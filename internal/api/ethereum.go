package api

import (
	"context"

	"github.com/ethpandaops/forky/api/rest"
)

// GetEthereumNow implements getEthereumNow: the current wall-clock slot and
// epoch.
func (h *HTTP) GetEthereumNow(ctx context.Context) (rest.GetEthereumNowRes, error) {
	slot, epoch, err := h.svc.GetEthereumNow(ctx)
	if err != nil {
		return nil, err
	}

	return &rest.GetEthereumNowOKHeaders{
		CacheControl: rest.NewOptString("public, max-age=1, s-maxage=1"),
		Response: rest.GetEthereumNowOK{
			Data: rest.EthereumNow{
				Slot:  rest.Slot(safeInt64(uint64(slot))),
				Epoch: rest.Epoch(safeInt64(uint64(epoch))),
			},
		},
	}, nil
}

// GetEthereumSpec implements getEthereumSpec: the configured network name and
// spec.
func (h *HTTP) GetEthereumSpec(ctx context.Context) (rest.GetEthereumSpecRes, error) {
	return &rest.GetEthereumSpecOKHeaders{
		CacheControl: rest.NewOptString("public, max-age=60, s-maxage=60"),
		Response: rest.GetEthereumSpecOK{
			Data: rest.EthereumSpecResult{
				NetworkName: h.svc.GetEthereumNetworkName(ctx),
				Spec: rest.EthereumSpec{
					SecondsPerSlot: safeInt64(h.svc.GetEthereumSpecSecondsPerSlot(ctx)),
					SlotsPerEpoch:  safeInt64(h.svc.GetEthereumSpecSlotsPerEpoch(ctx)),
					GenesisTime:    h.svc.GetEthereumSpecGenesisTime(ctx).UTC(),
				},
			},
		},
	}, nil
}
