package source

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	eth2v1 "github.com/attestantio/go-eth2-client/api/v1"
	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forky/pkg/forky/types"
	"github.com/ethpandaops/xatu/pkg/proto/xatu"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

var XatuHTTPType = "xatu_http"

type XatuHTTPConfig struct {
	Address string `yaml:"address"`
	Path    string `yaml:"path"`
}

type XatuHTTP struct {
	log logrus.FieldLogger

	config *XatuHTTPConfig

	name string

	metrics *BasicMetrics

	opts *Options

	onFrameCallbacks []func(ctx context.Context, frame *types.Frame)

	server *http.Server
	mux    *http.ServeMux

	filter xatu.EventFilter
}

func NewXatuHTTP(namespace, name string, log logrus.FieldLogger, config *XatuHTTPConfig, metrics *BasicMetrics, opts *Options) (*XatuHTTP, error) {
	filter, err := xatu.NewEventFilter(&xatu.EventFilterConfig{
		EventNames: []string{
			xatu.Event_BEACON_API_ETH_V1_DEBUG_FORK_CHOICE.String(),
			xatu.Event_BEACON_API_ETH_V1_DEBUG_FORK_CHOICE_REORG.String(),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create event filter: %w", err)
	}

	mux := http.NewServeMux()

	server := &http.Server{
		Addr:              config.Address,
		Handler:           mux,
		ReadHeaderTimeout: 15 * time.Second,
		WriteTimeout:      15 * time.Second,
	}

	return &XatuHTTP{
		log: log.
			WithField("source_name", name).
			WithField("component", "source/xatu_http"),
		name:             name,
		metrics:          metrics,
		mux:              mux,
		server:           server,
		config:           config,
		opts:             opts,
		onFrameCallbacks: []func(ctx context.Context, frame *types.Frame){},
		filter:           filter,
	}, nil
}

func (x *XatuHTTP) Name() string {
	return x.name
}

func (x *XatuHTTP) Type() string {
	return XatuHTTPType
}

func (x *XatuHTTP) Start(ctx context.Context) error {
	x.registerHandler(ctx, x.mux)

	x.log.WithField("address", x.config.Address).Info("Starting xatu_http source")

	go func() {
		err := x.server.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			x.log.Fatalf("Error starting XatuHTTP server: %s", err)
		}
	}()

	return nil
}

func (x *XatuHTTP) Stop(ctx context.Context) error {
	return nil
}

func (x *XatuHTTP) OnFrame(fn func(ctx context.Context, frame *types.Frame)) {
	x.onFrameCallbacks = append(x.onFrameCallbacks, fn)
}

func (x *XatuHTTP) registerHandler(ctx context.Context, mux *http.ServeMux) {
	path := "/"
	if x.config.Path != "" {
		path = x.config.Path
	}

	mux.HandleFunc(path, func(w http.ResponseWriter, req *http.Request) {
		body, err := io.ReadAll(req.Body)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)

			if _, err = w.Write([]byte(err.Error())); err != nil {
				x.log.WithError(err).Error("Failed to write error response")
			}

			return
		}

		switch req.Header.Get("Content-Type") {
		case "application/json":
			if err = x.handleJSONRequest(ctx, body); err != nil {
				w.WriteHeader(http.StatusBadRequest)

				if _, err = w.Write([]byte(err.Error())); err != nil {
					x.log.WithError(err).Error("Failed to write error response")
				}

				return
			}
		case "application/x-ndjson":
			if err = x.handleNDJSONRequest(ctx, body); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				x.log.WithError(err).Error("Failed to handle NDJSON request")

				if _, err = w.Write([]byte(err.Error())); err != nil {
					x.log.WithError(err).Error("Failed to write error response")
				}

				return
			}
		default:
			w.WriteHeader(http.StatusBadRequest)

			if _, err = w.Write([]byte("Unsupported content type")); err != nil {
				x.log.WithError(err).Error("Failed to write error response")
			}

			return
		}

		w.WriteHeader(http.StatusOK)

		if _, err = w.Write([]byte("OK")); err != nil {
			x.log.WithError(err).Error("Failed to write response")
		}
	})
}

func (x *XatuHTTP) handleNDJSONRequest(ctx context.Context, body []byte) error {
	s := string(body)

	events := []*xatu.DecoratedEvent{}

	split := strings.Split(s, "\n")

	for _, line := range split {
		if line == "" {
			continue
		}

		var v xatu.DecoratedEvent
		if err := json.Unmarshal([]byte(line), &v); err != nil {
			return err
		}

		events = append(events, &v)
	}

	x.handleXatuEvents(ctx, events)

	return nil
}

func (x *XatuHTTP) handleJSONRequest(ctx context.Context, body []byte) error {
	events := []*xatu.DecoratedEvent{}

	err := json.Unmarshal(body, &events)
	if err != nil {
		return err
	}

	x.handleXatuEvents(ctx, events)

	return nil
}

func (x *XatuHTTP) handleXatuEvents(ctx context.Context, events []*xatu.DecoratedEvent) {
	for _, event := range events {
		if err := x.handleXatuEvent(ctx, event); err != nil {
			x.log.WithError(err).Warn("Failed to handle event")
		}
	}
}

