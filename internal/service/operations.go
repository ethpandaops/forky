package service

type Operation string

const (
	OperationAddFrame    Operation = "add_frame"
	OperationGetFrame    Operation = "get_frame"
	OperationDeleteFrame Operation = "delete_frame"

	OperationListMetadata   Operation = "list_metadata"
	OperationUpdateMetadata Operation = "update_metadata"

	OperationListNodes  Operation = "list_nodes"
	OperationListSlots  Operation = "list_slots"
	OperationListEpochs Operation = "list_epochs"
	OperationListLabels Operation = "list_labels"

	OperationGetEthereumNow         Operation = "get_ethereum_now"
	OperationGetEthereumSpec        Operation = "get_ethereum_spec"
	OperationGetEthereumNetworkName Operation = "get_ethereum_network_name"
)
