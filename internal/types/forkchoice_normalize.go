package types

import (
	"encoding/json"
	"strconv"

	v1 "github.com/ethpandaops/go-eth2-client/api/v1"
	"github.com/ethpandaops/go-eth2-client/spec/phase0"
)

// ForkChoiceFromV1 normalizes a GET /eth/v1/debug/fork_choice response.
//
// Since Gloas some clients return one v1 node per fork choice node, i.e. up to
// three nodes per block with no payload status to tell them apart. Those are
// collapsed to the heaviest node per block, which is the block's pending node.
func ForkChoiceFromV1(fc *v1.ForkChoice) *ForkChoice {
	nodes := make([]*ForkChoiceNode, 0, len(fc.ForkChoiceNodes))
	byRoot := make(map[phase0.Root]int, len(fc.ForkChoiceNodes))

	for _, node := range fc.ForkChoiceNodes {
		justifiedEpoch := node.JustifiedEpoch
		finalizedEpoch := node.FinalizedEpoch

		normalized := &ForkChoiceNode{
			Slot:               node.Slot,
			BlockRoot:          node.BlockRoot,
			ParentRoot:         node.ParentRoot,
			JustifiedEpoch:     &justifiedEpoch,
			FinalizedEpoch:     &finalizedEpoch,
			Weight:             node.Weight,
			Validity:           v1Validity(node),
			ExecutionBlockHash: node.ExecutionBlockHash,
			ExtraData:          node.ExtraData,
		}

		if i, exists := byRoot[node.BlockRoot]; exists {
			if normalized.Weight > nodes[i].Weight {
				nodes[i] = normalized
			}

			continue
		}

		byRoot[node.BlockRoot] = len(nodes)
		nodes = append(nodes, normalized)
	}

	return &ForkChoice{
		JustifiedCheckpoint: fc.JustifiedCheckpoint,
		FinalizedCheckpoint: fc.FinalizedCheckpoint,
		ForkChoiceNodes:     nodes,
		ExtraData:           fc.ExtraData,
	}
}

// v1Validity is a v1 node's validity. Lighthouse reports a Gloas block whose
// payload has not been revealed yet as not_yet_revealed (and mirrors it in
// extra_data["execution_status"]); its execution is simply not verified yet,
// i.e. optimistic. go-eth2-client decodes it as
// ForkChoiceNodeValidityNotYetRevealed; older versions decoded it as unknown,
// keeping the original under extra_data["validity"], as fork choices already
// stored or received from older sentries may still have it.
func v1Validity(node *v1.ForkChoiceNode) v1.ForkChoiceNodeValidity {
	switch {
	case node.Validity == v1.ForkChoiceNodeValidityNotYetRevealed:
		return v1.ForkChoiceNodeValidityOptimistic
	case node.Validity == v1.ForkChoiceNodeValidityUnknown &&
		(node.ExtraData["validity"] == "not_yet_revealed" || node.ExtraData["execution_status"] == "not_yet_revealed"):
		return v1.ForkChoiceNodeValidityOptimistic
	default:
		return node.Validity
	}
}

// ForkChoiceFromV2 normalizes a GET /eth/v2/debug/fork_choice response, which
// go-eth2-client has checked against the spec (ethereum/beacon-APIs#615), so
// every node carries all of its values.
func ForkChoiceFromV2(fc *v1.ForkChoiceV2) *ForkChoice {
	nodes := make([]*ForkChoiceNode, 0, len(fc.ForkChoiceNodes))

	for _, node := range fc.ForkChoiceNodes {
		var (
			justifiedEpoch                  = node.JustifiedCheckpoint.Epoch
			finalizedEpoch                  = node.FinalizedCheckpoint.Epoch
			payloadAttesterCount            = node.PayloadAttesterCount
			payloadAvailabilityYesCount     = node.PayloadAvailabilityYesCount
			payloadDataAvailabilityYesCount = node.PayloadDataAvailabilityYesCount
		)

		normalized := &ForkChoiceNode{
			Slot:                            node.Slot,
			BlockRoot:                       node.BlockRoot,
			ParentRoot:                      node.ParentRoot,
			JustifiedEpoch:                  &justifiedEpoch,
			FinalizedEpoch:                  &finalizedEpoch,
			Weight:                          uint64(node.Weight),
			Validity:                        node.Validity,
			ExecutionBlockHash:              phase0.Root(node.ExecutionBlockHash),
			PayloadStatus:                   node.PayloadStatus,
			PayloadAttesterCount:            &payloadAttesterCount,
			PayloadAvailabilityYesCount:     &payloadAvailabilityYesCount,
			PayloadDataAvailabilityYesCount: &payloadDataAvailabilityYesCount,
			ExtraData:                       node.ExtraData,
		}

		if node.ParentPayloadStatus != nil {
			parentPayloadStatus := *node.ParentPayloadStatus
			normalized.ParentPayloadStatus = &parentPayloadStatus
		}

		nodes = append(nodes, normalized)
	}

	return NormalizeV2(&ForkChoice{
		JustifiedCheckpoint: fc.JustifiedCheckpoint,
		FinalizedCheckpoint: fc.FinalizedCheckpoint,
		ForkChoiceNodes:     nodes,
		ExtraData:           fc.ExtraData,
	})
}

// nilIfEmpty returns nil for an empty extra data map. The spec requires
// extra_data, so clients send an empty object when they have none; forky
// represents (and encodes) no extra data as nil, however it was received.
func nilIfEmpty(extraData map[string]any) map[string]any {
	if len(extraData) == 0 {
		return nil
	}

	return extraData
}

