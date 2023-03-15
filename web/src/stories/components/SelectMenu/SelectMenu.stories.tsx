import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, waitFor, within } from '@storybook/testing-library';

import Component from '@components/SelectMenu';

const componentMeta: Meta<typeof Component> = {
  title: 'Components/SelectMenu',
  component: Component,
  args: {
    id: 'test-id',
    data: [
      { id: 1, name: 'Wade Cooper' },
      { id: 2, name: 'Arlene Mccoy' },
      { id: 3, name: 'Devon Webb' },
      { id: 4, name: 'Tom Cook' },
      { id: 5, name: 'Tanya Fox' },
      { id: 6, name: 'Hellen Schmidt' },
      { id: 7, name: 'Caroline Schultz' },
      { id: 8, name: 'Mason Heaney' },
      { id: 9, name: 'Claudie Smitham' },
      { id: 10, name: 'Emil Schaefer' },
    ],
    label: undefined,
    initialSelectedIndex: 2,
  },
  tags: ['autodocs'],
  argTypes: {
    id: {
      table: { defaultValue: { summary: 'test-id' } },
      control: { type: 'text' },
    },
    data: {
      control: { type: 'array' },
    },
    label: {
      control: { type: 'text' },
    },
    initialSelectedIndex: {
      table: { defaultValue: { summary: 0 }, control: { type: 'number' } },
    },
    onChange: { action: true },
  },
  parameters: {
    actions: {
      handles: ['mouseover input', 'click input'],
    },
  },
};

export default componentMeta;

export const Default: StoryObj<typeof Component> = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const menu = canvas.getByTestId('menu');
    let selectedItem = canvas.getByTestId('selected-item-name');
    expect(selectedItem).toHaveTextContent(args.data[args.initialSelectedIndex || 0].name);
    const data = args.data[0];
    await userEvent.click(menu);
    await waitFor(async () => {
      const item = canvas.getByTestId(data.id);
      await userEvent.click(item);
    });
    await expect(args.onChange).toHaveBeenCalledWith(data);
    selectedItem = canvas.getByTestId('selected-item-name');
    expect(selectedItem).toHaveTextContent(data.name);
  },
};
