import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { ErrorBoundaryFallback as ErrorBoundaryFallbackView } from '@app/ErrorBoundary';
import NotFound from '@app/NotFound';

const meta = {
  title: 'App/Fallbacks',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const NotFoundPage: Story = {
  render: () => <NotFound />,
};

export const ErrorBoundaryFallback: Story = {
  render: () => <ErrorBoundaryFallbackView />,
};
