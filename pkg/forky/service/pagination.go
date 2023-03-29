package service

import "github.com/ethpandaops/forkchoice/pkg/forky/db"

type PaginationCursor struct {
	// The cursor to start from.
	Offset int `json:"offset"`
	// The number of items to return.
	Limit int `json:"limit"`
}

func DefaultPagination() *PaginationCursor {
	return &PaginationCursor{
		Offset: 0,
		Limit:  1000,
	}
}

func (p *PaginationCursor) AsDBPageCursor() *db.PaginationCursor {
	return &db.PaginationCursor{
		Offset: p.Offset,
		Limit:  p.Limit,
	}
}

type PaginationResponse struct {
	// The total number of items.
	Total int64 `json:"total"`
}
