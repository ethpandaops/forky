//go:build !webui

// Package web provides the frontend filesystem. When built without the
// webui tag, GetFS returns an empty filesystem.
package web

import "io/fs"

type emptyFS struct{}

func (emptyFS) Open(string) (fs.File, error) {
	return nil, &fs.PathError{Op: "open", Path: "/", Err: fs.ErrNotExist}
}

// GetFS returns an empty filesystem when the webui build tag is not set.
func GetFS() (fs.FS, error) {
	return emptyFS{}, nil
}
