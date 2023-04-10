import Graphology from 'graphology';

import { V1GetFrameResponse, FrameMetaData, Checkpoint } from '@app/types/api';

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
  directed: boolean;
  distance: number;
}

export interface GraphAttributes {
  slotStart: number;
  slotEnd: number;
  id: string;
  head?: string;
  type: 'aggregated' | 'weighted' | 'empty';
}

export interface WeightedGraphAttributes extends GraphAttributes {
  forks: number;
}

export interface AggregatedGraphAttributes extends GraphAttributes {
  nodes: {
    metadata: FrameMetaData;
    head?: WeightedNodeAttributes;
    justifiedCheckpoint?: Checkpoint;
    finalizedCheckpoint?: Checkpoint;
    forks: number;
  }[];
}

export interface WeightedNodeAttributes extends NodeAttributes {
  checkpoint?: 'finalized' | 'justified';
  validity: 'valid' | string;
  orphaned?: boolean;
  parentRoot?: string;
  weight: bigint;
  weightPercentageComparedToHeaviestNeighbor: number;
}

export interface AggregatedNodeAttributes extends NodeAttributes {
  checkpoints: { node: string; checkpoint: 'finalized' | 'justified' }[];
  validities: { node: string; validity: 'valid' | string }[];
  orphaned: string[];
  highestWeight: bigint;
  seenByNodes: string[];
  canonicalForNodes: string[];
}

export type ProcessedData = {
  frame: Required<Required<V1GetFrameResponse>['frame']>;
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
