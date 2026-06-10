package source

import "errors"

var (
	ErrMissingName = errors.New("missing name")

	ErrFrameNotFound = errors.New("frame not found")
)
