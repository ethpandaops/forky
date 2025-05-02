package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"

	"github.com/pkg/errors"

	fhttp "github.com/ethpandaops/forky/pkg/forky/api/http"
	"github.com/ethpandaops/forky/pkg/forky/service"

	"github.com/julienschmidt/httprouter"
)

type GetFramesBatchRequest struct {
	IDs []string `json:"ids"`
}

func (h *HTTP) handleV1GetFrame(ctx context.Context, _ *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	id := p.ByName("id")
	if id == "" {
		return fhttp.NewBadRequestResponse(nil), errors.New("id is required")
	}

	frame, err := h.svc.GetFrame(ctx, id)
	if err != nil {
		if errors.Is(err, service.ErrFrameNotFound) {
			return fhttp.NewNotFoundResponse(nil), err
		}

		return fhttp.NewInternalServerErrorResponse(nil), err
	}

	rsp := fhttp.V1GetFrameResponse{
		Frame: frame,
	}

	response := fhttp.NewSuccessResponse(fhttp.ContentTypeResolvers{
		fhttp.ContentTypeJSON: func() ([]byte, error) {
			return json.Marshal(rsp)
		},
	})

	if h.config.EdgeCacheConfig.Enabled {
		response.SetCacheControl(fmt.Sprintf("public, max-age=%[1]v, s-maxage=%[1]v", h.config.EdgeCacheConfig.FrameTTL.Seconds()))
	}

	return response, nil
}
func (h *HTTP) handleV1GetFramesBatch(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	log := h.log.WithField("handler", "handleV1GetFramesBatch")
	log.Debug("Processing batch frame request")

	if r.Body == nil {
		return fhttp.NewBadRequestResponse(nil), errors.New("request body is empty")
	}
	defer r.Body.Close()

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		log.WithError(err).Error("Failed to read request body")
		return fhttp.NewInternalServerErrorResponse(nil), errors.Wrap(err, "failed to read request body")
	}

	var req GetFramesBatchRequest
	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		return fhttp.NewBadRequestResponse(nil), errors.Wrap(err, "invalid JSON request body")
	}

	if len(req.IDs) == 0 {
		return fhttp.NewBadRequestResponse(nil), errors.New("no frame IDs provided in request")
	}

	log.WithField("num_ids", len(req.IDs)).Debug("Processing frame IDs")

	var bodyBuf bytes.Buffer
	mpWriter := multipart.NewWriter(&bodyBuf)

	foundFrames := 0

	for _, id := range req.IDs {
		frame, err := h.svc.GetFrame(ctx, id)
		if err != nil {
			if errors.Is(err, service.ErrFrameNotFound) {
				log.WithField("id", id).Debug("Frame not found, skipping")
				continue
			}

			log.WithField("id", id).WithError(err).Debug("Failed to get frame, skipping")
			continue
		}

		frameContent, err := frame.AsGzipJSON()
		if err != nil {
			log.WithField("id", id).WithError(err).Debug("Failed to serialize frame to gzipped JSON, skipping")
			continue
		}

		frameFileName := fmt.Sprintf("%s.json.gz", frame.Metadata.ID)
		frameContentType := "application/gzip"

		partHeaders := make(textproto.MIMEHeader)
		partHeaders.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%q"`, frameFileName))
		partHeaders.Set("Content-Type", frameContentType)
		partHeaders.Set("Content-ID", fmt.Sprintf("<%s>", frame.Metadata.ID))
		partHeaders.Set("Content-Encoding", "gzip")

		partWriter, err := mpWriter.CreatePart(partHeaders)
		if err != nil {
			log.WithError(err).Error("Failed to create multipart part")
			mpWriter.Close()
			return fhttp.NewInternalServerErrorResponse(nil), errors.Wrap(err, "failed to create multipart part")
		}

		if _, err = partWriter.Write(frameContent); err != nil {
			log.WithError(err).Error("Failed to write frame content to multipart part")
			mpWriter.Close()
			return fhttp.NewInternalServerErrorResponse(nil), errors.Wrap(err, "failed to write frame content to part")
		}

		foundFrames++
		log.WithField("id", id).Debug("Added frame to multipart response")
	}

	if err := mpWriter.Close(); err != nil {
		log.WithError(err).Error("Failed to close multipart writer")
		return fhttp.NewInternalServerErrorResponse(nil), errors.Wrap(err, "failed to close multipart writer")
	}

	if foundFrames == 0 {
		return fhttp.NewNotFoundResponse(nil), errors.New("no frames found for the provided IDs")
	}

	log.WithField("found_frames", foundFrames).Debug("Finished bundling frames")

	response := &fhttp.Response{
		StatusCode: http.StatusOK,
		Headers: map[string]string{
			"Content-Type": fmt.Sprintf("multipart/mixed; boundary=%s", mpWriter.Boundary()),
		},
		ExtraData: map[string]interface{}{
			"_raw_content": bodyBuf.Bytes(),
		},
	}

	if h.config.EdgeCacheConfig.Enabled {
		response.Headers["Cache-Control"] = fmt.Sprintf("public, max-age=%[1]v, s-maxage=%[1]v", h.config.EdgeCacheConfig.FrameTTL.Seconds())
	}

	return response, nil
}
