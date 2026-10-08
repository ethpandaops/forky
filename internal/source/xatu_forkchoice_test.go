package source

import (
	"encoding/json"
	"os"
	"testing"

	eth2v1 "github.com/ethpandaops/go-eth2-client/api/v1"
	xatuethv1 "github.com/ethpandaops/xatu/pkg/proto/eth/v1"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/types/known/wrapperspb"

	"github.com/ethpandaops/forky/internal/types"
)

func loadFixture(t *testing.T, path string, wrapped bool, dst any) {
	t.Helper()

	raw, err := os.ReadFile(path)
	require.NoError(t, err)

	if wrapped {
		var envelope struct {
			Data json.RawMessage `json:"data"`
		}

		require.NoError(t, json.Unmarshal(raw, &envelope))

		if envelope.Data != nil {
			raw = envelope.Data
		}
	}

	require.NoError(t, json.Unmarshal(raw, dst))
}

// throughPipeline sends a fork choice through the Xatu pipeline as forky
// receives it: encoded as JSON by the Xatu server, decoded by forky.
func throughPipeline(t *testing.T, fc *xatuethv1.ForkChoiceV2) *xatuethv1.ForkChoiceV2 {
	t.Helper()

	encoded, err := protojson.Marshal(fc)
	require.NoError(t, err)

	var decoded xatuethv1.ForkChoiceV2

	require.NoError(t, protojson.Unmarshal(encoded, &decoded))

	return &decoded
}

// TestForkChoiceFromXatuV2 ensures a v2 fork choice received from Xatu
// normalizes exactly as when fetched from the beacon node directly, keeping
// the empty and full nodes.
func TestForkChoiceFromXatuV2(t *testing.T) {
	var original eth2v1.ForkChoiceV2

	loadFixture(t, "../types/testdata/forkchoice_v2_spec.json", true, &original)

	fc, err := xatuethv1.NewForkChoiceV2FromGoEth2ClientV2(&original)
	require.NoError(t, err)

	got, err := forkChoiceFromXatu(throughPipeline(t, fc))
	require.NoError(t, err)
	require.Equal(t, types.ForkChoiceFromV2(&original), got)

	statuses := make(map[eth2v1.ForkChoicePayloadStatus]int)
	for _, node := range got.ForkChoiceNodes {
		statuses[node.PayloadStatus]++
	}

	require.Equal(t, map[eth2v1.ForkChoicePayloadStatus]int{
		eth2v1.ForkChoicePayloadStatusPending: 4,
		eth2v1.ForkChoicePayloadStatusEmpty:   4,
		eth2v1.ForkChoicePayloadStatusFull:    4,
	}, statuses)
}

// TestForkChoiceFromXatuV2Partial ensures a v2 fork choice from a sentry that
// sent nodes without checkpoints or PTC counts keeps them unset, for
// NormalizeV2 to fill in, rather than zero.
func TestForkChoiceFromXatuV2Partial(t *testing.T) {
	var original eth2v1.ForkChoiceV2

	loadFixture(t, "../types/testdata/forkchoice_v2_spec.json", true, &original)

	fc, err := xatuethv1.NewForkChoiceV2FromGoEth2ClientV2(&original)
	require.NoError(t, err)

	for _, node := range fc.GetForkChoiceNodes() {
		node.JustifiedCheckpoint, node.JustifiedEpoch = nil, nil
		node.FinalizedCheckpoint, node.FinalizedEpoch = nil, nil
		node.PayloadAttesterCount = nil
	}

	got, err := forkChoiceFromXatu(throughPipeline(t, fc))
	require.NoError(t, err)

	for _, node := range got.ForkChoiceNodes {
		require.Nil(t, node.JustifiedEpoch)
		require.Nil(t, node.FinalizedEpoch)
		require.Nil(t, node.PayloadAttesterCount)
		require.NotNil(t, node.PayloadAvailabilityYesCount)
	}

	// A sentry before ethpandaops/xatu#900 sent only the epochs.
	fc.GetForkChoiceNodes()[0].JustifiedEpoch = &wrapperspb.UInt64Value{Value: 7}

	got, err = forkChoiceFromXatu(throughPipeline(t, fc))
	require.NoError(t, err)
	require.NotNil(t, got.ForkChoiceNodes[0].JustifiedEpoch)
	require.Equal(t, uint64(7), uint64(*got.ForkChoiceNodes[0].JustifiedEpoch))
}

// TestForkChoiceFromXatuV1 ensures a v1 fork choice received from Xatu, from
// a sentry whose beacon node lacks the v2 endpoint, normalizes as a v1 dump.
func TestForkChoiceFromXatuV1(t *testing.T) {
	var original eth2v1.ForkChoice

	loadFixture(t, "../types/testdata/forkchoice_v1_nimbus.json", false, &original)

	fc, err := xatuethv1.NewForkChoiceV2FromGoEth2ClientV1(&original)
	require.NoError(t, err)

	got, err := forkChoiceFromXatu(throughPipeline(t, fc))
	require.NoError(t, err)
	require.Equal(t, types.ForkChoiceFromV1(&original), got)
}

func TestForkChoiceFromXatuInvalidPayloadStatus(t *testing.T) {
	var original eth2v1.ForkChoiceV2

	loadFixture(t, "../types/testdata/forkchoice_v2_spec.json", true, &original)

	fc, err := xatuethv1.NewForkChoiceV2FromGoEth2ClientV2(&original)
	require.NoError(t, err)

	fc.ForkChoiceNodes[1].PayloadStatus.Value = 7

	_, err = forkChoiceFromXatu(fc)
	require.EqualError(t, err, "invalid fork choice node 1: unrecognised payload status 7")
}
