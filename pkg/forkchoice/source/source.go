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

	// TODO(sam.calder-mason): Add more methods for interacting with a source.
	// ListFrames returns a list of frames for the specified filter.
	ListFrames(ctx context.Context, filter *types.FrameFilter) ([]*types.FrameMetadata, error)
	// GetFrame returns the frame with the specified ID.
	GetFrame(ctx context.Context, id string) (*types.Frame, error)
}

var _ = Source(&BeaconNode{})

func NewSource(log logrus.FieldLogger, name string, sourceType string, config yaml.RawMessage) (Source, error) {
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
