/**
 * The character library: every meta.ai picture in the characters folder (`@characters`, kept in
 * the private data-for-cartoons repo – see scripts/characters-dir.mjs), described in
 * library.json (who, pose, face, which way they face, measured anchor points), plus the
 * pieces to turn pictures into puppets.
 *
 *   picture('carrick_sweat')            an SVG group with the picture's anchor at (0, 0)
 *   point('bruno_extinguisher', 'nozzle')  a named point, relative to the anchor
 *   new PoseRig('Bruno', { holding: 'bruno_extinguisher', proud: 'bruno_proud' }, 'holding')
 *
 * Before generating a new picture in meta.ai, look here (or run `npm run characters`): flip,
 * swap a face, or reuse a pose with different motion first.
 */
import { Actor, svg, uid, type Timeline } from '@/engine';
import library from './library.json';

export type PictureId = keyof typeof library.pictures;
export type CharacterName = keyof typeof library.characters;
export interface PictureInfo {
  character: CharacterName;
  file: string;
  size: [number, number];
  body: string;
  view: string;
  face: string;
  anchor: string;
  points: Record<string, [number, number]>;
  styleRef?: PictureId;
  notes?: string;
  usedIn: string[];
}

const found = import.meta.glob<string>(['@characters/*/*.png', '!@characters/*/*.orig.png'], {
  eager: true, import: 'default', query: '?url',
});
/** Picture URLs by catalog file name (`<Name>/<file>.png`). */
const files = new Map(Object.entries(found).map(([path, url]) => [path.split('/').slice(-2).join('/'), url]));

export function pictureInfo(id: PictureId): PictureInfo {
  return library.pictures[id] as unknown as PictureInfo;
}

/** URL of a picture. The pictures are git-ignored, so a fresh checkout may not have them. */
export function pictureUrl(id: PictureId): string {
  const { file } = pictureInfo(id);
  const url = files.get(file);
  if (!url) throw new Error(`Character picture ${file} is missing from the characters folder (data-for-cartoons/characters, or CHARACTERS_DIR in .env.local).`);
  return url;
}

/** A named point of a picture, relative to its anchor (or to another point). */
export function point(id: PictureId, name: string, from = pictureInfo(id).anchor): [number, number] {
  const { points } = pictureInfo(id);
  const p = points[name];
  const o = points[from];
  if (!p || !o) throw new Error(`${id} has no point "${p ? from : name}"`);
  return [p[0] - o[0], p[1] - o[1]];
}

/** The whole picture, placed so its anchor (or point `at`) sits on (0, 0). */
export function picture(id: PictureId, at?: string): SVGGElement {
  const info = pictureInfo(id);
  const [ox, oy] = info.points[at ?? info.anchor];
  const g = svg('g', { transform: `translate(${-ox} ${-oy})` });
  g.appendChild(svg('image', { href: pictureUrl(id), width: info.size[0], height: info.size[1] }));
  return g;
}

/**
 * The whole picture with a rectangular hole cut out (picture pixels `[x0, y0, x1, y1]`), placed
 * like picture(). Layer it over a similar picture to swap everything except that spot – e.g. a
 * new face over a body whose arm differs.
 */
export function pictureWithout(id: PictureId, [x0, y0, x1, y1]: [number, number, number, number]): SVGGElement {
  const info = pictureInfo(id);
  const [w, h] = info.size;
  const [ox, oy] = info.points[info.anchor];
  const clip = uid('hole');
  const g = svg('g', { transform: `translate(${-ox} ${-oy})` });
  g.appendChild(svg('clipPath', { id: clip })).appendChild(svg('path', {
    d: `M 0 0 H ${w} V ${h} H 0 Z M ${x0} ${y0} V ${y1} H ${x1} V ${y0} Z`, 'clip-rule': 'evenodd',
  }));
  g.appendChild(svg('image', { href: pictureUrl(id), width: w, height: h, 'clip-path': `url(#${clip})` }));
  return g;
}

/**
 * A puppet made of several pictures of one character, showing one at a time. Every picture is
 * placed by its anchor, so the body stays put when the pose or face changes.
 * A pose is a picture id, or a list of SVG parts for something composed (e.g. a head swap).
 */
export class PoseRig<P extends string> extends Actor {
  private readonly poses = new Map<P, Actor>();

  constructor(name: string, poses: Record<P, PictureId | SVGGElement[]>, first: P, options: { x?: number; y?: number; scale?: number; opacity?: number } = {}) {
    super({ name, ...options });
    for (const [pose, source] of Object.entries(poses) as [P, PictureId | SVGGElement[]][]) {
      const actor = new Actor({ name: pose, opacity: pose === first ? 1 : 0 });
      for (const part of typeof source === 'string' ? [picture(source)] : source) actor.el.appendChild(part);
      this.poses.set(pose, actor);
      this.add(actor);
    }
  }

  /** Switch to `pose` at time `at` (an instant cut, like a cartoon drawing change). */
  show(tl: Timeline, pose: P, at: number): void {
    for (const [name, actor] of this.poses) tl.set(actor, { opacity: name === pose ? 1 : 0 }, at);
  }
}
