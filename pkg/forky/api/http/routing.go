package http

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/julienschmidt/httprouter"
	"github.com/sirupsen/logrus"
)

func DeriveRegisteredPath(request *http.Request, ps httprouter.Params) string {
	registeredPath := request.URL.Path
	for _, param := range ps {
		registeredPath = strings.Replace(registeredPath, param.Value, fmt.Sprintf(":%s", param.Key), 1)
	}

	return registeredPath
}

func WrappedHandler(log logrus.FieldLogger, metrics *Metrics, handler func(ctx context.Context, r *http.Request, p httprouter.Params, contentType ContentType) (*Response, error)) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
		start := time.Now()

		contentType := NewContentTypeFromRequest(r)
		ctx := r.Context()
		registeredPath := DeriveRegisteredPath(r, p)

		log.WithFields(logrus.Fields{
			"method":       r.Method,
			"path":         r.URL.Path,
			"content_type": contentType,
			"accept":       r.Header.Get("Accept"),
		}).Debug("Handling request")

		metrics.ObserveRequest(r.Method, registeredPath)

		response := &Response{}

		var err error

		defer func() {
			metrics.ObserveResponse(r.Method, registeredPath, fmt.Sprintf("%v", response.StatusCode), contentType.String(), time.Since(start))
		}()

		response, err = handler(ctx, r, p, contentType)
		if err != nil {
			if writeErr := WriteErrorResponse(w, err.Error(), response.StatusCode); writeErr != nil {
				log.WithError(writeErr).Error("Failed to write error response")
			}

			return
		}

		// Set headers before any potential content processing
		for header, value := range response.Headers {
			w.Header().Set(header, value)
		}

		// Special case: Check for raw multipart content (stored as _raw_content in ExtraData)
		if rawContent, ok := response.ExtraData["_raw_content"]; ok {
			if rawBytes, ok := rawContent.([]byte); ok {
				// Raw content handling - write directly to response
				w.WriteHeader(response.StatusCode)

				if _, err := w.Write(rawBytes); err != nil {
					log.WithError(err).Error("Failed to write raw content")
				}

				return
			}
		}

		// Standard flow - marshal response based on content type
		data, err := response.MarshalAs(contentType)
		if err != nil {
			if writeErr := WriteErrorResponse(w, err.Error(), http.StatusInternalServerError); writeErr != nil {
				log.WithError(writeErr).Error("Failed to write error response")
			}

			return
		}

		if err := WriteContentAwareResponse(w, data, contentType); err != nil {
			log.WithError(err).Error("Failed to write response")
		}
	}
}
