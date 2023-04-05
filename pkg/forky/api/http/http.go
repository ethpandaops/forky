package http

import (
	"time"

	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forky/pkg/forky/service"
	"github.com/ethpandaops/forky/pkg/forky/types"
)

// V1
// // Ethereum
type V1GetEthereumSpecRequest struct {
}

type EthereumSpec struct {
	SecondsPerSlot uint64    `json:"seconds_per_slot"`
	SlotsPerEpoch  uint64    `json:"slots_per_epoch"`
	GenesisTime    time.Time `json:"genesis_time"`
}
type V1GetEthereumSpecResponse struct {
	NetworkName string       `json:"network_name"`
	Spec        EthereumSpec `json:"spec"`
}

type V1GetEthereumNowRequest struct {
}

type V1GetEthereumNowResponse struct {
	Slot  uint64 `json:"slot"`
	Epoch uint64 `json:"epoch"`
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
