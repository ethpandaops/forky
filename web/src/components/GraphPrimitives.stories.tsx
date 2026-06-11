import type { Meta, StoryObj } from '@storybook/tanstack-react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import AggregatedNode from '@components/AggregatedNode';
import ConcatNode from '@components/ConcatNode';
import Edge from '@components/Edge';
import { HoverCardPanel } from '@components/HoverCard';
import { AggregatedNodeCard, TruncationCard, WeightedNodeCard } from '@components/NodeCards';
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

/* Hover-card content for every weighted node state, rendered statically in
 * the real card chrome (HoverCardPanel) so each variant is reviewable
 * without pointer choreography. The styleKey/status pairs mirror what
 * WeightedNode derives for the matching disc states above. */
export const WeightedNodeCards: Story = {
  render: () => (
    <div className="flex min-h-screen flex-wrap content-start items-start gap-6 bg-background p-6">
      <HoverCardPanel accent="canonical">
        <WeightedNodeCard
          styleKey="canonical"
          status="VALID"
          blockRoot={storyBlockRoots.slot107}
          parentRoot={storyBlockRoots.slot106}
          slot={107}
          epoch={3}
          validity="valid"
          weight="910"
          weightPercentage={100}
        />
      </HoverCardPanel>
      <HoverCardPanel accent="optimistic">
        <WeightedNodeCard
          styleKey="optimistic"
          status="OPTIMISTIC"
          blockRoot={storyBlockRoots.slot106}
          parentRoot={storyBlockRoots.slot105}
          slot={106}
          epoch={3}
          validity="optimistic"
          weight="910"
          weightPercentage={100}
        />
      </HoverCardPanel>
      <HoverCardPanel accent="fork">
        <WeightedNodeCard
          styleKey="fork"
          status="VALID"
          blockRoot={storyBlockRoots.fork105}
          parentRoot={storyBlockRoots.slot104}
          slot={105}
          epoch={3}
          validity="valid"
          weight="430"
          weightPercentage={45}
        />
      </HoverCardPanel>
      <HoverCardPanel accent="justified">
        <WeightedNodeCard
          styleKey="justified"
          status="JUSTIFIED"
          blockRoot={storyBlockRoots.justified}
          parentRoot={storyBlockRoots.slot102}
          slot={103}
          epoch={3}
          validity="valid"
          weight="970"
          weightPercentage={100}
        />
      </HoverCardPanel>
      <HoverCardPanel accent="finalized">
        <WeightedNodeCard
          styleKey="finalized"
          status="FINALIZED"
          blockRoot={storyBlockRoots.finalized}
          parentRoot={storyBlockRoots.genesis}
          slot={100}
          epoch={3}
          validity="valid"
          weight="1000"
          weightPercentage={100}
        />
      </HoverCardPanel>
      <HoverCardPanel accent="invalid">
        <WeightedNodeCard
          styleKey="invalid"
          status="DETACHED"
          blockRoot={storyBlockRoots.orphan106}
          parentRoot={storyBlockRoots.missingParent}
          slot={106}
          epoch={3}
          validity="valid"
          weight="120"
          weightPercentage={100}
        />
      </HoverCardPanel>
      <HoverCardPanel accent="invalid">
        <WeightedNodeCard
          styleKey="invalid"
          status="INVALID"
          blockRoot={storyBlockRoots.fork106}
          parentRoot={storyBlockRoots.slot105}
          slot={106}
          epoch={3}
          validity="invalid"
          weight="350"
          weightPercentage={38}
        />
      </HoverCardPanel>
      <HoverCardPanel accent="invalid">
        <WeightedNodeCard
          styleKey="invalid"
          status="UNKNOWN"
          blockRoot={storyBlockRoots.missingParent}
          slot={108}
          epoch={3}
          validity="unknown"
          weight="0"
          weightPercentage={0}
        />
      </HoverCardPanel>
      {/* mainnet-scale numbers: 8-digit slot, 6-digit epoch, 15-digit
       * weight — chips wrap below the status and the weight tile shows
       * compact notation instead of overflowing */}
      <HoverCardPanel accent="canonical">
        <WeightedNodeCard
          styleKey="canonical"
          status="VALID"
          blockRoot={storyBlockRoots.slot107}
          parentRoot={storyBlockRoots.slot106}
          slot={14526770}
          epoch={453961}
          validity="valid"
          weight="393231898497114"
          weightPercentage={100}
        />
      </HoverCardPanel>
    </div>
  ),
};

/* Same coverage for the aggregated card: the styleKey/status pairs mirror
 * AggregatedNode's priority cascade (not valid → detached → finalized →
 * justified → optimistic → canonical/fork). */
