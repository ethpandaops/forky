package api

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	v1 "github.com/ethpandaops/go-eth2-client/api/v1"
	"github.com/ethpandaops/go-eth2-client/spec/phase0"
	"github.com/go-faster/jx"

	"github.com/ethpandaops/forky/api/rest"
	"github.com/ethpandaops/forky/internal/service"
	"github.com/ethpandaops/forky/internal/types"
)

// GetFrame implements getFrame: a single fork-choice frame by ID.
func (h *HTTP) GetFrame(ctx context.Context, params rest.GetFrameParams) (rest.GetFrameRes, error) {
	frame, err := h.svc.GetFrame(ctx, params.ID)
	if err != nil {
		if errors.Is(err, service.ErrFrameNotFound) {
			return &rest.Error{
				Code:    http.StatusNotFound,
				Message: err.Error(),
			}, nil
		}

		return nil, err
	}

	restFrame, err := frameToRest(frame)
	if err != nil {
		return nil, err
	}

	rsp := &rest.GetFrameOKHeaders{
		Response: rest.GetFrameOK{
			Data: rest.GetFrameOKData{
				Frame: restFrame,
			},
		},
	}

	if h.config.EdgeCacheConfig.Enabled {
		ttl := int64(h.config.EdgeCacheConfig.FrameTTL.Seconds())
		rsp.CacheControl = rest.NewOptString(fmt.Sprintf("public, max-age=%[1]d, s-maxage=%[1]d", ttl))
	}

	return rsp, nil
}

// frameToRest maps a domain frame onto the spec's Frame schema.
func frameToRest(frame *types.Frame) (rest.Frame, error) {
	data, err := forkChoiceToRest(frame.Data)
	if err != nil {
		return rest.Frame{}, err
	}

	return rest.Frame{
		Data:     data,
		Metadata: frameMetadataToRest(&frame.Metadata),
	}, nil
}

// frameMetadataToRest maps domain frame metadata onto the spec's
// FrameMetadata schema.
func frameMetadataToRest(m *types.FrameMetadata) rest.FrameMetadata {
	labels := m.Labels
	if labels == nil {
		labels = []string{}
	}

	return rest.FrameMetadata{
		ID:              m.ID,
		Node:            m.Node,
		FetchedAt:       m.FetchedAt.UTC(),
		WallClockSlot:   rest.Slot(safeInt64(uint64(m.WallClockSlot))),
		WallClockEpoch:  rest.Epoch(safeInt64(uint64(m.WallClockEpoch))),
		Labels:          labels,
		ConsensusClient: m.ConsensusClient,
		EventSource:     m.EventSource,
	}
}

// forkChoiceToRest maps a beacon node fork-choice dump onto the spec's
// ForkChoice schema, following the beacon-API string serialization for
// slots, epochs and weights.
func forkChoiceToRest(fc *types.ForkChoice) (rest.ForkChoice, error) {
	nodes := make([]rest.ForkChoiceNode, 0, len(fc.ForkChoiceNodes))

	for _, node := range fc.ForkChoiceNodes {
		restNode, err := forkChoiceNodeToRest(node)
		if err != nil {
			return rest.ForkChoice{}, err
		}

		nodes = append(nodes, restNode)
	}

	restFC := rest.ForkChoice{
		JustifiedCheckpoint: checkpointToRest(fc.JustifiedCheckpoint),
		FinalizedCheckpoint: checkpointToRest(fc.FinalizedCheckpoint),
		ForkChoiceNodes:     nodes,
	}

	if len(fc.ExtraData) > 0 {
		extra, err := extraDataToRest(fc.ExtraData)
		if err != nil {
			return rest.ForkChoice{}, err
		}

		restFC.ExtraData = rest.NewOptForkChoiceExtraData(extra)
	}

	return restFC, nil
}

// forkChoiceNodeToRest maps a fork-choice node onto the spec's
// ForkChoiceNode schema.
func forkChoiceNodeToRest(node *types.ForkChoiceNode) (rest.ForkChoiceNode, error) {
	restNode := rest.ForkChoiceNode{
		Slot:                            rest.SlotString(strconv.FormatUint(uint64(node.Slot), 10)),
		BlockRoot:                       rest.Root(node.BlockRoot.String()),
		ParentRoot:                      rest.Root(node.ParentRoot.String()),
		Weight:                          strconv.FormatUint(node.Weight, 10),
		Validity:                        rest.ForkChoiceNodeValidity(node.Validity.String()),
		ExecutionBlockHash:              rest.Root(node.ExecutionBlockHash.String()),
		PayloadAttesterCount:            optUint64String(node.PayloadAttesterCount),
		PayloadAvailabilityYesCount:     optUint64String(node.PayloadAvailabilityYesCount),
		PayloadDataAvailabilityYesCount: optUint64String(node.PayloadDataAvailabilityYesCount),
	}

	if node.JustifiedEpoch != nil {
		restNode.JustifiedEpoch = rest.NewOptEpochString(rest.EpochString(strconv.FormatUint(uint64(*node.JustifiedEpoch), 10)))
	}

	if node.FinalizedEpoch != nil {
		restNode.FinalizedEpoch = rest.NewOptEpochString(rest.EpochString(strconv.FormatUint(uint64(*node.FinalizedEpoch), 10)))
	}

	if node.PayloadStatus != v1.ForkChoicePayloadStatusUnknown {
		restNode.PayloadStatus = rest.NewOptPayloadStatus(rest.PayloadStatus(node.PayloadStatus.String()))
	}

	if node.ParentPayloadStatus != nil {
		restNode.ParentPayloadStatus = rest.NewOptPayloadStatus(rest.PayloadStatus(node.ParentPayloadStatus.String()))
	}

	if len(node.ExtraData) > 0 {
		extra, err := extraDataToRest(node.ExtraData)
		if err != nil {
			return rest.ForkChoiceNode{}, err
		}

		restNode.ExtraData = rest.NewOptForkChoiceNodeExtraData(rest.ForkChoiceNodeExtraData(extra))
	}

	return restNode, nil
}

// extraDataToRest maps client-specific extra data onto raw JSON values.
func extraDataToRest(extraData map[string]any) (map[string]jx.Raw, error) {
	extra := make(map[string]jx.Raw, len(extraData))

	for key, value := range extraData {
		raw, err := json.Marshal(value)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal extra_data %q: %w", key, err)
		}

		extra[key] = jx.Raw(raw)
	}

	return extra, nil
}

// optUint64String maps an optional value onto the spec's decimal string
// serialization.
func optUint64String(value *uint64) rest.OptString {
	if value == nil {
		return rest.OptString{}
	}

	return rest.NewOptString(strconv.FormatUint(*value, 10))
}

// checkpointToRest maps a beacon checkpoint onto the spec's Checkpoint
// schema.
func checkpointToRest(cp phase0.Checkpoint) rest.Checkpoint {
	return rest.Checkpoint{
		Epoch: rest.EpochString(strconv.FormatUint(uint64(cp.Epoch), 10)),
		Root:  rest.Root(cp.Root.String()),
	}
}
