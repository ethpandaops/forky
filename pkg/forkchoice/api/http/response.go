package http

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type ContentTypeResolver func() ([]byte, error)
type ContentTypeResolvers map[ContentType]ContentTypeResolver

type Response struct {
	resolvers  ContentTypeResolvers
	StatusCode int               `json:"status_code"`
	Headers    map[string]string `json:"headers"`
	ExtraData  map[string]interface{}
}
type jsonResponse struct {
	Data json.RawMessage `json:"data"`
}

func (r Response) MarshalAs(contentType ContentType) ([]byte, error) {
	if _, exists := r.resolvers[contentType]; !exists {
		return nil, fmt.Errorf("unsupported content-type: %s", contentType.String())
	}

	if contentType != ContentTypeJSON {
		return r.resolvers[contentType]()
	}

	return r.buildWrappedJSONResponse()
}

func (r Response) SetEtag(etag string) {
	r.Headers["ETag"] = etag
}

func (r Response) SetCacheControl(v string) {
	r.Headers["Cache-Control"] = v
}

func NewSuccessResponse(resolvers ContentTypeResolvers) *Response {
	return &Response{
		resolvers:  resolvers,
		StatusCode: http.StatusOK,
		Headers:    make(map[string]string),
		ExtraData:  make(map[string]interface{}),
	}
}

func NewInternalServerErrorResponse(resolvers ContentTypeResolvers) *Response {
	return &Response{
		resolvers:  resolvers,
		StatusCode: http.StatusInternalServerError,
		Headers:    make(map[string]string),
		ExtraData:  make(map[string]interface{}),
	}
}

func NewBadRequestResponse(resolvers ContentTypeResolvers) *Response {
	return &Response{
		resolvers:  resolvers,
		StatusCode: http.StatusBadRequest,
		Headers:    make(map[string]string),
		ExtraData:  make(map[string]interface{}),
	}
}

func NewUnsupportedMediaTypeResponse(resolvers ContentTypeResolvers) *Response {
	return &Response{
		resolvers:  resolvers,
		StatusCode: http.StatusUnsupportedMediaType,
		Headers:    make(map[string]string),
		ExtraData:  make(map[string]interface{}),
	}
}

func (r *Response) AddExtraData(key string, value interface{}) {
	r.ExtraData[key] = value
}

func (r *Response) buildWrappedJSONResponse() ([]byte, error) {
	data, err := r.resolvers[ContentTypeJSON]()
	if err != nil {
		return nil, err
	}

	rsp := jsonResponse{
		Data: data,
	}

	return json.Marshal(rsp)
}

// WriteJSONResponse writes a JSON response to the given writer.
func WriteJSONResponse(w http.ResponseWriter, data []byte) error {
	w.Header().Set("Content-Type", ContentTypeJSON.String())

	if _, err := w.Write(data); err != nil {
		return err
	}

	return nil
}

func WriteSSZResponse(w http.ResponseWriter, data []byte) error {
	w.Header().Set("Content-Type", ContentTypeSSZ.String())

	if _, err := w.Write(data); err != nil {
		return err
	}

	return nil
}

func WriteContentAwareResponse(w http.ResponseWriter, data []byte, contentType ContentType) error {
	switch contentType {
	case ContentTypeJSON:
		return WriteJSONResponse(w, data)
	case ContentTypeSSZ:
		return WriteSSZResponse(w, data)
	default:
		return WriteJSONResponse(w, data)
	}
}

func WriteErrorResponse(w http.ResponseWriter, msg string, statusCode int) error {
	w.Header().Set("Content-Type", ContentTypeJSON.String())

	w.WriteHeader(statusCode)

	bytes, err := json.Marshal(
		ErrorContainer{
			Message: msg,
			Code:    statusCode,
		})
	if err != nil {
		return err
	}

	if _, err := w.Write(bytes); err != nil {
		return err
	}

	return nil
}
