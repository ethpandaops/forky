import { useQuery, useQueries } from '@tanstack/react-query';

import { fetchNow, fetchSpec, Spec } from '@api/ethereum';
import { fetchFrame } from '@api/frames';
import { fetchMetadataList, fetchMetadataNodes } from '@api/metadata';
import { FrameFilter, FrameMetaData, V1GetEthereumNowResponse } from '@app/types/api';
import { ProcessedData } from '@app/types/graph';

export function useNowQuery(enabled = true) {
  return useQuery<
    Required<V1GetEthereumNowResponse>,
    unknown,
    Required<V1GetEthereumNowResponse>,
    string[]
  >({
    queryKey: ['now'],
    queryFn: () => fetchNow(),
    enabled,
    staleTime: 60_000,
  });
}

export function useSpecQuery(enabled = true) {
  return useQuery<Spec, unknown, Spec, string[]>({
    queryKey: ['spec'],
    queryFn: () => fetchSpec(),
    enabled,
    staleTime: 60_000,
  });
}

export function useNodesQuery(filter: FrameFilter, enabled = true) {
  return useQuery<string[], unknown, string[], [string, FrameFilter]>({
    queryKey: ['metadata', filter],
    queryFn: () => fetchMetadataNodes({ pagination: { limit: 100 }, filter }),
    enabled,
    staleTime: 6_000,
  });
}

export function useMetadataQuery(filter: FrameFilter, enabled = true) {
  return useQuery<FrameMetaData[], unknown, FrameMetaData[], [string, FrameFilter]>({
    queryKey: ['metadata', filter],
    queryFn: () => fetchMetadataList({ pagination: { limit: 1000 }, filter }),
    enabled,
    staleTime: 6_000,
  });
}

export function useFrameQuery(id: string, enabled = true) {
  return useQuery<ProcessedData, unknown, ProcessedData, string[]>({
    queryKey: ['frame', id],
    queryFn: () => fetchFrame(id),
    enabled,
    staleTime: 120_000,
  });
}

export function useFrameQueries(ids: string[], enabled = true) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ['frame', id],
      queryFn: () => fetchFrame(id),
      enabled,
      staleTime: 120_000,
    })),
  });
}
