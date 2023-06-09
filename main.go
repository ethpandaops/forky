package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	//nolint:gosec // running pprof on a separate port
	_ "net/http/pprof"

	"github.com/ethpandaops/forky/cmd"
	_ "github.com/lib/pq"
)

func main() {
	cancel := make(chan os.Signal, 1)
	signal.Notify(cancel, syscall.SIGTERM, syscall.SIGINT)

	go cmd.Execute()

	sig := <-cancel
	log.Printf("Caught signal: %v", sig)

	os.Exit(0)
}
