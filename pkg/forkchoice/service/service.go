package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/source"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/store"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
	"github.com/sirupsen/logrus"
)

type ForkChoice struct {
	log     logrus.FieldLogger
	sources map[string]source.Source
	store   store.Store
}

func NewForkChoice(log logrus.FieldLogger, sources map[string]source.Source, st store.Store) *ForkChoice {
	return &ForkChoice{
		log:     log,
		sources: sources,
		store:   st,
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
	// Store the frame.
	if err := f.store.SaveFrame(ctx, frame); err != nil {
		f.log.WithError(err).WithFields(logrus.Fields{
			"source":    s.Name(),
			"slot":      fmt.Sprintf("%v", frame.Metadata.WallClockSlot),
			"fetchedAt": fmt.Sprintf("%v", frame.Metadata.FetchedAt.Unix()),
			"node":      frame.Metadata.Node,
		}).Error("Failed to store frame")
	}
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

func (f *ForkChoice) GetNodes(ctx context.Context) ([]string, error) {
	return f.store.ListNodes(ctx)
}

func (f *ForkChoice) ListSlots(ctx context.Context, node string) ([]phase0.Slot, error) {
	return f.store.ListSlots(ctx, node)
}

func (f *ForkChoice) ListFrames(ctx context.Context, node string, slot phase0.Slot) ([]*types.FrameMetadata, error) {
	return f.store.ListFrames(ctx, node, slot)
}

func (f *ForkChoice) GetFrame(ctx context.Context, name string, slot phase0.Slot, fetchedAt time.Time) (*types.Frame, error) {
	return f.store.GetFrame(ctx, name, slot, fetchedAt)
}
