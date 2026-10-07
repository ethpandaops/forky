import { BlockPayload, PayloadStage } from '@app/types/graph';

export type { PayloadStage };

// Payload Timeliness Committee size and the number of "payload present" votes
// a payload needs to be considered timely (mainnet preset, used by Sepolia,
// Hoodi and the devnets).
export const PTC_SIZE = 512;
export const PAYLOAD_TIMELY_THRESHOLD = PTC_SIZE / 2;

/* Where a Gloas block's execution payload stands, from block arrival to the
 * fork choice deciding between the block's empty and full nodes:
 *   awaiting  - the node has not received the payload yet (no full node)
 *   voting    - payload received, the PTC is still voting on its timeliness
 *   timely    - the PTC voted the payload timely; attesters have not split
 *               the block's weight between empty and full yet
 *   late      - the PTC did not vote the payload timely; ditto
 *   undecided - payload received, empty and full tied, no PTC counts
 *   full      - the full node outweighs the empty node
 *   empty     - the empty node outweighs the full node */
export function payloadStage(payload: BlockPayload): PayloadStage {
  if (payload.status) return payload.status;
  if (payload.fullWeight === undefined) return 'awaiting';
  if (payload.attesterCount === undefined) return 'undecided';
  if (payload.attesterCount < PTC_SIZE) return 'voting';
  return (payload.availabilityYesCount ?? 0) > PAYLOAD_TIMELY_THRESHOLD ? 'timely' : 'late';
}

// Progress (0-100) of a block's payload: PTC votes while the committee is
// voting, the share voting the payload timely once it has.
export function payloadProgress(payload: BlockPayload, stage: PayloadStage): number {
  switch (stage) {
    case 'voting':
      return ((payload.attesterCount ?? 0) / PTC_SIZE) * 100;
    case 'timely':
    case 'late':
      return ((payload.availabilityYesCount ?? 0) / PTC_SIZE) * 100;
    case 'full':
    case 'empty':
      return 100;
    default:
      return 0;
  }
}

// The Tide's levels (percent of the node's height). While a payload is in
// between, the tide rises with its progress up to TIDE_RISE_LEVEL, just below
// the block hash, so the moving surface never crosses the node's label or
// hash. Once full it fills the node to the brim, its surface out of view.
export const TIDE_RISE_LEVEL = 52;
export const TIDE_FULL_LEVEL = 100;

// The Tide's level for a stage and its progress.
export function tideLevel(stage: PayloadStage, progress: number): number {
  switch (stage) {
    case 'full':
      return TIDE_FULL_LEVEL;
    case 'empty':
    case 'awaiting':
      return 0;
    case 'undecided':
      return TIDE_RISE_LEVEL / 2;
    default:
      return (Math.min(Math.max(progress, 0), 100) * TIDE_RISE_LEVEL) / 100;
  }
}

export interface PayloadStageStyle {
  name: string;
  // the label inside the node, where space is tight.
  short: string;
  description: string;
  // decided stages hold the Tide still; in-between ones keep it moving.
  decided: boolean;
  motion: 'still' | 'moving';
  // the liquid's back wave (body) and front wave (crest, whose border draws
  // the surface line), the in-node chip and the legend swatch.
  body: string;
  crest: string;
  chip: string;
  swatch: string;
  // a representative level for the legend.
  sampleLevel: number;
}

// Single source of truth for the payload stages, shared by the graph nodes,
// hover cards and legend.
export const PAYLOAD_STAGES: Record<PayloadStage, PayloadStageStyle> = {
  awaiting: {
    short: 'Awaiting',
    name: 'Awaiting',
    description: 'Payload not received yet',
    decided: false,
    motion: 'still',
    body: '',
    crest: '',
    chip: 'bg-background/70 text-muted',
    swatch: '',
    sampleLevel: 0,
  },
  voting: {
    short: 'PTC',
    name: 'PTC voting',
    description: 'PTC votes coming in',
    decided: false,
    motion: 'moving',
    body: 'bg-payload/15',
    crest: 'bg-payload/20 border-4 border-payload-surface/80',
    chip: 'bg-background/70 text-payload',
    swatch: 'bg-payload/60',
    sampleLevel: 50,
  },
  timely: {
    short: 'Timely',
    name: 'Timely',
    description: 'PTC: timely; awaiting attesters',
    decided: false,
    motion: 'moving',
    body: 'bg-payload/15',
    crest: 'bg-payload/20 border-4 border-payload-surface/80',
    chip: 'bg-background/70 text-payload',
    swatch: 'bg-payload/60',
    sampleLevel: 90,
  },
  late: {
    short: 'Late',
    name: 'Late',
    description: 'PTC: not timely',
    decided: false,
    motion: 'moving',
    body: 'bg-payload/10',
    crest: 'bg-payload/15 border-4 border-payload-surface/50',
    chip: 'bg-background/70 text-payload',
    swatch: 'bg-payload/40',
    sampleLevel: 25,
  },
  undecided: {
    short: 'Tied',
    name: 'Undecided',
    description: 'Empty and full tied',
    decided: false,
    motion: 'still',
    body: 'bg-muted/10',
    crest: 'bg-muted/15 border-4 border-muted/60',
    chip: 'bg-background/70 text-muted',
    swatch: 'bg-muted/50',
    sampleLevel: 50,
  },
  full: {
    short: 'Full',
    name: 'Full',
    description: 'Backed with its payload',
    decided: true,
    motion: 'still',
    body: 'bg-payload/10',
    crest: 'bg-payload/10 border-4 border-payload-surface',
    chip: 'bg-payload text-foreground-inverted',
    swatch: 'bg-payload',
    sampleLevel: 100,
  },
  empty: {
    short: 'Empty',
    name: 'Empty',
    description: 'Backed without its payload',
    decided: true,
    motion: 'still',
    body: '',
    crest: '',
    chip: 'bg-background/70 text-payload ring-2 ring-payload ring-inset',
    swatch: '',
    sampleLevel: 0,
  },
};

// Display order, following a block's lifecycle.
export const PAYLOAD_STAGE_ORDER: PayloadStage[] = [
  'awaiting',
  'voting',
  'timely',
  'late',
  'undecided',
  'full',
  'empty',
];

export interface PayloadSummary {
  stage: PayloadStage;
  // sources reporting the stage, out of the sources reporting payloads.
  count: number;
  reporting: number;
  level: number;
}

// Summarises the payload stages several sources report for one block: the
// stage most sources report (the later lifecycle stage on a tie), with the
// Tide at the mean level of those sources, scaled by how many agree. Only a
// payload every reporting source sees as full fills the node; otherwise the
// tide stays below the hash.
export function summarizePayloads(
  payloads: { stage: PayloadStage; progress: number }[],
): PayloadSummary | undefined {
  if (payloads.length === 0) return undefined;

  const counts = new Map<PayloadStage, number>();
  for (const { stage } of payloads) counts.set(stage, (counts.get(stage) ?? 0) + 1);

  let stage = PAYLOAD_STAGE_ORDER[0];
  let count = 0;
  for (const candidate of PAYLOAD_STAGE_ORDER) {
    const n = counts.get(candidate) ?? 0;
    if (n > 0 && n >= count) {
      stage = candidate;
      count = n;
    }
  }

  const agreeing = payloads.filter(p => p.stage === stage);
  const mean =
    agreeing.reduce((sum, p) => sum + tideLevel(p.stage, p.progress), 0) / agreeing.length;

  const level =
    count === payloads.length ? mean : Math.min((mean * count) / payloads.length, TIDE_RISE_LEVEL);

  return { stage, count, reporting: payloads.length, level };
}
