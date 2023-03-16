package store

import (
	"bytes"
	"context"
	"fmt"
	"path/filepath"

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
		Key:    aws.String(s.getFullName(frame.Metadata.ID)),
		Body:   reader,
	})

	return err
}

func (s *S3Store) GetFrame(ctx context.Context, id string) (*types.Frame, error) {
	file := s.getFullName(id)

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

func (s *S3Store) DeleteFrame(ctx context.Context, id string) error {
	_, err := s.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.config.bucketName),
		Key:    aws.String(s.getFullName(id)),
	})

	return err
}

func (s *S3Store) getFullName(id string) string {
	return filepath.Join(s.getFramesPath(), s.getFilename(id))
}

func (s *S3Store) getFramesPath() string {
	return filepath.Join(s.config.keyPrefix, "frames")
}

func (s *S3Store) getFilename(id string) string {
	return fmt.Sprintf("%s.json.gz", id)
}
