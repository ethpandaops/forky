import {
  Response,
  FrameMetaData,
  V1MetadataListRequest,
  V1MetadataListResponse,
  V1MetadataListNodesRequest,
  V1MetadataListNodesResponse,
} from '@app/types/api';
import { BASE_URL } from '@utils/environment';

/* 
  rest.get(`${BASE_URL}api/v1/ethereum/now`, async (_, res, ctx) => {
    return res(ctx.json({ data: getNow() }));
  }),
  rest.get(`${BASE_URL}api/v1/ethereum/spec`, (_, res, ctx) => {
    return res(ctx.json({ data: { network_name: networkName, spec } }));
  }),
  rest.post(`${BASE_URL}api/v1/metadata/nodes`, (_, res, ctx) => {
    return res(ctx.json({ data: nodes }));
  }),
*/

export async function fetchMetadataNodes(payload: V1MetadataListNodesRequest): Promise<string[]> {
  const response = await fetch(`${BASE_URL}api/v1/metadata/nodes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch slot data');
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
