package http

import (
	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/service"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
)

// V1
type V1SourcesRequest struct {
}

type V1SourcesResponse struct {
	SourcesMetadata []*service.SourceMetadata `json:"sources_metadata"`
}

// Metadata
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
	Nodes      []phase0.Slot               `json:"slots"`
	Pagination *service.PaginationResponse `json:"pagination"`
}

type V1GetFrameRequest struct {
}

type V1GetFrameResponse struct {
	Frame *types.Frame `json:"frame"`
}
