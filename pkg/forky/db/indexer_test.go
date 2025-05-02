package db

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"testing"
	"time"

	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forky/pkg/forky/types"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"gopkg.in/DATA-DOG/go-sqlmock.v1"
)

//nolint:gosec // not a security issue
func testRandIntn(n int) int {
	return rand.Intn(n)
}

var (
	testDBCounter = 0
)

func newMockIndexer() (*Indexer, sqlmock.Sqlmock, error) {
	db, mock, err := sqlmock.New()
	if err != nil {
		return nil, nil, fmt.Errorf("Failed to open mock sql db, got error: %v", err)
	}

	if db == nil {
		return nil, nil, errors.New("sql db is nil")
	}

	if mock == nil {
		return nil, nil, errors.New("mock sql is nil")
	}

	testDBCounter++

	indexer, err := NewIndexer("forky_test", logrus.New(), IndexerConfig{
		DSN:        fmt.Sprintf("file:%v?mode=memory&cache=shared", testDBCounter),
		DriverName: "sqlite",
	}, DefaultOptions().SetMetricsEnabled(false))
	if err != nil {
		return nil, nil, fmt.Errorf("Failed to create indexer, got error: %v", err)
	}

	return indexer, mock, nil
}

func TestFrame_AsFrameMetadata(t *testing.T) {
	t.Run("conversion", func(t *testing.T) {
		frame := FrameMetadata{
			ID:              "id",
			Node:            "node",
			WallClockSlot:   42,
			WallClockEpoch:  21,
			FetchedAt:       time.Now(),
			Labels:          []FrameMetadataLabel{{Name: "a"}, {Name: "b"}, {Name: "c"}},
			ConsensusClient: "prysm",
			EventSource:     BeaconNodeEventSource,
		}

		metadata := frame.AsFrameMetadata()

		assert.Equal(t, frame.ID, metadata.ID)
		assert.Equal(t, frame.Node, metadata.Node)
		//nolint:gosec // ignore integer overflow conversion uint64 -> int64
		assert.Equal(t, phase0.Slot(frame.WallClockSlot), metadata.WallClockSlot)
		//nolint:gosec // ignore integer overflow conversion uint64 -> int64
		assert.Equal(t, phase0.Epoch(frame.WallClockEpoch), metadata.WallClockEpoch)
		assert.Equal(t, frame.FetchedAt, metadata.FetchedAt)
		l := FrameMetadataLabels(frame.Labels)
		assert.Equal(t, l.AsStrings(), metadata.Labels)
		assert.Equal(t, frame.ConsensusClient, metadata.ConsensusClient)
		assert.Equal(t, frame.EventSource.String(), metadata.EventSource)
	})
}

func TestIndexer_AddFrame(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		indexer, _, err := newMockIndexer()
		if err != nil {
			t.Fatal(err)
		}

		id := uuid.New()

		frame := &types.FrameMetadata{
			ID:              id.String(),
			Node:            "node",
			WallClockSlot:   phase0.Slot(42),
			WallClockEpoch:  phase0.Epoch(21),
			FetchedAt:       time.Now(),
			Labels:          []string{"a", "b", "c"},
			ConsensusClient: "prysm",
			EventSource:     BeaconNodeEventSource.String(),
		}

		err = indexer.InsertFrameMetadata(context.Background(), frame)
		assert.NoError(t, err)
	})

	t.Run("with no labels", func(t *testing.T) {
		indexer, _, err := newMockIndexer()
		if err != nil {
			t.Fatal(err)
		}

		id := uuid.New()

		frame := &types.FrameMetadata{
			ID:              id.String(),
			Node:            "node",
			WallClockSlot:   phase0.Slot(42),
			WallClockEpoch:  phase0.Epoch(21),
			FetchedAt:       time.Now(),
			Labels:          nil,
			ConsensusClient: "prysm",
			EventSource:     BeaconNodeEventSource.String(),
		}

		err = indexer.InsertFrameMetadata(context.Background(), frame)
		assert.NoError(t, err)
	})
}

