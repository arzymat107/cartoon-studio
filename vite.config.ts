import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { exportPlugin } from './scripts/export-server.mjs';

export default defineConfig({
  plugins: [exportPlugin()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
