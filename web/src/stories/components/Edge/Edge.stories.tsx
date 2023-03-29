import { Stage, Container } from '@pixi/react';
import type { Meta, StoryObj } from '@storybook/react';

import Component from '@components/Edge';

const componentMeta: Meta<typeof Component> = {
  title: 'Components/Edge',
  component: Component,
  decorators: [
    (Story) => (
      <Stage
        data-testid="stage"
        width={400}
        height={200}
        options={{ backgroundAlpha: 0, antialias: true }}
      >
        <Container>
          <Story />
        </Container>
      </Stage>
    ),
  ],
  args: {
    source: {
      x: 20,
      y: 100,
    },
    target: {
      x: 380,
      y: 100,
    },
    width: 10,
    visible: true,
  },
  tags: ['autodocs'],
  argTypes: {
    source: { control: { type: 'object' } },
    target: { control: { type: 'object' } },
    width: { table: { defaultValue: { summary: '2' } }, control: { type: 'number' } },
    visible: { control: { type: 'boolean' } },
  },
  parameters: {},
};

export default componentMeta;

export const Canonical: StoryObj<typeof Component> = {};

export const Fork: StoryObj<typeof Component> = {
  args: {
    source: {
      x: 20,
      y: 180,
    },
    target: {
      x: 380,
      y: 20,
    },
    width: 5,
  },
};
