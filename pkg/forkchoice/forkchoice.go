package forkchoice

import (
	"context"
	"io/fs"
	"net/http"
	"time"

	"github.com/ethpandaops/forkchoice/pkg/forkchoice/api"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/db"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/service"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/source"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/store"
	"github.com/ethpandaops/forkchoice/pkg/version"
	static "github.com/ethpandaops/forkchoice/web"
	"github.com/julienschmidt/httprouter"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
)

type Server struct {
	log *logrus.Logger
	Cfg Config

	svc  *service.ForkChoice
	http *api.HTTP
}

func NewServer(log *logrus.Logger, conf *Config) *Server {
	if err := conf.Validate(); err != nil {
		log.Fatalf("invalid config: %s", err)
	}

	// Create our sources.
	sources := make(map[string]source.Source)
	for _, s := range conf.Sources {
		source, err := source.NewSource(log, s.Name, s.Type, s.Config)
		if err != nil {
			log.Fatalf("failed to create source %s: %s", s.Name, err)
		}

		sources[s.Name] = source
	}

	// Create our store.
	store, err := store.NewStore(log, conf.Store.Type, conf.Store.Config)
	if err != nil {
		log.Fatalf("failed to create store: %s", err)
	}

	// Create our indexer.
	indexer, err := db.NewIndexer(log, conf.Indexer)
	if err != nil {
		log.Fatalf("failed to create indexer: %s", err)
	}

	// Create our service which will glue everything together.
	svc := service.NewForkChoice(log, sources, store, indexer)

	// Create our HTTP API.
	http := api.NewHTTP(log, svc)

	s := &Server{
		Cfg:  *conf,
		log:  log,
		svc:  svc,
		http: http,
	}

	return s
}

func (s *Server) Start(ctx context.Context) error {
	s.log.Infof("Starting forkchoice server (%s)", version.Short())

	if err := s.svc.Start(ctx); err != nil {
		return err
	}

	router := httprouter.New()

	frontend, err := fs.Sub(static.FS, "build/frontend")
	if err != nil {
		return err
	}

	router.NotFound = http.FileServer(http.FS(frontend))

	if err := s.ServeMetrics(ctx); err != nil {
		return err
	}

	server := &http.Server{
		Addr:              s.Cfg.ListenAddr,
		ReadHeaderTimeout: 3 * time.Minute,
		WriteTimeout:      15 * time.Minute,
	}

	if err := s.http.BindToRouter(ctx, router); err != nil {
		return err
	}

	server.Handler = router

	s.log.Infof("Serving http at %s", s.Cfg.ListenAddr)

	if err := server.ListenAndServe(); err != nil {
		s.log.Fatal(err)
	}

	return nil
}

func (s *Server) ServeMetrics(ctx context.Context) error {
	go func() {
		server := &http.Server{
			Addr:              s.Cfg.MetricsAddr,
			ReadHeaderTimeout: 15 * time.Second,
		}

		server.Handler = promhttp.Handler()

		s.log.Infof("Serving metrics at %s", s.Cfg.MetricsAddr)

		if err := server.ListenAndServe(); err != nil {
			s.log.Fatal(err)
		}
	}()

	return nil
}
