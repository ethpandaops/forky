import type { Meta, StoryObj } from '@storybook/tanstack-react';
import { expect, userEvent, within } from 'storybook/test';

import Events from '@parts/Events';
import { storyApiHandlers } from '@app/stories/fixtures';
import { withForkyProviders } from '@app/stories/storybook';

const meta = {
  title: 'Parts/Events',
  component: Events,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: storyApiHandlers(),
    },
  },
  decorators: [withForkyProviders()],
} satisfies Meta<typeof Events>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  parameters: {
    tanstack: {
      router: {
        path: '/',
      },
    },
  },
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Events open={false} closeTo="/" />
    </div>
  ),
};

export const Populated: Story = {
  parameters: {
    tanstack: {
      router: {
        path: '/events',
      },
    },
  },
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Events open closeTo="/" />
    </div>
  ),
};

export const NodeScoped: Story = {
  parameters: {
    tanstack: {
      router: {
        path: '/node/$',
        params: { _splat: 'ams3-teku-001/events' },
      },
    },
  },
  decorators: [
    withForkyProviders({
      focus: {
        node: 'ams3-teku-001',
      },
    }),
  ],
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Events open closeTo="/node/ams3-teku-001" />
    </div>
  ),
};

export const Empty: Story = {
  parameters: {
    tanstack: {
      router: {
        path: '/events',
      },
    },
    msw: {
      handlers: storyApiHandlers({ metadata: [] }),
    },
  },
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Events open closeTo="/" />
    </div>
  ),
};

export const Loading: Story = {
  tags: ['test-exclude'],
  parameters: {
    tanstack: {
      router: {
        path: '/events',
      },
    },
    msw: {
      handlers: storyApiHandlers({ metadataDelay: 10_000 }),
    },
  },
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Events open closeTo="/" />
    </div>
  ),
};

export const Error: Story = {
  parameters: {
    tanstack: {
      router: {
        path: '/events',
      },
    },
    msw: {
      handlers: storyApiHandlers({ metadataError: true }),
    },
  },
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Events open closeTo="/" />
    </div>
  ),
};

export const SlotFilterInteraction: Story = {
  parameters: {
    tanstack: {
      router: {
        path: '/events',
      },
    },
  },
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Events open closeTo="/" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    const [slotOption] = await canvas.findAllByText('Slot');
    await userEvent.click(slotOption);
    const textbox = canvas.getByRole('textbox');
    await userEvent.click(textbox);
    await userEvent.type(textbox, '106{enter}');
    await expect(await canvas.findByText('event-before-reorg-1')).toBeVisible();
  },
};
