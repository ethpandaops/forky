package db

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

type NodeFilter struct {
	Node   *string
	Before *time.Time
	After  *time.Time
	Slot   *uint64
	Epoch  *uint64
	Labels *[]string
}

func (f *NodeFilter) Validate() error {
	if f.Node == nil &&
		f.Before == nil &&
		f.After == nil &&
		f.Slot == nil &&
		f.Epoch == nil &&
		f.Labels == nil {
		return errors.New("no filter specified")
	}

	return nil
}

func (f *NodeFilter) ApplyToQuery(query *gorm.DB) (*gorm.DB, error) {
	if f.Node != nil {
		query = query.Where("node = ?", f.Node)
	}

	if f.Before != nil {
		query = query.Where("fetched_at >= ?", f.Before)
	}

	if f.After != nil {
		query = query.Where("fetched_at <= ?", f.After)
	}

	if f.Slot != nil {
		query = query.Where("wallclock_slot = ?", f.Slot)
	}

	if f.Epoch != nil {
		query = query.Where("wallclock_epoch = ?", f.Epoch)
	}

	if f.Labels != nil {
		query = query.Where("labels @> ?", f.Labels)
	}

	return query, nil
}
