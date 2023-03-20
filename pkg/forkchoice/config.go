package forkchoice

import "github.com/ethpandaops/forkchoice/pkg/forkchoice/service"

type Config struct {
	ListenAddr   string `yaml:"listen_addr" default:":5555"`
	LoggingLevel string `yaml:"logging" default:"warn"`
	MetricsAddr  string `yaml:"metrics_addr" default:":9090"`

	Forky *service.Config `yaml:"forky"`
}

func (c *Config) Validate() error {
	return nil
}
