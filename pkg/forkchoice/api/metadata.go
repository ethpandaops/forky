package api

import (
	"context"
	"encoding/json"
	"net/http"

	fhttp "github.com/ethpandaops/forkchoice/pkg/forkchoice/api/http"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/service"

	"github.com/julienschmidt/httprouter"
)

func (h *HTTP) handleV1MetadataList(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	// Grab our request body
	var req fhttp.V1MetadataListRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return fhttp.NewBadRequestResponse(nil), err
	}

	page := req.Pagination
	if page == nil {
		page = service.DefaultPagination()
	}

	frames, pg, err := h.svc.ListMetadata(ctx, req.Filter, *page)
	if err != nil {
		return fhttp.NewInternalServerErrorResponse(nil), err
	}

	rsp := fhttp.V1MetadataListResponse{
		Frames:     frames,
		Pagination: pg,
	}

	response := fhttp.NewSuccessResponse(fhttp.ContentTypeResolvers{
		fhttp.ContentTypeJSON: func() ([]byte, error) {
			return json.Marshal(rsp)
		},
	})

	return response, nil
}

func (h *HTTP) handleV1MetadataListNodes(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	// Grab our request body
	var req fhttp.V1MetadataListNodesRequest

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

	rsp := fhttp.V1MetadataListNodesResponse{
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

func (h *HTTP) handleV1MetadataListSlots(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	// Grab our request body
	var req fhttp.V1MetadataListSlotsRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return fhttp.NewBadRequestResponse(nil), err
	}

	page := req.Pagination
	if page == nil {
		page = service.DefaultPagination()
	}

	slots, pg, err := h.svc.ListSlots(ctx, req.Filter, *page)
	if err != nil {
		return fhttp.NewInternalServerErrorResponse(nil), err
	}

	rsp := fhttp.V1MetadataListSlotsResponse{
		Slots:      slots,
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

func (h *HTTP) handleV1MetadataListEpochs(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	// Grab our request body
	var req fhttp.V1MetadataListEpochsRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return fhttp.NewBadRequestResponse(nil), err
	}

	page := req.Pagination
	if page == nil {
		page = service.DefaultPagination()
	}

	epochs, pg, err := h.svc.ListEpochs(ctx, req.Filter, *page)
	if err != nil {
		return fhttp.NewInternalServerErrorResponse(nil), err
	}

	rsp := fhttp.V1MetadataListEpochsResponse{
		Epochs:     epochs,
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

func (h *HTTP) handleV1MetadataListLabels(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	// Grab our request body
	var req fhttp.V1MetadataListLabelsRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return fhttp.NewBadRequestResponse(nil), err
	}

	page := req.Pagination
	if page == nil {
		page = service.DefaultPagination()
	}

	labels, pg, err := h.svc.ListLabels(ctx, req.Filter, *page)
	if err != nil {
		return fhttp.NewInternalServerErrorResponse(nil), err
	}

	rsp := fhttp.V1MetadataListLabelsResponse{
		Labels:     labels,
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
