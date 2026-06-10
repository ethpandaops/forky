package api

import (
	"errors"
	"fmt"

	"github.com/ethpandaops/forky/internal/human"
)

type Config struct {
	EdgeCacheConfig EdgeCacheConfig `yaml:"edge_cache" default:"{}"`
}

type EdgeCacheConfig struct {
	Enabled bool `yaml:"enabled" default:"true"`

	FrameTTL human.Duration `yaml:"frame_ttl" default:"1440m"`
}

func (c *Config) Validate() error {
	if err := c.EdgeCacheConfig.Validate(); err != nil {
		return fmt.Errorf("invalid edge cache config: %w", err)
	}

	return nil
}

func (c *EdgeCacheConfig) Validate() error {
	if c.Enabled && c.FrameTTL.Duration == 0 {
		return errors.New("frame_ttl must be greater than 0")
	}

	return nil
}
