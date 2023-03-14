package forkchoice

import "github.com/ethpandaops/forkchoice/pkg/forkchoice/source"

type Config struct {
	ListenAddr   string `yaml:"listenAddr" default:":5555"`
	LoggingLevel string `yaml:"logging" default:"warn"`
	MetricsAddr  string `yaml:"metricsAddr" default:":9090"`

	Sources []SourceConfig `yaml:"sources"`
}

func (c *Config) Validate() error {
	return nil
}

type SourceConfig struct {
	Name   string           `yaml:"name"`
	Type   string           `yaml:"type"`
	Config source.RawConfig `yaml:"config"`
}
