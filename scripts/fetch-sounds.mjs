/**
 * Fetch sound effects and music from Freesound (https://freesound.org) through its official API.
 * Only CC0 (public-domain) sounds are searched, so they are free to use without attribution –
 * the script still credits every file in CREDITS.md next to it.
 *
 * Setup (once): create a free account, then an API key at https://freesound.org/apiv2/apply,
 * and put it in .env.local (gitignored):
 *   FREESOUND_API_KEY=your-key
 *
 * Usage:
 *   npm run sounds                       download every sound in scripts/sounds.json that's missing
 *   npm run sounds -- --list sfx/poof    show the top matches for one sound (to choose a `pick`)
 *   npm run sounds -- --force sfx/poof   download it again (after changing its query or pick)
 *
 * Each downloaded file is trimmed (silence at both ends, `max` seconds at most, with a short fade)
 * and loudness-normalized, then saved as src/assets/sounds/<name>.mp3. A quiet recording that gets
 * cut too short needs a lower `silence` threshold (default −45 dB).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpeg from 'ffmpeg-static';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const soundsDir = join(root, 'src/assets/sounds');
const API = 'https://freesound.org/apiv2';

function apiKey() {
  if (process.env.FREESOUND_API_KEY) return process.env.FREESOUND_API_KEY;
  const env = join(root, '.env.local');
  if (existsSync(env)) {
    const match = /^FREESOUND_API_KEY=(.+)$/m.exec(readFileSync(env, 'utf8'));
    if (match) return match[1].trim().replace(/^["']|["']$/g, '');
  }
  console.error('No Freesound API key: create one at https://freesound.org/apiv2/apply and add\n  FREESOUND_API_KEY=your-key\nto .env.local');
  process.exit(1);
}

const key = apiKey();
const { sounds } = JSON.parse(readFileSync(join(root, 'scripts/sounds.json'), 'utf8'));
const args = process.argv.slice(2);
const list = args.includes('--list');
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));

async function api(path, params = {}) {
  const url = new URL(`${API}${path}`);
  for (const [k, v] of Object.entries({ ...params, token: key })) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Freesound ${res.status}: ${await res.text()}`);
  return res.json();
}

const FIELDS = 'id,name,username,license,duration,avg_rating,num_ratings,previews,url';

/** Top CC0 matches for a sound's query, best rated first. */
async function search(sound) {
  const [min, max] = sound.duration ?? [0, 30];
  const { results } = await api('/search/text/', {
    query: sound.query,
    filter: `license:"Creative Commons 0" duration:[${min} TO ${max}]`,
    sort: 'rating_desc',
    fields: FIELDS,
    page_size: 10,
  });
  return results;
}

/**
 * Trim silence (quieter than `silence` dB) at both ends, cut to `max` s with a fade, normalize
 * loudness, save as mp3.
 */
function process_(input, output, { max, silence = -45, music = false }) {
  const trim = `silenceremove=start_periods=1:start_threshold=${silence}dB`;
  const filters = music ? [] : [trim, 'areverse', trim, 'areverse'];
  if (max) filters.push(`atrim=0:${max}`, `afade=t=out:st=${Math.max(0, max - 0.15)}:d=0.15`);
  filters.push(`loudnorm=I=${music ? -20 : -16}:TP=-1.5:LRA=11`);
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', input, '-af', filters.join(','), '-ar', '44100', '-b:a', '160k', output]);
}

const credits = new Map(); // folder → rows

for (const sound of sounds) {
  if (only.length && !only.includes(sound.name)) continue;
  const out = join(soundsDir, `${sound.name}.mp3`);

  if (list) {
    console.log(`\n${sound.name}  ("${sound.query}")`);
    for (const r of await search(sound)) {
      console.log(`  ${String(r.id).padEnd(8)} ${r.duration.toFixed(1).padStart(5)}s  ★${(r.avg_rating ?? 0).toFixed(1)} (${r.num_ratings})  ${r.name} – ${r.username}`);
    }
    continue;
  }

  let chosen;
  if (sound.pick) chosen = await api(`/sounds/${sound.pick}/`, { fields: FIELDS });
  else chosen = (await search(sound))[0];
  if (!chosen) {
    console.warn(`no CC0 match for ${sound.name} ("${sound.query}") – try another query`);
    continue;
  }
  if (!/creativecommons\.org\/publicdomain\/zero/.test(chosen.license)) {
    console.warn(`skipped ${sound.name}: #${chosen.id} is not CC0 (${chosen.license})`);
    continue;
  }
  const folder = dirname(sound.name);
  (credits.get(folder) ?? credits.set(folder, []).get(folder)).push({ sound, chosen });

  if (existsSync(out) && !force) {
    console.log(`exists   ${sound.name}`);
    continue;
  }
  const tmp = join(tmpdir(), `freesound-${chosen.id}.mp3`);
  const res = await fetch(chosen.previews['preview-hq-mp3']);
  if (!res.ok) throw new Error(`download of #${chosen.id} failed: ${res.status}`);
  writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
  mkdirSync(dirname(out), { recursive: true });
  process_(tmp, out, { max: sound.max, silence: sound.silence, music: folder === 'music' });
  rmSync(tmp);
  console.log(`fetched  ${sound.name}  ←  #${chosen.id} "${chosen.name}" by ${chosen.username}`);
}

// CREDITS.md per folder, for the sounds in sounds.json (rewritten on full runs only).
if (!list && !only.length) {
  for (const [folder, rows] of credits) {
    const lines = [
      `# ${folder[0].toUpperCase()}${folder.slice(1)}`,
      '',
      'From [Freesound](https://freesound.org), licensed **CC0 1.0** (public domain – free to use, no',
      'attribution required; credited here anyway). Fetched by `npm run sounds`: trimmed and loudness-normalized.',
      '',
      '| File | Freesound sound | Author |',
      '| ---- | --------------- | ------ |',
      ...rows.map(({ sound, chosen }) => `| \`${sound.name.split('/').pop()}.mp3\` | [${chosen.name.replaceAll('|', '/')}](https://freesound.org/s/${chosen.id}/) | ${chosen.username} |`),
      '',
    ];
    writeFileSync(join(soundsDir, folder, 'CREDITS.md'), lines.join('\n'));
  }
}
