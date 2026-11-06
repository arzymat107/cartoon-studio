import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { charactersDir, privateSoundsDir } from './scripts/characters-dir.mjs';
import { exportPlugin } from './scripts/export-server.mjs';

const characters = charactersDir();
const privateSounds = privateSoundsDir();

export default defineConfig({
  plugins: [exportPlugin()],
  resolve: {
    alias: {
      '@characters': characters,
      '@private-sounds': privateSounds,
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // The character pictures and private sounds live outside the project (see scripts/characters-dir.mjs).
  server: { fs: { allow: ['.', characters, privateSounds] } },
});
