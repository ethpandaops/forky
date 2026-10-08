package source

import (
	"encoding/json"
	"errors"
	"fmt"

	eth2v1 "github.com/ethpandaops/go-eth2-client/api/v1"
	"github.com/ethpandaops/go-eth2-client/spec/phase0"
	xatuethv1 "github.com/ethpandaops/xatu/pkg/proto/eth/v1"
	"google.golang.org/protobuf/types/known/wrapperspb"

	"github.com/ethpandaops/forky/internal/types"
)

// forkChoiceFromXatu normalizes a fork choice dump received from Xatu.
//
// Sentries fetching the Gloas-aware v2 endpoint set a payload status on every
// node, with one node per block root and payload status; those dumps are
// normalized as v2 dumps, keeping the empty and full nodes. Anything else came
// from the v1 endpoint and is normalized as a v1 dump.
func forkChoiceFromXatu(fc *xatuethv1.ForkChoiceV2) (*types.ForkChoice, error) {
	if !hasPayloadStatuses(fc) {
		data, err := fc.AsGoEth2ClientV1ForkChoice()
		if err != nil {
			return nil, err
		}

		return types.ForkChoiceFromV1(data), nil
	}

	data, err := forkChoiceV2FromXatu(fc)
	if err != nil {
		return nil, err
	}

	return types.NormalizeV2(data), nil
}

// hasPayloadStatuses returns true if every node of the fork choice has a
// payload status.
func hasPayloadStatuses(fc *xatuethv1.ForkChoiceV2) bool {
	if len(fc.GetForkChoiceNodes()) == 0 {
		return false
	}

	for _, node := range fc.GetForkChoiceNodes() {
		if node.GetPayloadStatus() == nil {
			return false
		}
	}

	return true
}

// forkChoiceV2FromXatu converts a Xatu fork choice with payload statuses into
// forky's fork choice. Values a node does not carry stay unset, for
// NormalizeV2 to fill in where it can.
func forkChoiceV2FromXatu(fc *xatuethv1.ForkChoiceV2) (*types.ForkChoice, error) {
	justifiedCheckpoint, err := checkpointFromXatu(fc.GetJustifiedCheckpoint())
	if err != nil {
		return nil, fmt.Errorf("invalid justified checkpoint: %w", err)
	}

	finalizedCheckpoint, err := checkpointFromXatu(fc.GetFinalizedCheckpoint())
	if err != nil {
		return nil, fmt.Errorf("invalid finalized checkpoint: %w", err)
	}

	extraData, err := extraDataFromXatu(fc.GetExtraData())
	if err != nil {
		return nil, fmt.Errorf("invalid extra data: %w", err)
	}

	nodes := make([]*types.ForkChoiceNode, 0, len(fc.GetForkChoiceNodes()))

	for i, node := range fc.GetForkChoiceNodes() {
		converted, err := forkChoiceNodeFromXatu(node)
		if err != nil {
			return nil, fmt.Errorf("invalid fork choice node %d: %w", i, err)
		}

		nodes = append(nodes, converted)
	}

	return &types.ForkChoice{
		JustifiedCheckpoint: justifiedCheckpoint,
		FinalizedCheckpoint: finalizedCheckpoint,
		ForkChoiceNodes:     nodes,
		ExtraData:           extraData,
	}, nil
}

