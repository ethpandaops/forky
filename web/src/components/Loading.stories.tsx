import type { Meta, StoryObj } from '@storybook/tanstack-react';

import Loading from './Loading';

const meta = {
  title: 'Components/Loading',
  component: Loading,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <div className="h-screen w-screen bg-background">
        <Story />
      </div>
    ),
  ],
  args: {
    message: 'Loading...',
  },
} satisfies Meta<typeof Loading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Shell: Story = {
  decorators: [
    Story => (
      <div className="h-screen w-screen bg-shell">
        <Story />
      </div>
    ),
  ],
  args: {
    message: 'Loading fork-choice data...',
    textColor: 'text-on-shell',
  },
};
