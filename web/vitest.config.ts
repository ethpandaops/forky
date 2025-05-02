import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig, mergeConfig } from 'vitest/config';
import GithubActionsReporter from 'vitest-github-actions-reporter';
import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [tsconfigPaths()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: 'vitest.setup.ts',
      reporters: process.env.GITHUB_ACTIONS
        ? ['default', new GithubActionsReporter()]
        : ['default'],
      coverage: {},
    },
  }),
);
