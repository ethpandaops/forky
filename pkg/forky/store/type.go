package store

type Type string

const (
	UnknownStore        Type = "unknown"
	FileSystemStoreType Type = "fs"
	S3StoreType         Type = "s3"
	MemoryStoreType     Type = "memory"
)

func IsValidStoreType(st Type) bool {
	switch st {
	case FileSystemStoreType, S3StoreType, MemoryStoreType:
		return true
	default:
		return false
	}
}

type DataType string

const (
	UnknownDataType DataType = "unknown"
	FrameDataType   DataType = "frame"
	BlockDataType   DataType = "block"
)
