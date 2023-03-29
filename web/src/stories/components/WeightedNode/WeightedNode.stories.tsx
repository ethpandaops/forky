import { Stage, Container } from '@pixi/react';
import type { Meta, StoryObj } from '@storybook/react';

import Component from '@components/WeightedNode';

const componentMeta: Meta<typeof Component> = {
  title: 'Components/WeightedNode',
  component: Component,
  decorators: [
    (Story) => (
      <Stage
        data-testid="stage"
        width={400}
        height={400}
        options={{ backgroundAlpha: 0, antialias: true }}
      >
        <Container x={200} y={200}>
          <Story />
        </Container>
      </Stage>
    ),
  ],
  args: {
    validity: 'valid',
    hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    weight: '10000000000',
    weightPercentageComparedToHeaviestNeighbor: 100,
    type: 'canonical',
    x: 0,
    y: 0,
    radius: 200,
    borderWidth: 20,
    visible: true,
  },
  tags: ['autodocs'],
  argTypes: {
    validity: {
      options: ['valid', 'invalid'],
      control: { type: 'inline-radio' },
    },
    hash: { control: { type: 'text' } },
    weight: { control: { type: 'text' } },
    weightPercentageComparedToHeaviestNeighbor: {
      control: { type: 'range', min: 0, max: 100, step: 0.1 },
    },
    type: {
      options: ['canonical', 'fork', 'finalized', 'justified'],
      control: { type: 'inline-radio' },
    },
    x: { defaultValue: { summary: '0' }, control: { type: 'number' } },
    y: { defaultValue: { summary: '0' }, control: { type: 'number' } },
    radius: { defaultValue: { summary: '200' }, control: { type: 'number' } },
    borderWidth: { defaultValue: { summary: '20' }, control: { type: 'number' } },
    visible: { control: { type: 'boolean' } },
    onPointerEnter: { action: true, control: { type: 'none' } },
    onPointerLeave: { action: true, control: { type: 'none' } },
    onPointerTap: { action: true, control: { type: 'none' } },
  },
  parameters: {},
};

export default componentMeta;

export const Finalized: StoryObj<typeof Component> = {
  args: {
    type: 'finalized',
  },
};

export const Justified: StoryObj<typeof Component> = {
  args: {
    type: 'justified',
  },
};

export const Canonical: StoryObj<typeof Component> = {
  args: {
    type: 'canonical',
  },
};

export const CanonicalZeroWeight: StoryObj<typeof Component> = {
  args: {
    type: 'canonical',
    weight: '',
  },
};

export const Fork: StoryObj<typeof Component> = {
  args: {
    type: 'fork',
  },
};

export const ForkWeightCompared: StoryObj<typeof Component> = {
  args: {
    type: 'fork',
    weightPercentageComparedToHeaviestNeighbor: 65,
  },
};

export const Invalid: StoryObj<typeof Component> = {
  args: {
    type: 'fork',
    validity: 'invalid',
  },
};
