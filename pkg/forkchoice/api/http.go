package api

import (
	"context"
	"encoding/json"
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
}

func NewHTTP(log logrus.FieldLogger, svc *service.ForkChoice) *HTTP {
	metrics := fhttp.NewMetrics("http")

	return &HTTP{
		svc:     svc,
		log:     log.WithField("component", "http"),
		metrics: &metrics,
	}
}

func (h *HTTP) BindToRouter(ctx context.Context, router *httprouter.Router) error {
	router.GET("/api/v1/sources", h.wrappedHandler(h.handleV1Sources))

	router.GET("/api/v1/frames/:node/slots", h.wrappedHandler(h.handleV1FramesListSlots))
	router.GET("/api/v1/frames/:node/slots/:slot/frames", h.wrappedHandler(h.handleV1FramesList))
	router.GET("/api/v1/frames/:node/slots/:slot/frames/:fetchedAt", h.wrappedHandler(h.handleV1FramesGetFrame))

	return nil
}

func (h *HTTP) wrappedHandler(handler func(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error)) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
		fhttp.WrappedHandler(h.log, h.metrics, handler)(w, r, p)
	}
}

func (h *HTTP) handleV1Sources(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	sources, err := h.svc.ListSources(ctx)
	if err != nil {
		return fhttp.NewInternalServerErrorResponse(nil), err
	}

	rsp := fhttp.V1SourcesResponse{
		SourcesMetadata: sources,
	}

	response := fhttp.NewSuccessResponse(fhttp.ContentTypeResolvers{
		fhttp.ContentTypeJSON: func() ([]byte, error) {
			return json.Marshal(rsp)
		},
	})

	response.SetCacheControl("public, s-max-age=30")

	return response, nil
}
