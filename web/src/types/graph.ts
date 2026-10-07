import Graphology from 'graphology';

import { Frame, FrameMetadata, Checkpoint } from '@api';

export interface ProcessedForkChoiceNode {
  slot: number;
  blockRoot: string;
  parentRoot?: string;
  validity: string;
  executionBlockHash: string;
  canonical: boolean;
  checkpoint?: 'justified' | 'finalized';
  weight: bigint;
  orphaned: boolean;
}

export type Graph = Graphology<NodeAttributes, EdgeAttributes, GraphAttributes>;

export type WeightedGraph = Graphology<
  WeightedNodeAttributes,
  EdgeAttributes,
  WeightedGraphAttributes
>;
export type AggregatedGraph = Graphology<
  AggregatedNodeAttributes,
  EdgeAttributes,
  AggregatedGraphAttributes
>;

export interface NodeAttributes {
  canonical: boolean;
  slot: number;
  offset: number;
  blockRoot: string;
}

export interface EdgeAttributes {
  distance: number;
  // the child block was built on its parent block's empty payload (Gloas).
  builtOnEmpty?: boolean;
}

export interface GraphAttributes {
  slotStart: number;
  slotEnd: number;
  id: string;
  head?: string;
  // node ids of the (consensus, for aggregated) finalized/justified checkpoint
  // blocks, used to keep them visible when the tail is truncated.
  finalized?: string;
  justified?: string;
  type: 'aggregated' | 'weighted' | 'empty';
}

export interface WeightedGraphAttributes extends GraphAttributes {
  forks: number;
}

export interface AggregatedGraphAttributes extends GraphAttributes {
  nodes: {
    metadata: FrameMetadata;
    head?: WeightedNodeAttributes;
    justifiedCheckpoint?: Checkpoint;
    finalizedCheckpoint?: Checkpoint;
    forks: number;
  }[];
}

// Where a Gloas block's execution payload stands; see payloadStage in
// @utils/payload.
export type PayloadStage =
  | 'awaiting'
  | 'voting'
  | 'timely'
  | 'late'
  | 'undecided'
  | 'full'
  | 'empty';

// The Gloas payload of a block, from its pending, empty and full fork-choice
// nodes.
export interface BlockPayload {
  // the heavier of the block's empty and full nodes; undefined while tied.
  status?: 'empty' | 'full';
  emptyWeight?: bigint;
  fullWeight?: bigint;
  // which payload of its parent block the block was built on, if known.
  parentPayloadStatus?: 'empty' | 'full';
  // Payload Timeliness Committee votes.
  attesterCount?: number;
  availabilityYesCount?: number;
  dataAvailabilityYesCount?: number;
}

export interface WeightedNodeAttributes extends NodeAttributes {
  checkpoint?: 'finalized' | 'justified';
  validity: 'valid' | string;
  orphaned?: boolean;
  parentRoot?: string;
  weight: bigint;
  weightPercentageComparedToHeaviestNeighbor: number;
  payload?: BlockPayload;
}

export interface AggregatedNodeAttributes extends NodeAttributes {
  checkpoints: { node: string; checkpoint: 'finalized' | 'justified' }[];
  validities: { node: string; validity: 'valid' | string }[];
  orphaned: string[];
  highestWeight: bigint;
  seenByNodes: string[];
  canonicalForNodes: string[];
  // payload stage per source, for sources that report payload statuses.
  payloads: { node: string; stage: PayloadStage; progress: number }[];
}

export type ProcessedData = {
  frame: Required<Frame>;
  graph: WeightedGraph;
};

export interface OrphanReference {
  slot: number;
  nodeId: string;
  highestOffset: number;
  lowestOffset: number;
}

export interface ForkReference {
  slot: number;
  parentSlot: number;
  nodeId: string;
  height: number;
  lastSlot: number;
}
