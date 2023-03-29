package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forky/pkg/forky/db"
	"github.com/ethpandaops/forky/pkg/forky/ethereum"
	"github.com/ethpandaops/forky/pkg/forky/source"
	"github.com/ethpandaops/forky/pkg/forky/store"
	"github.com/ethpandaops/forky/pkg/forky/types"
	"github.com/ethpandaops/forky/pkg/version"
	"github.com/sirupsen/logrus"
)

type ForkChoice struct {
	config  *Config
	opts    *Options
	log     logrus.FieldLogger
	sources map[string]source.Source
	store   store.Store
	indexer *db.Indexer
	metrics *Metrics
	eth     *ethereum.BeaconChain
}

func NewForkChoice(namespace string, log logrus.FieldLogger, config *Config, opts *Options) (*ForkChoice, error) {
	// Create our sources.
	sources := make(map[string]source.Source)

	sourceOpts := source.DefaultOptions().SetMetricsEnabled(opts.MetricsEnabled)
	for _, s := range config.Sources {
		sou, err := source.NewSource(namespace, log, s.Name, s.Type, s.Config, sourceOpts)
		if err != nil {
			log.Fatalf("failed to create source %s: %s", s.Name, err)
		}

		sources[s.Name] = sou
	}

	// Create our store.
	storeOpts := store.DefaultOptions().SetMetricsEnabled(opts.MetricsEnabled)

	st, err := store.NewStore(namespace, log, config.Store.Type, config.Store.Config, storeOpts)
	if err != nil {
		return nil, fmt.Errorf("failed to create store: %s", err)
	}

	// Create our indexer.
	indexerOpts := db.DefaultOptions().SetMetricsEnabled(opts.MetricsEnabled)

	indexer, err := db.NewIndexer(namespace, log, config.Indexer, indexerOpts)
	if err != nil {
		log.Fatalf("failed to create indexer: %s", err)
	}

	// Create our ethereum beaconchain service.
	eth, err := ethereum.NewBeaconChain(log, &config.Ethereum)
	if err != nil {
		log.Fatalf("failed to create ethereum beaconchain: %s", err)
	}

	return &ForkChoice{
		config:  config,
		opts:    opts,
		log:     log.WithField("component", "service"),
		sources: sources,
		store:   st,
		indexer: indexer,
		metrics: NewMetrics(namespace+"_service", config, opts.MetricsEnabled),
		eth:     eth,
	}, nil
}

func (f *ForkChoice) Start(ctx context.Context) error {
	f.log.
		WithField("retention_period", f.config.RetentionPeriod.Duration.String()).
		WithField("version", version.Short()).
		WithField("sources", len(f.sources)).
		WithField("store", f.config.Store.Type).
		WithField("indexer", f.config.Indexer.DriverName).
		Info("Starting forky service")

	for _, source := range f.sources {
		source.OnFrame(func(ctx context.Context, frame *types.Frame) {
			if err := f.AddNewFrame(ctx, source.Name(), frame); err != nil {
				f.log.WithError(err).Error("Failed to add new frame")
			}
		})

		if err := source.Start(ctx); err != nil {
			return err
		}
	}

	go f.pollForUnwantedFrames(ctx)

	return nil
}

func (f *ForkChoice) Stop(ctx context.Context) error {
	for _, source := range f.sources {
		if err := source.Stop(ctx); err != nil {
			return err
		}
	}

	return nil
}

func (f *ForkChoice) pollForUnwantedFrames(ctx context.Context) {
	for {
		if err := f.DeleteOldFrames(ctx); err != nil {
			f.log.WithError(err).Error("Failed to delete old frames")
		}

		select {
		case <-time.After(1 * time.Minute):
		case <-ctx.Done():
			return
		}
	}
}

func (f *ForkChoice) AddNewFrame(ctx context.Context, sourceName string, frame *types.Frame) error {
	operation := OperationAddFrame

	f.metrics.ObserveOperation(operation)

	if frame == nil {
		f.metrics.ObserveOperationError(operation)

		return errors.New("frame is nil")
	}

	// Check if the frame is valid.
	if err := frame.Validate(); err != nil {
		f.metrics.ObserveOperationError(operation)

		return err
	}

	logCtx := f.log.WithFields(logrus.Fields{
		"source":    sourceName,
		"id":        frame.Metadata.ID,
		"slot":      fmt.Sprintf("%v", frame.Metadata.WallClockSlot),
		"fetchedAt": fmt.Sprintf("%v", frame.Metadata.FetchedAt.Unix()),
		"node":      frame.Metadata.Node,
	})

	// Store the frame in the store.
	if err := f.store.SaveFrame(ctx, frame); err != nil {
		f.metrics.ObserveOperationError(operation)

		logCtx.WithError(err).Error("Failed to store frame")

		return err
	}

	// Add the frame to the indexer.
	if err := f.indexer.InsertFrameMetadata(ctx, &frame.Metadata); err != nil {
		f.metrics.ObserveOperationError(operation)

		logCtx.WithError(err).Error("Failed to index frame")

		return err
	}

	logCtx.Debug("Stored and indexed frame")

	return nil
}

