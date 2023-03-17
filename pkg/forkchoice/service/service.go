package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/db"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/source"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/store"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
	"github.com/ethpandaops/forkchoice/pkg/version"
	"github.com/sirupsen/logrus"
)

type ForkChoice struct {
	config  *Config
	log     logrus.FieldLogger
	sources map[string]source.Source
	store   store.Store
	indexer *db.Indexer
}

func NewForkChoice(log logrus.FieldLogger, config *Config) (*ForkChoice, error) {
	// Create our sources.
	sources := make(map[string]source.Source)

	for _, s := range config.Sources {
		sou, err := source.NewSource(log, s.Name, s.Type, s.Config)
		if err != nil {
			log.Fatalf("failed to create source %s: %s", s.Name, err)
		}

		sources[s.Name] = sou
	}

	// Create our store.
	st, err := store.NewStore(log, config.Store.Type, config.Store.Config)
	if err != nil {
		return nil, fmt.Errorf("failed to create store: %s", err)
	}

	// Create our indexer.
	indexer, err := db.NewIndexer(log, config.Indexer)
	if err != nil {
		log.Fatalf("failed to create indexer: %s", err)
	}

	return &ForkChoice{
		config:  config,
		log:     log.WithField("component", "service"),
		sources: sources,
		store:   st,
		indexer: indexer,
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
			f.handleNewFrame(ctx, source, frame)
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

func (f *ForkChoice) handleNewFrame(ctx context.Context, s source.Source, frame *types.Frame) {
	if frame == nil {
		f.log.WithField("source", s.Name()).Error("Received nil frame")

		return
	}

	// Check if the frame is valid.
	if err := frame.Validate(); err != nil {
		f.log.WithError(err).WithFields(logrus.Fields{
			"source": s.Name(),
			"node":   frame.Metadata.Node,
		}).Error("Received invalid frame from source")

		return
	}

	logCtx := f.log.WithFields(logrus.Fields{
		"source":    s.Name(),
		"id":        frame.Metadata.ID,
		"slot":      fmt.Sprintf("%v", frame.Metadata.WallClockSlot),
		"fetchedAt": fmt.Sprintf("%v", frame.Metadata.FetchedAt.Unix()),
		"node":      frame.Metadata.Node,
	})

	// Store the frame in the store.
	if err := f.store.SaveFrame(ctx, frame); err != nil {
		logCtx.WithError(err).Error("Failed to store frame")

		return
	}

	// Add the frame to the indexer.
	if err := f.indexer.AddFrameMetadata(ctx, &frame.Metadata); err != nil {
		logCtx.WithError(err).Error("Failed to index frame")

		return
	}

	logCtx.Info("Stored and indexed frame")
}

func (f *ForkChoice) Sources(ctx context.Context) map[string]source.Source {
	return f.sources
}

func (f *ForkChoice) GetSourceByName(name string) (source.Source, error) {
	if s, ok := f.sources[name]; ok {
		return s, nil
	}

	return nil, errors.New("unknown source")
}

func (f *ForkChoice) ListSources(ctx context.Context) ([]*SourceMetadata, error) {
	sources := make([]*SourceMetadata, len(f.Sources(ctx)))

	for _, source := range f.Sources(ctx) {
		sources = append(sources, &SourceMetadata{
			Name: source.Name(),
			Type: source.Type(),
		})
	}

	return sources, nil
}

func (f *ForkChoice) ListNodes(ctx context.Context, filter *FrameFilter, page PaginationCursor) ([]string, *PaginationResponse, error) {
	count, err := f.indexer.CountNodesWithFrames(ctx, filter.AsDBFilter())
	if err != nil {
		return nil, nil, err
	}

	nodes, err := f.indexer.ListNodesWithFrames(ctx, filter.AsDBFilter(), page.AsDBPageCursor())
	if err != nil {
		return nil, nil, err
	}

	return nodes, &PaginationResponse{
		Total: count,
	}, nil
}

func (f *ForkChoice) ListSlots(ctx context.Context, filter *FrameFilter, page PaginationCursor) ([]phase0.Slot, *PaginationResponse, error) {
	count, err := f.indexer.CountSlotsWithFrames(ctx, filter.AsDBFilter())
	if err != nil {
		return nil, nil, err
	}

	slots, err := f.indexer.ListSlotsWithFrames(ctx, filter.AsDBFilter(), page.AsDBPageCursor())
	if err != nil {
		return nil, nil, err
	}

	return slots, &PaginationResponse{
		Total: count,
	}, nil
}

func (f *ForkChoice) ListEpochs(ctx context.Context, filter *FrameFilter, page PaginationCursor) ([]phase0.Epoch, *PaginationResponse, error) {
	count, err := f.indexer.CountEpochsWithFrames(ctx, filter.AsDBFilter())
	if err != nil {
		return nil, nil, err
	}

	epochs, err := f.indexer.ListEpochsWithFrames(ctx, filter.AsDBFilter(), page.AsDBPageCursor())
	if err != nil {
		return nil, nil, err
	}

	return epochs, &PaginationResponse{
		Total: count,
	}, nil
}

func (f *ForkChoice) ListLabels(ctx context.Context, filter *FrameFilter, page PaginationCursor) ([]string, *PaginationResponse, error) {
	count, err := f.indexer.CountLabelsWithFrames(ctx, filter.AsDBFilter())
	if err != nil {
		return nil, nil, err
	}

	labels, err := f.indexer.ListLabelsWithFrames(ctx, filter.AsDBFilter(), page.AsDBPageCursor())
	if err != nil {
		return nil, nil, err
	}

	return labels.AsStrings(), &PaginationResponse{
		Total: count,
	}, nil
}

func (f *ForkChoice) ListMetadata(ctx context.Context, filter *FrameFilter, page PaginationCursor) ([]*types.FrameMetadata, *PaginationResponse, error) {
	metadata, err := f.indexer.ListFrameMetadata(ctx, filter.AsDBFilter(), page.AsDBPageCursor())
	if err != nil {
		return nil, nil, err
	}

	count, err := f.indexer.CountFrameMetadata(ctx, filter.AsDBFilter())
	if err != nil {
		return nil, nil, err
	}

	md := db.FrameMetadatas(metadata)

	return md.AsFrameMetadata(), &PaginationResponse{
		Total: count,
	}, nil
}

func (f *ForkChoice) GetFrame(ctx context.Context, id string) (*types.Frame, error) {
	return f.store.GetFrame(ctx, id)
}