//nolint:gocyclo // its a test m8
func TestIndexer_ListFrames(t *testing.T) {
	t.Run("By ID", func(t *testing.T) {
		indexer, _, err := newMockIndexer()
		if err != nil {
			t.Fatal(err)
		}

		id := uuid.New().String()

		frame := &types.FrameMetadata{
			ID:             id,
			Node:           "node",
			WallClockSlot:  phase0.Slot(42),
			WallClockEpoch: phase0.Epoch(21),
			FetchedAt:      time.Now(),
			Labels:         []string{"a", "b", "c"},
		}

		err = indexer.InsertFrameMetadata(context.Background(), frame)
		if err != nil {
			t.Fatal(err)
		}

		frames, err := indexer.ListFrameMetadata(context.Background(), &FrameFilter{
			ID: &id,
		}, &PaginationCursor{})
		if err != nil {
			t.Fatal(err)
		}

		assert.Len(t, frames, 1)
		assert.Equal(t, frame.ID, frames[0].ID)
	})

	t.Run("With no labels", func(t *testing.T) {
		indexer, _, err := newMockIndexer()
		if err != nil {
			t.Fatal(err)
		}

		id := uuid.New().String()

		frame := &types.FrameMetadata{
			ID:             id,
			Node:           "node",
			WallClockSlot:  phase0.Slot(42),
			WallClockEpoch: phase0.Epoch(21),
			FetchedAt:      time.Now(),
			Labels:         nil,
		}

		err = indexer.InsertFrameMetadata(context.Background(), frame)
		if err != nil {
			t.Fatal(err)
		}

		frames, err := indexer.ListFrameMetadata(context.Background(), &FrameFilter{
			ID: &id,
		}, &PaginationCursor{})
		if err != nil {
			t.Fatal(err)
		}

		assert.Len(t, frames, 1)
		assert.Equal(t, frame.ID, frames[0].ID)
	})

	t.Run("By Node", func(t *testing.T) {
		indexer, _, err := newMockIndexer()
		if err != nil {
			t.Fatal(err)
		}

		node := "node1"

		frame := &types.FrameMetadata{
			ID:             uuid.New().String(),
			Node:           node,
			WallClockSlot:  phase0.Slot(42),
			WallClockEpoch: phase0.Epoch(21),
			FetchedAt:      time.Now(),
			Labels:         []string{"a", "b", "c"},
		}

		err = indexer.InsertFrameMetadata(context.Background(), frame)
		if err != nil {
			t.Fatal(err)
		}

		frames, err := indexer.ListFrameMetadata(context.Background(), &FrameFilter{
			Node: &node,
		}, &PaginationCursor{})
		if err != nil {
			t.Fatal(err)
		}

		assert.Len(t, frames, 1)
		assert.Equal(t, frame.Node, frames[0].Node)
	})

	t.Run("By WallClockSlot", func(t *testing.T) {
		indexer, _, err := newMockIndexer()
		if err != nil {
			t.Fatal(err)
		}

		slot := uint64(phase0.Slot(42))

		frame := &types.FrameMetadata{
			ID:             uuid.New().String(),
			Node:           "node",
			WallClockSlot:  phase0.Slot(slot),
			WallClockEpoch: phase0.Epoch(21),
			FetchedAt:      time.Now(),
			Labels:         []string{"a", "b", "c"},
		}

		err = indexer.InsertFrameMetadata(context.Background(), frame)
		if err != nil {
			t.Fatal(err)
		}

		frames, err := indexer.ListFrameMetadata(context.Background(), &FrameFilter{
			Slot: &slot,
		}, &PaginationCursor{})
		if err != nil {
			t.Fatal(err)
		}

		assert.Len(t, frames, 1)

		//nolint:gosec // ignore integer overflow conversion uint64 -> int64
		assert.Equal(t, int64(frame.WallClockSlot), frames[0].WallClockSlot)
	})

	t.Run("By WallClockEpoch", func(t *testing.T) {
		indexer, _, err := newMockIndexer()
		if err != nil {
			t.Fatal(err)
		}

		epoch := phase0.Epoch(21)
		epochUint64 := uint64(epoch)

		frame := &types.FrameMetadata{
			ID:             uuid.New().String(),
			Node:           "node",
			WallClockSlot:  phase0.Slot(42),
			WallClockEpoch: epoch,
			FetchedAt:      time.Now(),
			Labels:         []string{"a", "b", "c"},
		}

		err = indexer.InsertFrameMetadata(context.Background(), frame)
		if err != nil {
			t.Fatal(err)
		}

		frames, err := indexer.ListFrameMetadata(context.Background(), &FrameFilter{
			Epoch: &epochUint64,
		}, &PaginationCursor{})
		if err != nil {
			t.Fatal(err)
		}

		assert.Len(t, frames, 1)

		//nolint:gosec // ignore integer overflow conversion uint64 -> int64
		assert.Equal(t, int64(frame.WallClockEpoch), frames[0].WallClockEpoch)
	})

	t.Run("Before and After", func(t *testing.T) {
		indexer, _, err := newMockIndexer()
		if err != nil {
			t.Fatal(err)
		}

		now := time.Now()

		frame1 := &types.FrameMetadata{
			ID:             uuid.New().String(),
			Node:           "node1",
			WallClockSlot:  phase0.Slot(42),
			WallClockEpoch: phase0.Epoch(21),
			FetchedAt:      time.Now().Add(-time.Hour),
			Labels:         []string{"a", "b", "c"},
		}

		err = indexer.InsertFrameMetadata(context.Background(), frame1)
		if err != nil {
			t.Fatal(err)
		}

		frame2 := &types.FrameMetadata{
			ID:             uuid.New().String(),
			Node:           "node2",
			WallClockSlot:  phase0.Slot(42),
			WallClockEpoch: phase0.Epoch(21),
			FetchedAt:      time.Now().Add(time.Hour),
			Labels:         []string{"a", "b", "c"},
		}

		err = indexer.InsertFrameMetadata(context.Background(), frame2)
		if err != nil {
			t.Fatal(err)
		}

		expectedBefore, err := indexer.ListFrameMetadata(context.Background(), &FrameFilter{
			Before: &now,
		}, &PaginationCursor{})
		if err != nil {
			t.Fatal(err)
		}

		assert.Len(t, expectedBefore, 1)
		assert.Equal(t, frame1.ID, expectedBefore[0].ID)

		expectedAfter, err := indexer.ListFrameMetadata(context.Background(), &FrameFilter{
			After: &now,
		}, &PaginationCursor{})
		if err != nil {
			t.Fatal(err)
		}

		assert.Len(t, expectedAfter, 1)
		assert.Equal(t, frame2.ID, expectedAfter[0].ID)
	})

	t.Run("By Labels", func(t *testing.T) {
		indexer, _, err := newMockIndexer()
		if err != nil {
			t.Fatal(err)
		}

		frame1 := &types.FrameMetadata{
			ID:             uuid.New().String(),
			Node:           "node1",
			WallClockSlot:  phase0.Slot(43),
			WallClockEpoch: phase0.Epoch(231),
			FetchedAt:      time.Now(),
			Labels:         []string{"z", "a", "b", "c"},
		}

		err = indexer.InsertFrameMetadata(context.Background(), frame1)
		if err != nil {
			t.Fatal(err)
		}

		frame2 := &types.FrameMetadata{
			ID:             uuid.New().String(),
			Node:           "node2",
			WallClockSlot:  phase0.Slot(44),
			WallClockEpoch: phase0.Epoch(24),
			FetchedAt:      time.Now(),
			Labels:         []string{"z", "d", "e", "f"},
		}

		err = indexer.InsertFrameMetadata(context.Background(), frame2)
		if err != nil {
			t.Fatal(err)
		}

		frames, err := indexer.ListFrameMetadata(context.Background(), &FrameFilter{
			Labels: &[]string{"a", "b"},
		}, &PaginationCursor{})
		if err != nil {
			t.Fatal(err)
		}

		assert.Len(t, frames, 1)
		assert.Equal(t, frame1.ID, frames[0].ID)

		frames, err = indexer.ListFrameMetadata(context.Background(), &FrameFilter{
			Labels: &[]string{},
		}, &PaginationCursor{})
		if err != nil {
			t.Fatal(err)
		}

		assert.Len(t, frames, 0)

		frames, err = indexer.ListFrameMetadata(context.Background(), &FrameFilter{
			Labels: &[]string{"z", "d", "e", "f"},
		}, &PaginationCursor{})
		if err != nil {
			t.Fatal(err)
		}

		assert.Len(t, frames, 1)

		frames, err = indexer.ListFrameMetadata(context.Background(), &FrameFilter{
			Labels: &[]string{"z"},
		}, &PaginationCursor{})
		if err != nil {
			t.Fatal(err)
		}

		assert.Len(t, frames, 2)
	})

	t.Run("By random combinations", func(t *testing.T) {
		indexer, _, err := newMockIndexer()
		if err != nil {
			t.Fatal(err)
		}

		// Add 1000 random frames
		for i := 0; i < 1000; i++ {
			id := uuid.New().String()
			node := fmt.Sprintf("node-%d", i)
			//nolint:gosec // ignore integer overflow conversion uint64 -> int64
			slot := phase0.Slot(testRandIntn(1000))
			//nolint:gosec // ignore integer overflow conversion uint64 -> int64
			epoch := phase0.Epoch(testRandIntn(100))

			labels := []string{fmt.Sprintf("label%d", testRandIntn(10)), fmt.Sprintf("label%d", testRandIntn(10))}

			consensusClient := fmt.Sprintf("consensus_client%d", testRandIntn(10))

			eventSource := types.RandomEventSource()

			frame := &types.FrameMetadata{
				ID:              id,
				Node:            node,
				WallClockSlot:   slot,
				WallClockEpoch:  epoch,
				FetchedAt:       time.Now(),
				Labels:          labels,
				ConsensusClient: consensusClient,
				EventSource:     eventSource.String(),
			}

			err = indexer.InsertFrameMetadata(context.Background(), frame)
			if err != nil {
				t.Fatal(err)
			}
		}

		// List frames with random filters
		for i := 0; i < 500; i++ {
			var filter FrameFilter

			if testRandIntn(2) == 1 {
				filter.AddID(uuid.New().String())
			}

			if testRandIntn(2) == 1 {
				filter.AddNode(fmt.Sprintf("node-%d", testRandIntn(100)))
			}

			if testRandIntn(2) == 1 {
				filter.AddBefore(time.Now())
			}

			if testRandIntn(2) == 1 {
				filter.AddAfter(time.Now().Add(-24 * time.Hour))
			}

			if testRandIntn(2) == 1 {
				//nolint:gosec // ignore integer overflow conversion uint64 -> int64
				filter.AddSlot(uint64(testRandIntn(1000)))
			}

			if testRandIntn(2) == 1 {
				//nolint:gosec // ignore integer overflow conversion uint64 -> int64
				filter.AddEpoch(uint64(testRandIntn(100)))
			}

			if testRandIntn(2) == 1 {
				filter.AddLabels([]string{
					fmt.Sprintf("label%d", testRandIntn(10)),
					fmt.Sprintf("label%d", testRandIntn(10)),
				})
			}

			if testRandIntn(2) == 1 {
				filter.AddConsensusClient(fmt.Sprintf("consensus_client%d", testRandIntn(10)))
			}

			if testRandIntn(2) == 1 {
				filter.AddEventSource(testRandIntn(4))
			}

			frames, err := indexer.ListFrameMetadata(context.Background(), &filter, &PaginationCursor{})
			if err != nil {
				t.Fatal(err)
			}

			for _, frame := range frames {
				if filter.ID != nil && *filter.ID != frame.ID {
					t.Fatalf("expected ID %s, got %s", *filter.ID, frame.ID)
				}

				if filter.Node != nil && *filter.Node != frame.Node {
					t.Fatalf("expected Node %s, got %s", *filter.Node, frame.Node)
				}

				if filter.Before != nil && frame.FetchedAt.After(*filter.Before) {
					t.Fatalf("expected FetchedAt before %s, got %s", *filter.Before, frame.FetchedAt)
				}

				if filter.After != nil && frame.FetchedAt.Before(*filter.After) {
					t.Fatalf("expected FetchedAt after %s, got %s", *filter.After, frame.FetchedAt)
				}

				//nolint:gosec // ignore integer overflow conversion uint64 -> int64
				if filter.Slot != nil && *filter.Slot != uint64(frame.WallClockSlot) {
					t.Fatalf("expected WallClockSlot %d, got %d", *filter.Slot, frame.WallClockSlot)
				}

				//nolint:gosec // ignore integer overflow conversion uint64 -> int64
				if filter.Epoch != nil && *filter.Epoch != uint64(frame.WallClockEpoch) {
					t.Fatalf("expected WallClockEpoch %d, got %d", *filter.Epoch, frame.WallClockEpoch)
				}

				if filter.ConsensusClient != nil && *filter.ConsensusClient != frame.ConsensusClient {
					t.Fatalf("expected ConsensusClient %s, got %s", *filter.ConsensusClient, frame.ConsensusClient)
				}

				if filter.EventSource != nil && *filter.EventSource != int(frame.EventSource) {
					t.Fatalf("expected EventSource %d, got %d", *filter.EventSource, frame.EventSource)
				}

				if filter.Labels != nil {
					found := false

					for _, label := range *filter.Labels {
						for _, frameLabel := range frame.Labels {
							if label == frameLabel.Name {
								found = true

								break
							}
						}

						if found {
							break
						}
					}

					if !found {
						t.Fatalf("expected labels %v, got %v", filter.Labels, frame.Labels)
					}
				}
			}
		}
	})

	t.Run("With Pagination", func(t *testing.T) {
		indexer, _, err := newMockIndexer()
		if err != nil {
			t.Fatal(err)
		}

		// Add a few random frames
		for i := 0; i < 10; i++ {
			frame := &types.FrameMetadata{
				ID:   uuid.New().String(),
				Node: fmt.Sprintf("node%d", i),
				//nolint:gosec // ignore integer overflow conversion uint64 -> int64
				WallClockSlot: phase0.Slot(testRandIntn(1000)),
				//nolint:gosec // ignore integer overflow conversion uint64 -> int64
				WallClockEpoch: phase0.Epoch(testRandIntn(100)),
				FetchedAt:      time.Now(),
				Labels:         []string{fmt.Sprintf("label%d", testRandIntn(10))},
			}

			err = indexer.InsertFrameMetadata(context.Background(), frame)
			if err != nil {
				t.Fatal(err)
			}
		}

		// Test pagination
		limit := 5
		for offset := 0; offset < 10; offset += limit {
			frames, err := indexer.ListFrameMetadata(context.Background(), &FrameFilter{}, &PaginationCursor{
				Limit:  limit,
				Offset: offset,
			})
			if err != nil {
				t.Fatal(err)
			}

			// Check that only the expected number of frames are returned
			if offset+limit > 10 {
				assert.Len(t, frames, 10-offset)
			} else {
				assert.Len(t, frames, limit)
			}
		}
	})
}

