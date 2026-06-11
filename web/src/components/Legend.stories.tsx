import type { Meta, StoryObj } from '@storybook/tanstack-react';
import { expect, userEvent, within } from 'storybook/test';

import Legend from '@components/Legend';
import { StorySurface } from '@app/stories/storybook';

const meta = {
  title: 'Components/Legend',
  component: Legend,
  parameters: {
    layout: 'fullscreen',
  },
  render: args => (
    <StorySurface className="flex items-end">
      <Legend {...args} />
    </StorySurface>
  ),
} satisfies Meta<typeof Legend>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WeightedExpanded: Story = {
  args: {
    mode: 'weighted',
    defaultExpanded: true,
  },
};

export const AggregatedExpanded: Story = {
  args: {
    mode: 'aggregated',
    defaultExpanded: true,
  },
};

export const CollapsedPill: Story = {
  args: {
    mode: 'weighted',
  },
};

export const ExpandAndCollapse: Story = {
  args: {
    mode: 'weighted',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Show legend' }));
    await expect(canvas.getByText('Canonical')).toBeVisible();
    await expect(canvas.getByText('Detached')).toBeVisible();
    await expect(
      canvas.getByText('Ring: weight relative to the heaviest competing branch.'),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Hide legend' }));
    await expect(canvas.getByRole('button', { name: 'Show legend' })).toBeVisible();
  },
};

export const AggregatedCounters: Story = {
  args: {
    mode: 'aggregated',
    defaultExpanded: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText('Ring: share of sources reporting the block canonical.'),
    ).toBeVisible();
    await expect(canvas.getByText('Sources that have seen the block')).toBeVisible();
  },
};

export const MobileExpanded: Story = {
  globals: {
    viewport: { value: 'iphone14', isRotated: false },
  },
  args: {
    mode: 'aggregated',
    defaultExpanded: true,
  },
};

export const MobileCollapsed: Story = {
  globals: {
    viewport: { value: 'iphone14', isRotated: false },
  },
  args: {
    mode: 'weighted',
  },
};
