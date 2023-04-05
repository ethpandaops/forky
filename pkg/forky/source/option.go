package source

type Options struct {
	MetricsEnabled          bool
	AllowedEthereumNetworks []string
}

func DefaultOptions() *Options {
	return &Options{
		MetricsEnabled:          true,
		AllowedEthereumNetworks: []string{},
	}
}

func (o *Options) Validate() error {
	return nil
}

func (o *Options) WithMetricsEnabled() *Options {
	o.MetricsEnabled = true

	return o
}

func (o *Options) WithMetricsDisabled() *Options {
	o.MetricsEnabled = false

	return o
}

func (o *Options) SetMetricsEnabled(enabled bool) *Options {
	o.MetricsEnabled = enabled

	return o
}

func (o *Options) WithAllowedEthereumNetworks(networks []string) *Options {
	o.AllowedEthereumNetworks = networks

	return o
}
