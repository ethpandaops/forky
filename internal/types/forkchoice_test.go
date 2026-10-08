package types

import (
	"encoding/hex"
	"encoding/json"
	"os"
	"strconv"
	"strings"
	"testing"

	v1 "github.com/ethpandaops/go-eth2-client/api/v1"
	"github.com/ethpandaops/go-eth2-client/spec/phase0"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// loadV2 decodes a GET /eth/v2/debug/fork_choice response, as go-eth2-client
// does: strictly to the spec.
func loadV2(t *testing.T, path string) *v1.ForkChoiceV2 {
	t.Helper()

	raw, err := os.ReadFile(path)
	require.NoError(t, err)

	var wrapped struct {
		Data *v1.ForkChoiceV2 `json:"data"`
	}

	require.NoError(t, json.Unmarshal(raw, &wrapped))
	require.NotNil(t, wrapped.Data)

	return wrapped.Data
}

// loadPartialV2 decodes a v2 response captured from a client predating the
// spec into forky's fork choice, leaving values the client does not provide
// unset, as a fork choice received through Xatu from an older sentry may be.
func loadPartialV2(t *testing.T, path string) *ForkChoice {
	t.Helper()

	raw, err := os.ReadFile(path)
	require.NoError(t, err)

	var envelope map[string]json.RawMessage

	require.NoError(t, json.Unmarshal(raw, &envelope))

	if data, wrapped := envelope["data"]; wrapped {
		raw = data
	}

	var response struct {
		JustifiedCheckpoint phase0.Checkpoint `json:"justified_checkpoint"`
		FinalizedCheckpoint phase0.Checkpoint `json:"finalized_checkpoint"`
		ForkChoiceNodes     []struct {
			Slot                string         `json:"slot"`
			BlockRoot           string         `json:"block_root"`
			ParentRoot          string         `json:"parent_root"`
			PayloadStatus       string         `json:"payload_status"`
			Weight              string         `json:"weight"`
			Validity            string         `json:"validity"`
			ExecutionBlockHash  string         `json:"execution_block_hash"`
			JustifiedEpoch      string         `json:"justified_epoch"`
			FinalizedEpoch      string         `json:"finalized_epoch"`
			PayloadAttesters    string         `json:"payload_attester_count"`
			PayloadAvailable    string         `json:"payload_availability_yes_count"`
			PayloadDataAvailabe string         `json:"payload_data_availability_yes_count"`
			ExtraData           map[string]any `json:"extra_data"`
		} `json:"fork_choice_nodes"`
		ExtraData map[string]any `json:"extra_data"`
	}

	require.NoError(t, json.Unmarshal(raw, &response))

	optional := func(value string) *uint64 {
		if value == "" {
			return nil
		}

		parsed, err := strconv.ParseUint(value, 10, 64)
		require.NoError(t, err)

		return &parsed
	}

	root := func(value string) phase0.Root {
		var r phase0.Root
		if value == "" {
			return r
		}

		decoded, err := hex.DecodeString(strings.TrimPrefix(value, "0x"))
		require.NoError(t, err)
		copy(r[:], decoded)

		return r
	}

	fc := &ForkChoice{
		JustifiedCheckpoint: response.JustifiedCheckpoint,
		FinalizedCheckpoint: response.FinalizedCheckpoint,
		ExtraData:           response.ExtraData,
	}

	for _, node := range response.ForkChoiceNodes {
		payloadStatus, err := v1.ForkChoicePayloadStatusFromString(node.PayloadStatus)
		require.NoError(t, err)

		validity, err := v1.ForkChoiceNodeValidityFromString(node.Validity)
		require.NoError(t, err)

		fc.ForkChoiceNodes = append(fc.ForkChoiceNodes, &ForkChoiceNode{
			Slot:                            phase0.Slot(*optional(node.Slot)),
			BlockRoot:                       root(node.BlockRoot),
			ParentRoot:                      root(node.ParentRoot),
			JustifiedEpoch:                  (*phase0.Epoch)(optional(node.JustifiedEpoch)),
			FinalizedEpoch:                  (*phase0.Epoch)(optional(node.FinalizedEpoch)),
			Weight:                          *optional(node.Weight),
			Validity:                        validity,
			ExecutionBlockHash:              root(node.ExecutionBlockHash),
			PayloadStatus:                   payloadStatus,
			PayloadAttesterCount:            optional(node.PayloadAttesters),
			PayloadAvailabilityYesCount:     optional(node.PayloadAvailable),
			PayloadDataAvailabilityYesCount: optional(node.PayloadDataAvailabe),
			ExtraData:                       node.ExtraData,
		})
	}

	return fc
}

func status(s v1.ForkChoicePayloadStatus) *v1.ForkChoicePayloadStatus {
	return new(s)
}

// The fixtures are the four newest blocks of each client's v2 response on
// Sepolia, a chain where every block was built on its parent's full payload,
// captured before the clients implemented the merged spec. The oldest block's
// parent is not in the fixture. NormalizeV2 fills in what they lack.
func TestNormalizeV2PartialClients(t *testing.T) {
	const oldestSlot = phase0.Slot(11299989)

	tests := []struct {
		name    string
		fixture string
		// epochs is whether the client provides checkpoint epochs.
		epochs bool
		// inferable is whether pending nodes carry the bid's parent block
		// hash, from which the parent payload status can be inferred.
		inferable bool
	}{
		{name: "Teku", fixture: "testdata/forkchoice_v2_teku.json", epochs: false, inferable: true},
		{name: "Prysm", fixture: "testdata/forkchoice_v2_prysm.json", epochs: true, inferable: false},
		{name: "Lodestar", fixture: "testdata/forkchoice_v2_lodestar.json", epochs: true, inferable: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			fc := NormalizeV2(loadPartialV2(t, test.fixture))
			require.Len(t, fc.ForkChoiceNodes, 12)

			for _, node := range fc.ForkChoiceNodes {
				assert.NotEmpty(t, node.PayloadStatus)
				assert.NotNil(t, node.PayloadAttesterCount, "slot %d %s", node.Slot, node.PayloadStatus)
				assert.NotNil(t, node.PayloadAvailabilityYesCount)
				assert.NotNil(t, node.PayloadDataAvailabilityYesCount)
				assert.Equal(t, test.epochs, node.JustifiedEpoch != nil, "slot %d %s", node.Slot, node.PayloadStatus)
				assert.Equal(t, test.epochs, node.FinalizedEpoch != nil)
				assert.NotEqual(t, node.BlockRoot, node.ParentRoot)

				switch {
				case node.PayloadStatus != v1.ForkChoicePayloadStatusPending:
					assert.Equal(t, status(v1.ForkChoicePayloadStatusPending), node.ParentPayloadStatus)
				case test.inferable && node.Slot != oldestSlot:
					assert.Equal(t, status(v1.ForkChoicePayloadStatusFull), node.ParentPayloadStatus, "slot %d", node.Slot)
				default:
					assert.Nil(t, node.ParentPayloadStatus, "slot %d", node.Slot)
				}
			}
		})
	}
}

