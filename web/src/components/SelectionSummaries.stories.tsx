import type { Meta, StoryObj } from '@storybook/tanstack-react';

import AggregatedBlockSummary from '@components/AggregatedBlockSummary';
import AggregatedFramesSummary from '@components/AggregatedFramesSummary';
import BYOFrameBlockSummary from '@components/BYOFrameBlockSummary';
import FrameBlockSummary from '@components/FrameBlockSummary';
import FrameSummary from '@components/FrameSummary';
import {
  getProcessedStoryFrame,
  storyApiHandlers,
  storyBlockRoots,
  storyFrameIds,
} from '@app/stories/fixtures';
import { PanelSurface, withForkyProviders } from '@app/stories/storybook';

const meta = {
  title: 'Components/Selection Summaries',
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

export const FrameLoaded: Story = {
  render: () => (
    <PanelSurface>
      <FrameSummary id="frame-alpha" />
    </PanelSurface>
  ),
};

export const FrameLoading: Story = {
  tags: ['test-exclude'],
  parameters: {
    msw: {
      handlers: storyApiHandlers({ frameDelay: 10_000 }),
    },
  },
  render: () => (
    <PanelSurface>
      <FrameSummary id="frame-alpha" />
    </PanelSurface>
  ),
};

export const FrameError: Story = {
  parameters: {
    msw: {
      handlers: storyApiHandlers({ frameError: true }),
    },
  },
  render: () => (
    <PanelSurface>
      <FrameSummary id="frame-alpha" />
    </PanelSurface>
  ),
};

export const FrameBlockLoaded: Story = {
  render: () => (
    <PanelSurface>
      <FrameBlockSummary frameId="frame-alpha" blockRoot={storyBlockRoots.fork106} />
    </PanelSurface>
  ),
};

export const FrameBlockMissing: Story = {
  render: () => (
    <PanelSurface>
      <FrameBlockSummary frameId="frame-alpha" blockRoot={storyBlockRoots.fork107} />
    </PanelSurface>
  ),
};

export const AggregatedFramesLoaded: Story = {
  render: () => (
    <PanelSurface className="items-start">
      <AggregatedFramesSummary ids={storyFrameIds} />
    </PanelSurface>
  ),
};

export const AggregatedFramesPartialError: Story = {
  render: () => (
    <PanelSurface className="items-start">
      <AggregatedFramesSummary ids={[storyFrameIds[0], 'missing-frame', storyFrameIds[1]]} />
    </PanelSurface>
  ),
};

export const AggregatedBlockLoaded: Story = {
  render: () => (
    <PanelSurface>
      <AggregatedBlockSummary frameIds={storyFrameIds} blockRoot={storyBlockRoots.fork106} />
    </PanelSurface>
  ),
};

export const AggregatedBlockMissing: Story = {
  render: () => (
    <PanelSurface>
      <AggregatedBlockSummary frameIds={storyFrameIds} blockRoot={storyBlockRoots.missingParent} />
    </PanelSurface>
  ),
};

export const BYOFrameBlockLoaded: Story = {
  decorators: [
    withForkyProviders({
      focus: {
        byo: true,
        byoData: getProcessedStoryFrame(storyFrameIds[0]),
      },
    }),
  ],
  render: () => (
    <PanelSurface>
      <BYOFrameBlockSummary frameId="frame-alpha" blockRoot={storyBlockRoots.fork106} />
    </PanelSurface>
  ),
};

export const BYOFrameBlockMissingData: Story = {
  decorators: [
    withForkyProviders({
      focus: {
        byo: true,
      },
    }),
  ],
  render: () => (
    <PanelSurface>
      <BYOFrameBlockSummary frameId="frame-alpha" blockRoot={storyBlockRoots.fork106} />
    </PanelSurface>
  ),
};
