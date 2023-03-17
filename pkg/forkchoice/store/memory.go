package store

import (
	"context"
	"fmt"
	"sync"

	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
	"github.com/sirupsen/logrus"
)

type MemoryStore struct {
	frames map[string]*types.Frame
	mu     sync.Mutex

	log logrus.FieldLogger
}

func NewMemoryStore(log logrus.FieldLogger) *MemoryStore {
	return &MemoryStore{
		frames: make(map[string]*types.Frame),
		log:    log,
	}
}

func (s *MemoryStore) SaveFrame(ctx context.Context, frame *types.Frame) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.frames[frame.Metadata.ID] = frame

	return nil
}

func (s *MemoryStore) GetFrame(ctx context.Context, id string) (*types.Frame, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	frame, ok := s.frames[id]
	if !ok {
		return nil, fmt.Errorf("frame not found")
	}

	return frame, nil
}

func (s *MemoryStore) DeleteFrame(ctx context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.frames, id)

	return nil
}
