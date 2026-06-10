import type { Meta, StoryObj } from '@storybook/tanstack-react';

import App from '@app/App';
import { storyApiHandlers } from '@app/stories/fixtures';

const meta = {
  title: 'App/Routes',
  component: App,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: storyApiHandlers(),
    },
  },
} satisfies Meta<typeof App>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AggregatedLive: Story = {
  parameters: {
    tanstack: {
      router: {
        path: '/',
      },
    },
  },
};

export const SourceView: Story = {
  args: {
    node: 'syd1-lighthouse-001',
  },
  parameters: {
    tanstack: {
      router: {
        path: '/node/$nodeId',
        params: { nodeId: 'syd1-lighthouse-001' },
      },
    },
  },
};

export const SnapshotView: Story = {
  args: {
    frameId: 'frame-alpha',
  },
  parameters: {
    tanstack: {
      router: {
        path: '/snapshot/$frameId',
        params: { frameId: 'frame-alpha' },
      },
    },
  },
};

export const BYOUploadView: Story = {
  args: {
    byo: true,
  },
  parameters: {
    tanstack: {
      router: {
        path: '/byo',
      },
    },
  },
};

export const EventsOverlay: Story = {
  args: {
    eventsOpen: true,
    eventsCloseTo: '/',
  },
  parameters: {
    tanstack: {
      router: {
        path: '/events',
      },
    },
  },
};

export const NodeEventsOverlay: Story = {
  args: {
    node: 'ams3-teku-001',
    eventsOpen: true,
    eventsCloseTo: '/node/ams3-teku-001',
  },
  parameters: {
    tanstack: {
      router: {
        path: '/node/$nodeId/events',
        params: { nodeId: 'ams3-teku-001' },
      },
    },
  },
};

export const LoadingSpec: Story = {
  tags: ['test-exclude'],
  parameters: {
    tanstack: {
      router: {
        path: '/',
      },
    },
    msw: {
      handlers: storyApiHandlers({ specDelay: 10_000 }),
    },
  },
};

export const SpecError: Story = {
  parameters: {
    tanstack: {
      router: {
        path: '/',
      },
    },
    msw: {
      handlers: storyApiHandlers({ specError: true }),
    },
  },
};
