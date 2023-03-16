package db

import (
	"context"
	"errors"
	"time"

	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
	"gorm.io/gorm"
)

type Frame struct {
	gorm.Model
	ID             string `gorm:"primaryKey"`
	Node           string `gorm:"index"`
	WallclockSlot  uint64
	WallclockEpoch uint64
	FetchedAt      time.Time `gorm:"index"`
	Labels         []string  `gorm:"type:text[]"`
}

func (f *Frame) AsFrameMetadata() *types.FrameMetadata {
	return &types.FrameMetadata{
		ID:             f.ID,
		Node:           f.Node,
		WallClockSlot:  phase0.Slot(f.WallclockSlot),
		WallClockEpoch: phase0.Epoch(f.WallclockEpoch),
		FetchedAt:      f.FetchedAt,
		Labels:         f.Labels,
	}
}

func (f *Frame) FromFrameMetadata(metadata *types.FrameMetadata) *Frame {
	f.ID = metadata.ID
	f.Node = metadata.Node
	f.WallclockSlot = uint64(metadata.WallClockSlot)
	f.WallclockEpoch = uint64(metadata.WallClockEpoch)
	f.FetchedAt = metadata.FetchedAt
	f.Labels = metadata.Labels

	return f
}

func (i *Indexer) AddFrame(ctx context.Context, frame *types.Frame) error {
	var f Frame

	result := i.db.WithContext(ctx).Create(f.FromFrameMetadata(&frame.Metadata))

	return result.Error
}

func (i *Indexer) RemoveFrame(ctx context.Context, id string) error {
	result := i.db.WithContext(ctx).Where("id = ?", id).Delete(&Frame{})

	return result.Error
}

func (i *Indexer) ListFrames(ctx context.Context, filter *types.FrameFilter) ([]*types.FrameMetadata, error) {
	return nil, errors.New("not implemented")
	// var entries []*Frame

	// query := i.db.WithContext(ctx)

	// if err := filter.Validate(); err != nil {
	// 	return nil, err
	// }

	// query, err := filter.ApplyToQuery(query)
	// if err != nil {
	// 	return nil, err
	// }

	// result := query.Find(&entries).Limit(1000)
	// if result.Error != nil {
	// 	return nil, result.Error
	// }

	// metadataList := make([]*types.FrameMetadata, len(entries))

	// for i, entry := range entries {
	// 	metadataList[i] = entry.AsFrameMetadata()
	// }

	// return metadataList, nil
}

func (i *Indexer) ListNodes(ctx context.Context, filter *NodeFilter) ([]string, error) {
	var nodes []string

	query := i.db.WithContext(ctx).Model(&Frame{})

	if err := filter.Validate(); err != nil {
		return nil, err
	}

	query, err := filter.ApplyToQuery(query)
	if err != nil {
		return nil, err
	}

	result := query.Distinct("node").Find(&nodes).Limit(1000)
	if result.Error != nil {
		return nil, result.Error
	}

	return nodes, nil
}
