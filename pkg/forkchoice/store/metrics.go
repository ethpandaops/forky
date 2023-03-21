package store

import "github.com/prometheus/client_golang/prometheus"

type BasicMetrics struct {
	namespace string

	implementation *prometheus.GaugeVec
	itemsAdded     *prometheus.CounterVec
	itemsRemoved   *prometheus.CounterVec
	itemsRetreived *prometheus.CounterVec
	itemsStored    *prometheus.GaugeVec
}

func NewBasicMetrics(namespace, storeType string, enabled bool) *BasicMetrics {
	m := &BasicMetrics{
		namespace: namespace,

		implementation: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Namespace: namespace,
			Name:      "type",
			Help:      "The implementation type of the store",
		}, []string{"implementation"}),

		itemsAdded: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "items_added",
			Help:      "Number of items added to the store",
		}, []string{"type"}),
		itemsRemoved: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "items_added",
			Help:      "Number of items removed from the store",
		}, []string{"type"}),
		itemsRetreived: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "items_added",
			Help:      "Number of items retreived from the store",
		}, []string{"type"}),
		itemsStored: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Namespace: namespace,
			Name:      "items_added",
			Help:      "Number of items stored in the store",
		}, []string{"type"}),
	}

	if enabled {
		prometheus.MustRegister(m.implementation)
		prometheus.MustRegister(m.itemsAdded)
		prometheus.MustRegister(m.itemsRemoved)
		prometheus.MustRegister(m.itemsRetreived)
		prometheus.MustRegister(m.itemsStored)
	}

	return m
}

func (m *BasicMetrics) SetImplementation(storeType string) {
	m.implementation.Reset()

	m.implementation.WithLabelValues(storeType).Set(1)
}

func (m *BasicMetrics) ObserveItemAdded(itemType string) {
	m.itemsAdded.WithLabelValues(itemType).Inc()
}

func (m *BasicMetrics) ObserveItemRemoved(itemType string) {
	m.itemsRemoved.WithLabelValues(itemType).Inc()
}

func (m *BasicMetrics) ObserveItemRetreived(itemType string) {
	m.itemsRetreived.WithLabelValues(itemType).Inc()
}

func (m *BasicMetrics) ObserveItemStored(itemType string, count int) {
	m.itemsStored.WithLabelValues(itemType).Set(float64(count))
}
