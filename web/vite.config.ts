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
      // '/api': {
      //   target: 'https://forky.mainnet.ethpandaops.io',
      //   changeOrigin: true,
      //   secure: false,
      // },
      '/api': {
        target: 'http://localhost:5556',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
