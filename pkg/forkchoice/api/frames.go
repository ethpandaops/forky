package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	fhttp "github.com/ethpandaops/forkchoice/pkg/forkchoice/api/http"

	"github.com/julienschmidt/httprouter"
)

// func (h *HTTP) handleV1FramesList(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
// 	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
// 		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
// 	}

// 	node := p.ByName("node")
// 	if node == "" {
// 		return fhttp.NewBadRequestResponse(nil), errors.New("node is required")
// 	}

// 	slotNumber := p.ByName("slot")
// 	if slotNumber == "" {
// 		return fhttp.NewBadRequestResponse(nil), errors.New("slot is required")
// 	}

// 	// Cast slot to uint64
// 	slot, err := strconv.ParseUint(slotNumber, 10, 64)
// 	if err != nil {
// 		return fhttp.NewBadRequestResponse(nil), errors.New("slot is not a valid number")
// 	}

// 	framesMetadata, err := h.svc.ListFrames(ctx, node, phase0.Slot(slot))
// 	if err != nil {
// 		return fhttp.NewInternalServerErrorResponse(nil), err
// 	}

// 	rsp := fhttp.V1FramesListResponse{
// 		Frames: framesMetadata,
// 	}

// 	response := fhttp.NewSuccessResponse(fhttp.ContentTypeResolvers{
// 		fhttp.ContentTypeJSON: func() ([]byte, error) {
// 			return json.Marshal(rsp)
// 		},
// 	})

// 	response.SetCacheControl("public, s-max-age=30")

// 	return response, nil
// }

// func (h *HTTP) handleV1FramesListSlots(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
// 	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
// 		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
// 	}

// 	node := p.ByName("node")
// 	if node == "" {
// 		return fhttp.NewBadRequestResponse(nil), errors.New("node is required")
// 	}

// 	slots, err := h.svc.ListSlots(ctx, node)
// 	if err != nil {
// 		return fhttp.NewInternalServerErrorResponse(nil), err
// 	}

// 	rsp := fhttp.V1FramesListSlotsResponse{
// 		Slots: slots,
// 	}

// 	response := fhttp.NewSuccessResponse(fhttp.ContentTypeResolvers{
// 		fhttp.ContentTypeJSON: func() ([]byte, error) {
// 			return json.Marshal(rsp)
// 		},
// 	})

// 	response.SetCacheControl("public, s-max-age=30")

// 	return response, nil
// }

func (h *HTTP) handleV1GetFrame(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	id := p.ByName("id")
	if id == "" {
		return fhttp.NewBadRequestResponse(nil), errors.New("id is required")
	}

	frame, err := h.svc.GetFrame(ctx, id)
	if err != nil {
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

	response.SetCacheControl("public, s-max-age=30")

	return response, nil
}
