package types

import (
	"time"

	v1 "github.com/attestantio/go-eth2-client/api/v1"
	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/google/uuid"
)

type FrameMetadata struct {
	// Node is the node that provided the frame.
	// In the case of a beacon node, this is the beacon node's ID as specified in the config for this service.
	// In the case of Xatu, this is the Xatu Sentry ID.
	Node string `json:"node"`
	// ID is the ID of the frame.
	ID uuid.UUID `json:"id"`
	// FetchedAt is the time the frame was fetched.
	FetchedAt time.Time `json:"fetched_at"`
	// WallClockSlot is the wall clock slot at the time the frame was fetched.
	WallClockSlot phase0.Slot `json:"wall_clock_slot"`
	// WallClockEpoch is the wall clock epoch at the time the frame was fetched.
	WallClockEpoch phase0.Epoch `json:"wall_clock_epoch"`
}

// Frame holds a fork choice dump with a timestamp.
type Frame struct {
	// Data is the fork choice dump.
	Data *v1.ForkChoice `json:"data"`
	// Metadata is the metadata of the frame.
	Metadata FrameMetadata `json:"metadata"`
}

// FrameFilter is a filter for frames.
type FrameFilter struct {
	// WallClockSlot is the wall clock slot to filter on.
	WallClockSlot *phase0.Slot `json:"wall_clock_slot"`
	// WallClockEpoch is the wall clock epoch to filter on.
	WallClockEpoch *phase0.Epoch `json:"wall_clock_epoch"`
}
