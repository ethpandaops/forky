package store

type Type string

const (
	UnknownStore        Type = "unknown"
	FileSystemStoreType Type = "fs"
	S3StoreType         Type = "s3"
	GORMStoreType       Type = "gorm"
)

func IsValidStoreType(st Type) bool {
	switch st {
	case FileSystemStoreType, S3StoreType, GORMStoreType:
		return true
	default:
		return false
	}
}