func TestForkChoiceFromV2SpecParentLinks(t *testing.T) {
	var (
		rootA = phase0.Root{0xa}
		rootB = phase0.Root{0xb}
		rootC = phase0.Root{0xc}
		hashX = phase0.Hash32{0x1}
		hashA = phase0.Hash32{0x2}
		hashB = phase0.Hash32{0x3}
	)

	node := func(slot phase0.Slot, root, parent phase0.Root, s v1.ForkChoicePayloadStatus, hash phase0.Hash32) *v1.ForkChoiceNodeV2 {
		return &v1.ForkChoiceNodeV2{
			Slot:               slot,
			BlockRoot:          root,
			PayloadStatus:      s,
			ParentRoot:         parent,
			ExecutionBlockHash: hash,
		}
	}

	// Block A has pending and empty nodes with the chain's previous payload
	// hash X, and a full node with its own payload hash A. Block B follows the
	// spec, pointing its empty and full nodes at its own pending node, and was
	// built on A's full payload. Block C was built on B's empty payload.
	fc := ForkChoiceFromV2(&v1.ForkChoiceV2{
		ForkChoiceNodes: []*v1.ForkChoiceNodeV2{
			node(1, rootA, phase0.Root{}, v1.ForkChoicePayloadStatusPending, hashX),
			node(1, rootA, phase0.Root{}, v1.ForkChoicePayloadStatusEmpty, hashX),
			node(1, rootA, phase0.Root{}, v1.ForkChoicePayloadStatusFull, hashA),
			node(2, rootB, rootA, v1.ForkChoicePayloadStatusPending, hashA),
			node(2, rootB, rootB, v1.ForkChoicePayloadStatusEmpty, hashA),
			node(2, rootB, rootB, v1.ForkChoicePayloadStatusFull, hashB),
			node(3, rootC, rootB, v1.ForkChoicePayloadStatusPending, hashA),
		},
	})

	nodes := fc.ForkChoiceNodes
	require.Len(t, nodes, 7)

	assert.Nil(t, nodes[0].ParentPayloadStatus, "parent not in the tree")
	assert.Equal(t, status(v1.ForkChoicePayloadStatusFull), nodes[3].ParentPayloadStatus)
	assert.Equal(t, status(v1.ForkChoicePayloadStatusEmpty), nodes[6].ParentPayloadStatus)

	for _, n := range nodes[4:6] {
		assert.Equal(t, rootA, n.ParentRoot, "empty and full nodes keep the parent block's root")
		assert.Equal(t, status(v1.ForkChoicePayloadStatusPending), n.ParentPayloadStatus)
	}
}

