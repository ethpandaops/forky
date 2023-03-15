package service

import (
	"context"
	"errors"

	"github.com/ethpandaops/forkchoice/pkg/forkchoice/source"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
	"github.com/sirupsen/logrus"
)

type ForkChoice struct {
	log     logrus.FieldLogger
	sources map[string]source.Source
}

func NewForkChoice(log logrus.FieldLogger, sources map[string]source.Source) *ForkChoice {
	return &ForkChoice{
		log:     log,
		sources: sources,
	}
}

func (f *ForkChoice) Start(ctx context.Context) error {
	for _, source := range f.sources {
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

func (f *ForkChoice) ListFramesFromSource(ctx context.Context, name string, filter *types.FrameFilter) ([]*types.FrameMetadata, error) {
	s, err := f.GetSourceByName(name)
	if err != nil {
		return nil, err
	}

	return s.ListFrames(ctx, filter)
}

func (f *ForkChoice) GetFrameFromSource(ctx context.Context, name string, id string) (*types.Frame, error) {
	s, err := f.GetSourceByName(name)
	if err != nil {
		return nil, err
	}

	return s.GetFrame(ctx, id)
}
