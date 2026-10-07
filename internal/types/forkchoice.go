package types

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"

	v1 "github.com/ethpandaops/go-eth2-client/api/v1"
	"github.com/ethpandaops/go-eth2-client/spec/phase0"
)

// ForkChoice is a beacon node's fork choice dump, normalized across the v1 and
// v2 debug fork choice endpoints and the differences between client
// implementations of them.
//
// Frames stored before Gloas support hold the v1 shape, which this type reads
// unchanged: the Gloas fields are all optional.
type ForkChoice struct {
	// JustifiedCheckpoint is the store's justified checkpoint.
	JustifiedCheckpoint phase0.Checkpoint
	// FinalizedCheckpoint is the store's finalized checkpoint.
	FinalizedCheckpoint phase0.Checkpoint
	// ForkChoiceNodes are the fork choice nodes. Pre-Gloas, and for clients
	// without the v2 endpoint, there is one node per block. Post-Gloas a block
	// can have a pending, an empty and a full node.
	ForkChoiceNodes []*ForkChoiceNode
	// ExtraData is the client-specific extra data of the fork choice store,
	// such as the unrealized justified checkpoint.
	ExtraData map[string]any
}

// ForkChoiceNode is a node in the fork choice tree.
type ForkChoiceNode struct {
	Slot      phase0.Slot
	BlockRoot phase0.Root
	// ParentRoot is the root of the parent block. Unlike the v2 endpoint, it is
	// the parent block's root for empty and full nodes too.
	ParentRoot         phase0.Root
	JustifiedEpoch     *phase0.Epoch
	FinalizedEpoch     *phase0.Epoch
	Weight             uint64
	Validity           v1.ForkChoiceNodeValidity
	ExecutionBlockHash phase0.Root
	// PayloadStatus is the Gloas payload status of the node; unknown (the zero
	// value) for nodes without one.
	PayloadStatus v1.ForkChoicePayloadStatus
	// ParentPayloadStatus is the payload status of the parent fork choice node:
	// for a pending node, whether its block was built on the parent block's
	// empty or full payload; for empty and full nodes, pending. Nil if unknown.
	ParentPayloadStatus             *v1.ForkChoicePayloadStatus
	PayloadAttesterCount            *uint64
	PayloadAvailabilityYesCount     *uint64
	PayloadDataAvailabilityYesCount *uint64
	ExtraData                       map[string]any
}

type forkChoiceJSON struct {
	JustifiedCheckpoint *phase0.Checkpoint `json:"justified_checkpoint"`
	FinalizedCheckpoint *phase0.Checkpoint `json:"finalized_checkpoint"`
	ForkChoiceNodes     []*ForkChoiceNode  `json:"fork_choice_nodes"`
	ExtraData           map[string]any     `json:"extra_data,omitempty"`
}

// MarshalJSON implements json.Marshaler.
func (f *ForkChoice) MarshalJSON() ([]byte, error) {
	return json.Marshal(&forkChoiceJSON{
		JustifiedCheckpoint: &f.JustifiedCheckpoint,
		FinalizedCheckpoint: &f.FinalizedCheckpoint,
		ForkChoiceNodes:     f.ForkChoiceNodes,
		ExtraData:           f.ExtraData,
	})
}

// UnmarshalJSON implements json.Unmarshaler.
func (f *ForkChoice) UnmarshalJSON(input []byte) error {
	var data forkChoiceJSON
	if err := json.Unmarshal(input, &data); err != nil {
		return fmt.Errorf("invalid JSON: %w", err)
	}

	if data.JustifiedCheckpoint == nil {
		return errors.New("justified checkpoint missing")
	}

	if data.FinalizedCheckpoint == nil {
		return errors.New("finalized checkpoint missing")
	}

	if data.ForkChoiceNodes == nil {
		return errors.New("fork choice nodes missing")
	}

	for i, node := range data.ForkChoiceNodes {
		if node == nil {
			return fmt.Errorf("fork choice node entry %d missing", i)
		}
	}

	f.JustifiedCheckpoint = *data.JustifiedCheckpoint
	f.FinalizedCheckpoint = *data.FinalizedCheckpoint
	f.ForkChoiceNodes = data.ForkChoiceNodes
	f.ExtraData = data.ExtraData

	return nil
}

type forkChoiceNodeJSON struct {
	Slot                            string         `json:"slot"`
	BlockRoot                       string         `json:"block_root"`
	ParentRoot                      string         `json:"parent_root"`
	JustifiedEpoch                  string         `json:"justified_epoch,omitempty"`
	FinalizedEpoch                  string         `json:"finalized_epoch,omitempty"`
	Weight                          string         `json:"weight"`
	Validity                        string         `json:"validity"`
	ExecutionBlockHash              string         `json:"execution_block_hash"`
	PayloadStatus                   string         `json:"payload_status,omitempty"`
	ParentPayloadStatus             string         `json:"parent_payload_status,omitempty"`
	PayloadAttesterCount            string         `json:"payload_attester_count,omitempty"`
	PayloadAvailabilityYesCount     string         `json:"payload_availability_yes_count,omitempty"`
	PayloadDataAvailabilityYesCount string         `json:"payload_data_availability_yes_count,omitempty"`
	ExtraData                       map[string]any `json:"extra_data,omitempty"`
}

