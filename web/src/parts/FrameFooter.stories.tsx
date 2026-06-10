import type { Meta, StoryObj } from '@storybook/tanstack-react';

import FrameFooter from '@parts/FrameFooter';
import { storyApiHandlers, storyFrameIds } from '@app/stories/fixtures';
import { withForkyProviders } from '@app/stories/storybook';

const meta = {
  title: 'Parts/Frame Footer',
  component: FrameFooter,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: storyApiHandlers(),
    },
  },
  decorators: [withForkyProviders()],
} satisfies Meta<typeof FrameFooter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithoutActiveFrame: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <FrameFooter />
    </div>
  ),
};

export const WithActiveFrame: Story = {
  decorators: [
    withForkyProviders({
      focus: {
        frameId: storyFrameIds[0],
      },
    }),
  ],
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <FrameFooter />
    </div>
  ),
};
