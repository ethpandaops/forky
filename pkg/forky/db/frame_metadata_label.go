package db

import (
	"time"

	"gorm.io/gorm"
)

type FrameMetadataLabel struct {
	gorm.Model
	Name      string    `gorm:"index:idx_name_created_at_deleted_at,where:deleted_at IS NULL"`
	FrameID   string    `gorm:"index"`
	CreatedAt time.Time `gorm:"index:idx_name_created_at_deleted_at,where:deleted_at IS NULL"`
}

type FrameMetadataLabels []FrameMetadataLabel

func (f *FrameMetadataLabels) AsStrings() []string {
	labels := make([]string, len(*f))

	for i, label := range *f {
		labels[i] = label.Name
	}

	return labels
}
