package api

import (
	"github.com/ethpandaops/forky/pkg/forky/human"
	"github.com/pkg/errors"
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
		return errors.Wrap(err, "invalid edge cache config")
	}

	return nil
}

func (c *EdgeCacheConfig) Validate() error {
	if c.Enabled && c.FrameTTL.Duration == 0 {
		return errors.New("frame_ttl must be greater than 0")
	}

	return nil
}
