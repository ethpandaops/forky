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

type V1ListNodesRequest struct {
	Filter *service.NodeFilter `json:"filter"`
}

type V1ListNodesResponse struct {
	Nodes []string `json:"nodes"`
}
type V1FramesListSlotsRequest struct {
}

type V1FramesListSlotsResponse struct {
	Slots []phase0.Slot `json:"slots"`
}

type V1GetFrameRequest struct {
}

type V1GetFrameResponse struct {
	Frame *types.Frame `json:"frame"`
}
