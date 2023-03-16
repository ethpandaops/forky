package service

import (
	"errors"
	"time"

	"github.com/ethpandaops/forkchoice/pkg/forkchoice/db"
)

type SourceMetadata struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type NodeFilter struct {
	Node   *string    `json:"node"`
	Before *time.Time `json:"before"`
	After  *time.Time `json:"after"`
	Slot   *uint64    `json:"slot"`
	Epoch  *uint64    `json:"epoch"`
	Labels *[]string  `json:"labels"`
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

func (f *NodeFilter) AsDBFilter() *db.NodeFilter {
	return &db.NodeFilter{
		Node:   f.Node,
		Before: f.Before,
		After:  f.After,
		Slot:   f.Slot,
		Epoch:  f.Epoch,
		Labels: f.Labels,
	}
}
