package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	fhttp "github.com/ethpandaops/forkchoice/pkg/forkchoice/api/http"

	"github.com/ethpandaops/forkchoice/pkg/forkchoice/service"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
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

	router.GET("/api/v1/frames/:sourceName", h.wrappedHandler(h.handleV1FramesWithSource))
	router.GET("/api/v1/frames/:sourceName/:frameID", h.wrappedHandler(h.handleV1FramesWithSourceAndID))

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

func (h *HTTP) handleV1FramesWithSource(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	sourceName := p.ByName("sourceName")
	if sourceName == "" {
		return fhttp.NewBadRequestResponse(nil), errors.New("source name is required")
	}

	filter := &types.FrameFilter{}

	framesMetadata, err := h.svc.ListFramesFromSource(ctx, sourceName, filter)
	if err != nil {
		return fhttp.NewInternalServerErrorResponse(nil), err
	}

	rsp := fhttp.V1FramesBySourceResponse{
		FramesMetadata: framesMetadata,
	}

	response := fhttp.NewSuccessResponse(fhttp.ContentTypeResolvers{
		fhttp.ContentTypeJSON: func() ([]byte, error) {
			return json.Marshal(rsp)
		},
	})

	response.SetCacheControl("public, s-max-age=30")

	return response, nil
}

func (h *HTTP) handleV1FramesWithSourceAndID(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	sourceName := p.ByName("sourceName")
	if sourceName == "" {
		return fhttp.NewBadRequestResponse(nil), errors.New("source name is required")
	}

	frameID := p.ByName("frameID")
	if frameID == "" {
		return fhttp.NewBadRequestResponse(nil), errors.New("frame ID is required")
	}

	frame, err := h.svc.GetFrameFromSource(ctx, sourceName, frameID)
	if err != nil {
		return fhttp.NewInternalServerErrorResponse(nil), err
	}

	rsp := fhttp.V1FrameBySourceAndIDResponse{
		Frame: frame,
	}

	response := fhttp.NewSuccessResponse(fhttp.ContentTypeResolvers{
		fhttp.ContentTypeJSON: func() ([]byte, error) {
			return json.Marshal(rsp)
		},
	})

	response.SetCacheControl("public, s-max-age=30")

	return response, nil

}
