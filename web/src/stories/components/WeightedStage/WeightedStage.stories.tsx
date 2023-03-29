import type { Meta, StoryObj } from '@storybook/react';

import Component from '@components/WeightedStage';

const componentMeta: Meta<typeof Component> = {
  title: 'Components/WeightedStage',
  component: Component,
  args: { width: 600, height: 600 },
  tags: ['autodocs'],
  argTypes: {},
  parameters: {},
};

export default componentMeta;

export const Default: StoryObj<typeof Component> = {};
