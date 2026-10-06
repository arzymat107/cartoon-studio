/**
 * Renders an episode to an MP4 video with sound (ready for YouTube).
 *
 *   npm run export                          → exports/demo.mp4 (episode's size, 30 fps)
 *   npm run export -- --episode football    → exports/football.mp4 (vertical 1080×1920)
 *   --progress-json                         machine-readable progress (used by the Export button)
 *   npm run export -- --episode demo --fps 60 --out exports/my-cartoon.mp4
 *
 * How it works: a headless browser (your installed Edge or Chrome) opens the cartoon in
 * export mode, renders the soundtrack offline, then steps through the timeline frame by
 * frame taking a screenshot of each one. ffmpeg joins the frames and the sound into an MP4.
 * Nothing is recorded in real time, so the video is perfectly smooth on any computer.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const option = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const episode = option('episode', 'demo');
const fps = Number(option('fps', 30));
const out = resolve(root, option('out', `exports/${episode}.mp4`));
const jsonProgress = process.argv.includes('--progress-json');

/** Progress for humans (one updating line) or for the dev server's Export button (`@@progress {…}` lines). */
function report(stage, done = 0, total = 1) {
  if (jsonProgress) {
    console.log(`@@progress ${JSON.stringify({ stage, done, total })}`);
  } else if (stage === 'video') {
    process.stdout.write(`\rrendering video… ${Math.round((done / total) * 100)}% (${done}/${total} frames)   `);
  } else {
    console.log(`${stage === 'sound' ? 'rendering sound' : stage}…`);
  }
}

const server = await createServer({ root, logLevel: 'warn', server: { port: 0, strictPort: false } });
await server.listen();
const baseUrl = server.resolvedUrls.local[0];

const browser = await launchBrowser();
const wavPath = join(tmpdir(), `cartoon-audio-${process.pid}.wav`);
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', (error) => console.error('page error:', error.message));
  await page.goto(`${baseUrl}?export&episode=${encodeURIComponent(episode)}`);
  await page.waitForFunction(() => 'exporter' in window, null, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);

  // The episode decides the frame size (landscape or vertical).
  const { width, height, duration } = await page.evaluate(() => {
    const { width, height, duration } = window.exporter;
    return { width, height, duration };
  });
  await page.setViewportSize({ width, height });
  const frames = Math.ceil(duration * fps) + 1;
  console.log(`episode "${episode}": ${width}×${height}, ${duration.toFixed(1)} s, ${frames} frames at ${fps} fps`);

  report('sound');
  const wavBase64 = await page.evaluate(() => window.exporter.renderAudio());
  writeFileSync(wavPath, Buffer.from(wavBase64, 'base64'));

  mkdirSync(dirname(out), { recursive: true });
  const ffmpeg = spawn(ffmpegPath, [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(fps), '-i', '-',
    '-i', wavPath,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-movflags', '+faststart',
    out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const finished = new Promise((ok, fail) =>
    ffmpeg.on('close', (code) => (code === 0 ? ok() : fail(new Error(`ffmpeg exited with code ${code}`)))));

  const started = Date.now();
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.exporter.seek(t), Math.min(i / fps, duration));
    const png = await page.screenshot({ type: 'png' });
    if (!ffmpeg.stdin.write(png)) await new Promise((ok) => ffmpeg.stdin.once('drain', ok));
    if (i % 10 === 0 || i === frames - 1) report('video', i + 1, frames);
  }
  report('encoding');
  ffmpeg.stdin.end();
  await finished;
  if (jsonProgress) console.log(`@@done ${JSON.stringify({ file: out })}`);
  else console.log(`\ndone in ${((Date.now() - started) / 1000).toFixed(0)} s → ${out}`);
} finally {
  await browser.close();
  await server.close();
  rmSync(wavPath, { force: true });
}

/** Use an installed Edge or Chrome, so no browser download is needed. */
async function launchBrowser() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {
      // try the next one
    }
  }
  throw new Error('Microsoft Edge or Google Chrome must be installed to export videos.');
}
