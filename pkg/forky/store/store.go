package store

import (
	"context"
	"fmt"

	"github.com/ethpandaops/forkchoice/pkg/forky/types"
	"github.com/ethpandaops/forkchoice/pkg/yaml"
	"github.com/sirupsen/logrus"
)

// Store is an interface for different persistence implementations.
type Store interface {
	// SaveFrame saves a frame to the store
	SaveFrame(ctx context.Context, frame *types.Frame) error
	// GetFrame fetches a frame from the store
	GetFrame(ctx context.Context, id string) (*types.Frame, error)
	// Delete deletes a frame from the store
	DeleteFrame(ctx context.Context, id string) error
}

func NewStore(namespace string, log logrus.FieldLogger, storeType Type, config yaml.RawMessage, opts *Options) (Store, error) {
	namespace += "_store"

	switch storeType {
	case FileSystemStoreType:
		var fsConfig FileSystemConfig

		if err := config.Unmarshal(&fsConfig); err != nil {
			return nil, err
		}

		return NewFileSystem(namespace, fsConfig, opts)
	case S3StoreType:
		var s3Config *S3StoreConfig

		if err := config.Unmarshal(&s3Config); err != nil {
			return nil, err
		}

		return NewS3Store(namespace, log, s3Config, opts)
	case MemoryStoreType:
		return NewMemoryStore(namespace, log, opts), nil
	default:
		return nil, fmt.Errorf("unknown store type: %s", storeType)
	}
}
