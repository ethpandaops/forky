//go:build webui

// Package web embeds the frontend build output from web/dist/.
package web

import (
	"embed"
	"io/fs"
)

//go:embed all:dist/*
var embeddedFiles embed.FS

// GetFS returns the embedded dist filesystem rooted at dist/.
func GetFS() (fs.FS, error) {
	return fs.Sub(embeddedFiles, "dist")
}
