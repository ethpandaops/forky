package forkchoice

import "github.com/ethpandaops/forkchoice/pkg/forkchoice/service"

type Config struct {
	ListenAddr   string `yaml:"listenAddr" default:":5555"`
	LoggingLevel string `yaml:"logging" default:"warn"`
	MetricsAddr  string `yaml:"metricsAddr" default:":9090"`

	Forky *service.Config `yaml:"forky"`
}

func (c *Config) Validate() error {
	return nil
}
