import { useQuery, useQueries, UseQueryOptions } from '@tanstack/react-query';

import { fetchNow, fetchSpec, Spec } from '@api/ethereum';
import { fetchFrame, fetchFramesBatch } from '@api/frames';
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

// Split an array into chunks of a specified size
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

type FrameQueryOptions = UseQueryOptions<
  Record<string, ProcessedData>,
  unknown,
  Record<string, ProcessedData>,
  string[]
>;

export function useFrameQueries(ids: string[], enabled = true) {
  const BATCH_SIZE = 10;
  const idChunks = ids.length > 1 ? chunkArray(ids, BATCH_SIZE) : [ids];

  const batchQueries = useQueries<FrameQueryOptions[]>({
    queries: idChunks.map(chunk => ({
      queryKey: ['frames-batch', chunk.join(',')] as const,
      queryFn: () => fetchFramesBatch(chunk),
      enabled: enabled && chunk.length > 0,
      staleTime: 120_000,
    })),
  });

  if (!enabled || ids.length === 0) {
    return ids.map(_ => ({
      data: undefined,
      isLoading: false,
      error: null,
    }));
  }

  const isLoading = batchQueries.some(query => query.isLoading);

  if (!isLoading && batchQueries.every(query => query.data)) {
    const mergedData: Record<string, ProcessedData> = {};
    batchQueries.forEach(query => {
      if (query.data) {
        Object.assign(mergedData, query.data);
      }
    });

    return ids.map(id => ({
      data: mergedData[id],
      isLoading: false,
      error: !mergedData[id] ? new Error(`Frame ${id} not found`) : null,
    }));
  }

  return ids.map(id => {
    const batchIndex = idChunks.findIndex(chunk => chunk.includes(id));
    if (batchIndex === -1) {
      return { data: undefined, isLoading: false, error: new Error('ID not found in any batch') };
    }

    const batchQuery = batchQueries[batchIndex];

    if (batchQuery.isLoading) {
      return { data: undefined, isLoading: true, error: null };
    }

    if (batchQuery.error) {
      return { data: undefined, isLoading: false, error: batchQuery.error };
    }

    return {
      data: batchQuery.data?.[id],
      isLoading: false,
      error: !batchQuery.data?.[id] ? new Error(`Frame ${id} not found in batch`) : null,
    };
  });
}
