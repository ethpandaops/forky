import path from 'node:path';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [
      storybookTest({
        configDir: path.join(__dirname, '.storybook'),
        tags: {
          exclude: ['test-exclude'],
        },
      }),
    ],
    test: {
      name: 'storybook',
      globals: true,
      environment: 'jsdom',
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        instances: [
          {
            browser: 'chromium',
          },
        ],
      },
      setupFiles: ['./.storybook/vitest-setup.ts'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-dev-runtime',
        'react/jsx-runtime',
        '@headlessui/react',
        '@heroicons/react/20/solid',
        '@heroicons/react/24/solid',
        '@tanstack/react-query',
        '@tanstack/react-router',
        'clsx',
        'graphology',
        'javascript-time-ago',
        'react-time-ago',
        'react-zoom-pan-pinch',
        'zod',
        'zod/mini',
        '@testing-library/jest-dom',
        '@storybook/addon-docs',
        '@storybook/addon-docs/blocks',
        'msw-storybook-addon',
        'storybook/internal/channels',
        'storybook/internal/client-logger',
        'storybook/internal/docs-tools',
        'storybook/internal/preview-api',
        'storybook/internal/preview/runtime',
        'storybook/preview-api',
        'storybook/test',
        'storybook/viewport',
      ],
    },
  }),
);
