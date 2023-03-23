package api

import (
	"context"
	"net/http"

	fhttp "github.com/ethpandaops/forkchoice/pkg/forkchoice/api/http"

	"github.com/ethpandaops/forkchoice/pkg/forkchoice/service"
	"github.com/julienschmidt/httprouter"
	"github.com/sirupsen/logrus"
)

type HTTP struct {
	log     logrus.FieldLogger
	svc     *service.ForkChoice
	metrics *fhttp.Metrics
	opts    *Options
}

func NewHTTP(log logrus.FieldLogger, svc *service.ForkChoice, opts *Options) *HTTP {
	metrics := fhttp.NewMetrics(opts.MetricsEnabled, "http")

	return &HTTP{
		opts:    opts,
		svc:     svc,
		log:     log.WithField("component", "http"),
		metrics: &metrics,
	}
}

func (h *HTTP) BindToRouter(ctx context.Context, router *httprouter.Router) error {
	router.GET("/api/v1/frames/:id", h.wrappedHandler(h.handleV1GetFrame))

	router.POST("/api/v1/metadata", h.wrappedHandler(h.handleV1MetadataList))
	router.POST("/api/v1/metadata/nodes", h.wrappedHandler(h.handleV1MetadataListNodes))
	router.POST("/api/v1/metadata/slots", h.wrappedHandler(h.handleV1MetadataListSlots))
	router.POST("/api/v1/metadata/epochs", h.wrappedHandler(h.handleV1MetadataListEpochs))
	router.POST("/api/v1/metadata/labels", h.wrappedHandler(h.handleV1MetadataListLabels))

	return nil
}

func (h *HTTP) wrappedHandler(handler func(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error)) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
		fhttp.WrappedHandler(h.log, h.metrics, handler)(w, r, p)
	}
}
