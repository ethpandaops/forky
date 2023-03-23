package forkchoice

import (
	"os"

	"github.com/creasty/defaults"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/service"
	"gopkg.in/yaml.v2"
)

type Config struct {
	ListenAddr string        `yaml:"listen_addr" default:":5555"`
	LogLevel   string        `yaml:"log_level" default:"warn"`
	Metrics    MetricsConfig `yaml:"metrics"`

	Forky *service.Config `yaml:"forky"`
}

type MetricsConfig struct {
	Enabled bool   `yaml:"enabled" default:"true"`
	Addr    string `yaml:"addr" default:":9090"`
}

func (c *Config) Validate() error {
	return nil
}

func NewConfigFromYAML(y []byte) (*Config, error) {
	config := &Config{}

	if err := defaults.Set(config); err != nil {
		return nil, err
	}

	type plain Config

	if err := yaml.Unmarshal(y, (*plain)(config)); err != nil {
		return nil, err
	}

	return config, nil
}

func NewConfigFromYAMLFile(file string) (*Config, error) {
	yamlFile, err := os.ReadFile(file)
	if err != nil {
		return nil, err
	}

	return NewConfigFromYAML(yamlFile)
}
