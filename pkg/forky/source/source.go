package source

import (
	"context"
	"fmt"

	"github.com/ethpandaops/forky/pkg/forky/types"
	"github.com/ethpandaops/forky/pkg/yaml"
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
var _ = Source(&XatuHTTP{})

func NewSource(namespace string, log logrus.FieldLogger, name, sourceType string, config yaml.RawMessage, opts *Options) (Source, error) {
	namespace += "_source"

	metrics := NewBasicMetrics(namespace, sourceType, name, opts.MetricsEnabled)

	switch sourceType {
	case BeaconNodeType:
		conf := BeaconNodeConfig{}

		if err := config.Unmarshal(&conf); err != nil {
			return nil, err
		}

		source, err := NewBeaconNode(namespace, log, &conf, name, metrics)
		if err != nil {
			return nil, err
		}

		return source, nil

	case XatuHTTPType:
		conf := XatuHTTPConfig{}

		if err := config.Unmarshal(&conf); err != nil {
			return nil, err
		}

		source, err := NewXatuHTTP(namespace, name, log, &conf, metrics, opts)
		if err != nil {
			return nil, err
		}

		return source, nil
	default:
		return nil, fmt.Errorf("unknown source type: %s", sourceType)
	}
}
