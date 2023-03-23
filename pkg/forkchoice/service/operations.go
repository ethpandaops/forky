package service

type Operation string

const (
	OperationAddFrame    Operation = "add_frame"
	OperationGetFrame    Operation = "get_frame"
	OperationDeleteFrame Operation = "delete_frame"

	OperationListMetadata Operation = "list_metadata"

	OperationListNodes  Operation = "list_nodes"
	OperationListSlots  Operation = "list_slots"
	OperationListEpochs Operation = "list_epochs"
	OperationListLabels Operation = "list_labels"
)
