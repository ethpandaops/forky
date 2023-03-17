package db

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"testing"
	"time"

	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
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

	indexer, err := NewIndexer(logrus.New(), IndexerConfig{
		DSN:        fmt.Sprintf("file:%v?mode=memory&cache=shared", testDBCounter),
		DriverName: "sqlite",
	})
	if err != nil {
		return nil, nil, fmt.Errorf("Failed to create indexer, got error: %v", err)
	}

	return indexer, mock, nil
}

func TestFrame_AsFrameMetadata(t *testing.T) {
	t.Run("conversion", func(t *testing.T) {
		frame := FrameMetadata{
			ID:             "id",
			Node:           "node",
			WallClockSlot:  42,
			WallClockEpoch: 21,
			FetchedAt:      time.Now(),
			Labels:         []FrameMetadataLabel{{Name: "a"}, {Name: "b"}, {Name: "c"}},
		}

		metadata := frame.AsFrameMetadata()

		assert.Equal(t, frame.ID, metadata.ID)
		assert.Equal(t, frame.Node, metadata.Node)
		assert.Equal(t, phase0.Slot(frame.WallClockSlot), metadata.WallClockSlot)
		assert.Equal(t, phase0.Epoch(frame.WallClockEpoch), metadata.WallClockEpoch)
		assert.Equal(t, frame.FetchedAt, metadata.FetchedAt)
		l := FrameMetadataLabels(frame.Labels)
		assert.Equal(t, l.AsStrings(), metadata.Labels)
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
			ID:             id.String(),
			Node:           "node",
			WallClockSlot:  phase0.Slot(42),
			WallClockEpoch: phase0.Epoch(21),
			FetchedAt:      time.Now(),
			Labels:         []string{"a", "b", "c"},
		}

		err = indexer.AddFrameMetadata(context.Background(), frame)
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

		err = indexer.AddFrameMetadata(context.Background(), frame)
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

		err = indexer.AddFrameMetadata(context.Background(), frame)
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

		err = indexer.AddFrameMetadata(context.Background(), frame)
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
		assert.Equal(t, uint64(frame.WallClockSlot), frames[0].WallClockSlot)
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

		err = indexer.AddFrameMetadata(context.Background(), frame)
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
		assert.Equal(t, uint64(frame.WallClockEpoch), frames[0].WallClockEpoch)
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

		err = indexer.AddFrameMetadata(context.Background(), frame1)
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

		err = indexer.AddFrameMetadata(context.Background(), frame2)
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

		err = indexer.AddFrameMetadata(context.Background(), frame1)
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

		err = indexer.AddFrameMetadata(context.Background(), frame2)
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

		// Add 100 random frames
		for i := 0; i < 1000; i++ {
			id := uuid.New().String()
			node := fmt.Sprintf("node-%d", i)

			slot := phase0.Slot(testRandIntn(1000))

			epoch := phase0.Epoch(testRandIntn(100))

			labels := []string{fmt.Sprintf("label%d", testRandIntn(10)), fmt.Sprintf("label%d", testRandIntn(10))}

			frame := &types.FrameMetadata{
				ID:             id,
				Node:           node,
				WallClockSlot:  slot,
				WallClockEpoch: epoch,
				FetchedAt:      time.Now(),
				Labels:         labels,
			}

			err = indexer.AddFrameMetadata(context.Background(), frame)
			if err != nil {
				t.Fatal(err)
			}
		}

		// List frames with random filters
		for i := 0; i < 100; i++ {
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
				filter.AddSlot(uint64(testRandIntn(1000)))
			}

			if testRandIntn(2) == 1 {
				filter.AddEpoch(uint64(testRandIntn(100)))
			}

			if testRandIntn(2) == 1 {
				filter.AddLabels([]string{
					fmt.Sprintf("label%d", testRandIntn(10)),
					fmt.Sprintf("label%d", testRandIntn(10)),
				})
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

				if filter.Slot != nil && *filter.Slot != frame.WallClockSlot {
					t.Fatalf("expected WallClockSlot %d, got %d", *filter.Slot, frame.WallClockSlot)
				}

				if filter.Epoch != nil && *filter.Epoch != frame.WallClockEpoch {
					t.Fatalf("expected WallClockEpoch %d, got %d", *filter.Epoch, frame.WallClockEpoch)
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
				ID:             uuid.New().String(),
				Node:           fmt.Sprintf("node%d", i),
				WallClockSlot:  phase0.Slot(testRandIntn(1000)),
				WallClockEpoch: phase0.Epoch(testRandIntn(100)),
				FetchedAt:      time.Now(),
				Labels:         []string{fmt.Sprintf("label%d", testRandIntn(10))},
			}

			err = indexer.AddFrameMetadata(context.Background(), frame)
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
				ID:             uuid.New().String(),
				Node:           node,
				WallClockSlot:  phase0.Slot(testRandIntn(1000)),
				WallClockEpoch: phase0.Epoch(testRandIntn(100)),
				FetchedAt:      time.Now(),
				Labels:         []string{fmt.Sprintf("label%d", testRandIntn(10))},
			}

			err = indexer.AddFrameMetadata(context.Background(), frame)
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
				ID:             uuid.New().String(),
				Node:           node,
				WallClockSlot:  phase0.Slot(testRandIntn(1000)),
				WallClockEpoch: phase0.Epoch(testRandIntn(100)),
				FetchedAt:      time.Now(),
				Labels:         []string{fmt.Sprintf("label%d", testRandIntn(10))},
			}

			err = indexer.AddFrameMetadata(context.Background(), frame)
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
				//nolint:gosec // don't care in this test
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
