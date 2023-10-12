package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/ethpandaops/forky/pkg/forky/db"
	"github.com/pkg/errors"
)

func (f *ForkChoice) BackfillConsensusClient(ctx context.Context) error {
	// Get all frames that don't have a consensus client
	empty := ""

	filter := &FrameFilter{
		ConsensusClient: &empty,
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

func (f *ForkChoice) DeleteUselessLabels(ctx context.Context) error {
	// Get all frames that don't have an event source
	empty := ""

	frameCount, err := f.indexer.CountFrameMetadata(ctx, (&FrameFilter{
		ConsensusClient: &empty,
	}).AsDBFilter())
	if err != nil {
		return err
	}

	// We are still waiting for the consensus backfill to complete.
	if frameCount > 0 {
		return nil
	}

	frameCount, err = f.indexer.CountFrameMetadata(ctx, (&FrameFilter{
		EventSource: &empty,
	}).AsDBFilter())
	if err != nil {
		return err
	}

	// We are still waiting for the event source backfill to complete.
	if frameCount > 0 {
		return nil
	}

	for _, unwanted := range []string{
		"consensus_client_implementation",
		"xatu_event_name",
		"xatu_sentry",
		"xatu_event_id",
		"consensus_client_version",
		"ethereum_network_id",
		"ethereum_network_name",
		"fetch_request_duration_ms",
	} {
		rowsAffected, err := f.indexer.DeleteFrameMetadataLabelsByName(ctx, unwanted)
		if err != nil {
			return errors.Wrap(err, fmt.Sprintf("failed to delete labels by name %v", unwanted))
		}

		if rowsAffected > 0 {
			f.log.WithField("rows_affected", rowsAffected).Debugf("Deleted unwated labels by name %v", unwanted)

			time.Sleep(60 * time.Second)
		}
	}

	return nil
}
