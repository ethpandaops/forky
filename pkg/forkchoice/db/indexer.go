package db

import (
	"errors"

	"github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type Indexer struct {
	db  *gorm.DB
	log logrus.FieldLogger
}

func NewIndexer(log logrus.FieldLogger, config IndexerConfig) (*Indexer, error) {
	var db *gorm.DB

	var err error

	switch config.DriverName {
	case "postgres":
		db, err = gorm.Open(postgres.Open(config.DSN), &gorm.Config{})
	case "sqlite":
		db, err = gorm.Open(sqlite.Open(config.DSN), &gorm.Config{})
	default:
		return nil, errors.New("invalid driver name: " + config.DriverName)
	}

	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(&Frame{})
	if err != nil {
		return nil, err
	}

	return &Indexer{
		db:  db,
		log: log.WithField("component", "indexer"),
	}, nil
}
