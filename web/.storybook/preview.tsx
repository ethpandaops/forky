import type { Decorator, Preview } from '@storybook/tanstack-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en.json';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';

import { storyRoute } from './story-routes';
import '../src/index.css';

type StorybookThemeMode = 'light' | 'dark' | 'system';

TimeAgo.addLocale(en);
TimeAgo.setDefaultLocale('en');

initialize({
  onUnhandledRequest: 'bypass',
  quiet: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

function applyThemeMode(themeMode: StorybookThemeMode) {
  if (typeof window === 'undefined') return;

  if (themeMode === 'system') {
    delete window.localStorage.isDarkMode;
    document.documentElement.classList.toggle(
      'dark',
      window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
    );
    return;
  }

  const isDarkMode = themeMode === 'dark';
  window.localStorage.isDarkMode = String(isDarkMode);
  document.documentElement.classList.toggle('dark', isDarkMode);
}

const decorators: Decorator[] = [
  (Story, context) => {
    const themeMode = (context.globals.themeMode as StorybookThemeMode | undefined) ?? 'system';
    applyThemeMode(themeMode);

    return (
      <QueryClientProvider client={queryClient} key={context.id}>
        <Story />
      </QueryClientProvider>
    );
  },
];

const preview: Preview = {
  globalTypes: {
    themeMode: {
      name: 'Theme',
      description: 'Global theme mode',
      defaultValue: 'system',
      toolbar: {
        icon: 'mirror',
        dynamicTitle: true,
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
          { value: 'system', title: 'System' },
        ],
      },
    },
  },
  beforeEach: () => {
    queryClient.clear();
  },
  loaders: [mswLoader],
  decorators,
  parameters: {
    tanstack: {
      router: {
        route: storyRoute,
        path: '/',
        context: { queryClient },
      },
    },
    msw: {
      handlers: [],
    },
    viewport: {
      viewports: INITIAL_VIEWPORTS,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        method: 'alphabetical',
      },
    },
  },
};

export default preview;
