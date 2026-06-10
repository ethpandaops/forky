import type { ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/tanstack-react';

import Selection from '@parts/Selection';
import {
  getProcessedStoryFrame,
  storyApiHandlers,
  storyBlockRoots,
  storyFrameIds,
} from '@app/stories/fixtures';
import { SelectionSeeder, defaultBYOData, withForkyProviders } from '@app/stories/storybook';

const meta = {
  title: 'Parts/Selection',
  component: Selection,
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
} satisfies Meta<typeof Selection>;

export default meta;

type Story = StoryObj<typeof meta>;

function SelectionState({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Selection />
      {children}
    </div>
  );
}

export const Closed: Story = {
  render: () => <SelectionState />,
};

export const SnapshotPanel: Story = {
  render: () => (
    <SelectionState>
      <SelectionSeeder frameId={storyFrameIds[0]} />
    </SelectionState>
  ),
};

export const AggregatedSnapshotsPanel: Story = {
  render: () => (
    <SelectionState>
      <SelectionSeeder aggregatedFrameIds={storyFrameIds} />
    </SelectionState>
  ),
};

export const BlockPanel: Story = {
  render: () => (
    <SelectionState>
      <SelectionSeeder
        frameBlock={{
          frameId: storyFrameIds[0],
          blockRoot: storyBlockRoots.fork106,
        }}
      />
    </SelectionState>
  ),
};

export const AggregatedBlockPanel: Story = {
  render: () => (
    <SelectionState>
      <SelectionSeeder
        aggregatedFramesBlock={{
          frameIds: storyFrameIds,
          blockRoot: storyBlockRoots.fork106,
        }}
      />
    </SelectionState>
  ),
};

export const BYOBlockPanel: Story = {
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
        byoData: defaultBYOData,
      },
    }),
  ],
  render: () => (
    <SelectionState>
      <SelectionSeeder
        frameBlock={{
          frameId: storyFrameIds[0],
          blockRoot: storyBlockRoots.fork106,
        }}
      />
    </SelectionState>
  ),
};

export const BYOBlockMissingBlockPanel: Story = {
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
    <SelectionState>
      <SelectionSeeder
        frameBlock={{
          frameId: storyFrameIds[0],
          blockRoot: storyBlockRoots.missingParent,
        }}
      />
    </SelectionState>
  ),
};
