package store

import "github.com/prometheus/client_golang/prometheus"

type BasicMetrics struct {
	namespace string

	info           *prometheus.GaugeVec
	itemsAdded     *prometheus.CounterVec
	itemsRemoved   *prometheus.CounterVec
	itemsRetreived *prometheus.CounterVec
	itemsStored    *prometheus.GaugeVec

	cacheHit  *prometheus.CounterVec
	cacheMiss *prometheus.CounterVec
}

func NewBasicMetrics(namespace, storeType string, enabled bool) *BasicMetrics {
	m := &BasicMetrics{
		namespace: namespace,

		info: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Namespace: namespace,
			Name:      "info",
			Help:      "Information about the implementation of the store",
		}, []string{"implementation"}),

		itemsAdded: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "items_added_count",
			Help:      "Number of items added to the store",
		}, []string{"type"}),
		itemsRemoved: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "items_removed_count",
			Help:      "Number of items removed from the store",
		}, []string{"type"}),
		itemsRetreived: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "items_retrieved_count",
			Help:      "Number of items retreived from the store",
		}, []string{"type"}),
		itemsStored: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Namespace: namespace,
			Name:      "items_stored_total",
			Help:      "Number of items stored in the store",
		}, []string{"type"}),
		cacheHit: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "cache_hit_count",
			Help:      "Number of cache hits",
		}, []string{"type"}),
		cacheMiss: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "cache_miss_count",
			Help:      "Number of cache misses",
		}, []string{"type"}),
	}

	if enabled {
		prometheus.MustRegister(m.info)
		prometheus.MustRegister(m.itemsAdded)
		prometheus.MustRegister(m.itemsRemoved)
		prometheus.MustRegister(m.itemsRetreived)
		prometheus.MustRegister(m.itemsStored)
		prometheus.MustRegister(m.cacheHit)
		prometheus.MustRegister(m.cacheMiss)
	}

	m.info.WithLabelValues(storeType).Set(1)

	return m
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

func (m *BasicMetrics) ObserveCacheHit(itemType string) {
	m.cacheHit.WithLabelValues(itemType).Inc()
}

func (m *BasicMetrics) ObserveCacheMiss(itemType string) {
	m.cacheMiss.WithLabelValues(itemType).Inc()
}
