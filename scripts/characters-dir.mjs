/**
 * Where the character pictures live. They're kept outside this (public) repo, in the private
 * data-for-cartoons repo next to it:
 *
 *   ~/projects/data-for-cartoons/characters/<Name>/<name>_<pose>.png      cleaned, used here
 *   ~/projects/data-for-cartoons/characters/<Name>/raw/<name>_<pose>.png  meta.ai originals
 *
 * Another place can be set in .env.local:  CHARACTERS_DIR=/path/to/characters
 *
 * Sounds that can't be published here (not CC0) live next to it, in data-for-cartoons/sounds/.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function charactersDir() {
  let dir = process.env.CHARACTERS_DIR;
  const env = join(root, '.env.local');
  if (!dir && existsSync(env)) dir = /^CHARACTERS_DIR=(.+)$/m.exec(readFileSync(env, 'utf8'))?.[1].trim().replace(/^["']|["']$/g, '');
  return resolve(root, dir || '../data-for-cartoons/characters');
}

/** data-for-cartoons/sounds/ – private sounds, loaded like src/assets/sounds/ (`@private-sounds`). */
export function privateSoundsDir() {
  return resolve(charactersDir(), '../sounds');
}
