package db

import (
	"gorm.io/gorm"
)

type FrameMetadataLabel struct {
	gorm.Model
	Name    string `gorm:"primaryKey,index"`
	FrameID string `gorm:"index"`
}

type FrameMetadataLabels []FrameMetadataLabel

func (f *FrameMetadataLabels) AsStrings() []string {
	labels := make([]string, len(*f))

	for i, label := range *f {
		labels[i] = label.Name
	}

	return labels
}
