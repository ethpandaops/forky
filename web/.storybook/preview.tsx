import 'tailwindcss/tailwind.css';
import React from 'react';

import type { Preview } from '@storybook/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { initialize, mswDecorator } from 'msw-storybook-addon';

import { handlers } from '@app/mocks/handlers';

const queryClient = new QueryClient();
initialize({
  onUnhandledRequest: ({ method, url }) => {
    if (url.pathname.startsWith('/api/')) {
      console.error(`Unhandled ${method} request to ${url}.

        This exception has been only logged in the console, however, it's strongly recommended to resolve this error as you don't want unmocked data in Storybook stories.

        If you wish to mock an error response, please refer to this guide: https://mswjs.io/docs/recipes/mocking-error-responses
      `);
    }
  },
});

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    darkMode: {
      current: 'dark',
      classTarget: 'html',
      darkClass: 'dark',
      stylePreview: true,
    },
    msw: {
      handlers,
    },
  },
  decorators: [
    mswDecorator,
    (story) => (
      <QueryClientProvider client={queryClient}>
        {story()}
        <ReactQueryDevtools />
      </QueryClientProvider>
    ),
  ],
};

export default preview;
