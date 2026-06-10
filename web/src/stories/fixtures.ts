import { http, HttpResponse, delay } from 'msw';

import type {
  EthereumNow,
  Frame,
  FrameFilter,
  FrameMetadata,
  ForkChoice,
  ForkChoiceNode,
  GetEthereumNowResponse,
  GetEthereumSpecResponse,
  GetFrameResponse,
  ListMetadataNodesResponse,
  ListMetadataResponse,
  MetadataQuery,
} from '@api';
import type { ProcessedData } from '@app/types/graph';
import { processForkChoiceData } from '@utils/graph';

export const storyNetworkName = 'hoodi-story';

export const storySpec = {
  seconds_per_slot: 12,
  slots_per_epoch: 32,
  genesis_time: '2024-01-01T00:00:00.000Z',
};

export const storyNow: EthereumNow = {
  slot: 113,
  epoch: 3,
};

const baseGenesis = new Date(storySpec.genesis_time).getTime();
const storyNodes = ['ams3-teku-001', 'syd1-lighthouse-001', 'sfo2-prysm-001'];

function root(value: number): string {
  return `0x${value.toString(16).padStart(64, '0')}`;
}

function atSlot(slot: number, offsetMs = 0): string {
  return new Date(baseGenesis + slot * storySpec.seconds_per_slot * 1000 + offsetMs).toISOString();
}

function forkChoiceNode({
  slot,
  blockRoot,
  parentRoot,
  weight,
  validity = 'valid',
  graffiti,
}: {
  slot: number;
  blockRoot: string;
  parentRoot: string;
  weight: number;
  validity?: ForkChoiceNode['validity'];
  graffiti?: string;
}): ForkChoiceNode {
  return {
    slot: slot.toString(),
    block_root: blockRoot,
    parent_root: parentRoot,
    justified_epoch: '3',
    finalized_epoch: '3',
    weight: weight.toString(),
    validity,
    execution_block_hash: root(10_000 + slot + weight),
    extra_data: {
      graffiti: graffiti ?? `story-slot-${slot}`,
      proposer_boost_root: blockRoot,
      unrealized_justified_root: root(103),
      unrealized_finalized_root: root(100),
    },
  };
}

const roots = {
  genesis: root(99),
  finalized: root(100),
  slot101: root(101),
  slot102: root(102),
  justified: root(103),
  slot104: root(104),
  slot105: root(105),
  slot106: root(106),
  slot107: root(107),
  fork105: root(205),
  fork106: root(206),
  fork107: root(207),
  orphan106: root(306),
  missingParent: root(50),
};

export const storyBlockRoots = roots;

function forkChoiceAlpha(): ForkChoice {
  return {
    finalized_checkpoint: { epoch: '3', root: roots.finalized },
    justified_checkpoint: { epoch: '3', root: roots.justified },
    fork_choice_nodes: [
      forkChoiceNode({
        slot: 100,
        blockRoot: roots.finalized,
        parentRoot: roots.genesis,
        weight: 1_000,
        graffiti: 'finalized checkpoint',
      }),
      forkChoiceNode({
        slot: 101,
        blockRoot: roots.slot101,
        parentRoot: roots.finalized,
        weight: 990,
      }),
      forkChoiceNode({
        slot: 102,
        blockRoot: roots.slot102,
        parentRoot: roots.slot101,
        weight: 980,
      }),
      forkChoiceNode({
        slot: 103,
        blockRoot: roots.justified,
        parentRoot: roots.slot102,
        weight: 970,
        validity: 'optimistic',
        graffiti: 'justified optimistic checkpoint',
      }),
      forkChoiceNode({
        slot: 104,
        blockRoot: roots.slot104,
        parentRoot: roots.justified,
        weight: 960,
      }),
      forkChoiceNode({
        slot: 105,
        blockRoot: roots.slot105,
        parentRoot: roots.slot104,
        weight: 950,
      }),
      forkChoiceNode({
        slot: 106,
        blockRoot: roots.slot106,
        parentRoot: roots.slot105,
        weight: 930,
      }),
      forkChoiceNode({
        slot: 107,
        blockRoot: roots.slot107,
        parentRoot: roots.slot106,
        weight: 910,
      }),
      forkChoiceNode({
        slot: 108,
        blockRoot: roots.fork105,
        parentRoot: roots.slot105,
        weight: 430,
      }),
      forkChoiceNode({
        slot: 109,
        blockRoot: roots.fork106,
        parentRoot: roots.fork105,
        weight: 350,
        validity: 'invalid',
        graffiti: 'invalid fork branch',
      }),
    ],
  };
}