func TestForkChoiceFromV2KeepsProvidedParentPayloadStatus(t *testing.T) {
	fc := ForkChoiceFromV2(&v1.ForkChoiceV2{
		ForkChoiceNodes: []*v1.ForkChoiceNodeV2{
			{
				Slot:                1,
				BlockRoot:           phase0.Root{0xb},
				ParentRoot:          phase0.Root{0xa},
				PayloadStatus:       v1.ForkChoicePayloadStatusPending,
				ParentPayloadStatus: status(v1.ForkChoicePayloadStatusEmpty),
			},
		},
	})

	assert.Equal(t, status(v1.ForkChoicePayloadStatusEmpty), fc.ForkChoiceNodes[0].ParentPayloadStatus)
}

// Nimbus returns two v1 nodes per Gloas block, with no payload status.
func TestForkChoiceFromV1CollapsesDuplicateBlocks(t *testing.T) {
	raw, err := os.ReadFile("testdata/forkchoice_v1_nimbus.json")
	require.NoError(t, err)

	var data v1.ForkChoice

	require.NoError(t, json.Unmarshal(raw, &data))
	require.Len(t, data.ForkChoiceNodes, 8)
	require.NotEmpty(t, data.ExtraData)

	fc := ForkChoiceFromV1(&data)
	require.Len(t, fc.ForkChoiceNodes, 4)
	assert.Equal(t, data.ExtraData, fc.ExtraData)

	heaviest := make(map[phase0.Root]uint64)
	for _, node := range data.ForkChoiceNodes {
		heaviest[node.BlockRoot] = max(heaviest[node.BlockRoot], node.Weight)
	}

	for _, node := range fc.ForkChoiceNodes {
		assert.Equal(t, heaviest[node.BlockRoot], node.Weight)
		assert.Empty(t, node.PayloadStatus)
		assert.NotNil(t, node.JustifiedEpoch)
	}
}

// Frames stored before Gloas support must decode and re-encode unchanged.
func TestFrameLegacyJSON(t *testing.T) {
	raw, err := os.ReadFile("testdata/frame_v1_legacy.json")
	require.NoError(t, err)

	var frame Frame

	require.NoError(t, json.Unmarshal(raw, &frame))
	require.NoError(t, frame.Validate())
	require.Len(t, frame.Data.ForkChoiceNodes, 3)

	encoded, err := json.Marshal(&frame)
	require.NoError(t, err)
	assert.JSONEq(t, string(raw), string(encoded))
}

