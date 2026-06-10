import type { Meta, StoryObj } from '@storybook/tanstack-react';
import { expect, userEvent, within } from 'storybook/test';

import type { ForkChoice, ForkChoiceNode, Frame, FrameMetadata } from '@api';
import type { ProcessedData } from '@app/types/graph';
import Graph from '@parts/Graph';
import { storySpec } from '@app/stories/fixtures';
import { withForkyProviders } from '@app/stories/storybook';
import { processForkChoiceData } from '@utils/graph';

const graphNodes = [
  { node: 'ams3-teku-001', consensusClient: 'teku', region: 'ams3' },
  { node: 'syd1-lighthouse-001', consensusClient: 'lighthouse', region: 'syd1' },
  { node: 'sfo2-prysm-001', consensusClient: 'prysm', region: 'sfo2' },
];

const graphGenesisTime = new Date(storySpec.genesis_time).getTime();

function blockRoot(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return `0x${hash.toString(16).padStart(64, '0')}`;
}

function fetchedAt(slot: number, nodeIndex: number): string {
  return new Date(
    graphGenesisTime + slot * storySpec.seconds_per_slot * 1000 + (nodeIndex + 1) * 1_000,
  ).toISOString();
}

interface GraphNodeSpec {
  key: string;
  slot: number;
  parent?: string;
  weight: number;
  validity?: ForkChoiceNode['validity'];
  graffiti?: string;
}

function forkChoiceNode({
  key,
  slot,
  parent,
  weight,
  validity = 'valid',
  graffiti,
}: GraphNodeSpec): ForkChoiceNode {
  return {
    slot: slot.toString(),
    block_root: blockRoot(key),
    parent_root: blockRoot(parent ?? 'genesis'),
    justified_epoch: '3',
    finalized_epoch: '3',
    weight: weight.toString(),
    validity,
    execution_block_hash: blockRoot(`execution-${key}-${weight}`),
    extra_data: {
      graffiti: graffiti ?? key,
      proposer_boost_root: blockRoot(key),
      unrealized_justified_root: blockRoot('canonical-103'),
      unrealized_finalized_root: blockRoot('canonical-100'),
    },
  };
}

function forkChoice(nodes: GraphNodeSpec[]): ForkChoice {
  return {
    finalized_checkpoint: { epoch: '3', root: blockRoot('canonical-100') },
    justified_checkpoint: { epoch: '3', root: blockRoot('canonical-103') },
    fork_choice_nodes: nodes.map(forkChoiceNode),
  };
}

function frameMetadata({
  frameId,
  nodeIndex,
  slot,
  scenario,
}: {
  frameId: string;
  nodeIndex: number;
  slot: number;
  scenario: string;
}): FrameMetadata {
  const source = graphNodes[nodeIndex];
  return {
    id: frameId,
    node: source.node,
    fetched_at: fetchedAt(slot, nodeIndex),
    wall_clock_slot: slot,
    wall_clock_epoch: Math.floor(slot / storySpec.slots_per_epoch),
    labels: [`region=${source.region}`, `story_graph_scenario=${scenario}`],
    consensus_client: source.consensusClient,
    event_source: 'beacon_node',
  };
}

function processedFrame({
  scenario,
  frameId,
  nodeIndex,
  nodes,
}: {
  scenario: string;
  frameId: string;
  nodeIndex: number;
  nodes: GraphNodeSpec[];
}): ProcessedData {
  const maxSlot = Math.max(...nodes.map(({ slot }) => slot));
  const frame: Required<Frame> = {
    metadata: frameMetadata({ frameId, nodeIndex, slot: maxSlot, scenario }),
    data: forkChoice(nodes),
  };
  return processForkChoiceData(frame);
}

function adjustWeights(nodes: GraphNodeSpec[], nodeIndex: number): GraphNodeSpec[] {
  const multiplier = [1, 0.94, 0.88][nodeIndex] ?? 1;
  return nodes.map(node => ({
    ...node,
    weight: Math.max(1, Math.round(node.weight * multiplier)),
  }));
}

function scenarioFrames(scenario: string, nodes: GraphNodeSpec[], count = graphNodes.length) {
  return Array.from({ length: count }, (_, nodeIndex) =>
    processedFrame({
      scenario,
      frameId: `${scenario}-${nodeIndex + 1}`,
      nodeIndex,
      nodes: adjustWeights(nodes, nodeIndex),
    }),
  );
}

