package ethereum

import (
	"errors"
	"fmt"
)

type Config struct {
	Network NetworkConfig `yaml:"network"`
}

type NetworkConfig struct {
	Name string     `yaml:"name"`
	Spec SpecConfig `yaml:"spec"`
}

type SpecConfig struct {
	SlotDurationMs uint64 `yaml:"slot_duration_ms"`
	SlotsPerEpoch  uint64 `yaml:"slots_per_epoch"`
	GenesisTime    uint64 `yaml:"genesis_time"`

	HezeForkEpoch      uint64 `yaml:"heze_fork_epoch"`
	SlotDurationMsHeze uint64 `yaml:"slot_duration_ms_heze"`
}

func (c *Config) Validate() error {
	if err := c.Network.Validate(); err != nil {
		return fmt.Errorf("invalid network config: %w", err)
	}

	return nil
}

func (c *NetworkConfig) Validate() error {
	if c.Name == "" {
		return errors.New("name is required")
	}

	if err := c.Spec.Validate(); err != nil {
		return fmt.Errorf("invalid spec config: %w", err)
	}

	return nil
}

func (c *SpecConfig) Validate() error {
	if c.SlotDurationMs == 0 {
		return errors.New("slot_duration_ms is required")
	}

	if c.SlotsPerEpoch == 0 {
		return errors.New("slots_per_epoch is required")
	}

	if c.GenesisTime == 0 {
		return errors.New("genesis_time is required")
	}

	return nil
}
