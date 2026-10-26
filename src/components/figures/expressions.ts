/**
 * Facial expressions for portrait figures, drawn in the portrait's own 680 × 880 coordinates.
 * Eyes and brows are generated from the traced neutral landmarks (eye corners, brow ends), so the
 * likeness and asymmetry stay; mouths are drawn per player (see `FaceSpec.mouths`).
 */
import { uid } from '@/engine';
import { f, type Point } from './paint';

export const FIGURE_EXPRESSIONS = ['neutral', 'happy', 'laugh', 'smug', 'angry', 'sad', 'shocked', 'determined'] as const;
export type FigureExpression = (typeof FIGURE_EXPRESSIONS)[number];
/** Every expression but 'neutral', which is the traced portrait itself. */
export type DrawnFigureExpression = Exclude<FigureExpression, 'neutral'>;

export interface EyeShape {
  /** Height of the upper and lower lid curves (bigger = more open). Negative `low` lifts the lower lid. */
  up: number;
  low: number;
  /** Lower (+) or raise (−) the upper lid at the inner / outer corner: angry, sad. */
  innerDrop?: number;
  outerDrop?: number;
  iris?: number;
  look?: Point;
  /** Squeezed shut, as a happy arc. */
  closed?: boolean;
}

export interface BrowShape {
  /** Move the inner and outer ends (+ = down). `pinch` pulls the inner end towards the nose. */
  inner: number;
  outer: number;
  arch: number;
  pinch?: number;
}

/** Eyes and brows of one expression: [screen-left, screen-right]. */
export interface EyesAndBrows {
  eyes: [EyeShape, EyeShape];
  brows: [BrowShape, BrowShape];
}

/** An eyelid for blinking: drawn closed, scaled from 0 at `pivot` (the top of the eye). */
export interface Lid {
  pivot: Point;
  /** Skin-colored shape covering the open eye. */
  cover: string;
  /** Lash line of the closed eye. */
  lash: string;
}

/** Everything a player's portrait needs for expressions, blinking and talking (portrait coordinates). */
export interface FaceSpec {
  /** Traced neutral landmarks: [outer, inner] corners of each eye and ends of each brow. */
  leftEye: [Point, Point];
  rightEye: [Point, Point];
  leftBrow: [Point, Point];
  rightBrow: [Point, Point];
  colors: { line: string; crease: string; brow: string; iris: string; white: string };
  /** Mouth markup per expression; `id` is a fresh id for a clip path. */
  mouths: Record<DrawnFigureExpression, (id: string) => string>;
  /** Override the default eye and brow shapes of some expressions. */
  shapes?: Partial<Record<DrawnFigureExpression, EyesAndBrows>>;
  lids: [Lid, Lid];
  /** Wide-open talking mouth, drawn over any expression; scaled from 0 at `pivot` (the upper lip). */
  talk: { pivot: Point; markup: (id: string) => string };
}

/** Default eye and brow shapes, tuned on the Mbappé M1 portrait. */
export const DEFAULT_SHAPES: Record<DrawnFigureExpression, EyesAndBrows> = {
  happy: {
    brows: [{ inner: -8, outer: -8, arch: 20 }, { inner: -8, outer: -10, arch: 20 }],
    eyes: [{ up: 20, low: -4 }, { up: 18, low: -6 }],
  },
  laugh: {
    brows: [{ inner: -18, outer: -10, arch: 24 }, { inner: -18, outer: -12, arch: 24 }],
    eyes: [{ up: 18, low: 0, closed: true }, { up: 18, low: 0, closed: true }],
  },
  smug: {
    brows: [{ inner: 8, outer: 6, arch: 10 }, { inner: -20, outer: -34, arch: 26 }],
    eyes: [{ up: 10, low: 8, look: [10, 2] }, { up: 16, low: 8, look: [10, 2] }],
  },
  angry: {
    brows: [{ inner: 34, outer: -6, arch: 2, pinch: 14 }, { inner: 34, outer: -8, arch: 2, pinch: 14 }],
    eyes: [{ up: 22, low: 8, innerDrop: 18, iris: 0.9 }, { up: 22, low: 8, innerDrop: 18, iris: 0.9 }],
  },
  sad: {
    brows: [{ inner: -28, outer: 14, arch: 4 }, { inner: -30, outer: 16, arch: 4 }],
    eyes: [{ up: 20, low: 12, outerDrop: 14, look: [0, 6] }, { up: 18, low: 12, outerDrop: 14, look: [0, 6] }],
  },
  shocked: {
    brows: [{ inner: -36, outer: -30, arch: 24 }, { inner: -36, outer: -34, arch: 24 }],
    eyes: [{ up: 34, low: 20, iris: 0.72 }, { up: 32, low: 20, iris: 0.72 }],
  },
  determined: {
    brows: [{ inner: 20, outer: -2, arch: 6, pinch: 8 }, { inner: 20, outer: -4, arch: 6, pinch: 8 }],
    eyes: [{ up: 16, low: 6, innerDrop: 10 }, { up: 15, low: 6, innerDrop: 10 }],
  },
};

