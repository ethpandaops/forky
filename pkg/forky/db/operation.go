package db

type Operation string

const (
	OperationInsertFrameMetadata Operation = "insert_frame_metadata"
	OperationDeleteFrameMetadata Operation = "delete_frame_metadata"
	OperationCountFrameMetadata  Operation = "count_frame_metadata"
	OperationListFrameMetadata   Operation = "list_frame_metadata"

	OperationCountNodesWithFrames Operation = "count_nodes_with_frames"
	OperationsListNodesWithFrames Operation = "list_nodes_with_frames"

	OperationCountSlotsWithFrames Operation = "count_slots_with_frames"
	OperationListSlotsWithFrames  Operation = "list_slots_with_frames"

	OperationCountEpochsWithFrames Operation = "count_epochs_with_frames"
	OperationListEpochsWithFrames  Operation = "list_epochs_with_frames"

	OperationCountLabelsWithFrames Operation = "count_labels_with_frames"
	OperationListLabelsWithFrames  Operation = "list_labels_with_frames"
)