function idsFor(data: ProcessedData[]): string[] {
  return data.map(({ frame }) => frame.metadata.id);
}

function single(data: ProcessedData[]): ProcessedData[] {
  return [data[0]];
}

const graphScenarios = {
  happyPath: scenarioFrames('happy-path', [
    { key: 'canonical-100', slot: 100, weight: 1_000, graffiti: 'finalized checkpoint' },
    { key: 'canonical-101', slot: 101, parent: 'canonical-100', weight: 980 },
    { key: 'canonical-102', slot: 102, parent: 'canonical-101', weight: 960 },
    { key: 'canonical-103', slot: 103, parent: 'canonical-102', weight: 940 },
    { key: 'canonical-104', slot: 104, parent: 'canonical-103', weight: 920 },
    { key: 'canonical-105', slot: 105, parent: 'canonical-104', weight: 900 },
    { key: 'canonical-106', slot: 106, parent: 'canonical-105', weight: 880 },
    { key: 'canonical-107', slot: 107, parent: 'canonical-106', weight: 860 },
    { key: 'canonical-108', slot: 108, parent: 'canonical-107', weight: 840 },
  ]),
  missedSlots: scenarioFrames('missed-slots', [
    { key: 'canonical-100', slot: 100, weight: 1_000 },
    { key: 'canonical-101', slot: 101, parent: 'canonical-100', weight: 980 },
    { key: 'canonical-103', slot: 103, parent: 'canonical-101', weight: 950 },
    { key: 'canonical-106', slot: 106, parent: 'canonical-103', weight: 920 },
    { key: 'canonical-107', slot: 107, parent: 'canonical-106', weight: 900 },
    { key: 'canonical-110', slot: 110, parent: 'canonical-107', weight: 870 },
  ]),
  previousForkContinued: scenarioFrames('previous-fork-continued', [
    { key: 'canonical-100', slot: 100, weight: 1_000 },
    { key: 'canonical-101', slot: 101, parent: 'canonical-100', weight: 980 },
    { key: 'canonical-102', slot: 102, parent: 'canonical-101', weight: 960 },
    { key: 'short-fork-103', slot: 103, parent: 'canonical-102', weight: 360 },
    { key: 'canonical-104', slot: 104, parent: 'canonical-102', weight: 930 },
    { key: 'canonical-105', slot: 105, parent: 'canonical-104', weight: 910 },
    { key: 'canonical-106', slot: 106, parent: 'canonical-105', weight: 890 },
    { key: 'canonical-107', slot: 107, parent: 'canonical-106', weight: 870 },
  ]),
  headForkLowerWeight: scenarioFrames('head-fork-lower-weight', [
    { key: 'canonical-100', slot: 100, weight: 1_000 },
    { key: 'canonical-101', slot: 101, parent: 'canonical-100', weight: 980 },
    { key: 'canonical-102', slot: 102, parent: 'canonical-101', weight: 960 },
    { key: 'canonical-103', slot: 103, parent: 'canonical-102', weight: 940 },
    { key: 'canonical-104', slot: 104, parent: 'canonical-103', weight: 920 },
    { key: 'canonical-106', slot: 106, parent: 'canonical-104', weight: 900 },
    { key: 'canonical-107', slot: 107, parent: 'canonical-106', weight: 870 },
    {
      key: 'head-fork-109',
      slot: 109,
      parent: 'canonical-106',
      weight: 260,
      graffiti: 'head fork with lower weight',
    },
  ]),
  multiForks: scenarioFrames('multi-forks', [
    { key: 'canonical-100', slot: 100, weight: 1_000 },
    { key: 'canonical-101', slot: 101, parent: 'canonical-100', weight: 980 },
    { key: 'canonical-102', slot: 102, parent: 'canonical-101', weight: 960 },
    { key: 'fork-103', slot: 103, parent: 'canonical-101', weight: 390 },
    { key: 'canonical-104', slot: 104, parent: 'canonical-102', weight: 930 },
    { key: 'fork-105', slot: 105, parent: 'canonical-104', weight: 430 },
    { key: 'canonical-106', slot: 106, parent: 'canonical-104', weight: 900 },
    { key: 'canonical-108', slot: 108, parent: 'canonical-106', weight: 870 },
    { key: 'fork-109', slot: 109, parent: 'canonical-106', weight: 350 },
    { key: 'canonical-110', slot: 110, parent: 'canonical-108', weight: 840 },
  ]),
  chaosForks: scenarioFrames('chaos-forks', [
    { key: 'canonical-100', slot: 100, weight: 1_000 },
    { key: 'early-fork-101', slot: 101, parent: 'canonical-100', weight: 280 },
    { key: 'canonical-102', slot: 102, parent: 'canonical-100', weight: 960 },
    { key: 'canonical-103', slot: 103, parent: 'canonical-102', weight: 940 },
    { key: 'canonical-104', slot: 104, parent: 'canonical-103', weight: 920 },
    { key: 'side-fork-105', slot: 105, parent: 'canonical-102', weight: 470 },
    {
      key: 'invalid-fork-106',
      slot: 106,
      parent: 'canonical-104',
      weight: 120,
      validity: 'invalid',
      graffiti: 'invalid payload branch',
    },
    { key: 'canonical-107', slot: 107, parent: 'canonical-104', weight: 890 },
    {
      key: 'optimistic-fork-109',
      slot: 109,
      parent: 'side-fork-105',
      weight: 430,
      validity: 'optimistic',
      graffiti: 'optimistic side branch',
    },
    {
      key: 'detached-110',
      slot: 110,
      parent: 'unknown-parent',
      weight: 80,
      graffiti: 'missing parent',
    },
    { key: 'canonical-111', slot: 111, parent: 'canonical-107', weight: 850 },
    { key: 'late-fork-112', slot: 112, parent: 'canonical-107', weight: 310 },
  ]),
  rareSameSlot: scenarioFrames('rare-same-slot-siblings', [
    { key: 'canonical-100', slot: 100, weight: 1_000 },
    { key: 'canonical-101', slot: 101, parent: 'canonical-100', weight: 980 },
    { key: 'canonical-102', slot: 102, parent: 'canonical-101', weight: 960 },
    { key: 'canonical-103', slot: 103, parent: 'canonical-102', weight: 930 },
    {
      key: 'same-slot-fork-103',
      slot: 103,
      parent: 'canonical-102',
      weight: 390,
      graffiti: 'rare same-slot sibling',
    },
    { key: 'canonical-104', slot: 104, parent: 'canonical-103', weight: 910 },
    { key: 'canonical-105', slot: 105, parent: 'canonical-104', weight: 890 },
  ]),
  // Spans far more than MAX_GRAPH_SLOTS (128): the tail is truncated and the
  // finalized (slot 100) + justified (slot 103) checkpoints are pinned into
  // compact columns left of the window, bridged by "slots hidden" markers.
  longTail: scenarioFrames('long-tail', [
    { key: 'canonical-100', slot: 100, weight: 1_000, graffiti: 'finalized checkpoint' },
    { key: 'canonical-103', slot: 103, parent: 'canonical-100', weight: 990 },
    ...Array.from({ length: 16 }, (_, i) => ({
      key: `canonical-${273 + i * 8}`,
      slot: 273 + i * 8,
      parent: i === 0 ? 'canonical-103' : `canonical-${273 + (i - 1) * 8}`,
      weight: 980 - i * 8,
    })),
    { key: 'fork-396', slot: 396, parent: 'canonical-393', weight: 310 },
    { key: 'canonical-400', slot: 400, parent: 'canonical-393', weight: 850 },
  ]),
};