const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const pt = ([x, y]: Point, dx = 0, dy = 0) => `${f(x + dx)} ${f(y + dy)}`;

/** One eye between its outer and inner corner. */
function eye([outer, inner]: [Point, Point], e: EyeShape, c: FaceSpec['colors']): string {
  const { up, low, innerDrop = 0, outerDrop = 0, iris = 1, look = [0, 0], closed = false } = e;
  const a = lerp(outer, inner, 0.22);
  const b = lerp(outer, inner, 0.78);
  if (closed) {
    const arc = `M ${pt(outer, 0, 4)} C ${pt(a, 0, -up)} ${pt(b, 0, -up)} ${pt(inner, 0, 4)}`;
    return `<path d="${arc}" stroke="${c.line}" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M ${pt(outer, 4, 20)} C ${pt(a, 0, 6)} ${pt(b, 0, 6)} ${pt(inner, -4, 20)}" stroke="${c.crease}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>`;
  }
  const upper = `M ${pt(outer)} C ${pt(a, 0, -up + outerDrop)} ${pt(b, 0, -up + innerDrop)} ${pt(inner)}`;
  const shape = `${upper} C ${pt(b, 0, low)} ${pt(a, 0, low)} ${pt(outer)} Z`;
  const mid = lerp(outer, inner, 0.5);
  const top = Math.max(4, up * 0.75 - (innerDrop + outerDrop) * 0.35);
  const center: Point = [mid[0] + look[0], mid[1] - (top - Math.max(0, low * 0.75)) / 2 + look[1]];
  const id = uid('figure-eye');
  const crease = up > 14
    ? `<path d="M ${pt(outer, 8, -16)} C ${pt(a, 0, -up - 14 + outerDrop)} ${pt(b, 0, -up - 14 + innerDrop)} ${pt(inner, -6, -14)}" stroke="${c.crease}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : '';
  return `<clipPath id="${id}"><path d="${shape}"/></clipPath>
    <path d="${shape}" fill="${c.white}"/>
    <g clip-path="url(#${id})">
      <circle cx="${f(center[0])}" cy="${f(center[1])}" r="${f(17 * iris)}" fill="${c.iris}"/>
      <circle cx="${f(center[0])}" cy="${f(center[1])}" r="${f(8.5 * iris)}" fill="#090504"/>
      <circle cx="${f(center[0] + 6)}" cy="${f(center[1] - 6)}" r="5" fill="#fff"/>
      <path d="${upper} L ${pt(inner, 0, -60)} L ${pt(outer, 0, -60)} Z" fill="none" stroke="#000" stroke-width="18" opacity=".18"/>
    </g>
    <path d="${upper}" stroke="${c.line}" stroke-width="8" fill="none" stroke-linecap="round"/>
    ${crease}
    <path d="M ${pt(outer, 12, 16)} C ${pt(a, 0, low + 14)} ${pt(b, 0, low + 14)} ${pt(inner, -10, 14)}" stroke="${c.crease}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`;
}

/** A tapered brow from its outer to its inner end. `side` 1 = screen-left brow. */
function brow([outer, inner]: [Point, Point], b: BrowShape, side: -1 | 1, color: string): string {
  const o: Point = [outer[0], outer[1] + b.outer];
  const i: Point = [inner[0] + side * (b.pinch ?? 0), inner[1] + b.inner];
  const a = lerp(o, i, 0.3);
  const c = lerp(o, i, 0.72);
  return `<path d="M ${pt(o)} C ${pt(a, 0, -b.arch)} ${pt(c, 0, -b.arch)} ${pt(i)} L ${pt(i, -side * 2, 22)} C ${pt(c, 0, -b.arch + 20)} ${pt(a, 0, -b.arch + 16)} ${pt(o, 0, 11)} Z" fill="${color}"/>`;
}

/** Markup for one expression's brows, eyes and mouth. */
export function expressionMarkup(face: FaceSpec, name: DrawnFigureExpression): { brows: string; eyes: string; mouth: string } {
  const { eyes, brows } = face.shapes?.[name] ?? DEFAULT_SHAPES[name];
  return {
    brows: brow(face.leftBrow, brows[0], 1, face.colors.brow) + brow(face.rightBrow, brows[1], -1, face.colors.brow),
    eyes: eye(face.leftEye, eyes[0], face.colors) + eye(face.rightEye, eyes[1], face.colors),
    mouth: face.mouths[name](uid('figure-mouth')),
  };
}
