import type { Meta, StoryObj } from '@storybook/tanstack-react';
import { expect, userEvent, within } from 'storybook/test';

import useFocus from '@contexts/focus';
import BYOFooter from '@parts/BYOFooter';
import { storyFrames } from '@app/stories/fixtures';
import { withForkyProviders } from '@app/stories/storybook';

const meta = {
  title: 'Parts/BYO Footer',
  component: BYOFooter,
  parameters: {
    layout: 'fullscreen',
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
} satisfies Meta<typeof BYOFooter>;

export default meta;

type Story = StoryObj<typeof meta>;

const alphaNodeCount = storyFrames.alpha.data.fork_choice_nodes.length;

function BYOFooterHarness() {
  const { byoData } = useFocus();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-[calc(100vh-148px)] items-center justify-center p-6 text-sm text-muted">
        <span>
          {byoData
            ? `Loaded ${byoData.frame.data.fork_choice_nodes.length} nodes`
            : 'No BYO data loaded'}
        </span>
      </div>
      <BYOFooter />
    </div>
  );
}

export const Idle: Story = {
  render: () => <BYOFooterHarness />,
};

export const Dragging: Story = {
  render: () => <BYOFooterHarness />,
  play: async ({ canvasElement }) => {
    canvasElement.ownerDocument.dispatchEvent(
      new DragEvent('dragover', { bubbles: true, cancelable: true }),
    );
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Drop to view')).toBeVisible();
  },
};

export const InvalidJsonUpload: Story = {
  render: () => <BYOFooterHarness />,
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('File input not found');
    await userEvent.upload(input, new File(['not json'], 'fork-choice.json'));
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('The file is not valid JSON.')).toBeVisible();
  },
};

export const ValidJsonUpload: Story = {
  render: () => <BYOFooterHarness />,
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('File input not found');
    await userEvent.upload(
      input,
      new File([JSON.stringify(storyFrames.alpha.data)], 'fork-choice.json', {
        type: 'application/json',
      }),
    );
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(new RegExp(`loaded ${alphaNodeCount} nodes`, 'i')),
    ).toBeVisible();
  },
};
