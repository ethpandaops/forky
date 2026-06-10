import type { StorybookConfig } from '@storybook/tanstack-react';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-vitest',
    '@storybook/addon-themes',
    'storybook/viewport',
  ],
  framework: {
    name: '@storybook/tanstack-react',
    options: {},
  },
  core: {
    builder: '@storybook/builder-vite',
    disableTelemetry: true,
  },
  staticDirs: ['../public'],
};

export default config;
