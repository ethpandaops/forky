import type { Meta, StoryObj } from '@storybook/tanstack-react';

import Stage from '@parts/Stage';
import { getProcessedStoryFrame, storyApiHandlers, storyFrameIds } from '@app/stories/fixtures';
import { withForkyProviders } from '@app/stories/storybook';

const meta = {
  title: 'Parts/Stage',
  component: Stage,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: storyApiHandlers(),
    },
    tanstack: {
      router: {
        path: '/',
      },
    },
  },
  decorators: [withForkyProviders()],
} satisfies Meta<typeof Stage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AggregatedActiveFrames: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Stage />
    </div>
  ),
};

export const SnapshotFrame: Story = {
  decorators: [
    withForkyProviders({
      focus: {
        frameId: storyFrameIds[0],
      },
    }),
  ],
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Stage />
    </div>
  ),
};

export const BYOEmpty: Story = {
  parameters: {
    tanstack: {
      router: {
        path: '/byo',
      },
    },
  },
  decorators: [
    withForkyProviders({
      focus: {
        byo: true,
      },
    }),
  ],
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Stage />
    </div>
  ),
};

export const BYOLoaded: Story = {
  parameters: {
    tanstack: {
      router: {
        path: '/byo',
      },
    },
  },
  decorators: [
    withForkyProviders({
      focus: {
        byo: true,
        byoData: getProcessedStoryFrame(storyFrameIds[0]),
      },
    }),
  ],
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Stage />
    </div>
  ),
};
