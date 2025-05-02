import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
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
