package service

import (
	"errors"
	"time"

	"github.com/ethpandaops/forky/pkg/forky/db"
)

type SourceMetadata struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type FrameFilter struct {
	Node            *string    `json:"node"`
	Before          *time.Time `json:"before"`
	After           *time.Time `json:"after"`
	Slot            *uint64    `json:"slot"`
	Epoch           *uint64    `json:"epoch"`
	Labels          *[]string  `json:"labels"`
	ConsensusClient *string    `json:"consensus_client"`
	EventSource     *string    `json:"event_source"`
}

func (f *FrameFilter) Validate() error {
	if f.Node == nil &&
		f.Before == nil &&
		f.After == nil &&
		f.Slot == nil &&
		f.Epoch == nil &&
		f.Labels == nil &&
		f.ConsensusClient == nil &&
		f.EventSource == nil {
		return errors.New("no filter specified")
	}

	return nil
}

func (f *FrameFilter) AsDBFilter() *db.FrameFilter {
	filter := &db.FrameFilter{
		Node:            f.Node,
		Before:          f.Before,
		After:           f.After,
		Slot:            f.Slot,
		Epoch:           f.Epoch,
		Labels:          f.Labels,
		ConsensusClient: f.ConsensusClient,
	}

	if f.EventSource != nil {
		es := int(db.NewEventSourceFromString(*f.EventSource))

		filter.EventSource = &es
	}

	return filter
}
