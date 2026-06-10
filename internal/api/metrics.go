package api

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"

	"github.com/ethpandaops/forky/api/rest"
)

const encodingJSON = "application/json"

// Metrics records request/response counts and durations per route.
type Metrics struct {
	requests        *prometheus.CounterVec
	responses       *prometheus.CounterVec
	requestDuration *prometheus.HistogramVec
}

// NewMetrics creates the API metrics collectors, registering them when
// enabled.
func NewMetrics(enabled bool, namespace string) Metrics {
	m := Metrics{
		requests: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "request_count",
			Help:      "Number of requests",
		}, []string{"method", "path"}),
		responses: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "response_count",
			Help:      "Number of responses",
		}, []string{"method", "path", "code", "encoding"}),
		requestDuration: prometheus.NewHistogramVec(prometheus.HistogramOpts{
			Namespace: namespace,
			Name:      "request_duration_seconds",
			Help:      "Request duration (in seconds.)",
			Buckets:   []float64{0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
		}, []string{"method", "path", "encoding"}),
	}

	if enabled {
		prometheus.MustRegister(m.requests)
		prometheus.MustRegister(m.responses)
		prometheus.MustRegister(m.requestDuration)
	}

	return m
}

// ObserveRequest records an incoming request.
func (m Metrics) ObserveRequest(method, path string) {
	m.requests.WithLabelValues(method, path).Inc()
}

// ObserveResponse records a completed response.
func (m Metrics) ObserveResponse(method, path, code, encoding string, duration time.Duration) {
	m.responses.WithLabelValues(method, path, code, encoding).Inc()
	m.requestDuration.WithLabelValues(method, path, encoding).Observe(duration.Seconds())
}

// statusRecorder captures the response status code for metrics.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (w *statusRecorder) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

// instrument wraps the generated server with per-route metrics, using the
// spec's path pattern as the label to keep cardinality bounded.
func (h *HTTP) instrument(srv *rest.Server) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if route, ok := srv.FindRoute(r.Method, r.URL.Path); ok {
			path = route.PathPattern()
		}

		h.metrics.ObserveRequest(r.Method, path)

		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}

		srv.ServeHTTP(rec, r)

		h.metrics.ObserveResponse(r.Method, path, strconv.Itoa(rec.status), encodingJSON, time.Since(start))
	})
}