export const AggregatedNodeCards: Story = {
  render: () => (
    <div className="flex min-h-screen flex-wrap content-start items-start gap-6 bg-background p-6">
      <HoverCardPanel accent="canonical">
        <AggregatedNodeCard
          styleKey="canonical"
          status="VALID"
          blockRoot={storyBlockRoots.slot107}
          slot={107}
          epoch={3}
          seen={3}
          canonical={2}
          finalizedCheckpoints={0}
          justifiedCheckpoints={0}
          orphans={0}
          valid={3}
          optimistic={0}
          total={3}
        />
      </HoverCardPanel>
      <HoverCardPanel accent="fork">
        <AggregatedNodeCard
          styleKey="fork"
          status="VALID"
          blockRoot={storyBlockRoots.fork107}
          slot={107}
          epoch={3}
          seen={1}
          canonical={1}
          finalizedCheckpoints={0}
          justifiedCheckpoints={0}
          orphans={0}
          valid={1}
          optimistic={0}
          total={3}
        />
      </HoverCardPanel>
      <HoverCardPanel accent="finalized">
        <AggregatedNodeCard
          styleKey="finalized"
          status="FINALIZED"
          blockRoot={storyBlockRoots.finalized}
          slot={100}
          epoch={3}
          seen={3}
          canonical={3}
          finalizedCheckpoints={3}
          justifiedCheckpoints={0}
          orphans={0}
          valid={3}
          optimistic={0}
          total={3}
        />
      </HoverCardPanel>
      <HoverCardPanel accent="justified">
        <AggregatedNodeCard
          styleKey="justified"
          status="JUSTIFIED"
          blockRoot={storyBlockRoots.justified}
          slot={103}
          epoch={3}
          seen={3}
          canonical={3}
          finalizedCheckpoints={0}
          justifiedCheckpoints={3}
          orphans={0}
          valid={3}
          optimistic={0}
          total={3}
        />
      </HoverCardPanel>
      <HoverCardPanel accent="optimistic">
        <AggregatedNodeCard
          styleKey="optimistic"
          status="1/3 OPTIMISTIC"
          blockRoot={storyBlockRoots.slot106}
          slot={106}
          epoch={3}
          seen={3}
          canonical={2}
          finalizedCheckpoints={0}
          justifiedCheckpoints={0}
          orphans={0}
          valid={3}
          optimistic={1}
          total={3}
        />
      </HoverCardPanel>
      <HoverCardPanel accent="invalid">
        <AggregatedNodeCard
          styleKey="invalid"
          status="1 NOT VALID"
          blockRoot={storyBlockRoots.fork106}
          slot={106}
          epoch={3}
          seen={2}
          canonical={1}
          finalizedCheckpoints={0}
          justifiedCheckpoints={0}
          orphans={0}
          valid={1}
          optimistic={0}
          total={3}
        />
      </HoverCardPanel>
      <HoverCardPanel accent="invalid">
        <AggregatedNodeCard
          styleKey="invalid"
          status="1 DETACHED"
          blockRoot={storyBlockRoots.orphan106}
          slot={106}
          epoch={3}
          seen={1}
          canonical={0}
          finalizedCheckpoints={0}
          justifiedCheckpoints={0}
          orphans={1}
          valid={1}
          optimistic={0}
          total={3}
        />
      </HoverCardPanel>
      <HoverCardPanel>
        <TruncationCard slots={1869} />
      </HoverCardPanel>
    </div>
  ),
};

/* Real pointer choreography: hover a node, the details card appears in a
 * portal (outside the canvas element); Escape dismisses it. */
export const WeightedNodeHoverInteraction: Story = {
  render: () => (
    <div className="relative h-[800px] min-w-[700px] bg-background">
      <WeightedNode
        hash={storyBlockRoots.fork105}
        weight="430"
        type="fork"
        validity="valid"
        weightPercentageComparedToHeaviestNeighbor={45}
        slot={105}
        epoch={3}
        parentRoot={storyBlockRoots.slot104}
        x={200}
        y={300}
        radius={RADIUS}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await userEvent.hover(canvas.getByRole('button'));
    // the card fades in (opacity 0 → 1), so retry until the entrance
    // transition lands
    await waitFor(() => expect(body.getByText('Click the block for full details')).toBeVisible());
    await expect(body.getByText('Branch share')).toBeVisible();
    await expect(body.getByText('45%')).toBeVisible();
    // slot/epoch render as chips with the number highlighted in a nested
    // span, so match on each chip's assembled text content
    await expect(body.getByText((_, element) => element?.textContent === 'slot 105')).toBeVisible();
    await expect(body.getByText((_, element) => element?.textContent === 'epoch 3')).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(body.queryByText('Click the block for full details')).not.toBeInTheDocument(),
    );
  },
};

export const TruncationMarkerHoverInteraction: Story = {
  render: () => (
    <div className="relative h-[800px] min-w-[700px] bg-background">
      <TruncationMarker x={200} y={300} radius={RADIUS} slots={1869} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await userEvent.hover(canvas.getByText(/slots\s+hidden/i));
    await waitFor(() => expect(body.getByText('Hidden range')).toBeVisible());
  },
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
