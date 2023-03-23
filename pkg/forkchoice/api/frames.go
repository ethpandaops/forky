package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	fhttp "github.com/ethpandaops/forkchoice/pkg/forkchoice/api/http"

	"github.com/julienschmidt/httprouter"
)

func (h *HTTP) handleV1GetFrame(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	id := p.ByName("id")
	if id == "" {
		return fhttp.NewBadRequestResponse(nil), errors.New("id is required")
	}

	frame, err := h.svc.GetFrame(ctx, id)
	if err != nil {
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

	response.SetCacheControl("public, s-max-age=30")

	return response, nil
}
