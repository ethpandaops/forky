package types

import (
	"time"

	v1 "github.com/attestantio/go-eth2-client/api/v1"
	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/google/uuid"
)

type FrameMetadata struct {
	// ID is the ID of the frame.
	ID uuid.UUID
	// FetchedAt is the time the frame was fetched.
	FetchedAt time.Time
	// WallClockSlot is the wall clock slot at the time the frame was fetched.
	WallClockSlot phase0.Slot
	// WallClockEpoch is the wall clock epoch at the time the frame was fetched.
	WallClockEpoch phase0.Epoch
}

// Frame holds a fork choice dump with a timestamp.
type Frame struct {
	// Data is the fork choice dump.
	Data *v1.ForkChoice
	// Metadata is the metadata of the frame.
	Metadata FrameMetadata
}

// FrameFilter is a filter for frames.
type FrameFilter struct {
	// WallClockSlot is the wall clock slot to filter on.
	WallClockSlot *phase0.Slot
	// WallClockEpoch is the wall clock epoch to filter on.
	WallClockEpoch *phase0.Epoch
}
