package service

import (
	"context"
	"errors"

	"github.com/ethpandaops/forkchoice/pkg/forkchoice/source"
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

func (f *ForkChoice) Sources() map[string]source.Source {
	return f.sources
}

func (f *ForkChoice) GetSourceByName(name string) (source.Source, error) {
	if source, ok := f.sources[name]; ok {
		return source, nil
	}

	return nil, errors.New("unknown source")
}
