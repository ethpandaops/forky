package db

import (
	"context"
	"database/sql"
	"errors"

	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forkchoice/pkg/forkchoice/types"
	perrors "github.com/pkg/errors"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type Indexer struct {
	db  *gorm.DB
	log logrus.FieldLogger
}

func NewIndexer(log logrus.FieldLogger, config IndexerConfig, dbConn ...*sql.DB) (*Indexer, error) {
	var db *gorm.DB

	var err error

	switch config.DriverName {
	case "postgres":
		conf := postgres.Config{
			DSN:        config.DSN,
			DriverName: "postgres",
		}

		if len(dbConn) > 0 {
			conf.Conn = dbConn[0]
		}

		dialect := postgres.New(conf)

		db, err = gorm.Open(dialect, &gorm.Config{})
	case "sqlite":
		db, err = gorm.Open(sqlite.Open(config.DSN), &gorm.Config{})
	default:
		return nil, errors.New("invalid driver name: " + config.DriverName)
	}

	if err != nil {
		return nil, err
	}

	db = db.Session(&gorm.Session{FullSaveAssociations: true})

	err = db.AutoMigrate(&FrameMetadata{})
	if err != nil {
		return nil, perrors.Wrap(err, "failed to auto migrate frame_metadata")
	}

	err = db.AutoMigrate(&FrameMetadataLabels{})
	if err != nil {
		return nil, perrors.Wrap(err, "failed to auto migrate frame_metadata_label")
	}

	return &Indexer{
		db:  db,
		log: log.WithField("component", "indexer"),
	}, nil
}

func (i *Indexer) AddFrameMetadata(ctx context.Context, metadata *types.FrameMetadata) error {
	var f FrameMetadata

	result := i.db.WithContext(ctx).Create(f.FromFrameMetadata(metadata))

	return result.Error
}

func (i *Indexer) RemoveFrameMetadata(ctx context.Context, id string) error {
	result := i.db.WithContext(ctx).Where("id = ?", id).Delete(&FrameMetadata{})

	return result.Error
}

func (i *Indexer) CountFrameMetadata(ctx context.Context, filter *FrameFilter) (int64, error) {
	var count int64

	query := i.db.WithContext(ctx).Model(&FrameMetadata{})

	// Fetch frames that have ALL labels provided.
	if filter.Labels != nil {
		frameIDs, err := i.getFrameIDsWithLabels(ctx, *filter.Labels)
		if err != nil {
			return 0, err
		}

		query = query.Where("id IN (?)", frameIDs)
	}

	query, err := filter.ApplyToQuery(query)
	if err != nil {
		return 0, err
	}

	result := query.Count(&count)
	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func (i *Indexer) ListFrameMetadata(ctx context.Context, filter *FrameFilter, page *PaginationCursor) ([]*FrameMetadata, error) {
	var frames []*FrameMetadata

	query := i.db.WithContext(ctx).Model(&FrameMetadata{})

	// Fetch frames that have ALL labels provided.
	if filter.Labels != nil {
		frameIDs, err := i.getFrameIDsWithLabels(ctx, *filter.Labels)
		if err != nil {
			return nil, err
		}

		query = query.Where("id IN (?)", frameIDs)
	}

	if page != nil {
		query = page.ApplyToQuery(query)
	}

	query, err := filter.ApplyToQuery(query)
	if err != nil {
		return nil, err
	}

	result := query.Preload("Labels").Order("fetched_at ASC").Find(&frames).Limit(1000)
	if result.Error != nil {
		return nil, result.Error
	}

	return frames, nil
}

func (i *Indexer) CountNodesWithFrames(ctx context.Context, filter *FrameFilter) (int64, error) {
	var count int64

	query := i.db.WithContext(ctx).Model(&FrameMetadata{})

	// Fetch frames that have ALL labels provided.
	if filter.Labels != nil {
		frameIDs, err := i.getFrameIDsWithLabels(ctx, *filter.Labels)
		if err != nil {
			return 0, err
		}

		query = query.Where("id IN (?)", frameIDs)
	}

	query, err := filter.ApplyToQuery(query)
	if err != nil {
		return 0, err
	}

	result := query.Distinct("node").Count(&count)
	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func (i *Indexer) ListNodesWithFrames(ctx context.Context, filter *FrameFilter, page *PaginationCursor) ([]string, error) {
	var nodes []string

	query := i.db.WithContext(ctx).Model(&FrameMetadata{})

	// Fetch frames that have ALL labels provided.
	if filter.Labels != nil {
		frameIDs, err := i.getFrameIDsWithLabels(ctx, *filter.Labels)
		if err != nil {
			return nil, err
		}

		query = query.Where("id IN (?)", frameIDs)
	}

	query, err := filter.ApplyToQuery(query)
	if err != nil {
		return nil, err
	}

	if page != nil {
		query = page.ApplyToQuery(query)
	}

	result := query.Preload("Labels").Distinct("node").Find(&nodes)
	if result.Error != nil {
		return nil, result.Error
	}

	return nodes, nil
}

func (i *Indexer) CountSlotsWithFrames(ctx context.Context, filter *FrameFilter) (int64, error) {
	var count int64

	query := i.db.WithContext(ctx).Model(&FrameMetadata{})

	// Fetch frames that have ALL labels provided.
	if filter.Labels != nil {
		frameIDs, err := i.getFrameIDsWithLabels(ctx, *filter.Labels)
		if err != nil {
			return 0, err
		}

		query = query.Where("id IN (?)", frameIDs)
	}

	query, err := filter.ApplyToQuery(query)
	if err != nil {
		return 0, err
	}

	result := query.Distinct("wall_clock_slot").Count(&count)
	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func (i *Indexer) ListSlotsWithFrames(ctx context.Context, filter *FrameFilter, page *PaginationCursor) ([]phase0.Slot, error) {
	var slots []phase0.Slot

	query := i.db.WithContext(ctx).Model(&FrameMetadata{})

	// Fetch frames that have ALL labels provided.
	if filter.Labels != nil {
		frameIDs, err := i.getFrameIDsWithLabels(ctx, *filter.Labels)
		if err != nil {
			return nil, err
		}

		query = query.Where("id IN (?)", frameIDs)
	}

	query, err := filter.ApplyToQuery(query)
	if err != nil {
		return nil, err
	}

	if page != nil {
		query = page.ApplyToQuery(query)
	}

	result := query.Preload("Labels").Distinct("wall_clock_slot").Find(&slots)
	if result.Error != nil {
		return nil, result.Error
	}

	return slots, nil
}

func (i *Indexer) CountEpochsWithFrames(ctx context.Context, filter *FrameFilter) (int64, error) {
	var count int64

	query := i.db.WithContext(ctx).Model(&FrameMetadata{})

	// Fetch frames that have ALL labels provided.
	if filter.Labels != nil {
		frameIDs, err := i.getFrameIDsWithLabels(ctx, *filter.Labels)
		if err != nil {
			return 0, err
		}

		query = query.Where("id IN (?)", frameIDs)
	}

	query, err := filter.ApplyToQuery(query)
	if err != nil {
		return 0, err
	}

	result := query.Distinct("wall_clock_epoch").Count(&count)
	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func (i *Indexer) ListEpochsWithFrames(ctx context.Context, filter *FrameFilter, page *PaginationCursor) ([]phase0.Epoch, error) {
	var epochs []phase0.Epoch

	query := i.db.WithContext(ctx).Model(&FrameMetadata{})

	// Fetch frames that have ALL labels provided.
	if filter.Labels != nil {
		frameIDs, err := i.getFrameIDsWithLabels(ctx, *filter.Labels)
		if err != nil {
			return nil, err
		}

		query = query.Where("id IN (?)", frameIDs)
	}

	query, err := filter.ApplyToQuery(query)
	if err != nil {
		return nil, err
	}

	if page != nil {
		query = page.ApplyToQuery(query)
	}

	result := query.Preload("Labels").Distinct("wall_clock_epoch").Find(&epochs)
	if result.Error != nil {
		return nil, result.Error
	}

	return epochs, nil
}

func (i *Indexer) CountLabelsWithFrames(ctx context.Context, filter *FrameFilter) (int64, error) {
	var count int64

	metadata, err := i.ListFrameMetadata(ctx, filter, &PaginationCursor{})
	if err != nil {
		return 0, err
	}

	ids := []string{}

	for _, frame := range metadata {
		ids = append(ids, frame.ID)
	}

	query := i.db.WithContext(ctx).Model(&FrameMetadataLabel{}).
		Where("frame_id IN (?)", ids).Group("name")

	result := query.Distinct("name").Count(&count)
	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func (i *Indexer) ListLabelsWithFrames(ctx context.Context, filter *FrameFilter, page *PaginationCursor) (FrameMetadataLabels, error) {
	labels := FrameMetadataLabels{}

	metadata, err := i.ListFrameMetadata(ctx, filter, page)
	if err != nil {
		return nil, err
	}

	ids := []string{}

	for _, frame := range metadata {
		ids = append(ids, frame.ID)
	}

	query := i.db.WithContext(ctx).Model(&FrameMetadataLabel{}).
		Where("frame_id IN (?)", ids)

	result := query.Distinct("name").Find(&labels)
	if result.Error != nil {
		return nil, err
	}

	return labels, nil
}

func (i *Indexer) DeleteFrameMetadata(ctx context.Context, id string) error {
	query := i.db.WithContext(ctx)

	result := query.Unscoped().Where("id = ?", id).Delete(&FrameMetadata{})
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("frame_metadata not found")
	}

	// result = query.Unscoped().Where("frame_id = ?", id).Delete(&FrameMetadataLabels{})
	// if result.Error != nil {
	// 	return result.Error
	// }

	// if result.RowsAffected == 0 {
	// 	return errors.New("frame_metadata_label not found")
	// }

	return nil
}

func (i *Indexer) getFrameIDsWithLabels(ctx context.Context, labels []string) ([]string, error) {
	frameLabels := []*FrameMetadataLabel{}

	if err := i.db.Model(&FrameMetadataLabel{}).Where("name IN (?)", labels).Find(&frameLabels).Error; err != nil {
		return nil, err
	}

	frameLabelFrameIDs := map[string]int{}
	for _, frameLabel := range frameLabels {
		frameLabelFrameIDs[frameLabel.FrameID]++
	}

	frameIDs := []string{}

	for frameID, count := range frameLabelFrameIDs {
		// Check if the frame has all required labels.
		if len(labels) != count {
			continue
		}

		frameIDs = append(frameIDs, frameID)
	}

	return frameIDs, nil
}
