package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
	"gorm.io/datatypes"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type GORMFrame struct {
	gorm.Model

	WallClockEpoch uint64
	WallClockSlot  uint64
	Node           string
	ID             string `gorm:"primaryKey"`
	FetchedAt      time.Time

	Frame string
}

type GORMStore struct {
	db *gorm.DB
}

type GORMConfig struct {
	DSN string `yaml:"dsn"`
}

func NewGORMStore(config GORMConfig) (*GORMStore, error) {
	db, err := gorm.Open(sqlite.Open(config.DSN), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(&GORMFrame{})
	if err != nil {
		return nil, err
	}

	return &GORMStore{db: db}, nil
}

func (g *GORMStore) Save(ctx context.Context, frame *types.Frame) error {
	gzippedData, err := frame.AsGzipJSON()
	if err != nil {
		return err
	}

	gormFrame := &GORMFrame{
		WallClockEpoch: uint64(frame.Metadata.WallClockEpoch),
		WallClockSlot:  uint64(frame.Metadata.WallClockSlot),
		Node:           frame.Metadata.Node,
		ID:             frame.Metadata.ID,
		Frame:          string(gzippedData),
	}

	result := g.db.WithContext(ctx).Create(gormFrame)

	return result.Error
}

func (g *GORMStore) Load(ctx context.Context, metadata types.FrameMetadata) (*types.Frame, error) {
	var gormFrame GORMFrame
	result := g.db.WithContext(ctx).
		Where("id = ?", metadata.ID).
		First(&gormFrame)

	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("frame not found: %w", result.Error)
	}

	if result.Error != nil {
		return nil, result.Error
	}

	var frame types.Frame
	if err := frame.FromGzipJSON([]byte(gormFrame.Frame)); err != nil {
		return nil, err
	}

	return &frame, nil
}

func (g *GORMStore) List(ctx context.Context, filter *types.FrameFilter) ([]*types.FrameMetadata, error) {
	var gormFrames []GORMFrame

	query := g.db.WithContext(ctx).Model(&GORMFrame{})

	if filter != nil {
		if filter.WallClockSlot != nil {
			query = query.Where(datatypes.JSONQuery("metadata").Equals("wall_clock_slot", fmt.Sprintf("%v", filter.WallClockSlot)))
		}

		if filter.WallClockEpoch != nil {
			query = query.Where(datatypes.JSONQuery("metadata").Equals("wall_clock_epoch", fmt.Sprintf("%v", filter.WallClockEpoch)))
		}
	}

	result := query.Find(&gormFrames)
	if result.Error != nil {
		return nil, result.Error
	}

	metadataList := make([]*types.FrameMetadata, len(gormFrames))

	for i, gormFrame := range gormFrames {
		metadataList[i] = &types.FrameMetadata{
			WallClockEpoch: phase0.Epoch(gormFrame.WallClockEpoch),
			WallClockSlot:  phase0.Slot(gormFrame.WallClockSlot),
			Node:           gormFrame.Node,
			ID:             gormFrame.ID,
			FetchedAt:      gormFrame.FetchedAt,
		}
	}

	return metadataList, nil
}

func (g *GORMStore) Delete(ctx context.Context, metadata types.FrameMetadata) error {
	result := g.db.WithContext(ctx).Where("metadata = ?", metadata).Delete(&GORMFrame{})

	return result.Error
}
