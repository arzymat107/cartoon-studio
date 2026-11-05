/**
 * The character library at a glance: who we have, every pose and face, and what's missing.
 *
 *   npm run characters                  list every character and picture (✗ = file missing)
 *   npm run characters -- sitting       only pictures matching all the words (pose, face, view, name…)
 *   npm run characters -- --sheet Ole   also make exports/contact-sheet.png of the listed pictures
 *
 * It also lists pictures on disk that library.json doesn't describe yet: add them before using them.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { charactersDir } from './characters-dir.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = charactersDir();
const library = JSON.parse(readFileSync(join(root, 'src/characters/library.json'), 'utf8'));
const args = process.argv.slice(2);
const sheet = args.includes('--sheet');
const words = args.filter((a) => a !== '--sheet').map((w) => w.toLowerCase());

const matches = Object.entries(library.pictures).filter(([id, p]) => {
  const text = [id, p.character, p.body, p.view, p.face, p.notes ?? '', ...(p.usedIn ?? [])].join(' ').toLowerCase();
  return words.every((w) => text.includes(w));
});

for (const [name, c] of Object.entries(library.characters)) {
  const pics = matches.filter(([, p]) => p.character === name);
  if (!pics.length) continue;
  console.log(`\n${name} – ${c.who}\n  ${c.look}`);
  for (const [id, p] of pics) {
    const ok = existsSync(join(dir, p.file)) ? ' ' : '✗';
    const points = Object.keys(p.points).join(', ');
    console.log(`  ${ok} ${id.padEnd(20)} ${p.body.padEnd(22)} ${p.view.padEnd(20)} ${p.face}  [${points}]${p.styleRef ? `  style: ${p.styleRef}` : ''}`);
  }
}
if (!matches.length) console.log('No picture matches – it may need generating (see the make-short skill).');

console.log(`\nPictures folder: ${dir}`);
const known = new Set(Object.values(library.pictures).map((p) => p.file));
const extra = existsSync(dir)
  ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).flatMap((d) =>
      readdirSync(join(dir, d.name)).filter((f) => f.endsWith('.png') && !f.endsWith('.orig.png')).map((f) => `${d.name}/${f}`))
      .filter((f) => !known.has(f))
  : [];
if (extra.length) console.log(`\nNot in src/characters/library.json yet:\n${extra.map((f) => `  + ${f}`).join('\n')}`);
const missing = matches.filter(([, p]) => !existsSync(join(dir, p.file)));
if (missing.length) console.log(`\n✗ ${missing.length} picture(s) missing from ${dir} – clone or pull the private data-for-cartoons repo next to this one.`);

if (sheet) {
  const files = matches.map(([, p]) => join(dir, p.file)).filter((f) => existsSync(f));
  execFileSync('python3', [join(root, 'scripts/contact-sheet.py'), ...files], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] });
  console.log('\nexports/contact-sheet.png');
}
