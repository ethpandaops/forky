package http

import (
	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/service"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
)

// V1
// // Sources
type V1SourcesRequest struct {
}

type V1SourcesResponse struct {
	SourcesMetadata []*service.SourceMetadata `json:"sources_metadata"`
}

// // Metadata
type V1MetadataListRequest struct {
	Filter     *service.FrameFilter      `json:"filter"`
	Pagination *service.PaginationCursor `json:"pagination"`
}

type V1MetadataListResponse struct {
	Frames     []*types.FrameMetadata      `json:"frames"`
	Pagination *service.PaginationResponse `json:"pagination"`
}

type V1MetadataListNodesRequest struct {
	Filter     *service.FrameFilter      `json:"filter"`
	Pagination *service.PaginationCursor `json:"pagination"`
}

type V1MetadataListNodesResponse struct {
	Nodes      []string                    `json:"nodes"`
	Pagination *service.PaginationResponse `json:"pagination"`
}

type V1MetadataListSlotsRequest struct {
	Filter     *service.FrameFilter      `json:"filter"`
	Pagination *service.PaginationCursor `json:"pagination"`
}

type V1MetadataListSlotsResponse struct {
	Slots      []phase0.Slot               `json:"slots"`
	Pagination *service.PaginationResponse `json:"pagination"`
}

type V1MetadataListEpochsRequest struct {
	Filter     *service.FrameFilter      `json:"filter"`
	Pagination *service.PaginationCursor `json:"pagination"`
}

type V1MetadataListEpochsResponse struct {
	Epochs     []phase0.Epoch              `json:"epochs"`
	Pagination *service.PaginationResponse `json:"pagination"`
}

type V1MetadataListLabelsRequest struct {
	Filter     *service.FrameFilter      `json:"filter"`
	Pagination *service.PaginationCursor `json:"pagination"`
}

type V1MetadataListLabelsResponse struct {
	Labels     []string                    `json:"labels"`
	Pagination *service.PaginationResponse `json:"pagination"`
}

// // Frames
type V1GetFrameRequest struct {
}

type V1GetFrameResponse struct {
	Frame *types.Frame `json:"frame"`
}
