package db

import (
	"time"

	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forky/pkg/forky/types"
	"gorm.io/gorm"
)

type FrameMetadata struct {
	gorm.Model
	ID   string `gorm:"primaryKey"`
	Node string `gorm:"index"`
	// We have to use int64 here as SQLite doesn't support uint64. This sucks
	// but slot 9223372036854775808 is probably around the heat death
	// of the universe so we should be OK.
	WallClockSlot   int64 `gorm:"index:idx_wall_clock_slot,where:deleted_at IS NULL"`
	WallClockEpoch  int64
	FetchedAt       time.Time            `gorm:"index"`
	Labels          []FrameMetadataLabel `gorm:"foreignkey:FrameID;"`
	ConsensusClient string
	EventSource     EventSource
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
		ID:              f.ID,
		Node:            f.Node,
		WallClockSlot:   phase0.Slot(f.WallClockSlot),
		WallClockEpoch:  phase0.Epoch(f.WallClockEpoch),
		FetchedAt:       f.FetchedAt,
		Labels:          l.AsStrings(),
		ConsensusClient: f.ConsensusClient,
		EventSource:     f.EventSource.String(),
	}
}

func (f *FrameMetadata) FromFrameMetadata(metadata *types.FrameMetadata) *FrameMetadata {
	f.ID = metadata.ID
	f.Node = metadata.Node
	f.WallClockSlot = int64(metadata.WallClockSlot)
	f.WallClockEpoch = int64(metadata.WallClockEpoch)
	f.FetchedAt = metadata.FetchedAt

	f.Labels = FrameMetadataLabels{}

	f.ConsensusClient = metadata.ConsensusClient
	f.EventSource = NewEventSourceFromType(types.EventSource(metadata.EventSource))

	for _, label := range metadata.Labels {
		f.Labels = append(f.Labels, FrameMetadataLabel{
			Name:    label,
			FrameID: metadata.ID,
		})
	}

	return f
}
