package db

import (
	"gorm.io/gorm"
)

type FrameLabel struct {
	gorm.Model
	Name    string `gorm:"primaryKey,index"`
	FrameID string `gorm:"index"`
}

type FrameLabels []FrameLabel

func (f *FrameLabels) AsStrings() []string {
	labels := make([]string, len(*f))

	for i, label := range *f {
		labels[i] = label.Name
	}

	return labels
}
