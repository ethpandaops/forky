import {
  Response,
  FrameMetaData,
  V1MetadataListRequest,
  V1MetadataListResponse,
  V1MetadataListNodesRequest,
  V1MetadataListNodesResponse,
} from '@app/types/api';
import { BASE_URL } from '@utils/environment';

export async function fetchMetadataNodes(payload: V1MetadataListNodesRequest): Promise<string[]> {
  const response = await fetch(`${BASE_URL}api/v1/metadata/nodes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch metadata nodes');
  }

  const json = (await response.json()) as Response<V1MetadataListNodesResponse>;
  return json.data?.nodes || [];
}

export async function fetchMetadataList(payload: V1MetadataListRequest): Promise<FrameMetaData[]> {
  const response = await fetch(`${BASE_URL}api/v1/metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch metadata list');
  }
  const json = (await response.json()) as Response<V1MetadataListResponse>;
  return json.data?.frames || [];
}
