package forky

import (
	"context"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"

	openapi "github.com/ethpandaops/forky/api"
	"github.com/ethpandaops/forky/internal/api"
	"github.com/ethpandaops/forky/internal/service"
	"github.com/ethpandaops/forky/web"
)

// Server is the main server for the forkchoice service.
// It glues together the service and the http api, while
// also providing metrics and static file serving.
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

	// Create our service which will glue everything together.
	svc, err := service.NewForkChoice("forky", log, conf.Forky, service.DefaultOptions().SetMetricsEnabled(conf.Metrics.Enabled))
	if err != nil {
		log.Fatalf("failed to create service: %s", err)
	}

	// Create our HTTP API.
	apiOpts := api.DefaultOptions().SetMetricsEnabled(conf.Metrics.Enabled)

	h, err := api.NewHTTP(log, svc, conf.HTTP, apiOpts)
	if err != nil {
		log.Fatalf("failed to create http api: %s", err)
	}

	// Create our server.
	s := &Server{
		Cfg:  *conf,
		log:  log,
		svc:  svc,
		http: h,
	}

	return s
}

func (s *Server) Start(ctx context.Context) error {
	if err := s.svc.Start(ctx); err != nil {
		return err
	}

	if s.Cfg.PProfAddr != nil {
		if err := s.ServePProf(ctx); err != nil {
			return err
		}
	}

	frontend, err := web.GetFS()
	if err != nil {
		return err
	}

	filesystem := http.FS(frontend)

	if s.Cfg.Metrics.Enabled {
		if metricsErr := s.ServeMetrics(ctx); metricsErr != nil {
			return metricsErr
		}
	}

	apiHandler, err := s.http.Handler()
	if err != nil {
		return err
	}

	mux := http.NewServeMux()
	mux.Handle("/api/", apiHandler)
	mux.HandleFunc("GET /openapi.yaml", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/yaml")

		if _, err := w.Write(openapi.OpenAPISpec); err != nil {
			s.log.WithError(err).Error("Failed to write OpenAPI spec")
		}
	})
	mux.Handle("/", wrapHandler(http.FileServer(filesystem), filesystem))

	server := &http.Server{
		Addr:              s.Cfg.ListenAddr,
		ReadHeaderTimeout: 3 * time.Minute,
		WriteTimeout:      15 * time.Minute,
	}

	server.Handler = mux

	s.log.Infof("Serving http at %s", s.Cfg.ListenAddr)

	if err := server.ListenAndServe(); err != nil {
		s.log.Fatal(err)
	}

	return nil
}

func (s *Server) ServePProf(ctx context.Context) error {
	pprofServer := &http.Server{
		Addr:              *s.Cfg.PProfAddr,
		ReadHeaderTimeout: 120 * time.Second,
	}

	go func() {
		s.log.Infof("Serving pprof at %s", *s.Cfg.PProfAddr)

		if err := pprofServer.ListenAndServe(); err != nil {
			s.log.Fatal(err)
		}
	}()

	return nil
}

func (s *Server) ServeMetrics(ctx context.Context) error {
	go func() {
		server := &http.Server{
			Addr:              s.Cfg.Metrics.Addr,
			ReadHeaderTimeout: 15 * time.Second,
		}

		server.Handler = promhttp.Handler()

		s.log.Infof("Serving metrics at %s", s.Cfg.Metrics.Addr)

		if err := server.ListenAndServe(); err != nil {
			s.log.Fatal(err)
		}
	}()

	return nil
}
