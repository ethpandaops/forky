import type { Meta, StoryObj } from '@storybook/tanstack-react';
import { expect, userEvent, within } from 'storybook/test';

import Header from '@parts/Header';
import { withForkyProviders } from '@app/stories/storybook';

const meta = {
  title: 'Parts/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
    tanstack: {
      router: {
        path: '/',
      },
    },
  },
  decorators: [withForkyProviders()],
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
    </div>
  ),
};

export const MenuOpen: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: /open menu/i }));
    await expect(canvas.getByText('An Ethereum fork choice explorer')).toBeVisible();
  },
};
