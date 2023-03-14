package source

type RawConfig struct {
	unmarshal func(interface{}) error
}

func (r *RawConfig) UnmarshalYAML(unmarshal func(interface{}) error) error {
	r.unmarshal = unmarshal
	return nil
}

func (r *RawConfig) Unmarshal(v interface{}) error {
	return r.unmarshal(v)
}
