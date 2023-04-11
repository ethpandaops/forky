package api

import (
	"context"
	"encoding/json"
	"net/http"

	fhttp "github.com/ethpandaops/forky/pkg/forky/api/http"

	"github.com/julienschmidt/httprouter"
)

func (h *HTTP) handleV1GetEthereumSpec(ctx context.Context, _ *http.Request, _ httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	rsp := fhttp.V1GetEthereumSpecResponse{
		NetworkName: h.svc.GetEthereumNetworkName(ctx),
		Spec: fhttp.EthereumSpec{
			SecondsPerSlot: h.svc.GetEthereumSpecSecondsPerSlot(ctx),
			SlotsPerEpoch:  h.svc.GetEthereumSpecSlotsPerEpoch(ctx),
			GenesisTime:    h.svc.GetEthereumSpecGenesisTime(ctx),
		},
	}

	response := fhttp.NewSuccessResponse(fhttp.ContentTypeResolvers{
		fhttp.ContentTypeJSON: func() ([]byte, error) {
			return json.Marshal(rsp)
		},
	})

	response.SetCacheControl("public, max-age=60, s-maxage=60")

	return response, nil
}

func (h *HTTP) handleV1GetEthereumNow(ctx context.Context, _ *http.Request, _ httprouter.Params, contentType fhttp.ContentType) (*fhttp.Response, error) {
	if err := fhttp.ValidateContentType(contentType, []fhttp.ContentType{fhttp.ContentTypeJSON}); err != nil {
		return fhttp.NewUnsupportedMediaTypeResponse(nil), err
	}

	slot, epoch, err := h.svc.GetEthereumNow(ctx)
	if err != nil {
		return fhttp.NewInternalServerErrorResponse(nil), err
	}

	rsp := fhttp.V1GetEthereumNowResponse{
		Slot:  uint64(slot),
		Epoch: uint64(epoch),
	}

	response := fhttp.NewSuccessResponse(fhttp.ContentTypeResolvers{
		fhttp.ContentTypeJSON: func() ([]byte, error) {
			return json.Marshal(rsp)
		},
	})

	response.SetCacheControl("public, max-age=1, s-maxage=1")

	return response, nil
}
