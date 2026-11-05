/**
 * Renders still frames of an episode at chosen times, plus one contact sheet of all of them –
 * the quick way to check every beat of a cartoon without exporting the whole video.
 *
 *   npm run frames -- --episode hot-seat 2.4 5 9.3 17.8
 *
 * Writes exports/frames/<episode>/t<time>.png and exports/frames/<episode>/sheet.png
 * (frames side by side, 6 per row, labelled with their time). On a vertical episode the sheet
 * shades the phone's overlay zones (SAFE below) in red: nothing important may sit there.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

/**
 * Parts of a vertical 1080×1920 Short that phones cover with YouTube's own interface
 * (as fractions of the frame, so they scale with the size):
 *   top     status bar / camera island, search and back buttons
 *   bottom  channel name, subscribe, title, hashtags, sound
 *   right   like / dislike / comment / share / remix buttons, from the middle down
 */
const SAFE = { top: 250 / 1920, bottom: 500 / 1920, right: 180 / 1080, rightFrom: 960 / 1920 };

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const at = args.indexOf('--episode');
const episode = at > -1 ? args.splice(at, 2)[1] : 'demo';
const times = args.map(Number).filter((t) => Number.isFinite(t));
if (!times.length) {
  console.error('usage: npm run frames -- --episode <name> <time> [time…]');
  process.exit(1);
}
const outDir = join(root, 'exports/frames', episode);
mkdirSync(outDir, { recursive: true });

const server = await createServer({ root, logLevel: 'warn', server: { port: 0, strictPort: false } });
await server.listen();
const browser = await launchBrowser();
const files = [];
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (error) => console.error('page error:', error.message));
  await page.goto(`${server.resolvedUrls.local[0]}?export&episode=${encodeURIComponent(episode)}`);
  await page.waitForFunction(() => 'exporter' in window, null, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  const { width, height, duration } = await page.evaluate(() => {
    const { width, height, duration } = window.exporter;
    return { width, height, duration };
  });
  await page.setViewportSize({ width, height });
  for (const t of times) {
    await page.evaluate((time) => window.exporter.seek(time), Math.min(t, duration));
    const file = join(outDir, `t${t}.png`);
    await page.screenshot({ path: file });
    files.push({ t, file });
    console.log(file);
  }

  // Contact sheet: the frames side by side, 6 per row, each labelled with its time.
  const cols = Math.min(6, files.length);
  const pct = (v) => `${(v * 100).toFixed(2)}%`;
  const zones = height > width ? [
    `top:0;left:0;right:0;height:${pct(SAFE.top)}`,
    `bottom:0;left:0;right:0;height:${pct(SAFE.bottom)}`,
    `top:${pct(SAFE.rightFrom)};bottom:${pct(SAFE.bottom)};right:0;width:${pct(SAFE.right)}`,
  ].map((style) => `<i style="${style}"></i>`).join('') : '';
  const cells = files.map(({ t, file }) =>
    `<figure><img src="data:image/png;base64,${readFileSync(file).toString('base64')}">${zones}<figcaption>${t} s</figcaption></figure>`).join('');
  await page.setViewportSize({ width: cols * 366 + 6, height: 400 });
  await page.setContent(`<style>
    body { margin: 0; padding: 6px; background: #fff; display: grid; grid-template-columns: repeat(${cols}, 360px); gap: 6px; }
    figure { margin: 0; position: relative; } img { width: 360px; display: block; }
    i { position: absolute; background: #ff000040; outline: 2px dashed #ff0000a0; outline-offset: -2px; }
    figcaption { position: absolute; top: 54px; left: 8px; padding: 2px 8px; font: bold 26px sans-serif; color: #fff; background: #000a; }
  </style>${cells}`);
  await page.screenshot({ path: join(outDir, 'sheet.png'), fullPage: true });
  console.log(join(outDir, 'sheet.png'));
} finally {
  await browser.close();
  await server.close();
}

async function launchBrowser() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {
      // try the next one
    }
  }
  throw new Error('Microsoft Edge or Google Chrome must be installed to render frames.');
}
