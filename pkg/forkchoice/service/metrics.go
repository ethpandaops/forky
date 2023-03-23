package service

import "github.com/prometheus/client_golang/prometheus"

type Metrics struct {
	namespace string

	retentionPeriod  prometheus.Gauge
	operations       *prometheus.CounterVec
	operationsErrors *prometheus.CounterVec
}

func NewMetrics(namespace string, config *Config, enabled bool) *Metrics {
	m := &Metrics{
		namespace: namespace,
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
	}

	m.retentionPeriod.Set(config.RetentionPeriod.Duration.Seconds())

	return m
}

func (m *Metrics) ObserveOperation(operation Operation) {
	m.operations.WithLabelValues(string(operation)).Inc()
}

func (m *Metrics) ObserveOperationError(operation Operation) {
	m.operationsErrors.WithLabelValues(string(operation)).Inc()
}
