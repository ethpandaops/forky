package store

import (
	"bytes"
	"context"
	"io"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
)

type S3Store struct {
	s3Client   *s3.S3
	uploader   *s3manager.Uploader
	downloader *s3manager.Downloader

	config S3StoreConfig
}

type S3StoreConfig struct {
	bucketName string `yaml:"bucket_name"`
	keyPrefix  string `yaml:"key_prefix"`
}

// NewS3Store creates a new S3Store instance with the specified AWS configuration, bucket name, and key prefix.
func NewS3Store(awsConfig *aws.Config, config S3StoreConfig) (*S3Store, error) {
	sess, err := session.NewSession(awsConfig)
	if err != nil {
		return nil, err
	}

	s3Client := s3.New(sess)
	uploader := s3manager.NewUploader(sess)
	downloader := s3manager.NewDownloader(sess)

	return &S3Store{
		s3Client:   s3Client,
		uploader:   uploader,
		downloader: downloader,

		config: config,
	}, nil
}

func (s *S3Store) Save(ctx context.Context, key string, reader io.Reader) error {
	_, err := s.uploader.UploadWithContext(ctx, &s3manager.UploadInput{
		Bucket: aws.String(s.config.bucketName),
		Key:    aws.String(s.keyWithPrefix(key)),
		Body:   reader,
	})

	return err
}

func (s *S3Store) Load(ctx context.Context, key string) (io.Reader, error) {
	buff := &aws.WriteAtBuffer{}

	_, err := s.downloader.DownloadWithContext(ctx, buff, &s3.GetObjectInput{
		Bucket: aws.String(s.config.bucketName),
		Key:    aws.String(s.keyWithPrefix(key)),
	})

	if err != nil {
		return nil, err
	}

	return bytes.NewReader(buff.Bytes()), nil
}

func (s *S3Store) Delete(ctx context.Context, key string) error {
	_, err := s.s3Client.DeleteObjectWithContext(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.config.bucketName),
		Key:    aws.String(s.keyWithPrefix(key)),
	})

	return err
}

func (s *S3Store) keyWithPrefix(key string) string {
	return strings.TrimLeft(strings.Join([]string{s.config.keyPrefix, key}, "/"), "/")
}