func TestIndexer_ListNodesWithFrames(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		indexer, _, err := newMockIndexer()
		if err != nil {
			t.Fatal(err)
		}

		// Add a few random frames
		for i := 0; i < 5; i++ {
			node := fmt.Sprintf("node%d", i)

			frame := &types.FrameMetadata{
				ID:   uuid.New().String(),
				Node: node,
				//nolint:gosec // ignore integer overflow conversion uint64 -> int64
				WallClockSlot: phase0.Slot(testRandIntn(1000)),
				//nolint:gosec // ignore integer overflow conversion uint64 -> int64
				WallClockEpoch:  phase0.Epoch(testRandIntn(100)),
				FetchedAt:       time.Now(),
				Labels:          []string{fmt.Sprintf("label%d", testRandIntn(10))},
				ConsensusClient: "prysm",
				EventSource:     BeaconNodeEventSource.String(),
			}

			err = indexer.InsertFrameMetadata(context.Background(), frame)
			if err != nil {
				t.Fatal(err)
			}
		}

		// List nodes with frames
		nodes, err := indexer.ListNodesWithFrames(context.Background(), &FrameFilter{}, &PaginationCursor{})
		if err != nil {
			t.Fatal(err)
		}

		// Check that all nodes are returned
		expectedNodes := []string{"node0", "node1", "node2", "node3", "node4"}
		assert.Len(t, nodes, len(expectedNodes))

		for _, node := range expectedNodes {
			assert.Contains(t, nodes, node)
		}
	})

	t.Run("with filter", func(t *testing.T) {
		indexer, _, err := newMockIndexer()
		if err != nil {
			t.Fatal(err)
		}

		// Add a few random frames
		for i := 0; i < 5; i++ {
			node := fmt.Sprintf("node%d", i)

			frame := &types.FrameMetadata{
				ID:   uuid.New().String(),
				Node: node,
				//nolint:gosec // ignore integer overflow conversion uint64 -> int64
				WallClockSlot: phase0.Slot(testRandIntn(1000)),
				//nolint:gosec // ignore integer overflow conversion uint64 -> int64
				WallClockEpoch: phase0.Epoch(testRandIntn(100)),
				FetchedAt:      time.Now(),
				Labels:         []string{fmt.Sprintf("label%d", testRandIntn(10))},
			}

			err = indexer.InsertFrameMetadata(context.Background(), frame)
			if err != nil {
				t.Fatal(err)
			}
		}
		// List nodes with frames using a filter
		filter := &FrameFilter{
			Labels: &[]string{"label5"},
		}

		nodes, err := indexer.ListNodesWithFrames(context.Background(), filter, &PaginationCursor{})
		if err != nil {
			t.Fatal(err)
		}

		// Check that only nodes with frames with the "label5" label are returned
		for _, node := range nodes {
			frames, err := indexer.ListFrameMetadata(context.Background(), &FrameFilter{
				Node: &node,
			}, &PaginationCursor{})
			if err != nil {
				t.Fatal(err)
			}

			for _, frame := range frames {
				assert.Equal(t, frame.Labels[0].Name, "label5")
			}
		}
	})
}