function forkChoiceBeta(): ForkChoice {
  return {
    finalized_checkpoint: { epoch: '3', root: roots.finalized },
    justified_checkpoint: { epoch: '3', root: roots.justified },
    fork_choice_nodes: [
      forkChoiceNode({
        slot: 100,
        blockRoot: roots.finalized,
        parentRoot: roots.genesis,
        weight: 1_050,
      }),
      forkChoiceNode({
        slot: 101,
        blockRoot: roots.slot101,
        parentRoot: roots.finalized,
        weight: 1_030,
      }),
      forkChoiceNode({
        slot: 102,
        blockRoot: roots.slot102,
        parentRoot: roots.slot101,
        weight: 1_010,
      }),
      forkChoiceNode({
        slot: 103,
        blockRoot: roots.justified,
        parentRoot: roots.slot102,
        weight: 1_000,
      }),
      forkChoiceNode({
        slot: 104,
        blockRoot: roots.slot104,
        parentRoot: roots.justified,
        weight: 990,
      }),
      forkChoiceNode({
        slot: 105,
        blockRoot: roots.slot105,
        parentRoot: roots.slot104,
        weight: 520,
      }),
      forkChoiceNode({
        slot: 106,
        blockRoot: roots.slot106,
        parentRoot: roots.slot105,
        weight: 510,
        graffiti: 'abandoned head before reorg',
      }),
      forkChoiceNode({
        slot: 107,
        blockRoot: roots.slot107,
        parentRoot: roots.slot106,
        weight: 500,
      }),
      forkChoiceNode({
        slot: 108,
        blockRoot: roots.fork105,
        parentRoot: roots.slot105,
        weight: 980,
        graffiti: 'heavier fork after reorg',
      }),
      forkChoiceNode({
        slot: 109,
        blockRoot: roots.fork106,
        parentRoot: roots.fork105,
        weight: 960,
      }),
      forkChoiceNode({
        slot: 110,
        blockRoot: roots.fork107,
        parentRoot: roots.fork106,
        weight: 940,
      }),
    ],
  };
}

function forkChoiceGamma(): ForkChoice {
  return {
    finalized_checkpoint: { epoch: '3', root: roots.finalized },
    justified_checkpoint: { epoch: '3', root: roots.justified },
    fork_choice_nodes: [
      forkChoiceNode({
        slot: 100,
        blockRoot: roots.finalized,
        parentRoot: roots.genesis,
        weight: 990,
      }),
      forkChoiceNode({
        slot: 101,
        blockRoot: roots.slot101,
        parentRoot: roots.finalized,
        weight: 980,
      }),
      forkChoiceNode({
        slot: 102,
        blockRoot: roots.slot102,
        parentRoot: roots.slot101,
        weight: 970,
      }),
      forkChoiceNode({
        slot: 103,
        blockRoot: roots.justified,
        parentRoot: roots.slot102,
        weight: 960,
      }),
      forkChoiceNode({
        slot: 104,
        blockRoot: roots.slot104,
        parentRoot: roots.justified,
        weight: 950,
      }),
      forkChoiceNode({
        slot: 105,
        blockRoot: roots.slot105,
        parentRoot: roots.slot104,
        weight: 930,
      }),
      forkChoiceNode({
        slot: 106,
        blockRoot: roots.slot106,
        parentRoot: roots.slot105,
        weight: 910,
        validity: 'optimistic',
      }),
      forkChoiceNode({
        slot: 107,
        blockRoot: roots.slot107,
        parentRoot: roots.slot106,
        weight: 890,
      }),
      forkChoiceNode({
        slot: 108,
        blockRoot: roots.fork105,
        parentRoot: roots.slot105,
        weight: 410,
      }),
    ],
  };
}

function frameMetadata({
  id,
  node,
  fetchedAt,
  labels = [],
  consensusClient = 'teku',
  eventSource = 'beacon_node',
}: {
  id: string;
  node: string;
  fetchedAt: string;
  labels?: string[];
  consensusClient?: string;
  eventSource?: string;
}): FrameMetadata {
  const slot = Math.floor(
    (new Date(fetchedAt).getTime() - baseGenesis) / 1000 / storySpec.seconds_per_slot,
  );

  return {
    id,
    node,
    fetched_at: fetchedAt,
    wall_clock_slot: slot,
    wall_clock_epoch: Math.floor(slot / storySpec.slots_per_epoch),
    labels,
    consensus_client: consensusClient,
    event_source: eventSource,
  };
}

