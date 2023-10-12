package db

import "github.com/ethpandaops/forky/pkg/forky/types"

type EventSource int

const (
	NilEventSource EventSource = iota
	UnknownEventSource
	BeaconNodeEventSource
	XatuPollingEventSource
	XatuReorgEventEventSource
)

func NewEventSourceFromString(s string) EventSource {
	return NewEventSourceFromType(types.NewEventSourceFromString(s))
}

func NewEventSourceFromType(s types.EventSource) EventSource {
	switch s {
	case types.UnknownEventSource:
		return UnknownEventSource
	case types.BeaconNodeEventSource:
		return BeaconNodeEventSource
	case types.XatuPollingEventSource:
		return XatuPollingEventSource
	case types.XatuReorgEventEventSource:
		return XatuReorgEventEventSource
	default:
		return NilEventSource
	}
}

func NewEventSource(i int) EventSource {
	switch i {
	case 1:
		return UnknownEventSource
	case 2:
		return BeaconNodeEventSource
	case 3:
		return XatuPollingEventSource
	case 4:
		return XatuReorgEventEventSource
	default:
		return NilEventSource
	}
}

func (e EventSource) String() string {
	return [...]string{"", "unknown", "beacon_node", "xatu_polling", "xatu_reorg_event"}[e]
}
