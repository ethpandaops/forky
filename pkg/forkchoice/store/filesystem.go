package store

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
)

type FileSystem struct {
	config FileSystemConfig
}

type FileSystemConfig struct {
	BaseDir string `yaml:"base_dir"`
}

// NewFileSystem creates a new FileSystem instance with the specified base directory.
func NewFileSystem(config FileSystemConfig) (*FileSystem, error) {
	err := os.MkdirAll(config.BaseDir, 0o755)
	if err != nil {
		return nil, err
	}

	return &FileSystem{
		config: config,
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
		return err
	}

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
		return nil, err
	}

	return &frame, nil
}

func (fs *FileSystem) DeleteFrame(ctx context.Context, id string) error {
	path := fs.framePath(id)

	err := os.Remove(path)
	if err != nil {
		return err
	}

	return nil
}