func (x *XatuHTTP) handleXatuEvent(ctx context.Context, event *xatu.DecoratedEvent) error {
	shouldBeFiltered, err := x.filter.ShouldBeDropped(event)
	if err != nil {
		return err
	}

	if shouldBeFiltered {
		// TODO(sam.calder-mason): Add metrics
		return nil
	}

	// Drop it if its from a network that we don't care about
	name := event.GetMeta().GetClient().GetEthereum().GetNetwork().GetName()

	found := false

	for _, network := range x.opts.AllowedEthereumNetworks {
		if network == name {
			found = true

			break
		}
	}

	if !found {
		return nil
	}

	switch event.Event.Name {
	case xatu.Event_BEACON_API_ETH_V1_DEBUG_FORK_CHOICE:
		return x.handleForkChoiceEvent(ctx, event)
	case xatu.Event_BEACON_API_ETH_V1_DEBUG_FORK_CHOICE_REORG:
		return x.handleForkChoiceReorgEvent(ctx, event)
	}

	return errors.New("unknown event type") // Should never happen (touch wood (tm (c)))
}

func (x *XatuHTTP) handleForkChoiceEvent(ctx context.Context, event *xatu.DecoratedEvent) error {
	// Create a new frame based on the event
	fc := event.GetEthV1ForkChoice()
	if fc == nil {
		return fmt.Errorf("event is not a fork choice event")
	}

	data, err := fc.AsGoEth2ClientV1ForkChoice()
	if err != nil {
		return fmt.Errorf("failed to convert event to fork choice: %w", err)
	}

	additionalData := event.GetMeta().GetClient().GetEthV1DebugForkChoice()
	if additionalData == nil {
		return fmt.Errorf("event is missing additional data")
	}

	return x.createFrameFromSnapshotAndData(ctx, event, data, additionalData.GetSnapshot())
}

func (x *XatuHTTP) handleForkChoiceReorgEvent(ctx context.Context, event *xatu.DecoratedEvent) error {
	// Create 2 new frames based on the event (one for `before` the reorg and one for `after` the reorg)
	// Note: `before` can be nil if the reorg happened before the xatu sentry started
	fcr := event.GetEthV1ForkChoiceReorg()
	if fcr == nil {
		return fmt.Errorf("event is not a fork choice reorg event")
	}

	additionalData := event.GetMeta().GetClient().GetEthV1DebugForkChoiceReorg()
	if additionalData == nil {
		return fmt.Errorf("event is missing additional data")
	}

	if fcr.After == nil && fcr.Before == nil {
		return fmt.Errorf("event is missing both before and after data")
	}

	if fcr.After != nil && additionalData.After != nil {
		data, err := fcr.After.AsGoEth2ClientV1ForkChoice()
		if err != nil {
			x.log.WithError(err).Error("failed to convert fork_choice_reorg.after to fork choice")
		} else {
			err = x.createFrameFromSnapshotAndData(ctx, event, data, additionalData.After)
			if err != nil {
				x.log.WithError(err).Error("failed to create frame from fork_choice_reorg.after")
			}
		}
	}

	if fcr.Before != nil && additionalData.Before != nil {
		data, err := fcr.Before.AsGoEth2ClientV1ForkChoice()
		if err != nil {
			x.log.WithError(err).Error("failed to convert fork_choice_reorg.before to fork choice")
		} else {
			err = x.createFrameFromSnapshotAndData(ctx, event, data, additionalData.Before)
			if err != nil {
				x.log.WithError(err).Error("failed to create frame from fork_choice_reorg.before")
			}
		}
	}

	return nil
}

func (x *XatuHTTP) createFrameFromSnapshotAndData(ctx context.Context,
	event *xatu.DecoratedEvent,
	data *eth2v1.ForkChoice,
	snapshot *xatu.ClientMeta_ForkChoiceSnapshot,
) error {
	frame := &types.Frame{
		Metadata: types.FrameMetadata{
			ID:   uuid.New().String(),
			Node: event.Meta.Client.Name,

			WallClockSlot:  phase0.Slot(snapshot.GetRequestSlot().Number),
			WallClockEpoch: phase0.Epoch(snapshot.GetRequestEpoch().Number),

			FetchedAt: event.GetMeta().GetClient().GetEthV1DebugForkChoice().GetSnapshot().GetTimestamp().AsTime(),

			Labels: []string{
				"xatu_sentry=" + event.GetMeta().GetClient().GetName(),
				"xatu_event_name=" + event.GetEvent().GetName().String(),
				"consensus_client_implementation=" + event.GetMeta().GetClient().GetEthereum().GetConsensus().GetImplementation(),
				"consensus_client_version=" + event.GetMeta().GetClient().GetEthereum().GetConsensus().GetVersion(),
				fmt.Sprintf("ethereum_network_id=%d", event.GetMeta().GetClient().GetEthereum().GetNetwork().GetId()),
				"ethereum_network_name=" + event.GetMeta().GetClient().GetEthereum().GetNetwork().GetName(),
				"reorg_depth=" + snapshot.GetTimestamp().String(),
				fmt.Sprintf("fetch_request_duration_ms=%d", snapshot.GetRequestDurationMs()),
			},
		},
		Data: data,
	}

	if event.GetEvent().GetName() == xatu.Event_BEACON_API_ETH_V1_DEBUG_FORK_CHOICE_REORG {
		data := event.GetEthV1ForkChoiceReorg()

		prefix := "xatu_reorg_event_"

		frame.Metadata.Labels = append(frame.Metadata.Labels,
			fmt.Sprintf(prefix+"slot=%d", data.GetEvent().GetSlot()),
			fmt.Sprintf(prefix+"epoch=%d", data.GetEvent().GetEpoch()),
			prefix+"old_head_block="+data.GetEvent().GetOldHeadBlock(),
			prefix+"old_head_state="+data.GetEvent().GetOldHeadState(),
			prefix+"new_head_block="+data.GetEvent().GetNewHeadBlock(),
			prefix+"new_head_state="+data.GetEvent().GetNewHeadState(),
			fmt.Sprintf(prefix+"depth=%d", +data.GetEvent().GetDepth()),
		)
	}

	for _, fn := range x.onFrameCallbacks {
		fn(ctx, frame)
	}

	return nil
}
