package store

import (
	"fmt"

	"github.com/ethpandaops/forkchoice/pkg/yaml"
)

type Config struct {
	Enabled bool            `yaml:"enabled" default:"true"`
	Type    Type            `yaml:"type"`
	Config  yaml.RawMessage `yaml:"config"`
}

func (c *Config) Validate() error {
	if !IsValidStoreType(c.Type) {
		return fmt.Errorf("invalid store type: %s", c.Type)
	}

	return nil
}
