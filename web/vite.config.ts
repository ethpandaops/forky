import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@stories': path.resolve(__dirname, './src/stories'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@public': path.resolve(__dirname, './public'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  plugins: [react(), eslint()],
  build: {
    outDir: 'build/frontend',
  },
});
