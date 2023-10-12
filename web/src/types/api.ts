export interface Checkpoint {
  epoch: string;
  root: string;
}

export interface ForkChoiceNode {
  slot: string;
  block_root: string;
  parent_root: string;
  justified_epoch: string;
  finalized_epoch: string;
  weight: string;
  validity: string;
  execution_block_hash: string;
  extra_data?: Record<string, unknown>;
}

export interface ForkChoiceData {
  justified_checkpoint?: Checkpoint;
  finalized_checkpoint?: Checkpoint;
  fork_choice_nodes?: ForkChoiceNode[];
  extra_data?: unknown;
}

/* REQUESTS */
export interface FrameFilter {
  node?: string;
  before?: string;
  after?: string;
  slot?: number;
  epoch?: number;
  labels?: string[];
  consensus_client?: string;
  event_source?: 'unknown' | 'beacon_node' | 'xatu_polling' | 'xatu_reorg_event';
}

export interface PaginationCursor {
  limit?: number;
  offset?: number;
  order?: string;
}

export interface V1MetadataListSlotsRequest {
  filter?: FrameFilter;
  pagination?: PaginationCursor;
}

export interface V1MetadataListRequest {
  filter?: FrameFilter;
  pagination?: PaginationCursor;
}

export interface V1MetadataListNodesRequest {
  filter?: FrameFilter;
  pagination?: PaginationCursor;
}

export interface V1MetadataListEpochsRequest {
  filter?: FrameFilter;
  pagination?: PaginationCursor;
}

export interface V1MetadataListLabelsRequest {
  filter?: FrameFilter;
  pagination?: PaginationCursor;
}

/* RESPONSE */
export interface Response<T> {
  data?: T;
}

export interface Frame {
  data?: ForkChoiceData;
  metadata?: FrameMetaData;
}

export interface FrameMetaData {
  id: string;
  node: string;
  fetched_at: string;
  wall_clock_slot: number;
  wall_clock_epoch: number;
  labels?: string[] | null;
}

export interface EthereumSpec {
  seconds_per_slot: number;
  slots_per_epoch: number;
  genesis_time: string;
}

export interface PaginationResponse {
  total?: number;
}

export interface V1MetadataListResponse {
  frames?: FrameMetaData[];
  pagination?: PaginationResponse;
}

export interface V1GetEthereumSpecResponse {
  network_name: string;
  spec?: EthereumSpec;
}

export interface V1GetEthereumNowResponse {
  slot?: number;
  epoch?: number;
}

export interface V1MetadataListNodesResponse {
  nodes?: string[];
  pagination: PaginationResponse;
}

export interface V1MetadataListSlotsResponse {
  slots?: number[];
  pagination: PaginationResponse;
}

export interface V1MetadataListEpochsResponse {
  epochs?: number[];
  pagination: PaginationResponse;
}

export interface V1MetadataListLabelsResponse {
  labels?: string[];
  pagination: PaginationResponse;
}

export interface V1GetFrameResponse {
  frame?: Frame;
}
