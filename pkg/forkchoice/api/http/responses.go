package http

import (
	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/service"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
)

// V1/Sources
type V1SourcesRequest struct {
}

type V1SourcesResponse struct {
	SourcesMetadata []*service.SourceMetadata `json:"sources_metadata"`
}

// V1/Frames

type V1FramesListNodesRequest struct {
}

type V1FramesListNodesResponse struct {
	Nodes []string `json:"nodes"`
}
type V1FramesListSlotsRequest struct {
}

type V1FramesListSlotsResponse struct {
	Slots []phase0.Slot `json:"slots"`
}

type V1FrameGetRequest struct {
}

type V1FrameGetResponse struct {
	Frame *types.Frame `json:"frame"`
}