func (f *ForkChoice) ListNodes(ctx context.Context, filter *FrameFilter, page PaginationCursor) ([]string, *PaginationResponse, error) {
	operation := OperationListNodes

	f.metrics.ObserveOperation(operation)

	if filter == nil {
		return nil, nil, ErrInvalidFilter
	}

	count, err := f.indexer.CountNodesWithFrames(ctx, filter.AsDBFilter())
	if err != nil {
		f.metrics.ObserveOperationError(operation)

		f.log.WithError(err).Error("failed to count nodes with frames for list nodes")

		return nil, nil, ErrUnknownServerErrorOccurred
	}

	nodes, err := f.indexer.ListNodesWithFrames(ctx, filter.AsDBFilter(), page.AsDBPageCursor())
	if err != nil {
		f.metrics.ObserveOperationError(operation)

		f.log.WithError(err).Error("failed to list nodes with frames for list nodes")

		return nil, nil, ErrUnknownServerErrorOccurred
	}

	return nodes, &PaginationResponse{
		Total: count,
	}, nil
}

func (f *ForkChoice) ListSlots(ctx context.Context, filter *FrameFilter, page PaginationCursor) ([]phase0.Slot, *PaginationResponse, error) {
	operation := OperationListSlots

	f.metrics.ObserveOperation(operation)

	if filter == nil {
		f.metrics.ObserveOperationError(operation)

		return nil, nil, ErrInvalidFilter
	}

	count, err := f.indexer.CountSlotsWithFrames(ctx, filter.AsDBFilter())
	if err != nil {
		f.metrics.ObserveOperationError(operation)

		f.log.WithError(err).Error("failed to count slots with frames for list slots")

		return nil, nil, ErrUnknownServerErrorOccurred
	}

	slots, err := f.indexer.ListSlotsWithFrames(ctx, filter.AsDBFilter(), page.AsDBPageCursor())
	if err != nil {
		f.metrics.ObserveOperationError(operation)

		f.log.WithError(err).Error("failed to list slots with frames for list slots")

		return nil, nil, ErrUnknownServerErrorOccurred
	}

	return slots, &PaginationResponse{
		Total: count,
	}, nil
}

func (f *ForkChoice) ListEpochs(ctx context.Context, filter *FrameFilter, page PaginationCursor) ([]phase0.Epoch, *PaginationResponse, error) {
	operation := OperationListEpochs

	f.metrics.ObserveOperation(operation)

	if filter == nil {
		f.metrics.ObserveOperationError(operation)

		return nil, nil, ErrInvalidFilter
	}

	count, err := f.indexer.CountEpochsWithFrames(ctx, filter.AsDBFilter())
	if err != nil {
		f.metrics.ObserveOperationError(operation)

		f.log.WithError(err).Error("failed to count epochs with frames for list epochs")

		return nil, nil, ErrUnknownServerErrorOccurred
	}

	epochs, err := f.indexer.ListEpochsWithFrames(ctx, filter.AsDBFilter(), page.AsDBPageCursor())
	if err != nil {
		f.metrics.ObserveOperationError(operation)

		f.log.WithError(err).Error("failed to list epochs with frames for list epochs")

		return nil, nil, ErrUnknownServerErrorOccurred
	}

	return epochs, &PaginationResponse{
		Total: count,
	}, nil
}

func (f *ForkChoice) ListLabels(ctx context.Context, filter *FrameFilter, page PaginationCursor) ([]string, *PaginationResponse, error) {
	operation := OperationListLabels

	f.metrics.ObserveOperation(operation)

	if filter == nil {
		f.metrics.ObserveOperationError(operation)

		return nil, nil, ErrInvalidFilter
	}

	count, err := f.indexer.CountLabelsWithFrames(ctx, filter.AsDBFilter())
	if err != nil {
		f.metrics.ObserveOperationError(operation)

		f.log.WithError(err).Error("failed to count labels with frames for list labels")

		return nil, nil, ErrUnknownServerErrorOccurred
	}

	labels, err := f.indexer.ListLabelsWithFrames(ctx, filter.AsDBFilter(), page.AsDBPageCursor())
	if err != nil {
		f.metrics.ObserveOperationError(operation)

		f.log.WithError(err).Error("failed to list labels with frames for list labels")

		return nil, nil, ErrUnknownServerErrorOccurred
	}

	return labels.AsStrings(), &PaginationResponse{
		Total: count,
	}, nil
}

