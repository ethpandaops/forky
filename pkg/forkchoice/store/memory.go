package store

import (
	"context"
	"sync"

	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
	"github.com/sirupsen/logrus"
)

type MemoryStore struct {
	frames map[string]*types.Frame
	mu     sync.Mutex

	opts *Options

	log logrus.FieldLogger

	basicMetrics *BasicMetrics
}

func NewMemoryStore(namespace string, log logrus.FieldLogger, opts *Options) *MemoryStore {
	metrics := NewBasicMetrics(namespace, string(MemoryStoreType), opts.MetricsEnabled)

	metrics.SetImplementation(string(MemoryStoreType))

	return &MemoryStore{
		frames:       make(map[string]*types.Frame),
		log:          log,
		opts:         opts,
		basicMetrics: metrics,
	}
}

func (s *MemoryStore) SaveFrame(ctx context.Context, frame *types.Frame) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	_, ok := s.frames[frame.Metadata.ID]
	if ok {
		return ErrFrameAlreadyStored
	}

	s.frames[frame.Metadata.ID] = frame

	s.basicMetrics.ObserveItemAdded(string(FrameDataType))

	return nil
}

func (s *MemoryStore) GetFrame(ctx context.Context, id string) (*types.Frame, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	frame, ok := s.frames[id]
	if !ok {
		return nil, ErrFrameNotFound
	}

	s.basicMetrics.ObserveItemRetreived(string(FrameDataType))

	return frame, nil
}

func (s *MemoryStore) DeleteFrame(ctx context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	_, ok := s.frames[id]
	if !ok {
		return ErrFrameNotFound
	}

	delete(s.frames, id)

	s.basicMetrics.ObserveItemRemoved(string(FrameDataType))

	return nil
}
