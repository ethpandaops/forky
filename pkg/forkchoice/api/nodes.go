package api

import (
	"context"
	"encoding/json"
	"net/http"

	fhttp "github.com/ethpandaops/forkchoice/pkg/forkchoice/api/http"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/service"

	"github.com/julienschmidt/httprouter"
)

func (h *HTTP) handleV1ListNodes(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	// Grab our request body
	var req fhttp.V1ListNodesRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return fhttp.NewBadRequestResponse(nil), err
	}

	page := req.Pagination
	if page == nil {
		page = service.DefaultPagination()
	}

	nodes, pg, err := h.svc.ListNodes(ctx, req.Filter, *page)
	if err != nil {
		return fhttp.NewInternalServerErrorResponse(nil), err
	}

	rsp := fhttp.V1ListNodesResponse{
		Nodes:      nodes,
		Pagination: pg,
	}

	response := fhttp.NewSuccessResponse(fhttp.ContentTypeResolvers{
		fhttp.ContentTypeJSON: func() ([]byte, error) {
			return json.Marshal(rsp)
		},
	})

	response.SetCacheControl("private, max-age=0, no-cache, no-store, must-revalidate")

	return response, nil
}
