package source

import (
	"context"
	"errors"
	"time"

	eth2client "github.com/attestantio/go-eth2-client"
	api "github.com/attestantio/go-eth2-client/api"
	v1 "github.com/attestantio/go-eth2-client/api/v1"
	"github.com/attestantio/go-eth2-client/http"
	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/cenkalti/backoff/v4"
	"github.com/ethpandaops/ethwallclock"
	"github.com/ethpandaops/forky/pkg/forky/ethereum"
	"github.com/ethpandaops/forky/pkg/forky/store"
	"github.com/ethpandaops/forky/pkg/forky/types"
	"github.com/go-co-op/gocron"
	"github.com/google/uuid"
	perrors "github.com/pkg/errors"
	"github.com/rs/zerolog"
	"github.com/sirupsen/logrus"
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
}

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
		return nil, perrors.Wrap(err, "invalid config")
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
		return perrors.Wrap(err, "failed to schedule polling")
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
		return perrors.Wrap(err, "failed to create client")
	}

	b.client = client

	// Fetch the genesis time and network parameters.
	rsp, err := b.client.(eth2client.GenesisProvider).Genesis(ctx, &api.GenesisOpts{})
	if err != nil {
		return perrors.Wrap(err, "failed to fetch genesis time")
	}

	b.genesis = rsp.Data

	// Fetch the network parameters.
	specRsp, err := b.client.(eth2client.SpecProvider).Spec(ctx, &api.SpecOpts{})
	if err != nil {
		return perrors.Wrap(err, "failed to fetch spec")
	}

	spec := specRsp.Data

	secondsPerSlot, ok := spec["SECONDS_PER_SLOT"]
	if !ok {
		return errors.New("failed to fetch SECONDS_PER_SLOT")
	}

	//nolint:unconvert //incorrect
	b.secondsPerSlot = time.Duration(secondsPerSlot.(time.Duration))

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
		return perrors.Wrap(err, "failed to get current wallclock")
	}

	rsp, err := b.client.(eth2client.NodeVersionProvider).NodeVersion(ctx, &api.NodeVersionOpts{})
	if err != nil {
		return perrors.Wrap(err, "failed to get node version")
	}

	nodeVersion := rsp.Data

	fetchedAt := time.Now()

	if provider, isProvider := b.client.(eth2client.ForkChoiceProvider); isProvider {
		rsp, err := provider.ForkChoice(ctx, &api.ForkChoiceOpts{})
		if err != nil {
			return perrors.Wrap(err, "failed to get fork choice dump")
		}

		dump := rsp.Data

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
			Data: dump,
		}

		b.publishFrame(ctx, frame)

		b.log.WithFields(logrus.Fields{
			"wallclock_slot":  slot.Number(),
			"wallclock_epoch": epoch.Number(),
			"fetchedAt":       frame.Metadata.FetchedAt,
		}).Debug("Fetched frame")
	}

	return nil
}