// MarshalJSON implements json.Marshaler.
func (n *ForkChoiceNode) MarshalJSON() ([]byte, error) {
	data := &forkChoiceNodeJSON{
		Slot:                            strconv.FormatUint(uint64(n.Slot), 10),
		BlockRoot:                       n.BlockRoot.String(),
		ParentRoot:                      n.ParentRoot.String(),
		JustifiedEpoch:                  formatOptionalUint64((*uint64)(n.JustifiedEpoch)),
		FinalizedEpoch:                  formatOptionalUint64((*uint64)(n.FinalizedEpoch)),
		Weight:                          strconv.FormatUint(n.Weight, 10),
		Validity:                        n.Validity.String(),
		ExecutionBlockHash:              n.ExecutionBlockHash.String(),
		PayloadStatus:                   "",
		PayloadAttesterCount:            formatOptionalUint64(n.PayloadAttesterCount),
		PayloadAvailabilityYesCount:     formatOptionalUint64(n.PayloadAvailabilityYesCount),
		PayloadDataAvailabilityYesCount: formatOptionalUint64(n.PayloadDataAvailabilityYesCount),
		ExtraData:                       n.ExtraData,
	}

	if n.PayloadStatus != v1.ForkChoicePayloadStatusUnknown {
		data.PayloadStatus = n.PayloadStatus.String()
	}

	if n.ParentPayloadStatus != nil {
		data.ParentPayloadStatus = n.ParentPayloadStatus.String()
	}

	return json.Marshal(data)
}

// UnmarshalJSON implements json.Unmarshaler.
func (n *ForkChoiceNode) UnmarshalJSON(input []byte) error {
	var data forkChoiceNodeJSON
	if err := json.Unmarshal(input, &data); err != nil {
		return fmt.Errorf("invalid JSON: %w", err)
	}

	slot, err := strconv.ParseUint(data.Slot, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid value for slot: %w", err)
	}

	n.Slot = phase0.Slot(slot)

	if err = decodeRoot(&n.BlockRoot, data.BlockRoot); err != nil {
		return fmt.Errorf("invalid value for block root: %w", err)
	}

	// The parent root is null for the oldest retained node on some clients.
	if data.ParentRoot != "" {
		if err = decodeRoot(&n.ParentRoot, data.ParentRoot); err != nil {
			return fmt.Errorf("invalid value for parent root: %w", err)
		}
	}

	justifiedEpoch, err := parseOptionalUint64(data.JustifiedEpoch)
	if err != nil {
		return fmt.Errorf("invalid value for justified epoch: %w", err)
	}

	n.JustifiedEpoch = (*phase0.Epoch)(justifiedEpoch)

	finalizedEpoch, err := parseOptionalUint64(data.FinalizedEpoch)
	if err != nil {
		return fmt.Errorf("invalid value for finalized epoch: %w", err)
	}

	n.FinalizedEpoch = (*phase0.Epoch)(finalizedEpoch)

	if n.Weight, err = strconv.ParseUint(data.Weight, 10, 64); err != nil {
		return fmt.Errorf("invalid value for weight: %w", err)
	}

	if n.Validity, err = v1.ForkChoiceNodeValidityFromString(data.Validity); err != nil {
		return fmt.Errorf("invalid value for validity: %w", err)
	}

	if err = decodeRoot(&n.ExecutionBlockHash, data.ExecutionBlockHash); err != nil {
		return fmt.Errorf("invalid value for execution block hash: %w", err)
	}

	if data.PayloadStatus != "" {
		if n.PayloadStatus, err = v1.ForkChoicePayloadStatusFromString(data.PayloadStatus); err != nil {
			return err
		}
	}

	if data.ParentPayloadStatus != "" {
		var status v1.ForkChoicePayloadStatus
		if status, err = v1.ForkChoicePayloadStatusFromString(data.ParentPayloadStatus); err != nil {
			return fmt.Errorf("invalid value for parent payload status: %w", err)
		}

		n.ParentPayloadStatus = &status
	}

	if n.PayloadAttesterCount, err = parseOptionalUint64(data.PayloadAttesterCount); err != nil {
		return fmt.Errorf("invalid value for payload attester count: %w", err)
	}

	if n.PayloadAvailabilityYesCount, err = parseOptionalUint64(data.PayloadAvailabilityYesCount); err != nil {
		return fmt.Errorf("invalid value for payload availability yes count: %w", err)
	}

	if n.PayloadDataAvailabilityYesCount, err = parseOptionalUint64(data.PayloadDataAvailabilityYesCount); err != nil {
		return fmt.Errorf("invalid value for payload data availability yes count: %w", err)
	}

	n.ExtraData = data.ExtraData

	return nil
}

func decodeRoot(dst *phase0.Root, input string) error {
	return dst.UnmarshalJSON([]byte(strconv.Quote(input)))
}

// parseOptionalUint64 parses a decimal string, returning nil for an empty one.
func parseOptionalUint64(input string) (*uint64, error) {
	if input == "" {
		return nil, nil
	}

	value, err := strconv.ParseUint(input, 10, 64)
	if err != nil {
		return nil, err
	}

	return &value, nil
}

func formatOptionalUint64(value *uint64) string {
	if value == nil {
		return ""
	}

	return strconv.FormatUint(*value, 10)
}
