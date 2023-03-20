package service

import (
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/db"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/human"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/source"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/store"
)

type Config struct {
	Sources []source.Config `yaml:"sources"`

	Store store.Config `yaml:"store"`

	Indexer db.IndexerConfig `yaml:"indexer"`

	RetentionPeriod human.Duration `yaml:"retention_period" default:"24h"`
}