func (f *ForkChoice) ListMetadata(ctx context.Context, filter *FrameFilter, page PaginationCursor) ([]*types.FrameMetadata, *PaginationResponse, error) {
	operation := OperationListMetadata

	f.metrics.ObserveOperation(operation)

	if filter == nil {
		f.metrics.ObserveOperationError(operation)

		return nil, nil, ErrInvalidFilter
	}

	metadata, err := f.indexer.ListFrameMetadata(ctx, filter.AsDBFilter(), page.AsDBPageCursor())
	if err != nil {
		f.metrics.ObserveOperationError(operation)

		f.log.WithError(err).Error("failed to count metadata for list metadata")

		return nil, nil, ErrUnknownServerErrorOccurred
	}

	count, err := f.indexer.CountFrameMetadata(ctx, filter.AsDBFilter())
	if err != nil {
		f.metrics.ObserveOperationError(operation)

		f.log.WithError(err).Error("failed to count metadata for list metadata")

		return nil, nil, ErrUnknownServerErrorOccurred
	}

	md := db.FrameMetadatas(metadata)

	return md.AsFrameMetadata(), &PaginationResponse{
		Total: count,
	}, nil
}

func (f *ForkChoice) GetFrame(ctx context.Context, id string) (*types.Frame, error) {
	operation := OperationGetFrame

	f.metrics.ObserveOperation(operation)

	if id == "" {
		f.metrics.ObserveOperationError(operation)

		return nil, ErrInvalidID
	}

	frame, err := f.store.GetFrame(ctx, id)
	if err != nil {
		f.metrics.ObserveOperationError(operation)

		f.log.WithError(err).WithField("id", id).Error("failed to get frame")

		if err == store.ErrFrameNotFound {
			return nil, ErrFrameNotFound
		}

		return nil, ErrUnknownServerErrorOccurred
	}

	return frame, nil
}

func (f *ForkChoice) DeleteFrame(ctx context.Context, id string) error {
	operation := OperationDeleteFrame

	f.metrics.ObserveOperation(operation)

	if id == "" {
		f.metrics.ObserveOperationError(operation)

		return ErrInvalidID
	}

	if err := f.store.DeleteFrame(ctx, id); err != nil {
		f.metrics.ObserveOperationError(operation)

		f.log.WithError(err).WithField("id", id).Error("failed to delete frame")

		return err
	}

	if err := f.indexer.DeleteFrameMetadata(ctx, id); err != nil {
		f.metrics.ObserveOperationError(operation)

		f.log.WithError(err).WithField("id", id).Error("failed to delete frame")

		return err
	}

	return nil
}

func (f *ForkChoice) GetEthereumNow(_ context.Context) (phase0.Slot, phase0.Epoch, error) {
	operation := OperationGetEthereumNow

	f.metrics.ObserveOperation(operation)

	slot, epoch, err := f.eth.Wallclock().Now()
	if err != nil {
		f.metrics.ObserveOperationError(operation)

		f.log.WithError(err).Error("failed to get ethereum now")

		return 0, 0, ErrUnknownServerErrorOccurred
	}

	return phase0.Slot(slot.Number()), phase0.Epoch(epoch.Number()), nil
}

func (f *ForkChoice) GetEthereumSpecSecondsPerSlot(_ context.Context) uint64 {
	operation := OperationGetEthereumSpec

	f.metrics.ObserveOperation(operation)

	return f.eth.Spec().SecondsPerSlot
}

func (f *ForkChoice) GetEthereumSpecSlotsPerEpoch(_ context.Context) uint64 {
	operation := OperationGetEthereumSpec

	f.metrics.ObserveOperation(operation)

	return f.eth.Spec().SlotsPerEpoch
}

func (f *ForkChoice) GetEthereumSpecGenesisTime(_ context.Context) time.Time {
	operation := OperationGetEthereumSpec

	f.metrics.ObserveOperation(operation)

	return f.eth.GenesisTime()
}

func (f *ForkChoice) GetEthereumNetworkName(_ context.Context) string {
	operation := OperationGetEthereumSpec

	f.metrics.ObserveOperation(operation)

	return f.eth.NetworkName()
}