function frame(metadata: FrameMetadata, data: ForkChoice): Required<Frame> {
  return { metadata, data };
}

export const storyFrames = {
  alpha: frame(
    frameMetadata({
      id: 'frame-alpha',
      node: storyNodes[0],
      fetchedAt: atSlot(110, 1_000),
      labels: ['region=ams3', 'consensus_client_version=v24.12.0'],
      consensusClient: 'teku',
    }),
    forkChoiceAlpha(),
  ),
  beta: frame(
    frameMetadata({
      id: 'frame-beta',
      node: storyNodes[1],
      fetchedAt: atSlot(110, 4_000),
      labels: ['region=syd1', 'consensus_client_version=v5.3.0'],
      consensusClient: 'lighthouse',
    }),
    forkChoiceBeta(),
  ),
  gamma: frame(
    frameMetadata({
      id: 'frame-gamma',
      node: storyNodes[2],
      fetchedAt: atSlot(110, 7_000),
      labels: ['region=sfo2', 'consensus_client_version=v5.1.2'],
      consensusClient: 'prysm',
    }),
    forkChoiceGamma(),
  ),
};

const eventBeforeMetadata = frameMetadata({
  id: 'event-before-reorg-1',
  node: storyNodes[0],
  fetchedAt: atSlot(106, 3_000),
  consensusClient: 'teku',
  eventSource: 'xatu_reorg_event',
  labels: [
    'xatu_event_id=reorg-1',
    'xatu_reorg_frame_timing=before',
    'xatu_reorg_event_slot=106',
    'xatu_reorg_event_epoch=3',
    `xatu_reorg_event_old_head_block=${roots.slot107}`,
    `xatu_reorg_event_new_head_block=${roots.fork107}`,
    'xatu_reorg_event_depth=3',
    'consensus_client_implementation=teku',
  ],
});

const eventAfterMetadata = frameMetadata({
  id: 'event-after-reorg-1',
  node: storyNodes[0],
  fetchedAt: atSlot(106, 6_000),
  consensusClient: 'teku',
  eventSource: 'xatu_reorg_event',
  labels: [
    'xatu_event_id=reorg-1',
    'xatu_reorg_frame_timing=after',
    'xatu_reorg_event_slot=106',
    'xatu_reorg_event_epoch=3',
    `xatu_reorg_event_old_head_block=${roots.slot107}`,
    `xatu_reorg_event_new_head_block=${roots.fork107}`,
    'xatu_reorg_event_depth=3',
    'consensus_client_implementation=teku',
  ],
});

const singleEventMetadata = frameMetadata({
  id: 'event-single-invalid',
  node: storyNodes[2],
  fetchedAt: atSlot(104, 4_000),
  consensusClient: 'prysm',
  eventSource: 'xatu_reorg_event',
  labels: [
    'xatu_event_id=invalid-1',
    'xatu_reorg_event_slot=104',
    'xatu_reorg_event_epoch=3',
    'xatu_reorg_event_depth=1',
    'consensus_client_implementation=prysm',
  ],
});

const storyEventFrames = [
  frame(eventBeforeMetadata, forkChoiceAlpha()),
  frame(eventAfterMetadata, forkChoiceBeta()),
  frame(singleEventMetadata, forkChoiceGamma()),
];

export const storyFrameList: Required<Frame>[] = Object.values(storyFrames);
export const storyAllFrames: Required<Frame>[] = [...storyFrameList, ...storyEventFrames];
export const storyFrameIds = storyFrameList.map(({ metadata }) => metadata.id);
export const storyEventMetadata = storyEventFrames.map(({ metadata }) => metadata);
export const storyAllMetadata = storyAllFrames.map(({ metadata }) => metadata);

export function cloneFrame(frameToClone: Required<Frame>): Required<Frame> {
  return JSON.parse(JSON.stringify(frameToClone)) as Required<Frame>;
}

export function getStoryFrame(id: string): Required<Frame> | undefined {
  const found = storyAllFrames.find(({ metadata }) => metadata.id === id);
  return found ? cloneFrame(found) : undefined;
}

export function getProcessedStoryFrame(id: string): ProcessedData {
  const found = getStoryFrame(id);
  if (!found) {
    throw new Error(`Unknown story frame: ${id}`);
  }
  return processForkChoiceData(found);
}

export function getProcessedStoryFrames(ids = storyFrameIds): ProcessedData[] {
  return ids.map(getProcessedStoryFrame);
}

