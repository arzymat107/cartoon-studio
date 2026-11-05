import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { charactersDir } from './scripts/characters-dir.mjs';
import { exportPlugin } from './scripts/export-server.mjs';

const characters = charactersDir();

export default defineConfig({
  plugins: [exportPlugin()],
  resolve: {
    alias: {
      '@characters': characters,
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // The character pictures live outside the project (see scripts/characters-dir.mjs).
  server: { fs: { allow: ['.', characters] } },
});
