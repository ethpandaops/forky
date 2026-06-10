import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      name: 'unit',
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: ['src/**/*.stories.{ts,tsx}', 'node_modules'],
      setupFiles: ['./vitest.setup.ts'],
      reporters: process.env.GITHUB_ACTIONS ? ['default', 'github-actions'] : ['default'],
      coverage: {},
    },
    optimizeDeps: {
      include: ['react-dom/client', 'zod/mini'],
    },
  }),
);
