package api

import (
	"bytes" // Added
	"context"
	"encoding/json"
	"fmt" // Added
	"io"
	"mime/multipart" // Added
	"net/http"
	"net/textproto" // Added

	// Added
	fhttp "github.com/ethpandaops/forky/pkg/forky/api/http"
	"github.com/pkg/errors"

	"github.com/ethpandaops/forky/pkg/forky/service"
	"github.com/julienschmidt/httprouter"
	"github.com/sirupsen/logrus"
)

type HTTP struct {
	log     logrus.FieldLogger
	svc     *service.ForkChoice
	metrics *fhttp.Metrics
	config  *Config
	opts    *Options
}

func NewHTTP(log logrus.FieldLogger, svc *service.ForkChoice, config *Config, opts *Options) (*HTTP, error) {
	if err := config.Validate(); err != nil {
		return nil, errors.Wrap(err, "invalid http config")
	}

	metrics := fhttp.NewMetrics(opts.MetricsEnabled, "http")

	return &HTTP{
		opts:    opts,
		config:  config,
		svc:     svc,
		log:     log.WithField("component", "http"),
		metrics: &metrics,
	}, nil
}

func (h *HTTP) BindToRouter(_ context.Context, router *httprouter.Router) error {
	router.GET("/api/v1/ethereum/now", h.wrappedHandler(h.handleV1GetEthereumNow))
	router.GET("/api/v1/ethereum/spec", h.wrappedHandler(h.handleV1GetEthereumSpec))

	router.GET("/api/v1/frames/:id", h.wrappedHandler(h.handleV1GetFrame))

	router.POST("/api/v1/frames/batch", h.wrappedHandler(h.handleV1GetFramesBatch))
	router.POST("/api/v1/metadata", h.wrappedHandler(h.handleV1MetadataList))
	router.POST("/api/v1/metadata/nodes", h.wrappedHandler(h.handleV1MetadataListNodes))
	router.POST("/api/v1/metadata/slots", h.wrappedHandler(h.handleV1MetadataListSlots))
	router.POST("/api/v1/metadata/epochs", h.wrappedHandler(h.handleV1MetadataListEpochs))
	router.POST("/api/v1/metadata/labels", h.wrappedHandler(h.handleV1MetadataListLabels))

	return nil
}

func (h *HTTP) wrappedHandler(handler func(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error)) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
		fhttp.WrappedHandler(h.log, h.metrics, handler)(w, r, p)
	}
}

// handleV1GetFramesBatch handles requests to fetch multiple frames by their IDs.
// GetFramesBatchRequest defines the structure for the batch frame request body.
type GetFramesBatchRequest struct {
	IDs []string `json:"ids"`
}

// handleV1GetFramesBatch handles requests to fetch multiple frames by their IDs.
// It expects a POST request with a JSON body containing an array of frame IDs, like {"ids": ["id1", "id2"]}.
// It returns a multipart/mixed response containing the requested frames.
func (h *HTTP) handleV1GetFramesBatch(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	log := h.log.WithField("handler", "handleV1GetFramesBatch")
	log.Info("Processing batch frame request")

	if r.Body == nil {
		log.Warn("Request body is empty")
		return fhttp.NewBadRequestResponse(nil), errors.New("request body is empty") // Pass nil resolvers for error responses
	}
	defer r.Body.Close()

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		log.WithError(err).Error("Failed to read request body")
		return fhttp.NewInternalServerErrorResponse(nil), errors.Wrap(err, "failed to read request body")
	}

	var req GetFramesBatchRequest
	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		log.WithError(err).Warn("Failed to decode JSON request body")
		return fhttp.NewBadRequestResponse(nil), errors.Wrap(err, "invalid JSON request body")
	}

	if len(req.IDs) == 0 {
		log.Warn("Request contains no frame IDs")
		return fhttp.NewBadRequestResponse(nil), errors.New("no frame IDs provided in request")
	}

	log.WithField("num_ids", len(req.IDs)).Info("Parsed frame IDs from request")

	// --- Start fetching and bundling ---
	var bodyBuf bytes.Buffer
	mpWriter := multipart.NewWriter(&bodyBuf)

	foundFrames := 0
	for _, id := range req.IDs {
		frame, err := h.svc.GetFrame(ctx, id)
		if err != nil {
			if errors.Is(err, service.ErrFrameNotFound) {
				log.WithField("id", id).Warn("Frame not found, skipping")
				continue // Skip this frame
			}
			// For other errors, log and continue for now.
			log.WithField("id", id).WithError(err).Error("Failed to get frame, skipping")
			continue
		}

		// --- Get frame content as gzipped JSON ---
		frameContent, err := frame.AsGzipJSON()
		if err != nil {
			log.WithField("id", id).WithError(err).Error("Failed to serialize frame to gzipped JSON, skipping")
			continue
		}

		frameFileName := fmt.Sprintf("%s.json.gz", frame.Metadata.ID)
		frameContentType := "application/gzip" // Content is gzipped JSON
		// --- End frame content ---

		partHeaders := make(textproto.MIMEHeader)
		partHeaders.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, frameFileName))
		partHeaders.Set("Content-Type", frameContentType)
		partHeaders.Set("Content-ID", fmt.Sprintf("<%s>", frame.Metadata.ID)) // Use frame ID for Content-ID
		partHeaders.Set("Content-Encoding", "gzip")                           // Explicitly set Content-Encoding to gzip

		partWriter, err := mpWriter.CreatePart(partHeaders)
		if err != nil {
			log.WithError(err).Error("Failed to create multipart part")
			mpWriter.Close() // Attempt cleanup
			return fhttp.NewInternalServerErrorResponse(nil), errors.Wrap(err, "failed to create multipart part")
		}

		if _, err = partWriter.Write(frameContent); err != nil {
			log.WithError(err).Error("Failed to write frame content to multipart part")
			mpWriter.Close() // Attempt cleanup
			return fhttp.NewInternalServerErrorResponse(nil), errors.Wrap(err, "failed to write frame content to part")
		}
		foundFrames++
		log.WithField("id", id).Debug("Added frame to multipart response")
	}

	// Close the multipart writer to finalize the body
	if err := mpWriter.Close(); err != nil {
		log.WithError(err).Error("Failed to close multipart writer")
		return fhttp.NewInternalServerErrorResponse(nil), errors.Wrap(err, "failed to close multipart writer")
	}

	if foundFrames == 0 {
		log.Warn("No frames found for the provided IDs")
		return fhttp.NewNotFoundResponse(nil), errors.New("no frames found for the provided IDs")
	}

	log.WithField("found_frames", foundFrames).Info("Finished bundling frames")

	// Create a custom response with direct multipart data
	// This bypasses the JSON marshaling that's causing errors
	response := &fhttp.Response{
		StatusCode: http.StatusOK,
		Headers: map[string]string{
			"Content-Type": fmt.Sprintf("multipart/mixed; boundary=%s", mpWriter.Boundary()),
		},
		ExtraData: map[string]interface{}{
			"_raw_content": bodyBuf.Bytes(), // Store raw content to be retrieved by the handler
		},
	}

	// Optional: Add cache headers if applicable
	if h.config.EdgeCacheConfig.Enabled {
		response.Headers["Cache-Control"] = fmt.Sprintf("public, max-age=%[1]v, s-maxage=%[1]v", h.config.EdgeCacheConfig.FrameTTL.Seconds())
	}

	return response, nil
}
