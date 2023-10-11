package types

import "math/rand"

type EventSource string

const (
	NilEventSource            EventSource = ""
	UnknownEventSource        EventSource = "unknown"
	BeaconNodeEventSource     EventSource = "beacon_node"
	XatuPollingEventSource    EventSource = "xatu_polling"
	XatuReorgEventEventSource EventSource = "xatu_reorg_event"
)

func NewEventSourceFromString(s string) EventSource {
	switch s {
	case string(UnknownEventSource):
		return UnknownEventSource
	case string(BeaconNodeEventSource):
		return BeaconNodeEventSource
	case string(XatuPollingEventSource):
		return XatuPollingEventSource
	case string(XatuReorgEventEventSource):
		return XatuReorgEventEventSource
	default:
		return NilEventSource
	}
}

func RandomEventSource() EventSource {
	//nolint:gosec // Not concerned about randomness here.
	switch rand.Intn(3) {
	case 0:
		return BeaconNodeEventSource
	case 1:
		return XatuPollingEventSource
	case 2:
		return XatuReorgEventEventSource
	default:
		return UnknownEventSource
	}
}

func (e EventSource) String() string {
	return string(e)
}
