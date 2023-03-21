package db

import (
	"time"

	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
	"gorm.io/gorm"
)

type FrameMetadata struct {
	gorm.Model
	ID   string `gorm:"primaryKey"`
	Node string `gorm:"index"`
	// We have to use int64 here as SQLite doesn't support uint64. This sucks
	// but slot 9223372036854775808 is probably around the heat death
	// of the universe so we should be OK.
	WallClockSlot  int64
	WallClockEpoch int64
	FetchedAt      time.Time            `gorm:"index"`
	Labels         []FrameMetadataLabel `gorm:"foreignkey:FrameID;"`
}

type FrameMetadatas []*FrameMetadata

func (f *FrameMetadatas) AsFrameMetadata() []*types.FrameMetadata {
	frames := make([]*types.FrameMetadata, len(*f))

	for i, frame := range *f {
		frames[i] = frame.AsFrameMetadata()
	}

	return frames
}

func (f *FrameMetadata) AsFrameMetadata() *types.FrameMetadata {
	l := FrameMetadataLabels(f.Labels)

	return &types.FrameMetadata{
		ID:             f.ID,
		Node:           f.Node,
		WallClockSlot:  phase0.Slot(f.WallClockSlot),
		WallClockEpoch: phase0.Epoch(f.WallClockEpoch),
		FetchedAt:      f.FetchedAt,
		Labels:         l.AsStrings(),
	}
}

func (f *FrameMetadata) FromFrameMetadata(metadata *types.FrameMetadata) *FrameMetadata {
	f.ID = metadata.ID
	f.Node = metadata.Node
	f.WallClockSlot = int64(metadata.WallClockSlot)
	f.WallClockEpoch = int64(metadata.WallClockEpoch)
	f.FetchedAt = metadata.FetchedAt

	f.Labels = FrameMetadataLabels{}

	for _, label := range metadata.Labels {
		f.Labels = append(f.Labels, FrameMetadataLabel{
			Name:    label,
			FrameID: metadata.ID,
		})
	}

	return f
}
