package http

import (
	"fmt"
	"net/http"
)

type ContentType int

const (
	ContentTypeUnknown ContentType = iota
	ContentTypeJSON
	ContentTypeYAML
	ContentTypeSSZ
)

func (c ContentType) String() string {
	switch c {
	case ContentTypeJSON:
		return "application/json"
	case ContentTypeYAML:
		return "application/yaml"
	case ContentTypeSSZ:
		return "application/octet-stream"
	case ContentTypeUnknown:
		return "unknown"
	}

	return ""
}

func DeriveContentType(accept string) ContentType {
	switch accept {
	case "application/json":
		return ContentTypeJSON
	case "*/*":
		return ContentTypeJSON
	case "application/yaml":
		return ContentTypeYAML
	case "application/octet-stream":
		return ContentTypeSSZ
	// Default to JSON if they don't care what they get.
	case "":
		return ContentTypeJSON
	}

	return ContentTypeUnknown
}

func ValidateContentType(contentType ContentType, accepting []ContentType) error {
	if !DoesAccept(accepting, contentType) {
		return fmt.Errorf("unsupported content-type: %s", contentType.String())
	}

	return nil
}

func DoesAccept(accepts []ContentType, input ContentType) bool {
	for _, a := range accepts {
		if a == input {
			return true
		}
	}

	return false
}

func NewContentTypeFromRequest(r *http.Request) ContentType {
	accept := r.Header.Get("Accept")
	if accept == "" {
		return ContentTypeJSON
	}

	content := DeriveContentType(accept)

	if content == ContentTypeUnknown {
		return ContentTypeJSON
	}

	return content
}
