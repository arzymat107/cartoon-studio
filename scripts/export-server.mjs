/**
 * Vite plugin behind the player's "Export MP4" button (works with `npm run dev` and `npm run preview`).
 *
 *   POST /api/export?episode=football&fps=30   start rendering (one export at a time)
 *   GET  /api/export/status                     { state, episode, stage, progress, file, error }
 *   GET  /api/export/download?file=football.mp4 the finished video
 *
 * It runs scripts/export-video.mjs, so the button and `npm run export` produce identical videos.
 */
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const exportsDir = join(root, 'exports');

/** @type {{ state: 'idle'|'running'|'done'|'error', episode?: string, stage?: string, progress: number, file?: string, error?: string }} */
let job = { state: 'idle', progress: 0 };

function startExport(episode, fps) {
  job = { state: 'running', episode, stage: 'starting', progress: 0 };
  const child = spawn(process.execPath, [join(root, 'scripts/export-video.mjs'), '--episode', episode, '--fps', String(fps), '--progress-json'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let buffer = '';
  let errors = '';
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('@@progress ')) {
        const { stage, done, total } = JSON.parse(line.slice(11));
        // Sound is quick; frames are most of the work; encoding finishes last.
        const progress = stage === 'sound' ? 0.02 : stage === 'video' ? 0.03 + 0.95 * (done / total) : stage === 'encoding' ? 0.99 : 0;
        job = { ...job, stage, progress };
      } else if (line.startsWith('@@done ')) {
        job = { ...job, state: 'done', stage: 'done', progress: 1, file: basename(JSON.parse(line.slice(7)).file) };
      }
    }
  });
  child.stderr.on('data', (chunk) => (errors += chunk));
  child.on('close', (code) => {
    if (job.state === 'running') {
      job = { ...job, state: 'error', error: errors.trim().split('\n').slice(-5).join('\n') || `export exited with code ${code}` };
    }
  });
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function middleware(req, res, next) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/export')) return next();

  if (url.pathname === '/api/export' && req.method === 'POST') {
    if (job.state === 'running') return sendJson(res, 409, { error: 'An export is already running.', job });
    const episode = url.searchParams.get('episode') ?? '';
    const fps = Number(url.searchParams.get('fps') ?? 30);
    if (!/^[\w-]+$/.test(episode)) return sendJson(res, 400, { error: 'Invalid episode name.' });
    if (!(fps >= 12 && fps <= 60)) return sendJson(res, 400, { error: 'fps must be between 12 and 60.' });
    startExport(episode, fps);
    return sendJson(res, 202, job);
  }

  if (url.pathname === '/api/export/status') return sendJson(res, 200, job);

  if (url.pathname === '/api/export/download') {
    // Only plain .mp4 file names inside exports/ – no paths.
    const file = url.searchParams.get('file') ?? '';
    const path = join(exportsDir, file);
    if (!/^[\w.-]+\.mp4$/.test(file) || !existsSync(path)) return sendJson(res, 404, { error: 'File not found.' });
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', statSync(path).size);
    res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
    return createReadStream(path).pipe(res);
  }

  return sendJson(res, 404, { error: 'Unknown export endpoint.' });
}

export function exportPlugin() {
  return {
    name: 'cartoon-export',
    // Block bodies on purpose: a function *returned* from these hooks is treated by Vite as a post-hook.
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
