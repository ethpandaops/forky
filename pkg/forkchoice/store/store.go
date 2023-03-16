package store

import (
	"context"
	"errors"
	"time"

	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
	"github.com/ethpandaops/forkchoice/pkg/yaml"
	"github.com/sirupsen/logrus"
)

// Store is an interface for different persistence implementations.
type Store interface {
	// SaveFrame saves a frame to the store
	SaveFrame(ctx context.Context, frame *types.Frame) error
	// GetFrame fetches a frame from the store
	GetFrame(ctx context.Context, node string, slot phase0.Slot, fetchedAt time.Time) (*types.Frame, error)
	// ListNodes returns a list of nodes
	ListNodes(ctx context.Context) ([]string, error)
	// ListSlots returns a list of slots for the specified node.
	ListSlots(ctx context.Context, node string) ([]phase0.Slot, error)
	// ListFrames returns a list of frames for the specified node and slot.
	ListFrames(ctx context.Context, node string, slot phase0.Slot) ([]*types.FrameMetadata, error)
	// Delete deletes a frame from the store
	DeleteFrame(ctx context.Context, node string, slot phase0.Slot, fetchedAt time.Time) error
}

func NewStore(log logrus.FieldLogger, storeType Type, config yaml.RawMessage) (Store, error) {
	switch storeType {
	// case FileSystemStoreType:
	// 	var fsConfig FileSystemConfig

	// 	if err := config.Unmarshal(&fsConfig); err != nil {
	// 		return nil, err
	// 	}

	// 	return NewFileSystem(fsConfig)
	case S3StoreType:
		var s3Config S3StoreConfig

		if err := config.Unmarshal(&s3Config); err != nil {
			return nil, err
		}

		return NewS3Store(log, s3Config)
	// case GORMStoreType:
	// 	var gormConfig GORMConfig

	// 	if err := config.Unmarshal(&gormConfig); err != nil {
	// 		return nil, err
	// 	}

	// 	return NewGORMStore(gormConfig)
	default:
		return nil, errors.New("unknown store type")
	}
}
