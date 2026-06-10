package store

import "errors"

var (
	ErrFrameNotFound      = errors.New("frame not found")
	ErrFrameAlreadyStored = errors.New("frame already stored")
	ErrFrameInvalid       = errors.New("frame invalid")
)
