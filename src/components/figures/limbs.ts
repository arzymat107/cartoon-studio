/**
 * Smooth two-segment limbs: an arm or leg is one tapered shape along a curve through
 * root → elbow/knee → wrist/ankle, redrawn whenever one of its two joints rotates.
 */
import { Actor, svg } from '@/engine';
import { smoothPath } from '../characters/face';
import { f, Shape, shade, type Look, type Point, type SkinPalette } from './paint';

/** An invisible rig joint: tweening it redraws the limb it belongs to (and anything else listening). */
export class Joint extends Actor {
  readonly listeners: (() => void)[] = [];
  protected override render(): void {
    super.render();
    // Undefined while Actor's constructor runs the first render.
    this.listeners?.forEach((listener) => listener());
  }
}

export interface Cover {
  from: number;
  to: number;
  /** Extra half-width over the limb. */
  extra: number;
  color: string;
  /** Trim line at the cover's open end (or `bandAt` along it, for socks). */
  band?: string;
  bandAt?: number;
  /** Starts with a rounder cap, for a sleeve over the shoulder. */
  shoulder?: boolean;
}

export interface LimbSpec {
  names: [string, string];
  root: Point;
  lengths: [number, number];
  rest: [number, number];
  skin: SkinPalette;
  /** Half-width along the limb: [u (0 = root, 1 = tip), width]. */
  widths: [number, number][];
  covers: Cover[];
  /** Draws the hand / boot into a group, pointing down from the wrist / ankle. */
  end: (g: SVGGElement, look: Look) => void;
  /** How much the hand / boot turns with the lower segment (1 = fully). */
  endTurn: number;
  /** Boots go over the sock; hands go under the arm. */
  endOnTop: boolean;
}

/** Two joints (upper and lower) drawn as one shape, with sleeve or sock covers and a hand or boot. */
export class Limb {
  readonly joints: [Joint, Joint];
  private readonly skin: Shape;
  private readonly covers: { cover: Cover; shape: Shape; band?: SVGPathElement }[];
  private readonly endGroup: SVGGElement;

