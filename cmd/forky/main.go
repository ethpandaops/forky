// Command forky fetches and serves Ethereum fork choice data. It wires up the
// CLI, loads configuration, and runs the application.
package main

import (
	"context"
	//nolint:gosec // pprof is served on a separate, operator-controlled port
	_ "net/http/pprof"
	"os"

	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"

	forky "github.com/ethpandaops/forky"
	"github.com/ethpandaops/forky/internal/version"
)

var (
	cfgFile string
	log     = logrus.New()
)

func main() {
	if err := rootCmd().Execute(); err != nil {
		os.Exit(1)
	}
}

func rootCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "forky",
		Short: "Fetches and serves Ethereum fork choice data",
		Run: func(_ *cobra.Command, _ []string) {
			cfg := initCommon()

			server := forky.NewServer(log, cfg)
			if err := server.Start(context.Background()); err != nil {
				log.WithError(err).Fatal("failed to serve")
			}
		},
	}

	cmd.PersistentFlags().StringVar(&cfgFile, "config", "config.yaml", "config file (default is config.yaml)")
	cmd.AddCommand(versionCmd())

	return cmd
}

func initCommon() *forky.Config {
	log.SetFormatter(&logrus.TextFormatter{})
	log.WithField("file", cfgFile).Info("Loading config")

	config, err := forky.NewConfigFromYAMLFile(cfgFile)
	if err != nil {
		log.Fatal(err)
	}

	logLevel, err := logrus.ParseLevel(config.LogLevel)
	if err != nil {
		log.WithField("log_level", config.LogLevel).Fatal("invalid log level")
	}

	log.SetLevel(logLevel)

	return config
}

func versionCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Print version information",
		Run: func(cmd *cobra.Command, _ []string) {
			cmd.Println(version.Full())
		},
	}
}
