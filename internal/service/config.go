package service

import (
	"github.com/ethpandaops/forky/internal/db"
	"github.com/ethpandaops/forky/internal/ethereum"
	"github.com/ethpandaops/forky/internal/human"
	"github.com/ethpandaops/forky/internal/source"
	"github.com/ethpandaops/forky/internal/store"
)

type Config struct {
	Sources []source.Config `yaml:"sources"`

	Store store.Config `yaml:"store"`

	Indexer db.IndexerConfig `yaml:"indexer"`

	RetentionPeriod human.Duration `yaml:"retention_period" default:"24h"`

	Ethereum ethereum.Config `yaml:"ethereum"`
}