  constructor(parent: Actor, look: Look, private readonly spec: LimbSpec) {
    const upper = new Joint({ name: spec.names[0], rotation: spec.rest[0] });
    const lower = new Joint({ name: spec.names[1], rotation: spec.rest[1] });
    this.joints = [upper, lower];
    const layer = parent.draw('g');
    this.endGroup = svg('g');
    spec.end(this.endGroup, look);
    if (!spec.endOnTop) layer.appendChild(this.endGroup);
    this.skin = new Shape(layer, spec.skin.base, spec.skin.shade, 5, look);
    this.covers = spec.covers.map((cover) => ({
      cover,
      shape: new Shape(layer, cover.color, shade(cover.color, 0.17), 7, look),
      band: cover.band ? layer.appendChild(svg('path', { stroke: cover.band, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' })) : undefined,
    }));
    if (spec.endOnTop) layer.appendChild(this.endGroup);
    upper.listeners.push(() => this.update());
    lower.listeners.push(() => this.update());
    this.update();
  }

  private update(): void {
    const { root: S, lengths: [l1, l2], widths, endTurn } = this.spec;
    const a1 = rad(this.joints[0].rotation);
    const a2 = a1 + rad(this.joints[1].rotation);
    const E: Point = [S[0] - Math.sin(a1) * l1, S[1] + Math.cos(a1) * l1];
    const W: Point = [E[0] - Math.sin(a2) * l2, E[1] + Math.cos(a2) * l2];
    const curve = new Curve(S, E, W, l1 / (l1 + l2));
    const width = (u: number) => interpolate(widths, u);

    this.skin.set(curve.outline(0, 1, width));
    for (const { cover, shape, band } of this.covers) {
      shape.set(curve.outline(cover.from, cover.to, (u) => width(u) + cover.extra, cover.shoulder));
      if (band) {
        const at = cover.bandAt !== undefined ? cover.from + cover.bandAt : cover.to - 0.015;
        const { p, n } = curve.at(at);
        const w = width(at) + cover.extra - 1;
        band.setAttribute('d', `M ${f(p[0] + n[0] * w)} ${f(p[1] + n[1] * w)} L ${f(p[0] - n[0] * w)} ${f(p[1] - n[1] * w)}`);
      }
    }
    this.endGroup.setAttribute('transform', `translate(${f(W[0])} ${f(W[1])}) rotate(${f(deg(a2) * endTurn)})`);
  }
}

/** Smooth curve root → joint → tip (Hermite segments meeting at the joint), parameterized 0–1 by length. */
export class Curve {
  constructor(private readonly S: Point, private readonly E: Point, private readonly W: Point, private readonly split: number) {}

  /** Point and unit normal at `u`. */
  at(u: number): { p: Point; n: Point } {
    const { S, E, W, split } = this;
    const mid: Point = [(W[0] - S[0]) / 2, (W[1] - S[1]) / 2];
    const [P0, P1, T0, T1, t]: [Point, Point, Point, Point, number] = u <= split
      ? [S, E, [E[0] - S[0], E[1] - S[1]], mid, u / split]
      : [E, W, mid, [W[0] - E[0], W[1] - E[1]], (u - split) / (1 - split)];
    const t2 = t * t;
    const t3 = t2 * t;
    const h = [2 * t3 - 3 * t2 + 1, t3 - 2 * t2 + t, -2 * t3 + 3 * t2, t3 - t2];
    const d = [6 * t2 - 6 * t, 3 * t2 - 4 * t + 1, -6 * t2 + 6 * t, 3 * t2 - 2 * t];
    const mix = (k: number[], i: 0 | 1) => k[0] * P0[i] + k[1] * T0[i] + k[2] * P1[i] + k[3] * T1[i];
    const tx = mix(d, 0);
    const ty = mix(d, 1);
    const len = Math.hypot(tx, ty) || 1;
    return { p: [mix(h, 0), mix(h, 1)], n: [-ty / len, tx / len] };
  }

  /** Closed outline between `from` and `to`, with rounded ends. */
  outline(from: number, to: number, width: (u: number) => number, roundStart = false): string {
    const steps = 14;
    const left: Point[] = [];
    const right: Point[] = [];
    for (let i = 0; i <= steps; i++) {
      const u = from + ((to - from) * i) / steps;
      const { p, n } = this.at(u);
      const w = width(u);
      left.push([p[0] + n[0] * w, p[1] + n[1] * w]);
      right.push([p[0] - n[0] * w, p[1] - n[1] * w]);
    }
    // Rounded end: a point beyond the end along the curve (sign 1 = forwards, −1 = backwards).
    const cap = (u: number, sign: number, size: number): Point => {
      const { p, n } = this.at(u);
      const w = width(u) * size;
      return [p[0] + n[1] * w * sign, p[1] - n[0] * w * sign];
    };
    return smoothPath([...left, cap(to, 1, 0.55), ...right.reverse(), cap(from, -1, roundStart ? 0.9 : 0.55)]);
  }
}

function interpolate(table: [number, number][], u: number): number {
  for (let i = 1; i < table.length; i++) {
    const [u0, w0] = table[i - 1];
    const [u1, w1] = table[i];
    if (u <= u1) {
      const t = (u - u0) / (u1 - u0);
      return w0 + (w1 - w0) * t * t * (3 - 2 * t);
    }
  }
  return table[table.length - 1][1];
}

/** Relaxed open hand pointing down from the wrist, the thumb on the body side. */
export function hand(side: -1 | 1, size: number, skin: SkinPalette) {
  return (g: SVGGElement, look: Look) => {
    const s = -side;
    const inner = g.appendChild(svg('g', { transform: `scale(${size})` }));
    new Shape(inner, skin.base, skin.shade, 3, look).set(smoothPath([[s * 4, -2], [s * 11, 6], [s * 12, 13], [s * 8, 14], [s * 4, 8]]));
    new Shape(inner, skin.base, skin.shade, 3, look)
      .set(smoothPath([[-6, -3], [-8.5, 6], [-8.5, 15], [-7, 22], [-3.5, 25], [0.5, 25.5], [4.5, 24], [7.5, 19], [8.5, 11], [8, 3], [6, -3]]));
    for (const x of [-3.5, 0.5, 4.5]) {
      inner.appendChild(svg('path', { d: `M ${x} 17 L ${x + 0.3} 24`, stroke: skin.deep, 'stroke-width': 1, 'stroke-linecap': 'round', opacity: 0.7 }));
    }
  };
}

/** Football (or riding) boot under the ankle, toes pointing outwards. */
export function boot(side: -1 | 1, size: number, color: string) {
  return (g: SVGGElement, look: Look) => {
    const inner = g.appendChild(svg('g', { transform: `scale(${size})` }));
    new Shape(inner, color, shade(color, 0.5), 5, look).set(smoothPath([[-10, -8], [-14, 6], [side * 7 - 16, 13], [side * 7 + 16, 13], [14, 6], [10, -8]]));
    inner.appendChild(svg('path', { d: `M ${side * 3 - 8} 4 L ${side * 3 + 8} 4`, stroke: 'rgba(255,255,255,0.35)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  };
}

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
