import { useQueries, useQuery } from '@tanstack/react-query';

import { getEthereumNow, getEthereumSpec, getFrame, listMetadata, listMetadataNodes } from '@api';
import { EthereumSpec, Frame, FrameMetadata } from '@api';
import { FrameFilter } from '@app/types/api';
import { ProcessedData } from '@app/types/graph';
import { processForkChoiceData } from '@utils/graph';

export interface Spec {
  network_name: string;
  spec: EthereumSpec;
}

export function useNowQuery(enabled = true) {
  return useQuery({
    queryKey: ['now'],
    queryFn: async () => {
      const { data, error } = await getEthereumNow();
      const now = data?.data;
      if (error || now?.slot == null || now?.epoch == null) {
        throw new Error('Failed to fetch ethereum now');
      }
      return { slot: now.slot, epoch: now.epoch };
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useSpecQuery(enabled = true) {
  return useQuery<Spec>({
    queryKey: ['spec'],
    queryFn: async () => {
      const { data, error } = await getEthereumSpec();
      const result = data?.data;
      if (error || !result?.spec) {
        throw new Error('Failed to fetch ethereum spec');
      }
      return {
        network_name: result.network_name ?? 'unknown',
        spec: result.spec as EthereumSpec,
      };
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useNodesQuery(filter: FrameFilter, enabled = true) {
  return useQuery({
    queryKey: ['metadata-nodes', filter],
    queryFn: async () => {
      const { data, error } = await listMetadataNodes({
        body: { pagination: { limit: 100 }, filter },
      });
      if (error) throw new Error('Failed to fetch metadata nodes');
      return data?.data?.nodes ?? [];
    },
    enabled,
    staleTime: 6_000,
  });
}

export function useMetadataQuery(filter: FrameFilter, enabled = true) {
  return useQuery({
    queryKey: ['metadata', filter],
    queryFn: async () => {
      const { data, error } = await listMetadata({
        body: { pagination: { limit: 1000 }, filter },
      });
      if (error) throw new Error('Failed to fetch metadata list');
      return (data?.data?.frames ?? []) satisfies FrameMetadata[];
    },
    enabled,
    staleTime: 6_000,
  });
}

async function fetchProcessedFrame(id: string): Promise<ProcessedData> {
  const { data, error } = await getFrame({ path: { id } });
  const frame = data?.data?.frame;
  if (error || !frame?.data || !frame?.metadata) {
    throw new Error('Failed to fetch frame');
  }

  return processForkChoiceData(frame satisfies Required<Frame>);
}

export function useFrameQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: ['frame', id],
    queryFn: () => fetchProcessedFrame(id),
    enabled,
    staleTime: 120_000,
  });
}

export function useFrameQueries(ids: string[], enabled = true) {
  return useQueries({
    queries: ids.map(id => ({
      queryKey: ['frame', id],
      queryFn: () => fetchProcessedFrame(id),
      enabled,
      staleTime: 120_000,
    })),
  });
}