function filterMetadata(metadata: FrameMetadata[], filter?: FrameFilter): FrameMetadata[] {
  if (!filter) return metadata;

  return metadata.filter(item => {
    if (filter.node && item.node !== filter.node) return false;
    if (filter.slot !== undefined && item.wall_clock_slot !== filter.slot) return false;
    if (filter.epoch !== undefined && item.wall_clock_epoch !== filter.epoch) return false;
    if (filter.consensus_client && item.consensus_client !== filter.consensus_client) return false;
    if (filter.event_source && item.event_source !== filter.event_source) return false;
    if (filter.after && new Date(item.fetched_at).getTime() < new Date(filter.after).getTime()) {
      return false;
    }
    if (filter.before && new Date(item.fetched_at).getTime() > new Date(filter.before).getTime()) {
      return false;
    }
    if (filter.labels?.length && !filter.labels.every(label => item.labels.includes(label))) {
      return false;
    }
    return true;
  });
}

function paginateMetadata(metadata: FrameMetadata[], pagination?: MetadataQuery['pagination']) {
  const offset = pagination?.offset ?? 0;
  const limit = pagination?.limit ?? metadata.length;
  return metadata.slice(offset, offset + limit);
}

export function storyApiHandlers({
  metadata = storyAllMetadata,
  frames = storyAllFrames,
  metadataDelay = 0,
  frameDelay = 0,
  specDelay = 0,
  nowDelay = 0,
  specError = false,
  nowError = false,
  metadataError = false,
  frameError = false,
}: {
  metadata?: FrameMetadata[];
  frames?: Required<Frame>[];
  metadataDelay?: number;
  frameDelay?: number;
  specDelay?: number;
  nowDelay?: number;
  specError?: boolean;
  nowError?: boolean;
  metadataError?: boolean;
  frameError?: boolean;
} = {}) {
  return [
    http.get('*/api/v1/ethereum/spec', async () => {
      if (specDelay) await delay(specDelay);
      if (specError) {
        return HttpResponse.json({ code: 500, message: 'Story spec failure' }, { status: 500 });
      }
      return HttpResponse.json({
        data: { network_name: storyNetworkName, spec: storySpec },
      } satisfies GetEthereumSpecResponse);
    }),
    http.get('*/api/v1/ethereum/now', async () => {
      if (nowDelay) await delay(nowDelay);
      if (nowError) {
        return HttpResponse.json({ code: 500, message: 'Story now failure' }, { status: 500 });
      }
      return HttpResponse.json({ data: storyNow } satisfies GetEthereumNowResponse);
    }),
    http.post('*/api/v1/metadata/nodes', async ({ request }) => {
      if (metadataError) {
        return HttpResponse.json({ code: 500, message: 'Story nodes failure' }, { status: 500 });
      }
      if (metadataDelay) await delay(metadataDelay);
      const body = (await request.json().catch(() => ({}))) as MetadataQuery;
      const filtered = filterMetadata(metadata, body.filter);
      const nodes = [...new Set(filtered.map(({ node }) => node))].sort();
      return HttpResponse.json({
        data: {
          nodes,
          pagination: { total: nodes.length },
        },
      } satisfies ListMetadataNodesResponse);
    }),
    http.post('*/api/v1/metadata', async ({ request }) => {
      if (metadataError) {
        return HttpResponse.json({ code: 500, message: 'Story metadata failure' }, { status: 500 });
      }
      if (metadataDelay) await delay(metadataDelay);
      const body = (await request.json().catch(() => ({}))) as MetadataQuery;
      const filtered = filterMetadata(metadata, body.filter).sort(
        (a, b) => new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime(),
      );
      const paginated = paginateMetadata(filtered, body.pagination);

      return HttpResponse.json({
        data: {
          frames: paginated,
          pagination: { total: filtered.length },
        },
      } satisfies ListMetadataResponse);
    }),
    http.get('*/api/v1/frames/:id', async ({ params }) => {
      if (frameError) {
        return HttpResponse.json({ code: 500, message: 'Story frame failure' }, { status: 500 });
      }
      if (frameDelay) await delay(frameDelay);
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      const found = frames.find(({ metadata: { id: frameId } }) => frameId === id);
      if (!found) {
        return HttpResponse.json({ code: 404, message: 'Frame not found' }, { status: 404 });
      }

      return HttpResponse.json({
        data: {
          frame: cloneFrame(found),
        },
      } satisfies GetFrameResponse);
    }),
  ];
}
