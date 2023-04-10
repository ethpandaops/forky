import { useContext as reactUseContext, createContext, useState, useCallback } from 'react';

import { ForkChoiceNode, FrameMetaData } from '@app/types/api';
import { WeightedNodeAttributes, AggregatedNodeAttributes } from '@app/types/graph';

export const Context = createContext<State | undefined>(undefined);

export default function useContext() {
  const context = reactUseContext(Context);
  if (context === undefined) {
    throw new Error('Selection context must be used within a Selection provider');
  }
  return context;
}

export type WeightedNode = {
  metadata: FrameMetaData;
  attributes: WeightedNodeAttributes;
  node: ForkChoiceNode;
};

export type AggregatedNode = {
  nodes: Record<
    string,
    {
      metadata: FrameMetaData;
      attributes: WeightedNodeAttributes;
      node: ForkChoiceNode;
    }
  >;
  attributes: AggregatedNodeAttributes;
};

export type FrameBlock = {
  frameId: string;
  blockRoot: string;
};

export type AggregatedFramesBlock = {
  frameIds: string[];
  blockRoot: string;
};

export interface State {
  frameId?: string;
  setFrameId: (id?: string) => void;
  aggregatedFrameIds?: string[];
  setAggregatedFrameIds: (ids?: string[]) => void;
  frameBlock?: FrameBlock;
  setFrameBlock: (block?: FrameBlock) => void;
  aggregatedFramesBlock?: AggregatedFramesBlock;
  setAggregatedFramesBlock: (block?: AggregatedFramesBlock) => void;
  clearAll: () => void;
}

export function useValue(): State {
  const [frameId, setFrameId] = useState<string | undefined>();
  const [aggregatedFrameIds, setAggregatedFrameIds] = useState<string[] | undefined>();
  const [frameBlock, setFrameBlock] = useState<FrameBlock | undefined>();
  const [aggregatedFramesBlock, setAggregatedFramesBlock] = useState<
    AggregatedFramesBlock | undefined
  >();

  const setFrameIdWrapper = useCallback((id?: string) => {
    setFrameId(id);
    setAggregatedFrameIds(undefined);
    setFrameBlock(undefined);
    setAggregatedFramesBlock(undefined);
  }, []);

  const setAggregatedFrameIdsWrapper = useCallback((ids?: string[]) => {
    setFrameId(undefined);
    setAggregatedFrameIds(ids);
    setFrameBlock(undefined);
    setAggregatedFramesBlock(undefined);
  }, []);

  const setFrameBlockWrapper = useCallback((data?: FrameBlock) => {
    setFrameId(undefined);
    setAggregatedFrameIds(undefined);
    setFrameBlock(data);
    setAggregatedFramesBlock(undefined);
  }, []);

  const setAggregatedFramesBlockWrapper = useCallback((data?: AggregatedFramesBlock) => {
    setFrameId(undefined);
    setAggregatedFrameIds(undefined);
    setFrameBlock(undefined);
    setAggregatedFramesBlock(data);
  }, []);

  const clearAll = useCallback(() => {
    setFrameId(undefined);
    setAggregatedFrameIds(undefined);
    setFrameBlock(undefined);
    setAggregatedFramesBlock(undefined);
  }, []);

  return {
    frameId,
    setFrameId: setFrameIdWrapper,
    aggregatedFrameIds,
    setAggregatedFrameIds: setAggregatedFrameIdsWrapper,
    frameBlock,
    setFrameBlock: setFrameBlockWrapper,
    aggregatedFramesBlock,
    setAggregatedFramesBlock: setAggregatedFramesBlockWrapper,
    clearAll,
  };
}
