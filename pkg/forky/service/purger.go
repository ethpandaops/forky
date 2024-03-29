package service

import (
	"context"
	"time"

	"github.com/ethpandaops/forky/pkg/forky/db"
)

func (f *ForkChoice) DeleteOldFrames(ctx context.Context) error {
	// Get all frames that are outside of the retention period
	// and delete them.
	before := time.Now().Add(-f.config.RetentionPeriod.Duration)

	filter := &FrameFilter{
		Before: &before,
	}

	frames, err := f.indexer.ListFrameMetadata(ctx, filter.AsDBFilter(), &db.PaginationCursor{
		Limit:   1000,
		Offset:  0,
		OrderBy: "fetched_at ASC",
	})
	if err != nil {
		return err
	}

	for _, frame := range frames {
		f.log.WithField("frame_id", frame.ID).WithField("age", time.Since(frame.FetchedAt)).Debug("Deleting old frame")

		if err := f.DeleteFrame(ctx, frame.ID); err != nil {
			f.log.WithError(err).WithField("frame_id", frame.ID).Error("Failed to delete old frame")
		}
	}

	f.log.Debugf("Deleted %v old frames", len(frames))

	return nil
}
