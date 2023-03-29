package db

import "github.com/prometheus/client_golang/prometheus"

type BasicMetrics struct {
	namespace string

	info             *prometheus.GaugeVec
	operations       *prometheus.CounterVec
	operationsErrors *prometheus.CounterVec
}

func NewBasicMetrics(namespace, driverName string, enabled bool) *BasicMetrics {
	m := &BasicMetrics{
		namespace: namespace,
		info: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Namespace: namespace,
			Name:      "info",
			Help:      "Information about the implementation of the db",
		}, []string{"driver"}),

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
		prometheus.MustRegister(m.info)
		prometheus.MustRegister(m.operations)
		prometheus.MustRegister(m.operationsErrors)
	}

	m.info.WithLabelValues(driverName).Set(1)

	return m
}

func (m *BasicMetrics) ObserveOperation(operation Operation) {
	m.operations.WithLabelValues(string(operation)).Inc()
}

func (m *BasicMetrics) ObserveOperationError(operation Operation) {
	m.operationsErrors.WithLabelValues(string(operation)).Inc()
}
