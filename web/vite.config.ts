import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';
import svgr from 'vite-plugin-svgr';

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
      '@assets': path.resolve(__dirname, './src/assets'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@providers': path.resolve(__dirname, './src/providers'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
    },
  },
  plugins: [svgr(), react(), eslint()],
  build: {
    outDir: 'build/frontend',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5555',
      },
    },
  },
});
