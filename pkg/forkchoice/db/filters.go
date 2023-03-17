package db

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

type FrameFilter struct {
	ID     *string
	Node   *string
	Before *time.Time
	After  *time.Time
	Slot   *uint64
	Epoch  *uint64
	Labels *[]string
}

func (f *FrameFilter) AddID(id string) {
	f.ID = &id
}

func (f *FrameFilter) AddNode(node string) {
	f.Node = &node
}

func (f *FrameFilter) AddBefore(before time.Time) {
	f.Before = &before
}

func (f *FrameFilter) AddAfter(after time.Time) {
	f.After = &after
}

func (f *FrameFilter) AddSlot(slot uint64) {
	f.Slot = &slot
}

func (f *FrameFilter) AddEpoch(epoch uint64) {
	f.Epoch = &epoch
}

func (f *FrameFilter) AddLabels(labels []string) {
	f.Labels = &labels
}

func (f *FrameFilter) Validate() error {
	if f.ID == nil &&
		f.Node == nil &&
		f.Before == nil &&
		f.After == nil &&
		f.Slot == nil &&
		f.Epoch == nil &&
		f.Labels == nil {
		return errors.New("no filter specified")
	}

	return nil
}

func (f *FrameFilter) ApplyToQuery(query *gorm.DB) (*gorm.DB, error) {
	if f.ID != nil {
		query = query.Where("id = ?", f.ID)
	}

	if f.Node != nil {
		query = query.Where("node = ?", f.Node)
	}

	if f.Before != nil {
		query = query.Where("fetched_at <= ?", f.Before)
	}

	if f.After != nil {
		query = query.Where("fetched_at >= ?", f.After)
	}

	if f.Slot != nil {
		query = query.Where("wall_clock_slot = ?", f.Slot)
	}

	if f.Epoch != nil {
		query = query.Where("wall_clock_epoch = ?", f.Epoch)
	}

	return query, nil
}
