package service

import "errors"

var (
	ErrInvalidID                  = errors.New("invalid id")
	ErrInvalidFilter              = errors.New("invalid filter")
	ErrUnknownServerErrorOccurred = errors.New("unknown server error occurred")
	ErrFrameNotFound              = errors.New("frame not found")
)
