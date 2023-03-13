import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, waitFor, within } from '@storybook/testing-library';

import Component from '@components/Checkbox';

const componentMeta: Meta<typeof Component> = {
  title: 'Components/Checkbox',
  component: Component,
  args: {
    id: 'test-id',
    label: 'this is a checkbox',
  },
  tags: ['autodocs'],
  argTypes: {
    id: {
      table: { defaultValue: { summary: 'test-id' } },
      control: { type: 'text' },
    },
    label: {
      table: { defaultValue: { summary: 'this is a checkbox' } },
      control: { type: 'text' },
    },
    onChange: { action: true },
  },
  parameters: {
    actions: {
      handles: ['mouseover label', 'mouseover input', 'click label', 'click input'],
    },
  },
};

export default componentMeta;

export const Default: StoryObj<typeof Component> = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId('input');
    await userEvent.click(canvas.getByLabelText(args.label ?? ''));
    await waitFor(async () => {
      await expect(args.onChange).toHaveBeenCalled();
      await expect(input).toBeChecked();
    });
    await userEvent.click(input);
    await waitFor(async () => {
      await expect(args.onChange).toHaveBeenCalled();
      await expect(input).not.toBeChecked();
    });
  },
};
