package store

import (
	"context"
	"errors"

	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
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

func NewStore(log logrus.FieldLogger, storeType Type, config yaml.RawMessage) (Store, error) {
	switch storeType {
	case FileSystemStoreType:
		var fsConfig FileSystemConfig

		if err := config.Unmarshal(&fsConfig); err != nil {
			return nil, err
		}

		return NewFileSystem(fsConfig)
	case S3StoreType:
		var s3Config S3StoreConfig

		if err := config.Unmarshal(&s3Config); err != nil {
			return nil, err
		}

		return NewS3Store(log, s3Config)
	default:
		return nil, errors.New("unknown store type")
	}
}
