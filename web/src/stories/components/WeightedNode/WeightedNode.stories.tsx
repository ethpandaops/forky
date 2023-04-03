import type { Meta, StoryObj } from '@storybook/react';

import Component from '@components/WeightedNode';

const componentMeta: Meta<typeof Component> = {
  title: 'Components/WeightedNode',
  component: Component,
  args: {
    hash: '0x12345abcef',
    weight: '1234',
    type: 'canonical',
    x: 0,
    y: 0,
    radius: 200,
    weightPercentageComparedToHeaviestNeighbor: 100,
  },
  tags: ['autodocs'],
  argTypes: {},
  parameters: {},
};

export default componentMeta;

export const Default: StoryObj<typeof Component> = {};
