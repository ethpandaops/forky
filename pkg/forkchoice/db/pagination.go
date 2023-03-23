package db

import "gorm.io/gorm"

type PaginationCursor struct {
	// The cursor to start from.
	Offset int `json:"offset"`
	// The number of items to return.
	Limit int `json:"limit"`
	// OrderBy is the column to order by.
	OrderBy string `json:"order_by"`
}

func (p *PaginationCursor) ApplyToQuery(query *gorm.DB) *gorm.DB {
	if p.Limit != 0 {
		query = query.Limit(p.Limit)
	}

	if p.OrderBy != "" {
		query = query.Order(p.OrderBy)
	} else {
		query = query.Order("fetched_at ASC")
	}

	return query.Offset(p.Offset)
}
