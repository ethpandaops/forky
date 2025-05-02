import { useQuery, useQueries } from '@tanstack/react-query';

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

export function useFramesBatchQuery(ids: string[], enabled = true) {
  return useQuery<
    Record<string, ProcessedData>,
    unknown,
    Record<string, ProcessedData>,
    [string, string[]]
  >({
    queryKey: ['frames-batch', ids],
    queryFn: () => fetchFramesBatch(ids),
    enabled: enabled && ids.length > 0,
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

export function useFrameQueries(ids: string[], enabled = true) {
  // Define the maximum number of IDs to send in a single batch request
  const BATCH_SIZE = 10;

  // Split IDs into chunks to avoid overwhelming the server
  const idChunks = ids.length > 1 ? chunkArray(ids, BATCH_SIZE) : [ids];

  // Create a batch query for each chunk
  const batchQueries = useQueries({
    queries: idChunks.map(chunk => ({
      queryKey: ['frames-batch', chunk],
      queryFn: () => fetchFramesBatch(chunk),
      enabled: enabled && chunk.length > 0,
      staleTime: 120_000,
    })),
  });

  // If not enabled or no IDs, return empty results
  if (!enabled || ids.length === 0) {
    return ids.map(id => ({
      data: undefined,
      isLoading: false,
      error: null,
    }));
  }

  // If any batch is still loading, show loading state
  const isLoading = batchQueries.some(query => query.isLoading);

  // If all batches are done, combine the results
  if (!isLoading && batchQueries.every(query => query.data)) {
    // Merge all batch results into a single map
    const mergedData: Record<string, ProcessedData> = {};
    batchQueries.forEach(query => {
      if (query.data) {
        Object.assign(mergedData, query.data);
      }
    });

    // Map results back to the original order of IDs
    return ids.map(id => ({
      data: mergedData[id],
      isLoading: false,
      error: !mergedData[id] ? new Error(`Frame ${id} not found`) : null,
    }));
  }

  // If batches are still loading or failed, return loading/error state
  return ids.map(id => {
    // Find which batch this ID belongs to
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
