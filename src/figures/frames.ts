/**
 * A body animated with whole drawn frames (meta.ai), played at 12 fps: the frame-by-frame
 * counterpart of CutoutFigure.
 *
 *   const man = new FrameFigure('normal', { x: 160, y: GROUND, scale: 2.4 })            // walk/
 *   const man = new FrameFigure('normal', { set: 'walk/redraw', x: 160, y: GROUND })   // walk/redraw/
 *   tl.add(walkFrames(man, { to: 860 }))
 *
 * The frames live in data-for-cartoons/bodies/<body>/<set>/ (cut out and lined up on one canvas
 * by walk/frames.py or walk/redraw.py; `anchor` is the figure origin on that canvas),
 * with frames.json: canvas, anchor, fps, the frame files, the standing picture, the step length
 * and the standing height in picture pixels. Figure units match CutoutFigure (about 372 tall,
 * origin on the ground), so the same `scale` gives the same size.
 */
import { gsap } from 'gsap';
import { Actor, svg, type ActorOptions, type Timeline } from '@/engine';

interface FramesInfo {
  canvas: [number, number];
  anchor: [number, number];
  fps: number;
  frames: { file: string }[];
  stand: string;
  step: number;
  height: number;
}

const pngs = import.meta.glob<string>('@bodies/**/*.png', { eager: true, import: 'default', query: '?url' });
const infos = import.meta.glob<FramesInfo>('@bodies/**/frames.json', { eager: true, import: 'default' });

function find<T>(files: Record<string, T>, suffix: string): T {
  const key = Object.keys(files).find((k) => k.endsWith(suffix));
  if (!key) throw new Error(`Walk frame file ${suffix} is missing (data-for-cartoons/bodies, made with walk frames.py).`);
  return files[key];
}

const HEIGHT = 372;

export class FrameFigure extends Actor {
  readonly info: FramesInfo;
  /** Picture pixels → figure units. */
  readonly k: number;
  private readonly images: SVGImageElement[] = [];
  private readonly standing: SVGImageElement;
  private shown?: SVGImageElement;

  constructor(bodyName: string, { set = 'walk', ...options }: ActorOptions & { set?: string } = {}) {
    super({ name: `${bodyName}-${set.replace('/', '-')}`, ...options });
    this.info = find(infos, `/${bodyName}/${set}/frames.json`);
    const { canvas, anchor, frames, stand, height } = this.info;
    this.k = HEIGHT / height;
    const g = this.draw('g', { transform: `scale(${this.k}) translate(${-anchor[0]} ${-anchor[1]})` });
    // Every drawing is in the page from the start (only one visible), so a frame never waits to load.
    const image = (file: string) => g.appendChild(svg('image', {
      href: find(pngs, `/${bodyName}/${set}/${file}`), width: canvas[0], height: canvas[1], visibility: 'hidden',
    })) as SVGImageElement;
    this.standing = image(stand);
    for (const f of frames) this.images.push(image(f.file));
    this.show(-1);
  }

  /** Show walk frame `i` (wrapping round the cycle), or the standing picture for −1. */
  show(i: number): void {
    const next = i < 0 ? this.standing : this.images[i % this.images.length];
    if (next === this.shown) return;
    this.shown?.setAttribute('visibility', 'hidden');
    next.setAttribute('visibility', 'visible');
    this.shown = next;
  }
}

/**
 * Walk from where he stands (or `from`) to `to`: the frames loop at their fps and he moves on in
 * the same steps (12 times a second), a cycle (two steps) further every cycle, so the feet stay
 * put. Stands (the standing picture) before and after.
 */
export function walkFrames(fig: FrameFigure, { to, from = fig.x }: { to: number; from?: number }): Timeline {
  const { fps, frames, step } = fig.info;
  const scale = Math.abs(fig.scaleY);
  const dir = Math.sign(to - from) || 1;
  const distance = Math.abs(to - from);
  // Stage px per frame: two steps per cycle of `frames.length` frames.
  const perFrame = (2 * step * fig.k * scale) / frames.length;
  const count = Math.max(1, Math.round(distance / perFrame));
  const duration = count / fps;

  // `f` counts frames (0 → count), not seconds: GSAP rounds tweened values to 4 decimals, so a
  // time like 22/12 s would land just short of the last frame and he'd never stand.
  const pose = (f: number) => {
    const i = Math.floor(f + 1e-3);
    if (f <= 0 || i >= count) {
      fig.show(-1);
      fig.x = f <= 0 ? from : to;
      return;
    }
    fig.show(i);
    fig.x = from + dir * distance * (i / count);
  };
  // A setter, not onUpdate: seeking a timeline with suppressed events still poses the figure.
  let frame = 0;
  const clock = {
    get f() { return frame; },
    set f(value: number) { frame = value; pose(value); },
  };
  return gsap.timeline()
    .set(fig, { scaleX: dir * scale })
    .fromTo(clock, { f: 0 }, { f: count, duration, ease: 'none', immediateRender: false });
}