func forkChoiceNodeFromXatu(node *xatuethv1.ForkChoiceNodeV2) (*types.ForkChoiceNode, error) {
	blockRoot, err := xatuethv1.StringToRoot(node.GetBlockRoot())
	if err != nil {
		return nil, fmt.Errorf("invalid block root: %w", err)
	}

	// The parent root is empty for the oldest retained node on some clients.
	var parentRoot phase0.Root
	if node.GetParentRoot() != "" {
		if parentRoot, err = xatuethv1.StringToRoot(node.GetParentRoot()); err != nil {
			return nil, fmt.Errorf("invalid parent root: %w", err)
		}
	}

	executionBlockHash, err := xatuethv1.StringToRoot(node.GetExecutionBlockHash())
	if err != nil {
		return nil, fmt.Errorf("invalid execution block hash: %w", err)
	}

	payloadStatus, err := payloadStatusFromXatu(node.GetPayloadStatus().GetValue())
	if err != nil {
		return nil, err
	}

	extraData, err := extraDataFromXatu(node.GetExtraData())
	if err != nil {
		return nil, fmt.Errorf("invalid extra data: %w", err)
	}

	validity, err := eth2v1.ForkChoiceNodeValidityFromString(node.GetValidity())
	if err != nil {
		return nil, fmt.Errorf("invalid validity: %w", err)
	}

	converted := &types.ForkChoiceNode{
		Slot:                            phase0.Slot(node.GetSlot().GetValue()),
		BlockRoot:                       blockRoot,
		ParentRoot:                      parentRoot,
		JustifiedEpoch:                  epochFromXatu(node.GetJustifiedCheckpoint(), node.GetJustifiedEpoch()),
		FinalizedEpoch:                  epochFromXatu(node.GetFinalizedCheckpoint(), node.GetFinalizedEpoch()),
		Weight:                          node.GetWeight().GetValue(),
		Validity:                        validity,
		ExecutionBlockHash:              executionBlockHash,
		PayloadStatus:                   payloadStatus,
		PayloadAttesterCount:            uint64FromXatu(node.GetPayloadAttesterCount()),
		PayloadAvailabilityYesCount:     uint64FromXatu(node.GetPayloadAvailabilityYesCount()),
		PayloadDataAvailabilityYesCount: uint64FromXatu(node.GetPayloadDataAvailabilityYesCount()),
		ExtraData:                       extraData,
	}

	if node.GetParentPayloadStatus() != nil {
		parentPayloadStatus, err := payloadStatusFromXatu(node.GetParentPayloadStatus().GetValue())
		if err != nil {
			return nil, fmt.Errorf("invalid parent payload status: %w", err)
		}

		converted.ParentPayloadStatus = &parentPayloadStatus
	}

	return converted, nil
}

// epochFromXatu returns a node's checkpoint epoch: from its checkpoint, which
// sentries since ethpandaops/xatu#900 send, else from the epoch field.
func epochFromXatu(checkpoint *xatuethv1.CheckpointV2, epoch *wrapperspb.UInt64Value) *phase0.Epoch {
	switch {
	case checkpoint.GetEpoch() != nil:
		value := phase0.Epoch(checkpoint.GetEpoch().GetValue())

		return &value
	case epoch != nil:
		value := phase0.Epoch(epoch.GetValue())

		return &value
	default:
		return nil
	}
}

// uint64FromXatu returns a wrapped value, nil if unset.
func uint64FromXatu(value *wrapperspb.UInt64Value) *uint64 {
	if value == nil {
		return nil
	}

	v := value.GetValue()

	return &v
}

func checkpointFromXatu(checkpoint *xatuethv1.CheckpointV2) (phase0.Checkpoint, error) {
	if checkpoint == nil {
		return phase0.Checkpoint{}, errors.New("missing")
	}

	root, err := xatuethv1.StringToRoot(checkpoint.GetRoot())
	if err != nil {
		return phase0.Checkpoint{}, err
	}

	return phase0.Checkpoint{
		Epoch: phase0.Epoch(checkpoint.GetEpoch().GetValue()),
		Root:  root,
	}, nil
}

// payloadStatusFromXatu maps Xatu's payload status, the spec's PayloadStatus
// enum, onto go-eth2-client's.
func payloadStatusFromXatu(status uint32) (eth2v1.ForkChoicePayloadStatus, error) {
	switch status {
	case 0:
		return eth2v1.ForkChoicePayloadStatusEmpty, nil
	case 1:
		return eth2v1.ForkChoicePayloadStatusFull, nil
	case 2:
		return eth2v1.ForkChoicePayloadStatusPending, nil
	default:
		return eth2v1.ForkChoicePayloadStatusUnknown, fmt.Errorf("unrecognised payload status %d", status)
	}
}

// extraDataFromXatu decodes extra data that Xatu carries as a JSON string,
// which is empty or null when the client provides none.
func extraDataFromXatu(input string) (map[string]any, error) {
	if input == "" {
		return nil, nil
	}

	var extraData map[string]any
	if err := json.Unmarshal([]byte(input), &extraData); err != nil {
		return nil, err
	}

	return extraData, nil
}
