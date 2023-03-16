package forkchoice

import (
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/source"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/store"
)

type Config struct {
	ListenAddr   string `yaml:"listenAddr" default:":5555"`
	LoggingLevel string `yaml:"logging" default:"warn"`
	MetricsAddr  string `yaml:"metricsAddr" default:":9090"`

	Sources []source.Config `yaml:"sources"`

	Store store.Config `yaml:"store"`
}

func (c *Config) Validate() error {
	return nil
}
