// Package api implements the Forky HTTP API as defined by the OpenAPI spec
// at api/openapi.yaml. The handlers implement the ogen-generated
// rest.Handler interface and map domain types onto the generated schema
// types, so the wire format is enforced by the spec.
package api

import (
	"context"
	"errors"
	"fmt"
	"math"
	"net/http"

	"github.com/go-faster/jx"
	"github.com/ogen-go/ogen/ogenerrors"
	"github.com/sirupsen/logrus"

	"github.com/ethpandaops/forky/api/rest"
	"github.com/ethpandaops/forky/internal/service"
)

// HTTP serves the Forky API over HTTP.
type HTTP struct {
	log     logrus.FieldLogger
	svc     *service.ForkChoice
	metrics Metrics
	config  *Config
	opts    *Options
}

var _ rest.Handler = (*HTTP)(nil)

// NewHTTP creates a new HTTP API around the fork-choice service.
func NewHTTP(log logrus.FieldLogger, svc *service.ForkChoice, config *Config, opts *Options) (*HTTP, error) {
	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("invalid http config: %w", err)
	}

	return &HTTP{
		opts:    opts,
		config:  config,
		svc:     svc,
		log:     log.WithField("component", "http"),
		metrics: NewMetrics(opts.MetricsEnabled, "http"),
	}, nil
}

// Handler returns the http.Handler serving the API, instrumented with
// per-route metrics.
func (h *HTTP) Handler() (http.Handler, error) {
	srv, err := rest.NewServer(h, rest.WithErrorHandler(h.handleRequestError))
	if err != nil {
		return nil, fmt.Errorf("failed to create rest server: %w", err)
	}

	return h.instrument(srv), nil
}

// NewError maps handler errors onto the spec's default error response.
func (h *HTTP) NewError(_ context.Context, err error) *rest.UnexpectedErrorStatusCode {
	code := http.StatusInternalServerError
	if errors.Is(err, service.ErrFrameNotFound) {
		code = http.StatusNotFound
	}

	if code >= http.StatusInternalServerError {
		h.log.WithError(err).Error("Handler error")
	}

	return &rest.UnexpectedErrorStatusCode{
		StatusCode: code,
		Response: rest.Error{
			Code:    code,
			Message: err.Error(),
		},
	}
}

// handleRequestError writes ogen-level errors (request decoding, routing)
// using the spec's error envelope.
func (h *HTTP) handleRequestError(_ context.Context, w http.ResponseWriter, _ *http.Request, err error) {
	code := ogenerrors.ErrorCode(err)

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)

	e := new(jx.Encoder)

	rsp := rest.Error{
		Code:    code,
		Message: err.Error(),
	}
	rsp.Encode(e)

	if _, writeErr := e.WriteTo(w); writeErr != nil {
		h.log.WithError(writeErr).Error("Failed to write error response")
	}
}

// safeInt64 converts an unsigned value to int64, clamping at the maximum
// rather than overflowing.
func safeInt64(v uint64) int64 {
	if v > math.MaxInt64 {
		return math.MaxInt64
	}

	return int64(v)
}
