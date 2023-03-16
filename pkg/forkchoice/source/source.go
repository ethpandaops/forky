package source

import (
	"context"
	"fmt"

	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
	"github.com/ethpandaops/forkchoice/pkg/yaml"
	"github.com/sirupsen/logrus"
)

type Source interface {
	// Name returns the user-defined name of the source.
	Name() string
	// Type returns the type of the source.
	Type() string
	// Start starts the source.
	Start(ctx context.Context) error
	// Stop stops the source.
	Stop(ctx context.Context) error

	// OnFrame is called when a new frame has been received.
	OnFrame(func(ctx context.Context, frame *types.Frame))
}

var _ = Source(&BeaconNode{})

func NewSource(log logrus.FieldLogger, name, sourceType string, config yaml.RawMessage) (Source, error) {
	switch sourceType {
	case BeaconNodeType:
		conf := BeaconNodeConfig{}

		if err := config.Unmarshal(&conf); err != nil {
			return nil, err
		}

		source, err := NewBeaconNode(log, &conf, name)
		if err != nil {
			return nil, err
		}

		return source, nil
	default:
		return nil, fmt.Errorf("unknown source type: %s", sourceType)
	}
}
