import type { Meta, StoryObj } from '@storybook/tanstack-react';
import { expect, userEvent, within } from 'storybook/test';

import Control from '@components/Control';
import EpochDial from '@components/EpochDial';
import Ruler from '@components/Ruler';
import Slot from '@components/Slot';
import SlotDial from '@components/SlotDial';
import SnapshotMarker from '@components/SnapshotMarker';
import Timeline from '@parts/Timeline';
import { storyAllMetadata, storyApiHandlers, storyEventMetadata } from '@app/stories/fixtures';
import { withForkyProviders } from '@app/stories/storybook';

const meta = {
  title: 'Components/Timeline',
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: storyApiHandlers(),
    },
  },
  decorators: [withForkyProviders()],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const RulerVariants: Story = {
  render: () => (
    <div className="grid min-h-screen content-center gap-8 bg-background p-8 text-foreground">
      <Ruler
        className="h-24 rounded-lg bg-track"
        marks={12}
        subMarks={4}
        summary="SLOT 107"
        markText
        markSuffix="s"
      />
      <Ruler className="h-10 rounded-lg bg-track" marks={32} summary="EPOCH 3" flip />
      <Ruler
        className="h-24 rounded-lg bg-danger-surface/60"
        marks={12}
        subMarks={1}
        summary="SLOT ERROR"
        markText
      />
    </div>
  ),
};

export const SnapshotMarkers: Story = {
  render: () => (
    <div className="flex min-h-screen items-center justify-center bg-background p-8 text-foreground">
      <div className="relative h-24 w-[640px] rounded-lg bg-track">
        <SnapshotMarker
          metadata={[storyAllMetadata[0]]}
          activeIds={['frame-alpha']}
          percentage="18"
        />
        <SnapshotMarker metadata={[storyEventMetadata[0]]} activeIds={[]} percentage="44" />
        <SnapshotMarker
          metadata={[storyAllMetadata[1], storyEventMetadata[1], storyAllMetadata[2]]}
          activeIds={['event-after-reorg-1']}
          percentage="70"
        />
      </div>
    </div>
  ),
};

export const SnapshotMarkerPopoverOpen: Story = {
  render: () => (
    <div className="flex min-h-screen items-center justify-center bg-background p-8 text-foreground">
      <div className="relative h-24 w-[640px] rounded-lg bg-track">
        <SnapshotMarker
          metadata={[storyAllMetadata[1], storyEventMetadata[1], storyAllMetadata[2]]}
          activeIds={['event-after-reorg-1']}
          percentage="50"
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTitle(/syd1-lighthouse-001/));
    await expect(canvas.getByText('event-after-reorg-1')).toBeVisible();
  },
};

export const SlotPopulated: Story = {
  render: () => (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-[720px]">
        <Slot slot={107} subMarks={4} shouldFetch segments={60} />
      </div>
    </div>
  ),
};

export const SlotLoading: Story = {
  tags: ['test-exclude'],
  parameters: {
    msw: {
      handlers: storyApiHandlers({ metadataDelay: 10_000 }),
    },
  },
  render: () => (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-[720px]">
        <Slot slot={107} subMarks={4} shouldFetch segments={60} />
      </div>
    </div>
  ),
};

export const SlotError: Story = {
  parameters: {
    msw: {
      handlers: storyApiHandlers({ metadataError: true }),
    },
  },
  render: () => (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-[720px]">
        <Slot slot={107} subMarks={4} shouldFetch segments={60} />
      </div>
    </div>
  ),
};

export const ControlPaused: Story = {
  render: () => (
    <div className="flex min-h-screen items-end justify-center bg-background text-foreground">
      <Control />
    </div>
  ),
};

export const ControlPlayingNearLive: Story = {
  decorators: [
    withForkyProviders({
      focus: {
        initialTime: Date.now() - 2 * 12_000,
        playing: true,
      },
    }),
  ],
  render: () => (
    <div className="flex min-h-screen items-end justify-center bg-background text-foreground">
      <Control />
    </div>
  ),
};

export const SlotAndEpochDials: Story = {
  render: () => (
    <div className="grid min-h-screen content-center gap-10 bg-background text-foreground">
      <EpochDial />
      <SlotDial />
    </div>
  ),
};

export const FullTimeline: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Timeline />
    </div>
  ),
};