// NormalizeV2 normalizes, in place, a fork choice with one node per (block
// root, payload status) pair.
//
// Empty and full nodes, which the spec points at their own block's pending
// node, keep the parent block's root as their parent root. Values a node
// lacks, as nodes received through Xatu from older sentries or from a client
// predating the spec may, are filled in from its extra_data or its block's
// other nodes, and missing parent payload statuses are inferred where possible.
// Empty extra data is set to nil.
func NormalizeV2(fc *ForkChoice) *ForkChoice {
	blocks := make(map[phase0.Root]map[v1.ForkChoicePayloadStatus]*ForkChoiceNode, len(fc.ForkChoiceNodes))

	fc.ExtraData = nilIfEmpty(fc.ExtraData)

	for _, node := range fc.ForkChoiceNodes {
		node.ExtraData = nilIfEmpty(node.ExtraData)
		fillFromExtraData(node)

		if blocks[node.BlockRoot] == nil {
			blocks[node.BlockRoot] = make(map[v1.ForkChoicePayloadStatus]*ForkChoiceNode, 3)
		}

		blocks[node.BlockRoot][node.PayloadStatus] = node
	}

	for _, node := range fc.ForkChoiceNodes {
		block := blocks[node.BlockRoot]

		// The spec points empty and full nodes at their own block's pending
		// node; keep parent_root as the parent block's root.
		if pending := block[v1.ForkChoicePayloadStatusPending]; pending != nil && node.ParentRoot == node.BlockRoot {
			node.ParentRoot = pending.ParentRoot
		}

		for _, sibling := range block {
			if sibling != node {
				fillFromSibling(node, sibling)
			}
		}

		if node.ParentPayloadStatus == nil {
			node.ParentPayloadStatus = inferParentPayloadStatus(node, blocks[node.ParentRoot])
		}
	}

	return fc
}

// fillFromExtraData fills values that some clients only provide in extra_data.
func fillFromExtraData(node *ForkChoiceNode) {
	if node.JustifiedEpoch == nil {
		node.JustifiedEpoch = (*phase0.Epoch)(extraDataUint64(node.ExtraData, "justified_epoch"))
	}

	if node.FinalizedEpoch == nil {
		node.FinalizedEpoch = (*phase0.Epoch)(extraDataUint64(node.ExtraData, "finalized_epoch"))
	}

	if node.PayloadAttesterCount == nil {
		node.PayloadAttesterCount = extraDataUint64(node.ExtraData, "payload_attester_count")
	}

	if node.PayloadAvailabilityYesCount == nil {
		node.PayloadAvailabilityYesCount = extraDataUint64(node.ExtraData, "payload_availability_yes_count")
	}

	if node.PayloadDataAvailabilityYesCount == nil {
		node.PayloadDataAvailabilityYesCount = extraDataUint64(node.ExtraData, "payload_data_availability_yes_count")
	}
}

// fillFromSibling fills block-level values, which are the same for all nodes
// of a block, that some clients only provide on one of a block's nodes:
// Prysm on the pending node, Lodestar's PTC counts on the full node.
func fillFromSibling(node, sibling *ForkChoiceNode) {
	if node.JustifiedEpoch == nil {
		node.JustifiedEpoch = sibling.JustifiedEpoch
	}

	if node.FinalizedEpoch == nil {
		node.FinalizedEpoch = sibling.FinalizedEpoch
	}

	if node.PayloadAttesterCount == nil {
		node.PayloadAttesterCount = sibling.PayloadAttesterCount
	}

	if node.PayloadAvailabilityYesCount == nil {
		node.PayloadAvailabilityYesCount = sibling.PayloadAvailabilityYesCount
	}

	if node.PayloadDataAvailabilityYesCount == nil {
		node.PayloadDataAvailabilityYesCount = sibling.PayloadDataAvailabilityYesCount
	}
}

// inferParentPayloadStatus infers the payload status of a node's parent fork
// choice node. Empty and full nodes hang off their own block's pending node.
// A pending node's execution block hash is the bid's parent block hash, which
// is the parent block's payload hash if the block was built on the full
// parent, or the parent's own parent block hash if it was built on the empty
// parent. Returns nil when it cannot be determined, e.g. for clients that put
// the bid's own block hash on pending nodes.
func inferParentPayloadStatus(
	node *ForkChoiceNode,
	parent map[v1.ForkChoicePayloadStatus]*ForkChoiceNode,
) *v1.ForkChoicePayloadStatus {
	switch node.PayloadStatus {
	case v1.ForkChoicePayloadStatusEmpty, v1.ForkChoicePayloadStatusFull:
		return new(v1.ForkChoicePayloadStatusPending)
	case v1.ForkChoicePayloadStatusPending:
		if full := parent[v1.ForkChoicePayloadStatusFull]; full != nil && full.ExecutionBlockHash == node.ExecutionBlockHash {
			return new(v1.ForkChoicePayloadStatusFull)
		}

		if pending := parent[v1.ForkChoicePayloadStatusPending]; pending != nil && pending.ExecutionBlockHash == node.ExecutionBlockHash {
			return new(v1.ForkChoicePayloadStatusEmpty)
		}
	case v1.ForkChoicePayloadStatusUnknown:
	}

	return nil
}

// extraDataUint64 reads a uint64 from extra_data, which clients encode either
// as a decimal string or as a JSON number.
func extraDataUint64(extraData map[string]any, key string) *uint64 {
	var (
		value uint64
		err   error
	)

	switch raw := extraData[key].(type) {
	case string:
		value, err = strconv.ParseUint(raw, 10, 64)
	case float64:
		if raw < 0 || raw != float64(uint64(raw)) {
			return nil
		}

		value = uint64(raw)
	case json.Number:
		value, err = strconv.ParseUint(raw.String(), 10, 64)
	default:
		return nil
	}

	if err != nil {
		return nil
	}

	return &value
}
