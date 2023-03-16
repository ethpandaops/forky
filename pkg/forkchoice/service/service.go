package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/db"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/source"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/store"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
	"github.com/sirupsen/logrus"
)

type ForkChoice struct {
	log     logrus.FieldLogger
	sources map[string]source.Source
	store   store.Store
	indexer *db.Indexer
}

func NewForkChoice(log logrus.FieldLogger, sources map[string]source.Source, st store.Store, indexer *db.Indexer) *ForkChoice {
	return &ForkChoice{
		log:     log.WithField("component", "service"),
		sources: sources,
		store:   st,
		indexer: indexer,
	}
}

func (f *ForkChoice) Start(ctx context.Context) error {
	for _, source := range f.sources {
		source.OnFrame(func(ctx context.Context, frame *types.Frame) {
			f.handleNewFrame(ctx, source, frame)
		})

		if err := source.Start(ctx); err != nil {
			return err
		}
	}

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
	if err := f.indexer.AddFrame(ctx, frame); err != nil {
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

func (f *ForkChoice) ListNodes(ctx context.Context, filter *NodeFilter) ([]string, error) {
	if err := filter.Validate(); err != nil {
		return nil, err
	}

	return f.indexer.ListNodes(ctx, filter.AsDBFilter())
}

func (f *ForkChoice) ListSlots(ctx context.Context, node string) ([]phase0.Slot, error) {
	return nil, errors.New("not implemented")
}

func (f *ForkChoice) ListFrames(ctx context.Context, node string, slot phase0.Slot) ([]*types.FrameMetadata, error) {
	return nil, errors.New("not implemented")
}

func (f *ForkChoice) GetFrame(ctx context.Context, id string) (*types.Frame, error) {
	return f.store.GetFrame(ctx, id)
}
