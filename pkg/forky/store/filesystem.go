package store

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"github.com/ethpandaops/forkchoice/pkg/forky/types"
)

type FileSystem struct {
	config       FileSystemConfig
	opts         *Options
	basicMetrics *BasicMetrics
}

type FileSystemConfig struct {
	BaseDir string `yaml:"base_dir"`
}

// NewFileSystem creates a new FileSystem instance with the specified base directory.
func NewFileSystem(namespace string, config FileSystemConfig, opts *Options) (*FileSystem, error) {
	if config.BaseDir == "" {
		return nil, fmt.Errorf("base directory is required")
	}

	err := os.MkdirAll(config.BaseDir, 0o755)
	if err != nil {
		return nil, err
	}

	metrics := NewBasicMetrics(namespace, string(FileSystemStoreType), opts.MetricsEnabled)

	return &FileSystem{
		config:       config,
		opts:         opts,
		basicMetrics: metrics,
	}, nil
}

func (fs *FileSystem) framePath(id string) string {
	return filepath.Join(fs.config.BaseDir, fmt.Sprintf("%s.json.gz", id))
}

func (fs *FileSystem) SaveFrame(ctx context.Context, frame *types.Frame) error {
	data, err := frame.AsGzipJSON()
	if err != nil {
		return err
	}

	path := fs.framePath(frame.Metadata.ID)

	err = os.WriteFile(path, data, 0o600)
	if err != nil {
		return fmt.Errorf("failed to write frame to disk: %v", err.Error())
	}

	fs.basicMetrics.ObserveItemAdded(string(FrameDataType))

	return nil
}

func (fs *FileSystem) GetFrame(ctx context.Context, id string) (*types.Frame, error) {
	path := fs.framePath(id)

	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var frame types.Frame

	err = frame.FromGzipJSON(data)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, ErrFrameNotFound
		}

		return nil, fmt.Errorf("failed to read frame from disk: %v", err.Error())
	}

	fs.basicMetrics.ObserveItemRetreived(string(FrameDataType))

	return &frame, nil
}

func (fs *FileSystem) DeleteFrame(ctx context.Context, id string) error {
	path := fs.framePath(id)

	err := os.Remove(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return ErrFrameNotFound
		}

		return err
	}

	fs.basicMetrics.ObserveItemRemoved(string(FrameDataType))

	return nil
}
