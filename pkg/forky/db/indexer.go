package db

import (
	"context"
	"errors"

	"github.com/attestantio/go-eth2-client/spec/phase0"
	"github.com/ethpandaops/forky/pkg/forky/types"
	perrors "github.com/pkg/errors"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/plugin/prometheus"
)

type Indexer struct {
	db      *gorm.DB
	log     logrus.FieldLogger
	metrics *BasicMetrics
	opts    *Options
}

func NewIndexer(namespace string, log logrus.FieldLogger, config IndexerConfig, opts *Options) (*Indexer, error) {
	namespace += "_indexer"

	var db *gorm.DB

	var err error

	switch config.DriverName {
	case "postgres":
		conf := postgres.Config{
			DSN:        config.DSN,
			DriverName: "postgres",
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

	if err = db.Use(
		prometheus.New(prometheus.Config{
			DBName:          "forkchoice",
			RefreshInterval: 15,
			StartServer:     false,
		}),
	); err != nil {
		return nil, perrors.Wrap(err, "failed to register prometheus plugin")
	}

	err = db.AutoMigrate(&FrameMetadata{})
	if err != nil {
		return nil, perrors.Wrap(err, "failed to auto migrate frame_metadata")
	}

	err = db.AutoMigrate(&FrameMetadataLabels{})
	if err != nil {
		return nil, perrors.Wrap(err, "failed to auto migrate frame_metadata_label")
	}

	return &Indexer{
		db:      db,
		log:     log.WithField("component", "indexer"),
		metrics: NewBasicMetrics(namespace, config.DriverName, opts.MetricsEnabled),
		opts:    opts,
	}, nil
}

func (i *Indexer) InsertFrameMetadata(ctx context.Context, metadata *types.FrameMetadata) error {
	operation := OperationInsertFrameMetadata
	i.metrics.ObserveOperation(operation)

	var f FrameMetadata

	result := i.db.WithContext(ctx).Create(f.FromFrameMetadata(metadata))
	if result.Error != nil {
		i.metrics.ObserveOperationError(operation)
	}

	return result.Error
}

func (i *Indexer) RemoveFrameMetadata(ctx context.Context, id string) error {
	operation := OperationDeleteFrameMetadata

	i.metrics.ObserveOperation(operation)

	result := i.db.WithContext(ctx).Where("id = ?", id).Delete(&FrameMetadata{})

	if result.Error != nil {
		i.metrics.ObserveOperationError(operation)
	}

	return result.Error
}

func (i *Indexer) CountFrameMetadata(ctx context.Context, filter *FrameFilter) (int64, error) {
	operation := OperationCountFrameMetadata

	i.metrics.ObserveOperation(operation)

	var count int64

	query := i.db.WithContext(ctx).Model(&FrameMetadata{})

	// Fetch frames that have ALL labels provided.
	if filter.Labels != nil {
		frameIDs, err := i.getFrameIDsWithLabels(ctx, *filter.Labels)
		if err != nil {
			i.metrics.ObserveOperationError(operation)

			return 0, err
		}

		query = query.Where("id IN (?)", frameIDs)
	}

	query, err := filter.ApplyToQuery(query)
	if err != nil {
		i.metrics.ObserveOperationError(operation)

		return 0, err
	}

	result := query.Count(&count)
	if result.Error != nil {
		i.metrics.ObserveOperationError(operation)

		return 0, result.Error
	}

	return count, nil
}

func (i *Indexer) ListFrameMetadata(ctx context.Context, filter *FrameFilter, page *PaginationCursor) ([]*FrameMetadata, error) {
	operation := OperationListFrameMetadata

	i.metrics.ObserveOperation(operation)

	var frames []*FrameMetadata

	query := i.db.WithContext(ctx).Model(&FrameMetadata{})

	// Fetch frames that have ALL labels provided.
	if filter.Labels != nil {
		frameIDs, err := i.getFrameIDsWithLabels(ctx, *filter.Labels)
		if err != nil {
			i.metrics.ObserveOperationError(operation)

			return nil, err
		}

		query = query.Where("id IN (?)", frameIDs)
	}

	if page != nil {
		query = page.ApplyToQuery(query)
	}

	query, err := filter.ApplyToQuery(query)
	if err != nil {
		i.metrics.ObserveOperationError(operation)

		return nil, err
	}

	result := query.Preload("Labels").Order("fetched_at ASC").Find(&frames).Limit(1000)
	if result.Error != nil {
		i.metrics.ObserveOperationError(operation)

		return nil, result.Error
	}

	return frames, nil
}

func (i *Indexer) CountNodesWithFrames(ctx context.Context, filter *FrameFilter) (int64, error) {
	operation := OperationCountNodesWithFrames

	i.metrics.ObserveOperation(operation)

	var count int64

	query := i.db.WithContext(ctx).Model(&FrameMetadata{})

	// Fetch frames that have ALL labels provided.
	if filter.Labels != nil {
		frameIDs, err := i.getFrameIDsWithLabels(ctx, *filter.Labels)
		if err != nil {
			i.metrics.ObserveOperationError(operation)

			return 0, err
		}

		query = query.Where("id IN (?)", frameIDs)
	}

	query, err := filter.ApplyToQuery(query)
	if err != nil {
		i.metrics.ObserveOperationError(operation)

		return 0, err
	}

	result := query.Distinct("node").Count(&count)
	if result.Error != nil {
		i.metrics.ObserveOperationError(operation)

		return 0, result.Error
	}

	return count, nil
}

func (i *Indexer) ListNodesWithFrames(ctx context.Context, filter *FrameFilter, page *PaginationCursor) ([]string, error) {
	operation := OperationsListNodesWithFrames

	i.metrics.ObserveOperation(operation)

	var nodes []string

	query := i.db.WithContext(ctx).Model(&FrameMetadata{})

	// Fetch frames that have ALL labels provided.
	if filter.Labels != nil {
		frameIDs, err := i.getFrameIDsWithLabels(ctx, *filter.Labels)
		if err != nil {
			i.metrics.ObserveOperationError(operation)

			return nil, err
		}

		query = query.Where("id IN (?)", frameIDs)
	}

	query, err := filter.ApplyToQuery(query)
	if err != nil {
		i.metrics.ObserveOperationError(operation)

		return nil, err
	}

	if page != nil {
		query = page.ApplyToQuery(query)
	}

	result := query.Preload("Labels").Distinct("node").Find(&nodes)
	if result.Error != nil {
		i.metrics.ObserveOperationError(operation)

		return nil, result.Error
	}

	return nodes, nil
}

func (i *Indexer) CountSlotsWithFrames(ctx context.Context, filter *FrameFilter) (int64, error) {
	operation := OperationCountSlotsWithFrames

	i.metrics.ObserveOperation(operation)

	var count int64

	query := i.db.WithContext(ctx).Model(&FrameMetadata{})

	// Fetch frames that have ALL labels provided.
	if filter.Labels != nil {
		frameIDs, err := i.getFrameIDsWithLabels(ctx, *filter.Labels)
		if err != nil {
			i.metrics.ObserveOperationError(operation)

			return 0, err
		}

		query = query.Where("id IN (?)", frameIDs)
	}

	query, err := filter.ApplyToQuery(query)
	if err != nil {
		i.metrics.ObserveOperationError(operation)

		return 0, err
	}

	result := query.Distinct("wall_clock_slot").Count(&count)
	if result.Error != nil {
		i.metrics.ObserveOperationError(operation)

		return 0, result.Error
	}

	return count, nil
}

func (i *Indexer) ListSlotsWithFrames(ctx context.Context, filter *FrameFilter, page *PaginationCursor) ([]phase0.Slot, error) {
	operation := OperationListSlotsWithFrames

	i.metrics.ObserveOperation(operation)

	var slots []phase0.Slot

	query := i.db.WithContext(ctx).Model(&FrameMetadata{})

	// Fetch frames that have ALL labels provided.
	if filter.Labels != nil {
		frameIDs, err := i.getFrameIDsWithLabels(ctx, *filter.Labels)
		if err != nil {
			i.metrics.ObserveOperationError(operation)

			return nil, err
		}

		query = query.Where("id IN (?)", frameIDs)
	}

	query, err := filter.ApplyToQuery(query)
	if err != nil {
		i.metrics.ObserveOperationError(operation)

		return nil, err
	}

	if page != nil {
		query = page.ApplyToQuery(query)
	}

	result := query.Preload("Labels").Distinct("wall_clock_slot").Find(&slots)
	if result.Error != nil {
		i.metrics.ObserveOperationError(operation)

		return nil, result.Error
	}

	return slots, nil
}

func (i *Indexer) CountEpochsWithFrames(ctx context.Context, filter *FrameFilter) (int64, error) {
	operation := OperationCountEpochsWithFrames

	i.metrics.ObserveOperation(operation)

	var count int64

	query := i.db.WithContext(ctx).Model(&FrameMetadata{})

	// Fetch frames that have ALL labels provided.
	if filter.Labels != nil {
		frameIDs, err := i.getFrameIDsWithLabels(ctx, *filter.Labels)
		if err != nil {
			i.metrics.ObserveOperationError(operation)

			return 0, err
		}

		query = query.Where("id IN (?)", frameIDs)
	}

	query, err := filter.ApplyToQuery(query)
	if err != nil {
		i.metrics.ObserveOperationError(operation)

		return 0, err
	}

	result := query.Distinct("wall_clock_epoch").Count(&count)
	if result.Error != nil {
		i.metrics.ObserveOperationError(operation)

		return 0, result.Error
	}

	return count, nil
}

func (i *Indexer) ListEpochsWithFrames(ctx context.Context, filter *FrameFilter, page *PaginationCursor) ([]phase0.Epoch, error) {
	operation := OperationListEpochsWithFrames

	i.metrics.ObserveOperation(operation)

	var epochs []phase0.Epoch

	query := i.db.WithContext(ctx).Model(&FrameMetadata{})

	// Fetch frames that have ALL labels provided.
	if filter.Labels != nil {
		frameIDs, err := i.getFrameIDsWithLabels(ctx, *filter.Labels)
		if err != nil {
			i.metrics.ObserveOperationError(operation)

			return nil, err
		}

		query = query.Where("id IN (?)", frameIDs)
	}

	query, err := filter.ApplyToQuery(query)
	if err != nil {
		i.metrics.ObserveOperationError(operation)

		return nil, err
	}

	if page != nil {
		query = page.ApplyToQuery(query)
	}

	result := query.Preload("Labels").Distinct("wall_clock_epoch").Find(&epochs)
	if result.Error != nil {
		i.metrics.ObserveOperationError(operation)

		return nil, result.Error
	}

	return epochs, nil
}

func (i *Indexer) CountLabelsWithFrames(ctx context.Context, filter *FrameFilter) (int64, error) {
	operation := OperationCountLabelsWithFrames

	i.metrics.ObserveOperation(operation)

	var count int64

	metadata, err := i.ListFrameMetadata(ctx, filter, &PaginationCursor{})
	if err != nil {
		i.metrics.ObserveOperationError(operation)

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
		i.metrics.ObserveOperationError(operation)

		return 0, result.Error
	}

	return count, nil
}

func (i *Indexer) ListLabelsWithFrames(ctx context.Context, filter *FrameFilter, page *PaginationCursor) (FrameMetadataLabels, error) {
	operation := OperationListLabelsWithFrames

	i.metrics.ObserveOperation(operation)

	labels := FrameMetadataLabels{}

	metadata, err := i.ListFrameMetadata(ctx, filter, page)
	if err != nil {
		i.metrics.ObserveOperationError(operation)

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
		i.metrics.ObserveOperationError(operation)

		return nil, err
	}

	return labels, nil
}

func (i *Indexer) DeleteFrameMetadata(ctx context.Context, id string) error {
	operation := OperationDeleteFrameMetadata

	i.metrics.ObserveOperation(operation)

	query := i.db.WithContext(ctx)

	result := query.Unscoped().Where("id = ?", id).Delete(&FrameMetadata{})
	if result.Error != nil {
		i.metrics.ObserveOperationError(operation)

		return result.Error
	}

	if result.RowsAffected == 0 {
		i.metrics.ObserveOperationError(operation)

		return errors.New("frame_metadata not found")
	}

	result = query.Unscoped().Where("frame_id = ?", id).Delete(&FrameMetadataLabels{})
	if result.Error != nil {
		i.metrics.ObserveOperationError(operation)

		return result.Error
	}

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
