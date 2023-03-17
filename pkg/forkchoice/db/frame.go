package db

import (
	"time"

	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
	"gorm.io/gorm"
)

type Frame struct {
	gorm.Model
	ID             string `gorm:"primaryKey"`
	Node           string `gorm:"index"`
	WallClockSlot  uint64
	WallClockEpoch uint64
	FetchedAt      time.Time    `gorm:"index"`
	Labels         []FrameLabel `gorm:"foreignkey:FrameID;"`
}

type Frames []*Frame

func (f *Frames) AsFrameMetadata() []*types.FrameMetadata {
	frames := make([]*types.FrameMetadata, len(*f))

	for i, frame := range *f {
		frames[i] = frame.AsFrameMetadata()
	}

	return frames
}

func (f *Frame) AsFrameMetadata() *types.FrameMetadata {
	l := FrameLabels(f.Labels)

	return &types.FrameMetadata{
		ID:             f.ID,
		Node:           f.Node,
		WallClockSlot:  phase0.Slot(f.WallClockSlot),
		WallClockEpoch: phase0.Epoch(f.WallClockEpoch),
		FetchedAt:      f.FetchedAt,
		Labels:         l.AsStrings(),
	}
}

func (f *Frame) FromFrameMetadata(metadata *types.FrameMetadata) *Frame {
	f.ID = metadata.ID
	f.Node = metadata.Node
	f.WallClockSlot = uint64(metadata.WallClockSlot)
	f.WallClockEpoch = uint64(metadata.WallClockEpoch)
	f.FetchedAt = metadata.FetchedAt

	f.Labels = FrameLabels{}

	for _, label := range metadata.Labels {
		f.Labels = append(f.Labels, FrameLabel{
			Name:    label,
			FrameID: metadata.ID,
		})
	}

	return f
}
