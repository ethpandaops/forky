package service

import (
	"context"
	"strings"

	"github.com/ethpandaops/forky/pkg/forky/db"
)

func (f *ForkChoice) BackfillConsensusClient(ctx context.Context) error {
	// Get all frames that don't have a consensus client

	empty := ""

	filter := &FrameFilter{
		ConsensusClient: &empty,
	}

	frames, err := f.indexer.ListFrameMetadata(ctx, filter.AsDBFilter(), &db.PaginationCursor{
		Limit:   1,
		Offset:  0,
		OrderBy: "fetched_at DESC",
	})
	if err != nil {
		return err
	}

	for _, frame := range frames {
		// Attempt to extract frame from labels.
		found := false

		//nolint:gocritic // Outside of our control.
		for _, label := range frame.Labels {
			if strings.Contains(label.Name, "consensus_client_implementation") {
				frame.ConsensusClient = strings.Split(label.Name, "=")[1]

				found = true

				break
			}
		}

		if !found {
			frame.ConsensusClient = "unknown"
		}

		f.log.
			WithField("frame_id", frame.ID).
			WithField("consensus_client", frame.ConsensusClient).
			Debug("Backfilling consensus client")

		if err := f.indexer.UpdateFrameMetadata(ctx, frame); err != nil {
			f.log.WithError(err).WithField("frame_id", frame.ID).Error("Failed to update frame metadata")

			continue
		}
	}

	f.log.Debugf("Updated consensus_client on %v frames", len(frames))

	return nil
}

func (f *ForkChoice) BackfillEventSource(ctx context.Context) error {
	// Get all frames that don't have an event source
	empty := ""

	filter := &FrameFilter{
		EventSource: &empty,
	}

	frames, err := f.indexer.ListFrameMetadata(ctx, filter.AsDBFilter(), &db.PaginationCursor{
		Limit:   1000,
		Offset:  0,
		OrderBy: "fetched_at DESC",
	})
	if err != nil {
		return err
	}

	for _, frame := range frames {
		// Attempt to extract frame from labels.
		//nolint:gocritic // Outside of our control.
		for _, label := range frame.Labels {
			// Default to beacon_node.
			frame.EventSource = db.BeaconNodeEventSource

			if strings.Contains(label.Name, "xatu_event_name") {
				source := strings.Split(label.Name, "=")[1]

				frame.EventSource = db.XatuPollingEventSource

				if strings.Contains(source, "REORG") {
					frame.EventSource = db.XatuReorgEventEventSource
				}

				break
			}
		}

		f.log.
			WithField("frame_id", frame.ID).
			WithField("event_source", frame.EventSource).
			Debug("Backfilling event_source")

		if err := f.indexer.UpdateFrameMetadata(ctx, frame); err != nil {
			f.log.WithError(err).WithField("frame_id", frame.ID).Error("Failed to update frame metadata")

			continue
		}
	}

	f.log.Debugf("Updated event_source on %v frames", len(frames))

	return nil
}
