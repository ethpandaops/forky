import { expect } from '@storybook/jest';
import type { Meta, StoryObj } from '@storybook/react';
import { waitFor, within } from '@storybook/testing-library';

import Component from '@components/Slider';

const componentMeta: Meta<typeof Component> = {
  title: 'Components/Slider',
  component: Component,
  args: {
    label: 'Current time',
    maxValue: 720,
    step: 1,
    numberFormatter: new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }),
  },
  tags: ['autodocs'],
  argTypes: {},
  parameters: {},
};

export default componentMeta;

export const Default: StoryObj<typeof Component> = {};
