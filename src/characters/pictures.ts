/**
 * The character library: every meta.ai picture in src/assets/characters/, described in
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
import { Actor, svg, type Timeline } from '@/engine';
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

const files = import.meta.glob<string>(['/src/assets/characters/*/*.png', '!/src/assets/characters/*/*.orig.png'], {
  eager: true, import: 'default', query: '?url',
});

export function pictureInfo(id: PictureId): PictureInfo {
  return library.pictures[id] as unknown as PictureInfo;
}

/** URL of a picture. The pictures are git-ignored, so a fresh checkout may not have them. */
export function pictureUrl(id: PictureId): string {
  const { file } = pictureInfo(id);
  const url = files[`/src/assets/characters/${file}`];
  if (!url) throw new Error(`Character picture src/assets/characters/${file} is missing (pictures are git-ignored and live only on the machine that made them).`);
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
