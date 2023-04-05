package api

import (
	"context"
	"encoding/json"
	"net/http"

	fhttp "github.com/ethpandaops/forky/pkg/forky/api/http"
	"github.com/ethpandaops/forky/pkg/forky/service"

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

	filter := req.Filter
	if filter == nil {
		filter = &service.FrameFilter{}
	}

	page := req.Pagination
	if page == nil {
		page = service.DefaultPagination()
	}

	frames, pg, err := h.svc.ListMetadata(ctx, filter, *page)
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

	filter := req.Filter
	if filter == nil {
		filter = &service.FrameFilter{}
	}

	nodes, pg, err := h.svc.ListNodes(ctx, filter, *page)
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

	filter := req.Filter
	if filter == nil {
		filter = &service.FrameFilter{}
	}

	slots, pg, err := h.svc.ListSlots(ctx, filter, *page)
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

	filter := req.Filter
	if filter == nil {
		filter = &service.FrameFilter{}
	}

	epochs, pg, err := h.svc.ListEpochs(ctx, filter, *page)
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

	filter := req.Filter
	if filter == nil {
		filter = &service.FrameFilter{}
	}

	labels, pg, err := h.svc.ListLabels(ctx, filter, *page)
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
