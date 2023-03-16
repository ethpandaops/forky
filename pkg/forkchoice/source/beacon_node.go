package source

import (
	"context"
	"errors"
	"time"

	eth2client "github.com/attestantio/go-eth2-client"
	v1 "github.com/attestantio/go-eth2-client/api/v1"
	"github.com/attestantio/go-eth2-client/http"
	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/ethwallclock"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/store"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
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

	// Ethereum network parameters.
	genesis        *v1.Genesis
	secondsPerSlot time.Duration
	slotsPerEpoch  uint64
	wallclock      *ethwallclock.EthereumBeaconChain
}

type BeaconNodeConfig struct {
	BeaconAddress   string       `yaml:"beaconAddress"`
	PollingInterval string       `yaml:"pollingInterval"`
	CacheTTLSeconds int          `yaml:"cacheTtlSeconds"`
	Store           store.Config `yaml:"store"`
}

func (b *BeaconNodeConfig) Validate() error {
	if b.BeaconAddress == "" {
		return errors.New("invalid beacon address")
	}

	if b.PollingInterval == "" {
		return errors.New("invalid polling interval")
	}

	if b.CacheTTLSeconds == 0 {
		return errors.New("invalid cache TTL")
	}

	return nil
}

func NewBeaconNode(log logrus.FieldLogger, config *BeaconNodeConfig, name string) (*BeaconNode, error) {
	if err := config.Validate(); err != nil {
		return nil, perrors.Wrap(err, "invalid config")
	}

	scheduler := gocron.NewScheduler(time.Local)

	return &BeaconNode{
		log:              log.WithField("source_name", name).WithField("component", "source/beacon_node"),
		config:           config,
		cron:             scheduler,
		name:             name,
		onFrameCallbacks: []func(ctx context.Context, frame *types.Frame){},
	}, nil
}

func (b *BeaconNode) Name() string {
	return b.name
}

func (b *BeaconNode) Type() string {
	return BeaconNodeType
}

func (b *BeaconNode) Start(ctx context.Context) error {
	b.cron.StartAsync()

	client, err := http.New(ctx,
		http.WithAddress(b.config.BeaconAddress),
		http.WithLogLevel(zerolog.WarnLevel),
	)
	if err != nil {
		return err
	}

	b.client = client

	_, err = b.cron.Every(b.config.PollingInterval).Do(func() {
		if err := b.fetchFrame(ctx); err != nil {
			b.log.WithError(err).Error("Failed to fetch frame")
		}
	})
	if err != nil {
		return perrors.Wrap(err, "failed to schedule polling")
	}

	go func() {
		for {
			if err := b.bootstrap(ctx); err != nil {
				b.log.WithError(err).Error("Failed to bootstrap")
			} else {
				break
			}

			time.Sleep(time.Second * 1)
		}
	}()

	return nil
}

func (b *BeaconNode) Stop(ctx context.Context) error {
	b.cron.Stop()

	return nil
}

func (b *BeaconNode) Ready(ctx context.Context) bool {
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
	// Fetch the genesis time and network parameters.
	genesis, err := b.client.(eth2client.GenesisProvider).Genesis(ctx)
	if err != nil {
		return perrors.Wrap(err, "failed to fetch genesis time")
	}

	b.genesis = genesis

	// Fetch the network parameters.
	spec, err := b.client.(eth2client.SpecProvider).Spec(ctx)
	if err != nil {
		return perrors.Wrap(err, "failed to fetch spec")
	}

	secondsPerSlot, ok := spec["SECONDS_PER_SLOT"]
	if !ok {
		return errors.New("failed to fetch SECONDS_PER_SLOT")
	}

	b.secondsPerSlot = time.Duration(secondsPerSlot.(time.Duration))

	slotsPerEpoch, ok := spec["SLOTS_PER_EPOCH"]
	if !ok {
		return errors.New("failed to fetch SLOTS_PER_EPOCH")
	}

	b.slotsPerEpoch = slotsPerEpoch.(uint64)

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

	fetchedAt := time.Now()

	if provider, isProvider := b.client.(eth2client.ForkChoiceProvider); isProvider {
		dump, err := provider.ForkChoice(ctx)
		if err != nil {
			return perrors.Wrap(err, "failed to get fork choice dump")
		}

		frame := &types.Frame{
			Metadata: types.FrameMetadata{
				Node:           b.Name(),
				FetchedAt:      fetchedAt,
				WallClockSlot:  phase0.Slot(slot.Number()),
				WallClockEpoch: phase0.Epoch(epoch.Number()),
				ID:             uuid.New().String(),
				Labels:         []string{},
			},
			Data: dump,
		}

		b.publishFrame(ctx, frame)

		b.log.WithFields(logrus.Fields{
			"wallclock_slot":  slot.Number(),
			"wallclock_epoch": epoch.Number(),
			"fetchedAt":       frame.Metadata.FetchedAt,
		}).Info("Fetched frame")
	}

	return nil
}