func TestIndexer_DeleteFrameMetadata(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		indexer, _, err := newMockIndexer()
		if err != nil {
			t.Fatal(err)
		}

		ids := []string{}

		// Add a few random frames
		for i := 0; i < 5; i++ {
			node := fmt.Sprintf("node%d", i)

			frame := &types.FrameMetadata{
				ID:   uuid.New().String(),
				Node: node,
				//nolint:gosec // ignore integer overflow conversion uint64 -> int64
				WallClockSlot: phase0.Slot(testRandIntn(1000)),
				//nolint:gosec // ignore integer overflow conversion uint64 -> int64
				WallClockEpoch: phase0.Epoch(testRandIntn(100)),
				FetchedAt:      time.Now(),
				Labels:         []string{fmt.Sprintf("label%d", testRandIntn(10))},
			}

			err = indexer.InsertFrameMetadata(context.Background(), frame)
			if err != nil {
				t.Fatal(err)
			}

			ids = append(ids, frame.ID)
		}

		for _, id := range ids {
			err = indexer.DeleteFrameMetadata(context.Background(), id)
			if err != nil {
				t.Fatal(err)
			}
		}

		// List nodes with frames
		nodes, err := indexer.ListFrameMetadata(context.Background(), &FrameFilter{}, &PaginationCursor{})
		if err != nil {
			t.Fatal(err)
		}

		// Check that no frame metadata is returned
		assert.Len(t, nodes, 0)
	})

	t.Run("with no labels", func(t *testing.T) {
		indexer, _, err := newMockIndexer()
		if err != nil {
			t.Fatal(err)
		}

		ids := []string{}

		// Add a few random frames
		for i := 0; i < 5; i++ {
			node := fmt.Sprintf("node%d", i)

			frame := &types.FrameMetadata{
				ID:   uuid.New().String(),
				Node: node,
				//nolint:gosec // ignore integer overflow conversion uint64 -> int64
				WallClockSlot: phase0.Slot(testRandIntn(1000)),
				//nolint:gosec // ignore integer overflow conversion uint64 -> int64
				WallClockEpoch: phase0.Epoch(testRandIntn(100)),
				FetchedAt:      time.Now(),
				Labels:         nil,
			}

			err = indexer.InsertFrameMetadata(context.Background(), frame)
			if err != nil {
				t.Fatal(err)
			}

			ids = append(ids, frame.ID)
		}

		for _, id := range ids {
			err = indexer.DeleteFrameMetadata(context.Background(), id)
			if err != nil {
				t.Fatal(err)
			}
		}

		// List nodes with frames
		nodes, err := indexer.ListFrameMetadata(context.Background(), &FrameFilter{}, &PaginationCursor{})
		if err != nil {
			t.Fatal(err)
		}

		// Check that no frame metadata is returned
		assert.Len(t, nodes, 0)
	})
}
