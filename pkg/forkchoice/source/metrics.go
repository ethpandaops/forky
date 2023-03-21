package source

import "github.com/prometheus/client_golang/prometheus"

type BasicMetrics struct {
	namespace string

	itemsFetched *prometheus.CounterVec
	sourceType   string
	sourceName   string
}

func NewBasicMetrics(namespace, sourceType, sourceName string, enabled bool) *BasicMetrics {
	m := &BasicMetrics{
		namespace:  namespace,
		sourceType: sourceType,
		itemsFetched: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "items_fetched_count",
			Help:      "The amount of items fetched by the source",
		}, []string{"source_type", "source_name", "type"}),
	}

	if enabled {
		prometheus.MustRegister(m.itemsFetched)
	}

	return m
}

func (m *BasicMetrics) ObserveItemFetched(itemType string) {
	m.itemsFetched.WithLabelValues(m.sourceType, m.sourceName, itemType).Inc()
}
