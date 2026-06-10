import type { Meta, StoryObj } from '@storybook/tanstack-react';

import AggregatedNode from '@components/AggregatedNode';
import ConcatNode from '@components/ConcatNode';
import Edge from '@components/Edge';
import ProgressCircle from '@components/ProgressCircle';
import SlotBoundary from '@components/SlotBoundary';
import TruncationMarker from '@components/TruncationMarker';
import WeightedNode from '@components/WeightedNode';
import { storyBlockRoots } from '@app/stories/fixtures';
import { withForkyProviders } from '@app/stories/storybook';

/* Always render graph nodes at the radius the real graph uses (see RADIUS in
 * parts/Graph) — node typography is fixed, so smaller discs distort the
 * text-to-circle proportions. */
const RADIUS = 150;

const meta = {
  title: 'Components/Graph Primitives',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withForkyProviders()],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const WeightedNodeStates: Story = {
  render: () => (
    <div className="relative h-[1100px] min-w-[1700px] bg-background">
      <WeightedNode
        hash={storyBlockRoots.slot107}
        weight="910"
        type="canonical"
        validity="valid"
        x={80}
        y={80}
        radius={RADIUS}
      />
      <WeightedNode
        hash={storyBlockRoots.slot106}
        weight="910"
        type="canonical"
        validity="optimistic"
        x={480}
        y={80}
        radius={RADIUS}
      />
      <WeightedNode
        hash={storyBlockRoots.fork105}
        weight="430"
        type="fork"
        validity="valid"
        weightPercentageComparedToHeaviestNeighbor={45}
        x={880}
        y={80}
        radius={RADIUS}
      />
      <WeightedNode
        hash={storyBlockRoots.justified}
        weight="970"
        type="justified"
        validity="valid"
        x={1280}
        y={80}
        radius={RADIUS}
      />
      <WeightedNode
        hash={storyBlockRoots.finalized}
        weight="1000"
        type="finalized"
        validity="valid"
        x={80}
        y={540}
        radius={RADIUS}
      />
      <WeightedNode
        hash={storyBlockRoots.orphan106}
        weight="120"
        type="detached"
        validity="valid"
        x={480}
        y={540}
        radius={RADIUS}
      />
      <WeightedNode
        hash={storyBlockRoots.fork106}
        weight="350"
        type="fork"
        validity="invalid"
        weightPercentageComparedToHeaviestNeighbor={38}
        x={880}
        y={540}
        radius={RADIUS}
      />
      <WeightedNode
        hash={storyBlockRoots.missingParent}
        weight="0"
        type="fork"
        validity="unknown"
        weightPercentageComparedToHeaviestNeighbor={0}
        x={1280}
        y={540}
        radius={RADIUS}
      />
    </div>
  ),
};

export const AggregatedNodeStates: Story = {
  render: () => (
    <div className="relative h-[1100px] min-w-[1700px] bg-background">
      <AggregatedNode
        hash={storyBlockRoots.slot107}
        type="canonical"
        seen={3}
        canonical={2}
        finalizedCheckpoints={0}
        justifiedCheckpoints={0}
        orphans={0}
        valid={3}
        optimistic={0}
        total={3}
        x={80}
        y={80}
        radius={RADIUS}
      />
      <AggregatedNode
        hash={storyBlockRoots.fork107}
        type="fork"
        seen={1}
        canonical={1}
        finalizedCheckpoints={0}
        justifiedCheckpoints={0}
        orphans={0}
        valid={1}
        optimistic={0}
        total={3}
        x={480}
        y={80}
        radius={RADIUS}
      />
      <AggregatedNode
        hash={storyBlockRoots.finalized}
        type="canonical"
        seen={3}
        canonical={3}
        finalizedCheckpoints={3}
        justifiedCheckpoints={0}
        orphans={0}
        valid={3}
        optimistic={0}
        total={3}
        x={880}
        y={80}
        radius={RADIUS}
      />
      <AggregatedNode
        hash={storyBlockRoots.justified}
        type="canonical"
        seen={3}
        canonical={3}
        finalizedCheckpoints={0}
        justifiedCheckpoints={3}
        orphans={0}
        valid={3}
        optimistic={0}
        total={3}
        x={1280}
        y={80}
        radius={RADIUS}
      />
      <AggregatedNode
        hash={storyBlockRoots.slot106}
        type="canonical"
        seen={3}
        canonical={2}
        finalizedCheckpoints={0}
        justifiedCheckpoints={0}
        orphans={0}
        valid={3}
        optimistic={1}
        total={3}
        x={80}
        y={540}
        radius={RADIUS}
      />
      <AggregatedNode
        hash={storyBlockRoots.fork106}
        type="fork"
        seen={2}
        canonical={1}
        finalizedCheckpoints={0}
        justifiedCheckpoints={0}
        orphans={0}
        valid={1}
        optimistic={0}
        total={3}
        x={480}
        y={540}
        radius={RADIUS}
      />
      <AggregatedNode
        hash={storyBlockRoots.orphan106}
        type="fork"
        seen={1}
        canonical={0}
        finalizedCheckpoints={0}
        justifiedCheckpoints={0}
        orphans={1}
        valid={1}
        optimistic={0}
        total={3}
        x={880}
        y={540}
        radius={RADIUS}
      />
    </div>
  ),
};

export const EdgesBoundariesAndProgress: Story = {
  render: () => (
    <div className="relative h-[1180px] min-w-[1700px] overflow-hidden bg-background">
      <SlotBoundary
        slot={104}
        epoch={3}
        x={180}
        y={80}
        width={4}
        height={640}
        textOffset={260}
        className="column-fade"
      />
      <SlotBoundary
        slot={105}
        x={620}
        y={80}
        width={4}
        height={640}
        textOffset={340}
        className="column-fade"
      />
      <Edge x1={230} y1={390} x2={670} y2={230} thickness={8} className="bg-edge" />
      <Edge x1={230} y1={390} x2={670} y2={570} thickness={8} className="bg-edge" />
      <WeightedNode
        hash={storyBlockRoots.slot104}
        weight="960"
        type="canonical"
        validity="valid"
        x={80}
        y={240}
        radius={RADIUS}
      />
      <WeightedNode
        hash={storyBlockRoots.slot105}
        weight="950"
        type="canonical"
        validity="valid"
        x={520}
        y={80}
        radius={RADIUS}
      />
      <WeightedNode
        hash={storyBlockRoots.fork105}
        weight="430"
        type="fork"
        validity="valid"
        x={520}
        y={420}
        radius={RADIUS}
        weightPercentageComparedToHeaviestNeighbor={45}
      />
      <ConcatNode
        id="concat-example"
        slotStart={100}
        slotEnd={107}
        x={1000}
        y={180}
        radius={RADIUS}
      />
      <TruncationMarker x={120} y={800} radius={RADIUS} slots={1869} />
      <div className="absolute left-[1020px] top-[560px] flex gap-8 text-foreground">
        <ProgressCircle
          progress={0}
          radius={48}
          color="text-canonical-ring"
          backgroundColor="text-canonical-deep"
        />
        <ProgressCircle
          progress={45}
          radius={48}
          color="text-fork-ring"
          backgroundColor="text-fork-deep"
        />
        <ProgressCircle
          progress={100}
          radius={48}
          color="text-finalized-ring"
          backgroundColor="text-finalized-deep"
        />
      </div>
    </div>
  ),
};
