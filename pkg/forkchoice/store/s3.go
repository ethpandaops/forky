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

	config *S3StoreConfig

	log logrus.FieldLogger
}

type S3StoreConfig struct {
	Endpoint     string `yaml:"endpoint"`
	Region       string `yaml:"region"`
	BucketName   string `yaml:"bucket_name"`
	KeyPrefix    string `yaml:"key_prefix"`
	AccessKey    string `yaml:"access_key"`
	AccessSecret string `yaml:"access_secret"`
	UsePathStyle bool   `yaml:"use_path_style"`
}

// NewS3Store creates a new S3Store instance with the specified AWS configuration, bucket name, and key prefix.
func NewS3Store(log logrus.FieldLogger, config *S3StoreConfig) (*S3Store, error) {
	resolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...any) (aws.Endpoint, error) {
		return aws.Endpoint{
			PartitionID:       "aws",
			SigningRegion:     config.Region,
			URL:               config.Endpoint,
			HostnameImmutable: true,
		}, nil
	})

	cfg := aws.Config{
		Region:                      config.Region,
		EndpointResolverWithOptions: resolver,
		Credentials:                 credentials.NewStaticCredentialsProvider(config.AccessKey, config.AccessSecret, ""),
	}

	s3Client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.UsePathStyle = config.UsePathStyle
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
		Bucket: aws.String(s.config.BucketName),
		Key:    aws.String(s.getFullName(frame.Metadata.ID)),
		Body:   reader,
	})

	return err
}

func (s *S3Store) GetFrame(ctx context.Context, id string) (*types.Frame, error) {
	file := s.getFullName(id)

	data, err := s.s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.config.BucketName),
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
		Bucket: aws.String(s.config.BucketName),
		Key:    aws.String(s.getFullName(id)),
	})

	return err
}

func (s *S3Store) getFullName(id string) string {
	return filepath.Join(s.getFramesPath(), s.getFilename(id))
}

func (s *S3Store) getFramesPath() string {
	return filepath.Join(s.config.KeyPrefix, "frames")
}

func (s *S3Store) getFilename(id string) string {
	return fmt.Sprintf("%s.json.gz", id)
}
