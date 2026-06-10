package api

import (
	"context"

	"github.com/ethpandaops/forky/api/rest"
	"github.com/ethpandaops/forky/internal/service"
)

// cacheControlNoStore disables caching for listing endpoints whose results
// change as new frames arrive.
const cacheControlNoStore = "private, max-age=0, no-cache, no-store, must-revalidate"

// ListMetadata implements listMetadata: a page of frame metadata.
func (h *HTTP) ListMetadata(ctx context.Context, req *rest.MetadataQuery) (rest.ListMetadataRes, error) {
	filter, page := metadataQueryFromRest(req)

	frames, pg, err := h.svc.ListMetadata(ctx, filter, page)
	if err != nil {
		return nil, err
	}

	restFrames := make([]rest.FrameMetadata, 0, len(frames))
	for _, frame := range frames {
		restFrames = append(restFrames, frameMetadataToRest(frame))
	}

	return &rest.ListMetadataOK{
		Data: rest.ListMetadataOKData{
			Frames:     restFrames,
			Pagination: paginationToRest(pg),
		},
	}, nil
}

// ListMetadataNodes implements listMetadataNodes: distinct node names.
func (h *HTTP) ListMetadataNodes(ctx context.Context, req *rest.MetadataQuery) (rest.ListMetadataNodesRes, error) {
	filter, page := metadataQueryFromRest(req)

	nodes, pg, err := h.svc.ListNodes(ctx, filter, page)
	if err != nil {
		return nil, err
	}

	if nodes == nil {
		nodes = []string{}
	}

	return &rest.ListMetadataNodesOKHeaders{
		CacheControl: rest.NewOptString(cacheControlNoStore),
		Response: rest.ListMetadataNodesOK{
			Data: rest.ListMetadataNodesOKData{
				Nodes:      nodes,
				Pagination: paginationToRest(pg),
			},
		},
	}, nil
}

// ListMetadataSlots implements listMetadataSlots: distinct slots.
func (h *HTTP) ListMetadataSlots(ctx context.Context, req *rest.MetadataQuery) (rest.ListMetadataSlotsRes, error) {
	filter, page := metadataQueryFromRest(req)

	slots, pg, err := h.svc.ListSlots(ctx, filter, page)
	if err != nil {
		return nil, err
	}

	restSlots := make([]rest.Slot, 0, len(slots))
	for _, slot := range slots {
		restSlots = append(restSlots, rest.Slot(safeInt64(uint64(slot))))
	}

	return &rest.ListMetadataSlotsOKHeaders{
		CacheControl: rest.NewOptString(cacheControlNoStore),
		Response: rest.ListMetadataSlotsOK{
			Data: rest.ListMetadataSlotsOKData{
				Slots:      restSlots,
				Pagination: paginationToRest(pg),
			},
		},
	}, nil
}

// ListMetadataEpochs implements listMetadataEpochs: distinct epochs.
func (h *HTTP) ListMetadataEpochs(ctx context.Context, req *rest.MetadataQuery) (rest.ListMetadataEpochsRes, error) {
	filter, page := metadataQueryFromRest(req)

	epochs, pg, err := h.svc.ListEpochs(ctx, filter, page)
	if err != nil {
		return nil, err
	}

	restEpochs := make([]rest.Epoch, 0, len(epochs))
	for _, epoch := range epochs {
		restEpochs = append(restEpochs, rest.Epoch(safeInt64(uint64(epoch))))
	}

	return &rest.ListMetadataEpochsOKHeaders{
		CacheControl: rest.NewOptString(cacheControlNoStore),
		Response: rest.ListMetadataEpochsOK{
			Data: rest.ListMetadataEpochsOKData{
				Epochs:     restEpochs,
				Pagination: paginationToRest(pg),
			},
		},
	}, nil
}

// ListMetadataLabels implements listMetadataLabels: distinct labels.
func (h *HTTP) ListMetadataLabels(ctx context.Context, req *rest.MetadataQuery) (rest.ListMetadataLabelsRes, error) {
	filter, page := metadataQueryFromRest(req)

	labels, pg, err := h.svc.ListLabels(ctx, filter, page)
	if err != nil {
		return nil, err
	}

	if labels == nil {
		labels = []string{}
	}

	return &rest.ListMetadataLabelsOKHeaders{
		CacheControl: rest.NewOptString(cacheControlNoStore),
		Response: rest.ListMetadataLabelsOK{
			Data: rest.ListMetadataLabelsOKData{
				Labels:     labels,
				Pagination: paginationToRest(pg),
			},
		},
	}, nil
}

// metadataQueryFromRest maps the spec's MetadataQuery onto the service
// filter and pagination types.
func metadataQueryFromRest(req *rest.MetadataQuery) (*service.FrameFilter, service.PaginationCursor) {
	filter := &service.FrameFilter{}
	if f, ok := req.Filter.Get(); ok {
		filter = frameFilterFromRest(f)
	}

	page := *service.DefaultPagination()

	if p, ok := req.Pagination.Get(); ok {
		page.Offset = p.Offset.Or(page.Offset)
		page.Limit = p.Limit.Or(page.Limit)
	}

	return filter, page
}

// frameFilterFromRest maps the spec's FrameFilter onto the service filter.
func frameFilterFromRest(f rest.FrameFilter) *service.FrameFilter {
	filter := &service.FrameFilter{
		Node:            optStringPtr(f.Node),
		ConsensusClient: optStringPtr(f.ConsensusClient),
		EventSource:     optStringPtr(f.EventSource),
	}

	if v, ok := f.Before.Get(); ok {
		filter.Before = &v
	}

	if v, ok := f.After.Get(); ok {
		filter.After = &v
	}

	if v, ok := f.Slot.Get(); ok && v >= 0 {
		slot := uint64(v)
		filter.Slot = &slot
	}

	if v, ok := f.Epoch.Get(); ok && v >= 0 {
		epoch := uint64(v)
		filter.Epoch = &epoch
	}

	if f.Labels != nil {
		labels := f.Labels
		filter.Labels = &labels
	}

	return filter
}

// optStringPtr converts an optional string to the pointer form used by the
// service filter.
func optStringPtr(o rest.OptString) *string {
	if v, ok := o.Get(); ok {
		return &v
	}

	return nil
}

// paginationToRest maps the service pagination response onto the spec's
// PaginationResponse schema.
func paginationToRest(pg *service.PaginationResponse) rest.PaginationResponse {
	if pg == nil {
		return rest.PaginationResponse{}
	}

	return rest.PaginationResponse{Total: pg.Total}
}
