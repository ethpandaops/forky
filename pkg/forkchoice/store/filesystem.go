package store

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
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

func (f *FileSystem) Save(ctx context.Context, frame *types.Frame) error {
	filePath, err := f.getPathFromMetadata(frame.Metadata)
	if err != nil {
		return err
	}

	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	// Convert to JSON
	asJson, err := json.Marshal(frame)
	if err != nil {
		return err
	}

	// Gzip before writing to disk
	var b bytes.Buffer
	gz := gzip.NewWriter(&b)
	_, err = gz.Write(asJson)
	if err != nil {
		return err
	}

	if err := gz.Close(); err != nil {
		return err
	}

	// Write to disk
	if err := ioutil.WriteFile(filePath, b.Bytes(), 0644); err != nil {
		return err
	}

	return err
}

func (f *FileSystem) Load(ctx context.Context, metadata types.FrameMetadata) (*types.Frame, error) {
	filePath, err := f.getPathFromMetadata(metadata)
	if err != nil {
		return nil, err
	}

	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}

	// Read the file
	data, err := ioutil.ReadAll(file)
	if err != nil {
		return nil, err
	}

	// Unzip
	r, err := gzip.NewReader(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}

	// Read the uncompressed data
	uncompressedData, err := ioutil.ReadAll(r)
	if err != nil {
		return nil, err
	}

	// Convert from JSON
	var returnFile types.Frame
	err = json.Unmarshal(uncompressedData, &returnFile)
	if err != nil {
		return nil, err
	}

	return &returnFile, nil
}

func (f *FileSystem) Delete(ctx context.Context, metadata types.FrameMetadata) error {
	filePath, err := f.getPathFromMetadata(metadata)
	if err != nil {
		return err
	}

	err = os.Remove(filePath)

	return err
}

func (f *FileSystem) List(ctx context.Context, filter *types.FrameFilter) ([]*types.FrameMetadata, error) {
	return nil, nil
}

func (f *FileSystem) getPathFromMetadata(metadata types.FrameMetadata) (string, error) {
	if err := metadata.Validate(); err != nil {
		return "", err
	}

	fileName, err := f.getFilenameFromMetadata(metadata)
	if err != nil {
		return "", err
	}

	return filepath.Join(f.config.BaseDir,
		"frames",
		metadata.Node,
		"slots",
		fmt.Sprintf("%v", metadata.WallClockSlot),
		fileName,
	), nil
}

func (f *FileSystem) getFilenameFromMetadata(metadata types.FrameMetadata) (string, error) {
	if err := metadata.Validate(); err != nil {
		return "", err
	}

	return fmt.Sprintf("%s-%s.json.gzip", metadata.FetchedAt, metadata.FetchedAt.String()), nil
}
