import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, waitFor, within } from '@storybook/testing-library';

import Component from '@components/Graph';

const componentMeta: Meta<typeof Component> = {
  title: 'Components/Graph',
  component: Component,
  args: {},
  tags: ['autodocs'],
  argTypes: {},
  parameters: {},
};

export default componentMeta;

export const Default: StoryObj<typeof Component> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const svg = canvas.getByTestId('svg');
    await waitFor(async () => {
      await expect(svg).toBeInTheDocument();
    });
  },
};
