package store

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
	"github.com/sirupsen/logrus"
)

type S3Store struct {
	s3Client *s3.Client

	config S3StoreConfig

	log logrus.FieldLogger
}

type S3StoreConfig struct {
	address    string `yaml:"address"`
	region     string `yaml:"region"`
	bucketName string `yaml:"bucket_name"`
	keyPrefix  string `yaml:"key_prefix"`
}

// NewS3Store creates a new S3Store instance with the specified AWS configuration, bucket name, and key prefix.
func NewS3Store(log logrus.FieldLogger, config S3StoreConfig) (*S3Store, error) {
	config.address = "http://localhost:9000"
	config.region = "us-east-1"
	config.bucketName = "forkchoice"
	config.keyPrefix = "/"

	resolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...any) (aws.Endpoint, error) {
		return aws.Endpoint{
			PartitionID:       "aws",
			SigningRegion:     config.region,
			URL:               config.address,
			HostnameImmutable: true,
		}, nil
	})

	cfg := aws.Config{
		Region:                      config.region,
		EndpointResolverWithOptions: resolver,
		Credentials:                 credentials.NewStaticCredentialsProvider("minioadmin", "minioadmin", ""),
	}

	s3Client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.UsePathStyle = true
	})

	return &S3Store{
		s3Client: s3Client,
		config:   config,
		log:      log,
	}, nil
}

func (s *S3Store) SaveFrame(ctx context.Context, frame *types.Frame) error {
	gzipped, err := frame.AsGzipJSON()
	if err != nil {
		return err
	}

	reader := bytes.NewReader(gzipped)

	_, err = s.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(s.config.bucketName),
		Key:    aws.String(s.getFullName(frame.Metadata.Node, frame.Metadata.WallClockSlot, frame.Metadata.FetchedAt)),
		Body:   reader,
	})

	return err
}

func (s *S3Store) GetFrame(ctx context.Context, node string, slot phase0.Slot, fetchedAt time.Time) (*types.Frame, error) {
	file := s.getFullName(node, slot, fetchedAt)

	data, err := s.s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.config.bucketName),
		Key:    aws.String(file),
	})
	if err != nil {
		return nil, err
	}
	defer data.Body.Close()

	// Read the gzipped data into a buffer.
	var buff bytes.Buffer

	_, err = buff.ReadFrom(data.Body)
	if err != nil {
		return nil, err
	}

	var frame types.Frame

	err = frame.FromGzipJSON(buff.Bytes())
	if err != nil {
		return nil, err
	}

	return &frame, nil
}

func (s *S3Store) DeleteFrame(ctx context.Context, node string, slot phase0.Slot, fetchedAt time.Time) error {
	_, err := s.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.config.bucketName),
		Key:    aws.String(s.getFullName(node, slot, fetchedAt)),
	})

	return err
}

func (s *S3Store) ListNodes(ctx context.Context) ([]string, error) {
	resp, err := s.s3Client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
		Bucket: aws.String(s.config.bucketName),
		Prefix: aws.String(s.getNodesPath()),
	})
	if err != nil {
		return nil, err
	}

	var ids []string
	for _, obj := range resp.Contents {
		ids = append(ids, filepath.Base(*obj.Key))
	}

	return nil, errors.New("not implemented")
}

func (s *S3Store) ListSlots(ctx context.Context, node string) ([]phase0.Slot, error) {
	resp, err := s.s3Client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
		Bucket: aws.String(s.config.bucketName),
		Prefix: aws.String(s.getSlotsPath(node)),
	})
	if err != nil {
		return nil, err
	}

	var slots []phase0.Slot
	for _, obj := range resp.Contents {
		slot, err := strconv.Atoi(filepath.Base(*obj.Key))
		if err != nil {
			return nil, err
		}

		slots = append(slots, phase0.Slot(slot))
	}

	return slots, nil
}

func (s *S3Store) ListFrames(ctx context.Context, node string, slot phase0.Slot) ([]*types.FrameMetadata, error) {
	resp, err := s.s3Client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
		Bucket: aws.String(s.config.bucketName),
		Prefix: aws.String(s.getFramesPath(node, slot)),
	})
	if err != nil {
		return nil, err
	}

	var metadataList []*types.FrameMetadata

	for _, obj := range resp.Contents {
		objectKey := *obj.Key
		// Extract the necessary components from the object key.
		components := strings.Split(objectKey, "/")

		if len(components) != len(strings.Split(s.getFullName("", 0, time.Now()), "/")) {
			return nil, fmt.Errorf("invalid object key format: %s", objectKey)
		}

		fetchedAt := components[5]

		fetchedAtTime, err := time.Parse(time.RFC3339, fetchedAt)
		if err != nil {
			// TODO(sam.calder-mason): Log this error instead of returning
			return nil, fmt.Errorf("error parsing fetchedAt: %w", err)
		}

		// Convert the wallClockSlot component to a phase0.Slot.
		wallClockSlot, err := strconv.ParseUint(components[3], 10, 64)
		if err != nil {
			return nil, fmt.Errorf("error parsing wallClockSlot: %w", err)
		}

		// Construct the FrameMetadata struct.
		frameMetadata := &types.FrameMetadata{
			Node:          node,
			FetchedAt:     fetchedAtTime,
			WallClockSlot: phase0.Slot(wallClockSlot),
		}

		metadataList = append(metadataList, frameMetadata)
	}

	return nil, errors.New("not implemented")
}

func (s *S3Store) getFullName(node string, slot phase0.Slot, fetchedAt time.Time) string {
	return filepath.Join(s.getFramesPath(node, slot), s.getFilename(fetchedAt))
}

func (s *S3Store) getNodesPath() string {
	return filepath.Join(s.config.keyPrefix, "nodes")
}

func (s *S3Store) getSlotsPath(node string) string {
	return filepath.Join(s.getNodesPath(), node, "slots")
}

func (s *S3Store) getFramesPath(node string, slot phase0.Slot) string {
	return filepath.Join(s.getSlotsPath(node), fmt.Sprintf("%v", slot), "frames")
}

func (s *S3Store) getFilename(fetchedAt time.Time) string {
	return fmt.Sprintf("%s.json.gz", fmt.Sprintf("%v", fetchedAt.Unix()))
}
