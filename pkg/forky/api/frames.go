package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/pkg/errors"

	fhttp "github.com/ethpandaops/forky/pkg/forky/api/http"
	"github.com/ethpandaops/forky/pkg/forky/service"

	"github.com/julienschmidt/httprouter"
)

type GetFramesBatchRequest struct {
	IDs []string `json:"ids"`
}

func (h *HTTP) handleV1GetFrame(ctx context.Context, _ *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	id := p.ByName("id")
	if id == "" {
		return fhttp.NewBadRequestResponse(nil), errors.New("id is required")
	}

	frame, err := h.svc.GetFrame(ctx, id)
	if err != nil {
		if errors.Is(err, service.ErrFrameNotFound) {
			return fhttp.NewNotFoundResponse(nil), err
		}

		return fhttp.NewInternalServerErrorResponse(nil), err
	}

	rsp := fhttp.V1GetFrameResponse{
		Frame: frame,
	}

	response := fhttp.NewSuccessResponse(fhttp.ContentTypeResolvers{
		fhttp.ContentTypeJSON: func() ([]byte, error) {
			return json.Marshal(rsp)
		},
	})

	if h.config.EdgeCacheConfig.Enabled {
		response.SetCacheControl(fmt.Sprintf("public, max-age=%[1]v, s-maxage=%[1]v", h.config.EdgeCacheConfig.FrameTTL.Seconds()))
	}

	return response, nil
}
