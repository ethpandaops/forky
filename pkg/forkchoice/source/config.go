package source

import "github.com/ethpandaops/forkchoice/pkg/yaml"

type Config struct {
	Name   string          `yaml:"name"`
	Type   string          `yaml:"type"`
	Config yaml.RawMessage `yaml:"config"`
}
