package forky

import (
	"context"
	"io/fs"
	"net/http"
	"time"

	"github.com/ethpandaops/forky/pkg/forky/api"
	"github.com/ethpandaops/forky/pkg/forky/service"
	static "github.com/ethpandaops/forky/web"
	"github.com/julienschmidt/httprouter"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
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
	h := api.NewHTTP(log, svc, apiOpts)

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

	router := httprouter.New()

	frontend, err := fs.Sub(static.FS, "build/frontend")
	if err != nil {
		return err
	}

	router.NotFound = http.FileServer(http.FS(frontend))

	if s.Cfg.Metrics.Enabled {
		if err := s.ServeMetrics(ctx); err != nil {
			return err
		}
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
