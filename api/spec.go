package api

import _ "embed"

// OpenAPISpec contains the canonical Forky OpenAPI specification.
//
//go:embed openapi.yaml
var OpenAPISpec []byte