// A stuck/syncing source: its fork-choice head (slot 104) sits ~1.1k slots
// behind its own wall clock. Stage partitions frames like this out of the
// aggregation; the Sources panel lists them struck through with their lag.
const stuckNodeFrame: ProcessedData = processForkChoiceData({
  metadata: {
    id: 'stuck-node-1',
    node: 'fra1-nimbus-001',
    fetched_at: fetchedAt(1208, 0),
    wall_clock_slot: 1208,
    wall_clock_epoch: Math.floor(1208 / storySpec.slots_per_epoch),
    labels: ['region=fra1', 'story_graph_scenario=stuck-node'],
    consensus_client: 'nimbus',
    event_source: 'beacon_node',
  },
  data: forkChoice([
    { key: 'canonical-100', slot: 100, weight: 1_000 },
    { key: 'canonical-101', slot: 101, parent: 'canonical-100', weight: 980 },
    { key: 'canonical-103', slot: 103, parent: 'canonical-101', weight: 960 },
    { key: 'canonical-104', slot: 104, parent: 'canonical-103', weight: 940 },
  ]),
});

const meta = {
  title: 'Parts/Graph',
  component: Graph,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withForkyProviders()],
  render: args => (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <Graph {...args} />
    </div>
  ),
} satisfies Meta<typeof Graph>;

