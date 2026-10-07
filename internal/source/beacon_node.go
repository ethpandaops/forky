package source

import (
	"context"
	"errors"
	"fmt"
	nethttp "net/http"
	"sync/atomic"
	"time"

	"github.com/cenkalti/backoff/v4"
	"github.com/ethpandaops/ethwallclock"
	eth2client "github.com/ethpandaops/go-eth2-client"
	api "github.com/ethpandaops/go-eth2-client/api"
	v1 "github.com/ethpandaops/go-eth2-client/api/v1"
	"github.com/ethpandaops/go-eth2-client/http"
	"github.com/ethpandaops/go-eth2-client/spec/phase0"
	"github.com/go-co-op/gocron"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/sirupsen/logrus"

	"github.com/ethpandaops/forky/internal/ethereum"
	"github.com/ethpandaops/forky/internal/store"
	"github.com/ethpandaops/forky/internal/types"
)

var BeaconNodeType = "beacon_node"

type BeaconNode struct {
	log logrus.FieldLogger

	config *BeaconNodeConfig

	cron *gocron.Scheduler

	client eth2client.Service

	name string

	onFrameCallbacks []func(ctx context.Context, frame *types.Frame)

	metrics *BasicMetrics

	// Ethereum network parameters.
	genesis        *v1.Genesis
	secondsPerSlot time.Duration
	slotsPerEpoch  uint64
	wallclock      *ethwallclock.EthereumBeaconChain

	// forkChoiceV2RetryAt is when to next try the v2 fork choice endpoint, in
	// unix nanoseconds, after the node reported it as unsupported.
	forkChoiceV2RetryAt atomic.Int64
}

// forkChoiceV2RetryInterval is how long to use the v1 fork choice endpoint
// before checking whether a node has started supporting v2.
const forkChoiceV2RetryInterval = time.Hour

type BeaconNodeConfig struct {
	Address         string       `yaml:"address"`
	PollingInterval string       `yaml:"polling_interval"`
	Store           store.Config `yaml:"store"`
	Labels          []string     `yaml:"labels"`
}

func (b *BeaconNodeConfig) Validate() error {
	if b.Address == "" {
		return errors.New("invalid address")
	}

	if b.PollingInterval == "" {
		return errors.New("invalid polling interval")
	}

	return nil
}

func NewBeaconNode(namespace string, log logrus.FieldLogger, config *BeaconNodeConfig, name string, metrics *BasicMetrics) (*BeaconNode, error) {
	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("invalid config: %w", err)
	}

	scheduler := gocron.NewScheduler(time.Local)

	return &BeaconNode{
		log: log.
			WithField("source_name", name).
			WithField("component", "source/beacon_node"),
		config:           config,
		cron:             scheduler,
		name:             name,
		onFrameCallbacks: []func(ctx context.Context, frame *types.Frame){},
		metrics:          metrics,
	}, nil
}

func (b *BeaconNode) Name() string {
	return b.name
}

func (b *BeaconNode) Type() string {
	return BeaconNodeType
}

func (b *BeaconNode) Start(ctx context.Context) error {
	_, err := b.cron.Every(b.config.PollingInterval).Do(func() {
		if err := b.fetchFrame(ctx); err != nil {
			b.log.WithError(err).Error("Failed to fetch frame")
		}
	})
	if err != nil {
		return fmt.Errorf("failed to schedule polling: %w", err)
	}

	go func() {
		back := backoff.NewExponentialBackOff()

		back.MaxInterval = time.Minute * 1
		back.MaxElapsedTime = 0

		for {
			if err := b.bootstrap(ctx); err != nil {
				sleepFor := back.NextBackOff()

				b.log.WithError(err).WithField("next_attempt_in", sleepFor.String()).Error("Failed to bootstrap")

				time.Sleep(sleepFor)
			} else {
				break
			}
		}
	}()

	b.cron.StartAsync()

	return nil
}

func (b *BeaconNode) Stop(ctx context.Context) error {
	b.cron.Stop()

	return nil
}

func (b *BeaconNode) Ready(ctx context.Context) bool {
	if b.client == nil {
		return false
	}

	if b.genesis == nil {
		return false
	}

	if b.secondsPerSlot == 0 {
		return false
	}

	if b.slotsPerEpoch == 0 {
		return false
	}

	if b.wallclock == nil {
		return false
	}

	return true
}

func (b *BeaconNode) OnFrame(callback func(ctx context.Context, frame *types.Frame)) {
	b.onFrameCallbacks = append(b.onFrameCallbacks, callback)
}

func (b *BeaconNode) publishFrame(ctx context.Context, frame *types.Frame) {
	for _, callback := range b.onFrameCallbacks {
		go callback(ctx, frame)
	}
}

