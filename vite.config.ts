import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { charactersDir, privateSoundsDir } from './scripts/characters-dir.mjs';
import { exportPlugin } from './scripts/export-server.mjs';

const characters = charactersDir();
const privateSounds = privateSoundsDir();

/**
 * The private folders are outside the project, so Vite doesn't watch them: new or changed
 * pictures there (e.g. a new character picture) would only show after a server restart. Watch them and
 * reload the page when something is added or removed (import.meta.glob lists are made at load).
 */
function watchPrivateFolders(): Plugin {
  return {
    name: 'watch-private-folders',
    configureServer(server) {
      const dirs = [characters, privateSounds];
      server.watcher.add(dirs);
      const reload = (file: string) => {
        if (!dirs.some((d) => file.startsWith(d))) return;
        // Drop cached glob results so the next load lists the new files.
        server.moduleGraph.invalidateAll();
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);
    },
  };
}

export default defineConfig({
  plugins: [exportPlugin(), watchPrivateFolders()],
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
