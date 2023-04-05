package db

type IndexerConfig struct {
	DSN        string `yaml:"dsn"`
	DriverName string `yaml:"driver_name"`
}
