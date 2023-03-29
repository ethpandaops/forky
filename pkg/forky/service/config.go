package service

import (
	"github.com/ethpandaops/forkchoice/pkg/forky/db"
	"github.com/ethpandaops/forkchoice/pkg/forky/ethereum"
	"github.com/ethpandaops/forkchoice/pkg/forky/human"
	"github.com/ethpandaops/forkchoice/pkg/forky/source"
	"github.com/ethpandaops/forkchoice/pkg/forky/store"
)

type Config struct {
	Sources []source.Config `yaml:"sources"`

	Store store.Config `yaml:"store"`

	Indexer db.IndexerConfig `yaml:"indexer"`

	RetentionPeriod human.Duration `yaml:"retention_period" default:"24h"`

	Ethereum ethereum.Config `yaml:"ethereum"`
}