export default meta;

type Story = StoryObj<typeof meta>;

function singleNodeStory(data: ProcessedData[], unique: string): Story {
  return {
    parameters: {
      tanstack: {
        router: {
          path: '/node/$',
          params: { _splat: data[0].frame.metadata.node },
        },
      },
    },
    args: {
      data: single(data),
      ids: [data[0].frame.metadata.id],
      unique: `single-${unique}`,
    },
  };
}

function aggregatedStory(data: ProcessedData[], unique: string): Story {
  return {
    parameters: {
      tanstack: {
        router: {
          path: '/',
        },
      },
    },
    args: {
      data,
      ids: idsFor(data),
      unique: `aggregated-${unique}`,
    },
  };
}

export const Empty: Story = {
  parameters: {
    tanstack: {
      router: {
        path: '/',
      },
    },
  },
  args: {
    data: [],
    ids: [],
    unique: 'empty',
  },
};

export const SingleNodeHappyPathAllSlots = singleNodeStory(graphScenarios.happyPath, 'happy-path');
export const AggregatedHappyPathAllSlots = aggregatedStory(graphScenarios.happyPath, 'happy-path');

export const SingleNodeHappyPathMissedSlots = singleNodeStory(
  graphScenarios.missedSlots,
  'missed-slots',
);
export const AggregatedHappyPathMissedSlots = aggregatedStory(
  graphScenarios.missedSlots,
  'missed-slots',
);

export const SingleNodePreviousForkContinued = singleNodeStory(
  graphScenarios.previousForkContinued,
  'previous-fork-continued',
);
export const AggregatedPreviousForkContinued = aggregatedStory(
  graphScenarios.previousForkContinued,
  'previous-fork-continued',
);

export const SingleNodeHeadForkLowerWeight = singleNodeStory(
  graphScenarios.headForkLowerWeight,
  'head-fork-lower-weight',
);
export const AggregatedHeadForkLowerWeight = aggregatedStory(
  graphScenarios.headForkLowerWeight,
  'head-fork-lower-weight',
);

export const SingleNodeMultiForks = singleNodeStory(graphScenarios.multiForks, 'multi-forks');
export const AggregatedMultiForks = aggregatedStory(graphScenarios.multiForks, 'multi-forks');

export const SingleNodeChaosForks = singleNodeStory(graphScenarios.chaosForks, 'chaos-forks');
export const AggregatedChaosForks = aggregatedStory(graphScenarios.chaosForks, 'chaos-forks');

export const SingleNodeRareSameSlotSiblings = singleNodeStory(
  graphScenarios.rareSameSlot,
  'rare-same-slot-siblings',
);
export const AggregatedRareSameSlotSiblings = aggregatedStory(
  graphScenarios.rareSameSlot,
  'rare-same-slot-siblings',
);

export const AggregatedSummaryCollapsed: Story = {
  ...aggregatedStory(graphScenarios.happyPath, 'summary-collapsed'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sources' }));
    await expect(canvas.getByRole('button', { name: 'Show sources' })).toBeVisible();
  },
};

export const SingleNodeTruncatedLongTail: Story = {
  ...singleNodeStory(graphScenarios.longTail, 'truncated-long-tail'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // finalized→justified gap (3 slots) and justified→window gap (169 slots)
    await expect(canvas.getAllByText(/slots\s+hidden/i)).toHaveLength(2);
    await expect(canvas.getByText('169')).toBeVisible();
  },
};

export const AggregatedTruncatedLongTail: Story = {
  ...aggregatedStory(graphScenarios.longTail, 'truncated-long-tail'),
};

export const AggregatedWithStuckNode: Story = {
  ...aggregatedStory(graphScenarios.happyPath, 'stuck-node'),
  args: {
    ...aggregatedStory(graphScenarios.happyPath, 'stuck-node').args,
    behind: [stuckNodeFrame],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('1104 slots behind')).toBeVisible();
    await expect(canvas.getByText('fra1-nimbus-001')).toBeVisible();
  },
};
