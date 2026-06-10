// Package api contains the OpenAPI specification and the generated server.
package api

// The OpenAPI spec at openapi.yaml is the source of truth for the HTTP API.
// The ogen-generated server, client and schema types live in ./rest and are
// regenerated from the spec via `make generate`.
//go:generate go tool ogen --target rest --package rest --clean openapi.yaml