func (b *BeaconNode) bootstrap(ctx context.Context) error {
	client, err := http.New(ctx,
		http.WithAddress(b.config.Address),
		http.WithLogLevel(zerolog.WarnLevel),
		http.WithTimeout(15*time.Second),
	)
	if err != nil {
		return fmt.Errorf("failed to create client: %w", err)
	}

	b.client = client

	genesisProvider, ok := b.client.(eth2client.GenesisProvider)
	if !ok {
		return errors.New("client does not support genesis provider")
	}

	// Fetch the genesis time and network parameters.
	rsp, err := genesisProvider.Genesis(ctx, &api.GenesisOpts{})
	if err != nil {
		return fmt.Errorf("failed to fetch genesis time: %w", err)
	}

	if rsp == nil || rsp.Data == nil {
		return errors.New("received nil response when fetching genesis time")
	}

	b.genesis = rsp.Data

	// Fetch the network parameters.
	specProvider, ok := b.client.(eth2client.SpecProvider)
	if !ok {
		return errors.New("client does not support spec provider")
	}

	specRsp, err := specProvider.Spec(ctx, &api.SpecOpts{})
	if err != nil {
		return fmt.Errorf("failed to fetch spec: %w", err)
	}

	if specRsp == nil || specRsp.Data == nil {
		return errors.New("received nil response when fetching spec")
	}

	spec := specRsp.Data

	secondsPerSlotSpec, ok := spec["SECONDS_PER_SLOT"]
	if !ok {
		return errors.New("failed to fetch SECONDS_PER_SLOT")
	}

	secondsPerSlot, ok := secondsPerSlotSpec.(time.Duration)
	if !ok {
		return errors.New("failed to cast SECONDS_PER_SLOT to time.Duration")
	}

	//nolint:unconvert //incorrect
	b.secondsPerSlot = time.Duration(secondsPerSlot)

	slotsPerEpoch, ok := spec["SLOTS_PER_EPOCH"]
	if !ok {
		return errors.New("failed to fetch SLOTS_PER_EPOCH")
	}

	sslotsPerEpoch, ok := slotsPerEpoch.(uint64)
	if !ok {
		return errors.New("failed to cast SLOTS_PER_EPOCH to uint64")
	}

	b.slotsPerEpoch = sslotsPerEpoch

	// Create the wallclock.
	b.wallclock = ethwallclock.NewEthereumBeaconChain(
		b.genesis.GenesisTime,
		b.secondsPerSlot,
		b.slotsPerEpoch,
	)

	return nil
}

func (b *BeaconNode) fetchFrame(ctx context.Context) error {
	if !b.Ready(ctx) {
		return errors.New("not ready to fetch frames")
	}

	slot, epoch, err := b.wallclock.Now()
	if err != nil {
		return fmt.Errorf("failed to get current wallclock: %w", err)
	}

	nodeVersionProvider, ok := b.client.(eth2client.NodeVersionProvider)
	if !ok {
		return errors.New("client does not support node version provider")
	}

	rsp, err := nodeVersionProvider.NodeVersion(ctx, &api.NodeVersionOpts{})
	if err != nil {
		return fmt.Errorf("failed to get node version: %w", err)
	}

	nodeVersion := rsp.Data

	fetchedAt := time.Now()

	forkChoice, err := b.fetchForkChoice(ctx)
	if err != nil {
		return err
	}

	b.metrics.ObserveItemFetched(string(DataFrame))

	frame := &types.Frame{
		Metadata: types.FrameMetadata{
			Node:            b.Name(),
			FetchedAt:       fetchedAt,
			WallClockSlot:   phase0.Slot(slot.Number()),
			WallClockEpoch:  phase0.Epoch(epoch.Number()),
			ID:              uuid.New().String(),
			Labels:          b.config.Labels,
			EventSource:     types.BeaconNodeEventSource.String(),
			ConsensusClient: string(ethereum.ClientFromString(nodeVersion)),
		},
		Data: forkChoice,
	}

	b.publishFrame(ctx, frame)

	b.log.WithFields(logrus.Fields{
		"wallclock_slot":  slot.Number(),
		"wallclock_epoch": epoch.Number(),
		"fetchedAt":       frame.Metadata.FetchedAt,
	}).Debug("Fetched frame")

	return nil
}

// fetchForkChoice fetches the node's fork choice dump, preferring the
// Gloas-aware v2 endpoint and falling back to v1 for nodes that do not
// support it.
func (b *BeaconNode) fetchForkChoice(ctx context.Context) (*types.ForkChoice, error) {
	if provider, isProvider := b.client.(eth2client.ForkChoiceV2Provider); isProvider &&
		time.Now().UnixNano() >= b.forkChoiceV2RetryAt.Load() {
		rsp, err := provider.ForkChoiceV2(ctx, &api.ForkChoiceOpts{})
		if err == nil {
			return types.ForkChoiceFromV2(rsp.Data), nil
		}

		if isUnsupportedEndpoint(err) {
			b.log.WithError(err).Debug("Beacon node does not support the v2 fork choice endpoint, falling back to v1")
			b.forkChoiceV2RetryAt.Store(time.Now().Add(forkChoiceV2RetryInterval).UnixNano())
		} else {
			b.log.WithError(err).Warn("Failed to get v2 fork choice dump, falling back to v1")
		}
	}

	provider, isProvider := b.client.(eth2client.ForkChoiceProvider)
	if !isProvider {
		return nil, errors.New("client does not support fork choice provider")
	}

	rsp, err := provider.ForkChoice(ctx, &api.ForkChoiceOpts{})
	if err != nil {
		return nil, fmt.Errorf("failed to get fork choice dump: %w", err)
	}

	return types.ForkChoiceFromV1(rsp.Data), nil
}

// isUnsupportedEndpoint reports whether err is a beacon node rejecting an
// endpoint it does not implement.
func isUnsupportedEndpoint(err error) bool {
	var apiErr *api.Error
	if !errors.As(err, &apiErr) {
		return false
	}

	switch apiErr.StatusCode {
	case nethttp.StatusBadRequest, nethttp.StatusNotFound, nethttp.StatusMethodNotAllowed, nethttp.StatusNotImplemented:
		return true
	default:
		return false
	}
}
