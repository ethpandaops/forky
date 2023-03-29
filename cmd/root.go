package cmd

import (
	"context"
	"os"

	"github.com/ethpandaops/forky/pkg/forky"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "forky",
	Short: "Fetches and serves Ethereum fork choice data",
	Run: func(cmd *cobra.Command, args []string) {
		cfg := initCommon()
		p := forky.NewServer(log, cfg)
		if err := p.Start(context.Background()); err != nil {
			log.WithError(err).Fatal("failed to serve")
		}
	},
}

var (
	cfgFile string
	log     = logrus.New()
)

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "config.yaml", "config file (default is config.yaml)")
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
