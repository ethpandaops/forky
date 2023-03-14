package http

import (
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/service"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
)

type V1SourcesRequest struct {
}

type V1SourcesResponse struct {
	SourcesMetadata []*service.SourceMetadata `json:"sources_metadata"`
}

type V1FramesBySourceRequest struct {
	Filter *types.FrameFilter `json:"filter"`
}

type V1FramesBySourceResponse struct {
	FramesMetadata []*types.FrameMetadata `json:"frames_metadata"`
}

type V1FrameBySourceAndIDRequest struct {
}

type V1FrameBySourceAndIDResponse struct {
	Frame *types.Frame `json:"frame"`
}