func TestFrameGzipRoundTrip(t *testing.T) {
	data := ForkChoiceFromV2(loadV2(t, "testdata/forkchoice_v2_spec.json"))
	// Exercise the store extra data too; an empty one is omitted when encoded.
	data.ExtraData = map[string]any{"proposer_boost_root": "0xb0"}

	frame := &Frame{
		Data: data,
		Metadata: FrameMetadata{
			ID:   "id",
			Node: "node",
		},
	}

	gz, err := frame.AsGzipJSON()
	require.NoError(t, err)

	var decoded Frame

	require.NoError(t, decoded.FromGzipJSON(gz))
	assert.Equal(t, frame.Data, decoded.Data)
}

// Lighthouse reports a Gloas block whose payload has not been revealed as
// not_yet_revealed, which go-eth2-client decodes as unknown.
func TestForkChoiceFromV1NotYetRevealedIsOptimistic(t *testing.T) {
	var data v1.ForkChoice

	require.NoError(t, json.Unmarshal([]byte(`{
		"justified_checkpoint": {"epoch": "1", "root": "0x0000000000000000000000000000000000000000000000000000000000000000"},
		"finalized_checkpoint": {"epoch": "0", "root": "0x0000000000000000000000000000000000000000000000000000000000000000"},
		"fork_choice_nodes": [{
			"slot": "11300470",
			"block_root": "0x0100000000000000000000000000000000000000000000000000000000000000",
			"parent_root": "0x0200000000000000000000000000000000000000000000000000000000000000",
			"justified_epoch": "1",
			"finalized_epoch": "0",
			"weight": "0",
			"validity": "not_yet_revealed",
			"execution_block_hash": "0x0300000000000000000000000000000000000000000000000000000000000000",
			"extra_data": {}
		}]
	}`), &data))

	assert.Equal(t, v1.ForkChoiceNodeValidityNotYetRevealed, data.ForkChoiceNodes[0].Validity)

	fc := ForkChoiceFromV1(&data)
	require.Len(t, fc.ForkChoiceNodes, 1)
	assert.Equal(t, v1.ForkChoiceNodeValidityOptimistic, fc.ForkChoiceNodes[0].Validity)

	// Older go-eth2-client versions decoded it as unknown, keeping the original in extra_data.
	data.ForkChoiceNodes[0].Validity = v1.ForkChoiceNodeValidityUnknown
	data.ForkChoiceNodes[0].ExtraData = map[string]any{"validity": "not_yet_revealed"}

	fc = ForkChoiceFromV1(&data)
	assert.Equal(t, v1.ForkChoiceNodeValidityOptimistic, fc.ForkChoiceNodes[0].Validity)
}

// TestForkChoiceFromV2Spec normalizes a response in the shape the merged spec
// defines, derived from the Teku fixture: every node carries its checkpoints,
// PTC counts and parent payload status.
func TestForkChoiceFromV2Spec(t *testing.T) {
	original := loadV2(t, "testdata/forkchoice_v2_spec.json")
	fc := ForkChoiceFromV2(original)
	require.Len(t, fc.ForkChoiceNodes, 12)

	pendingRoots := make(map[phase0.Root]phase0.Root)

	for _, node := range fc.ForkChoiceNodes {
		if node.PayloadStatus == v1.ForkChoicePayloadStatusPending {
			pendingRoots[node.BlockRoot] = node.ParentRoot
		}
	}

	for i, node := range fc.ForkChoiceNodes {
		require.NotNil(t, node.JustifiedEpoch)
		assert.Equal(t, original.ForkChoiceNodes[i].JustifiedCheckpoint.Epoch, *node.JustifiedEpoch)
		require.NotNil(t, node.FinalizedEpoch)
		require.NotNil(t, node.PayloadAttesterCount)
		assert.Equal(t, original.ForkChoiceNodes[i].PayloadAttesterCount, *node.PayloadAttesterCount)
		assert.Equal(t, uint64(original.ForkChoiceNodes[i].Weight), node.Weight)

		if node.PayloadStatus != v1.ForkChoicePayloadStatusPending {
			assert.Equal(t, pendingRoots[node.BlockRoot], node.ParentRoot, "empty and full nodes keep the parent block's root")
			assert.Equal(t, status(v1.ForkChoicePayloadStatusPending), node.ParentPayloadStatus)
		}
	}

	// The oldest block's parent is not retained; the others were built on their parent's full payload.
	assert.Nil(t, fc.ForkChoiceNodes[0].ParentPayloadStatus)
}
