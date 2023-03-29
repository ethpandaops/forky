package store

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"path/filepath"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3types "github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/aws/smithy-go"
	"github.com/ethpandaops/forkchoice/pkg/forky/types"
	"github.com/sirupsen/logrus"
)

type S3Store struct {
	s3Client *s3.Client

	config *S3StoreConfig

	log  logrus.FieldLogger
	opts *Options

	basicMetrics *BasicMetrics
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
func NewS3Store(namespace string, log logrus.FieldLogger, config *S3StoreConfig, opts *Options) (*S3Store, error) {
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

	metrics := NewBasicMetrics(namespace, string(S3StoreType), opts.MetricsEnabled)

	return &S3Store{
		s3Client:     s3Client,
		config:       config,
		log:          log,
		opts:         opts,
		basicMetrics: metrics,
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
	if err != nil {
		var apiErr smithy.APIError
		if errors.As(err, &apiErr) {
			switch apiErr.(type) {
			case *s3types.NoSuchBucket:
				return errors.New("bucket does not exist: " + apiErr.Error())
			case *s3types.NotFound:
				return ErrFrameNotFound
			default:
				return errors.New("failed to save frame: " + apiErr.Error())
			}
		}
	}

	s.basicMetrics.ObserveItemAdded(string(FrameDataType))

	return err
}

func (s *S3Store) GetFrame(ctx context.Context, id string) (*types.Frame, error) {
	file := s.getFullName(id)

	data, err := s.s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.config.BucketName),
		Key:    aws.String(file),
	})
	if err != nil {
		var apiErr smithy.APIError
		if errors.As(err, &apiErr) {
			switch apiErr.(type) {
			case *s3types.NotFound:
				return nil, ErrFrameNotFound
			default:
				return nil, errors.New("failed to get frame: " + apiErr.Error())
			}
		}

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

	s.basicMetrics.ObserveItemRetreived(string(FrameDataType))

	return &frame, nil
}

func (s *S3Store) DeleteFrame(ctx context.Context, id string) error {
	_, err := s.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.config.BucketName),
		Key:    aws.String(s.getFullName(id)),
	})
	if err != nil {
		var apiErr smithy.APIError
		if errors.As(err, &apiErr) {
			switch apiErr.(type) {
			case *s3types.NotFound:
				return ErrFrameNotFound
			default:
				return errors.New("failed to delete frame: " + apiErr.Error())
			}
		}
	}

	s.basicMetrics.ObserveItemRemoved(string(FrameDataType))

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
