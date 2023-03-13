package forkchoice

import (
	"context"
	"io/fs"
	"net/http"
	"time"

	"github.com/ethpandaops/forkchoice/pkg/version"
	static "github.com/ethpandaops/forkchoice/web"
	"github.com/julienschmidt/httprouter"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
)

type Server struct {
	log *logrus.Logger
	Cfg Config
}

func NewServer(log *logrus.Logger, conf *Config) *Server {
	if err := conf.Validate(); err != nil {
		log.Fatalf("invalid config: %s", err)
	}

	s := &Server{
		Cfg: *conf,
		log: log,
	}

	return s
}

func (s *Server) Start(ctx context.Context) error {
	s.log.Infof("Starting Checkpointz server (%s)", version.Short())

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
