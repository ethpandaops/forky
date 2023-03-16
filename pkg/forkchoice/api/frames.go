package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/attestantio/go-eth2-client/spec/phase0"

	fhttp "github.com/ethpandaops/forkchoice/pkg/forkchoice/api/http"
	"github.com/julienschmidt/httprouter"
)

func (h *HTTP) handleV1FramesList(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	node := p.ByName("node")
	if node == "" {
		return fhttp.NewBadRequestResponse(nil), errors.New("node is required")
	}

	slotNumber := p.ByName("slot")
	if slotNumber == "" {
		return fhttp.NewBadRequestResponse(nil), errors.New("slot is required")
	}

	// Cast slot to uint64
	slot, err := strconv.ParseUint(slotNumber, 10, 64)
	if err != nil {
		return fhttp.NewBadRequestResponse(nil), errors.New("slot is not a valid number")
	}

	framesMetadata, err := h.svc.ListFrames(ctx, node, phase0.Slot(slot))
	if err != nil {
		return fhttp.NewInternalServerErrorResponse(nil), err
	}

	rsp := fhttp.V1FramesListResponse{
		Frames: framesMetadata,
	}

	response := fhttp.NewSuccessResponse(fhttp.ContentTypeResolvers{
		fhttp.ContentTypeJSON: func() ([]byte, error) {
			return json.Marshal(rsp)
		},
	})

	response.SetCacheControl("public, s-max-age=30")

	return response, nil
}

func (h *HTTP) handleV1FramesListSlots(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	node := p.ByName("node")
	if node == "" {
		return fhttp.NewBadRequestResponse(nil), errors.New("node is required")
	}

	slots, err := h.svc.ListSlots(ctx, node)
	if err != nil {
		return fhttp.NewInternalServerErrorResponse(nil), err
	}

	rsp := fhttp.V1FramesListSlotsResponse{
		Slots: slots,
	}

	response := fhttp.NewSuccessResponse(fhttp.ContentTypeResolvers{
		fhttp.ContentTypeJSON: func() ([]byte, error) {
			return json.Marshal(rsp)
		},
	})

	response.SetCacheControl("public, s-max-age=30")

	return response, nil
}

func (h *HTTP) handleV1FramesGetFrame(ctx context.Context, r *http.Request, p httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	sourceName := p.ByName("sourceName")
	if sourceName == "" {
		return fhttp.NewBadRequestResponse(nil), errors.New("source name is required")
	}

	fetchedAt := p.ByName("fetchedAt")
	if fetchedAt == "" {
		return fhttp.NewBadRequestResponse(nil), errors.New("fetchedAt is required")
	}

	fetchedAtTimestamp, err := strconv.ParseInt(fetchedAt, 10, 64)
	if err != nil {
		return fhttp.NewBadRequestResponse(nil), errors.New("fetchedAt is not a valid timestamp")
	}

	slotNumber := p.ByName("slot")
	if slotNumber == "" {
		return fhttp.NewBadRequestResponse(nil), errors.New("slot is required")
	}

	// Cast slot to uint64
	slot, err := strconv.ParseUint(slotNumber, 10, 64)
	if err != nil {
		return fhttp.NewBadRequestResponse(nil), errors.New("slot is not a valid number")
	}

	frame, err := h.svc.GetFrameFromSource(ctx, sourceName, phase0.Slot(slot), time.Unix(fetchedAtTimestamp, 0))
	if err != nil {
		return fhttp.NewInternalServerErrorResponse(nil), err
	}

	rsp := fhttp.V1FrameBySourceAndIDResponse{
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
