import { http, RequestHandler, HttpResponse } from 'msw';

import type {
  EthereumNow,
  EthereumSpec,
  GetEthereumNowResponse,
  GetEthereumSpecResponse,
  GetFrameResponse,
  ListMetadataNodesResponse,
  ListMetadataResponse,
} from '@api';
import { generateRandomForkChoiceData } from '@utils/api';
import { BASE_URL } from '@utils/environment';

export const networkName = 'goerli';

export const spec: EthereumSpec = {
  seconds_per_slot: 12,
  slots_per_epoch: 32,
  genesis_time: '2021-03-23T14:00:00Z',
};

export function getNow(): EthereumNow {
  const slot = Math.floor(
    (Date.now() - new Date(spec.genesis_time).getTime()) / 1000 / spec.seconds_per_slot,
  );

  return {
    slot,
    epoch: Math.floor(slot / spec.slots_per_epoch),
  };
}

export const nodes: ListMetadataNodesResponse['data'] = {
  nodes: ['ams3-teku-001', 'syd1-lighthouse-001', 'syd1-prysm-001'],
  pagination: { total: 3 },
};

export const handlers: Array<RequestHandler> = [
  http.get(`${BASE_URL}api/v1/ethereum/now`, async () => {
    return HttpResponse.json({ data: getNow() } satisfies GetEthereumNowResponse);
  }),
  http.get(`${BASE_URL}api/v1/ethereum/spec`, () => {
    return HttpResponse.json({
      data: { network_name: networkName, spec },
    } satisfies GetEthereumSpecResponse);
  }),
  http.post(`${BASE_URL}api/v1/metadata/nodes`, () => {
    return HttpResponse.json({ data: nodes } satisfies ListMetadataNodesResponse);
  }),
  http.post(`${BASE_URL}api/v1/metadata`, async () => {
    const { slot, epoch } = getNow();
    const data: ListMetadataResponse = {
      data: {
        frames: [
          {
            id: 'bfe734bb-c986-4859-8b3e-44314ceca0b5',
            node: nodes.nodes[Math.floor(Math.random() * nodes.nodes.length)],
            fetched_at: new Date(
              new Date(spec.genesis_time).getTime() + slot * spec.seconds_per_slot * 1000,
            ).toISOString(),
            wall_clock_slot: slot,
            wall_clock_epoch: epoch,
            labels: [],
            consensus_client: 'teku',
            event_source: 'beacon_node',
          },
        ],
        pagination: { total: 1 },
      },
    };
    return HttpResponse.json(data);
  }),
  http.get(`${BASE_URL}api/v1/frames/:id`, ({ params }) => {
    const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? 'unknown';
    const { slot, epoch } = getNow();
    const data: GetFrameResponse = {
      data: {
        frame: {
          data: generateRandomForkChoiceData(),
          metadata: {
            id,
            node: 'ams3-teku-001',
            fetched_at: new Date(
              new Date(spec.genesis_time).getTime() + slot * spec.seconds_per_slot * 1000,
            ).toISOString(),
            wall_clock_slot: slot,
            wall_clock_epoch: epoch,
            labels: [],
            consensus_client: 'teku',
            event_source: 'beacon_node',
          },
        },
      },
    };
    return HttpResponse.json(data);
  }),
];
