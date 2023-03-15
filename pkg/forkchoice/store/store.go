package store

import (
	"context"
	"errors"

	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
	"github.com/ethpandaops/forkchoice/pkg/yaml"
)

// Store is an interface for different persistence implementations.
type Store interface {
	// Save takes a key and a reader, reads data from the reader, and saves it to the store.
	Save(ctx context.Context, frame *types.Frame) error
	// Load takes a key and returns a reader, which can be used to read the data associated with the key.
	Load(ctx context.Context, metadata types.FrameMetadata) (*types.Frame, error)
	// List returns a list of keys that are currently stored in the store.
	List(ctx context.Context, filter *types.FrameFilter) ([]*types.FrameMetadata, error)
	// Delete removes the data associated with the key from the store.
	Delete(ctx context.Context, metadata types.FrameMetadata) error
}

func NewStore(storeType Type, config yaml.RawMessage) (Store, error) {
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

		return nil, errors.New("not implemented")
	case GORMStoreType:
		var gormConfig GORMConfig

		if err := config.Unmarshal(&gormConfig); err != nil {
			return nil, err
		}

		return NewGORMStore(gormConfig)
	default:
		return nil, errors.New("unknown store type")
	}
}
