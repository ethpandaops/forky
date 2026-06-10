package api

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	v1 "github.com/attestantio/go-eth2-client/api/v1"
	"github.com/attestantio/go-eth2-client/spec/phase0"
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
func forkChoiceToRest(fc *v1.ForkChoice) (rest.ForkChoice, error) {
	nodes := make([]rest.ForkChoiceNode, 0, len(fc.ForkChoiceNodes))

	for _, node := range fc.ForkChoiceNodes {
		restNode := rest.ForkChoiceNode{
			Slot:               rest.SlotString(strconv.FormatUint(uint64(node.Slot), 10)),
			BlockRoot:          rest.Root(node.BlockRoot.String()),
			ParentRoot:         rest.Root(node.ParentRoot.String()),
			JustifiedEpoch:     rest.EpochString(strconv.FormatUint(uint64(node.JustifiedEpoch), 10)),
			FinalizedEpoch:     rest.EpochString(strconv.FormatUint(uint64(node.FinalizedEpoch), 10)),
			Weight:             strconv.FormatUint(node.Weight, 10),
			Validity:           rest.ForkChoiceNodeValidity(node.Validity.String()),
			ExecutionBlockHash: rest.Root(node.ExecutionBlockHash.String()),
		}

		if len(node.ExtraData) > 0 {
			extra := make(rest.ForkChoiceNodeExtraData, len(node.ExtraData))

			for key, value := range node.ExtraData {
				raw, err := json.Marshal(value)
				if err != nil {
					return rest.ForkChoice{}, fmt.Errorf("failed to marshal extra_data %q: %w", key, err)
				}

				extra[key] = jx.Raw(raw)
			}

			restNode.ExtraData = rest.NewOptForkChoiceNodeExtraData(extra)
		}

		nodes = append(nodes, restNode)
	}

	return rest.ForkChoice{
		JustifiedCheckpoint: checkpointToRest(fc.JustifiedCheckpoint),
		FinalizedCheckpoint: checkpointToRest(fc.FinalizedCheckpoint),
		ForkChoiceNodes:     nodes,
	}, nil
}

// checkpointToRest maps a beacon checkpoint onto the spec's Checkpoint
// schema.
func checkpointToRest(cp phase0.Checkpoint) rest.Checkpoint {
	return rest.Checkpoint{
		Epoch: rest.EpochString(strconv.FormatUint(uint64(cp.Epoch), 10)),
		Root:  rest.Root(cp.Root.String()),
	}
}
