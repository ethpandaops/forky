package service

import (
	"runtime"

	"github.com/ethpandaops/forkchoice/pkg/version"
	"github.com/prometheus/client_golang/prometheus"
)

type Metrics struct {
	namespace string

	info             *prometheus.GaugeVec
	versionInfo      *prometheus.GaugeVec
	retentionPeriod  prometheus.Gauge
	operations       *prometheus.CounterVec
	operationsErrors *prometheus.CounterVec
}

func NewMetrics(namespace string, config *Config, enabled bool) *Metrics {
	m := &Metrics{
		namespace: namespace,

		info: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Namespace: namespace,
			Name:      "info",
			Help:      "Information about the implementation of the service",
		}, []string{"version"}),

		versionInfo: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Namespace: namespace,
			Name:      "version_info",
			Help:      "Information about the version of the service",
		}, []string{"short", "full", "full_with_goos", "git_commit", "go_version"}),

		retentionPeriod: prometheus.NewGauge(prometheus.GaugeOpts{
			Namespace: namespace,
			Name:      "retention_period_seconds",
			Help:      "The retention period of the service",
		}),

		operations: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "operations_count",
			Help:      "The count of operations performed by the db",
		}, []string{"operation"}),
		operationsErrors: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "operations_errors_count",
			Help:      "The count of operations performed by the db that resulted in an error",
		}, []string{"operation"}),
	}

	if enabled {
		prometheus.MustRegister(m.retentionPeriod)
		prometheus.MustRegister(m.operations)
		prometheus.MustRegister(m.operationsErrors)
		prometheus.MustRegister(m.info)
		prometheus.MustRegister(m.versionInfo)
	}

	m.retentionPeriod.Set(config.RetentionPeriod.Duration.Seconds())

	m.info.WithLabelValues(version.FullVWithGOOS()).Set(1)
	m.versionInfo.WithLabelValues(
		version.Short(),
		version.Full(),
		version.FullVWithGOOS(),
		version.GitCommit,
		runtime.Version(),
	).Set(1)

	return m
}

func (m *Metrics) ObserveOperation(operation Operation) {
	m.operations.WithLabelValues(string(operation)).Inc()
}

func (m *Metrics) ObserveOperationError(operation Operation) {
	m.operationsErrors.WithLabelValues(string(operation)).Inc()
}
