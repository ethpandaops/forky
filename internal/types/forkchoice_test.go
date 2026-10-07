package types

import (
	"encoding/json"
	"os"
	"testing"

	v1 "github.com/ethpandaops/go-eth2-client/api/v1"
	"github.com/ethpandaops/go-eth2-client/spec/phase0"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func loadV2(t *testing.T, path string) *v1.ForkChoiceV2 {
	t.Helper()

	raw, err := os.ReadFile(path)
	require.NoError(t, err)

	var wrapped struct {
		Data *v1.ForkChoiceV2 `json:"data"`
	}

	require.NoError(t, json.Unmarshal(raw, &wrapped))

	if wrapped.Data != nil {
		return wrapped.Data
	}

	var fc v1.ForkChoiceV2

	require.NoError(t, json.Unmarshal(raw, &fc))

	return &fc
}

func status(s v1.ForkChoicePayloadStatus) *v1.ForkChoicePayloadStatus {
	return new(s)
}

// The fixtures are the four newest blocks of each client's v2 response on
// Sepolia, a chain where every block was built on its parent's full payload.
// The oldest block's parent is not in the fixture.
func TestForkChoiceFromV2Clients(t *testing.T) {
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
			fc := ForkChoiceFromV2(loadV2(t, test.fixture))
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
	frame := &Frame{
		Data: ForkChoiceFromV2(loadV2(t, "testdata/forkchoice_v2_lodestar.json")),
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

	assert.Equal(t, "not_yet_revealed", data.ForkChoiceNodes[0].ExtraData["validity"])

	fc := ForkChoiceFromV1(&data)
	require.Len(t, fc.ForkChoiceNodes, 1)
	assert.Equal(t, v1.ForkChoiceNodeValidityOptimistic, fc.ForkChoiceNodes[0].Validity)
}
