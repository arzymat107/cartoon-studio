/**
 * Facial expressions for the M1 portrait, drawn in its own 680 × 880 coordinates.
 * Every expression is a set of brows, eyes and mouth built from the traced neutral features
 * (eye corners, brow ends, mouth corners), so the likeness and the asymmetry stay.
 */
import { uid } from '@/engine';

export const MBAPPE_EXPRESSIONS = ['neutral', 'happy', 'laugh', 'smug', 'angry', 'sad', 'shocked', 'determined'] as const;
export type MbappeExpression = (typeof MBAPPE_EXPRESSIONS)[number];

type Point = [number, number];

const LINE = '#2b1a12';
const SHADE = '#8a5638';
const DEEP = '#64381f';
const BROW = '#141010';
const LIP = '#a5604c';
const UPPER_LIP = '#7d4434';
const MOUTH = '#3a0e0b';

interface EyeShape {
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

interface BrowShape {
  /** Move the inner and outer ends (+ = down). `pinch` pulls the inner end towards the nose. */
  inner: number;
  outer: number;
  arch: number;
  pinch?: number;
}

interface Expression {
  brows: [BrowShape, BrowShape];
  eyes: [EyeShape, EyeShape];
  mouth: (id: string) => string;
}

// Traced neutral features: [outer, inner] corners for the screen-left eye/brow, [inner, outer] for the right.
const LEFT_EYE: [Point, Point] = [[160, 442], [264, 438]];
const RIGHT_EYE: [Point, Point] = [[502, 414], [396, 428]];
const LEFT_BROW: [Point, Point] = [[152, 396], [297, 366]];
const RIGHT_BROW: [Point, Point] = [[533, 345], [398, 372]];

const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const f = (n: number) => n.toFixed(1);
const pt = ([x, y]: Point, dx = 0, dy = 0) => `${f(x + dx)} ${f(y + dy)}`;

/** One eye between its outer and inner corner. */
function eye([outer, inner]: [Point, Point], e: EyeShape): string {
  const { up, low, innerDrop = 0, outerDrop = 0, iris = 1, look = [0, 0], closed = false } = e;
  const a = lerp(outer, inner, 0.22);
  const b = lerp(outer, inner, 0.78);
  if (closed) {
    const arc = `M ${pt(outer, 0, 4)} C ${pt(a, 0, -up)} ${pt(b, 0, -up)} ${pt(inner, 0, 4)}`;
    return `<path d="${arc}" stroke="${LINE}" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M ${pt(outer, 4, 20)} C ${pt(a, 0, 6)} ${pt(b, 0, 6)} ${pt(inner, -4, 20)}" stroke="${SHADE}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>`;
  }
  const upper = `M ${pt(outer)} C ${pt(a, 0, -up + outerDrop)} ${pt(b, 0, -up + innerDrop)} ${pt(inner)}`;
  const shape = `${upper} C ${pt(b, 0, low)} ${pt(a, 0, low)} ${pt(outer)} Z`;
  const mid = lerp(outer, inner, 0.5);
  const top = Math.max(4, up * 0.75 - (innerDrop + outerDrop) * 0.35);
  const c: Point = [mid[0] + look[0], mid[1] - (top - Math.max(0, low * 0.75)) / 2 + look[1]];
  const id = uid('mbappe-eye');
  const crease = up > 14 ? `<path d="M ${pt(outer, 8, -16)} C ${pt(a, 0, -up - 14 + outerDrop)} ${pt(b, 0, -up - 14 + innerDrop)} ${pt(inner, -6, -14)}" stroke="${SHADE}" stroke-width="4" fill="none" stroke-linecap="round"/>` : '';
  return `<clipPath id="${id}"><path d="${shape}"/></clipPath>
    <path d="${shape}" fill="#f3ece3"/>
    <g clip-path="url(#${id})">
      <circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(17 * iris)}" fill="#2e1a10"/>
      <circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(8.5 * iris)}" fill="#090504"/>
      <circle cx="${f(c[0] + 6)}" cy="${f(c[1] - 6)}" r="5" fill="#fff"/>
      <path d="${upper} L ${pt(inner, 0, -60)} L ${pt(outer, 0, -60)} Z" fill="none" stroke="#000" stroke-width="18" opacity=".18"/>
    </g>
    <path d="${upper}" stroke="${LINE}" stroke-width="8" fill="none" stroke-linecap="round"/>
    ${crease}
    <path d="M ${pt(outer, 12, 16)} C ${pt(a, 0, low + 14)} ${pt(b, 0, low + 14)} ${pt(inner, -10, 14)}" stroke="${SHADE}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`;
}

/** A tapered brow from its outer to its inner end. */
function brow([outer, inner]: [Point, Point], b: BrowShape, side: -1 | 1): string {
  const o: Point = [outer[0], outer[1] + b.outer];
  const i: Point = [inner[0] + side * (b.pinch ?? 0), inner[1] + b.inner];
  const a = lerp(o, i, 0.3);
  const c = lerp(o, i, 0.72);
  return `<path d="M ${pt(o)} C ${pt(a, 0, -b.arch)} ${pt(c, 0, -b.arch)} ${pt(i)} L ${pt(i, -side * 2, 22)} C ${pt(c, 0, -b.arch + 20)} ${pt(a, 0, -b.arch + 16)} ${pt(o, 0, 11)} Z" fill="${BROW}"/>`;
}

/** Open mouth with upper teeth and a tongue, outlined, with a lower lip. */
function openMouth(id: string, d: string, lowerLip: string, teethBottom: number, smile = true): string {
  const folds = smile ? `
    <path d="M260 548 C230 574 214 610 222 648" stroke="${SHADE}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M420 532 C462 556 488 590 486 630" stroke="${DEEP}" stroke-width="9" fill="none" stroke-linecap="round" opacity=".85"/>` : '';
  return `${folds}
    <path d="${lowerLip}" fill="${LIP}"/>
    <clipPath id="${id}"><path d="${d}"/></clipPath>
    <path d="${d}" fill="${MOUTH}"/>
    <g clip-path="url(#${id})">
      <ellipse cx="358" cy="${teethBottom + 70}" rx="80" ry="34" fill="#b4505a"/>
      <path d="M200 560 L520 560 L520 ${teethBottom - 6} C440 ${teethBottom + 6} 300 ${teethBottom + 14} 200 ${teethBottom + 6} Z" fill="#fbf8f1"/>
    </g>
    <path d="${d}" fill="none" stroke="${LINE}" stroke-width="5" stroke-linejoin="round"/>`;
}

const EXPRESSIONS: Record<Exclude<MbappeExpression, 'neutral'>, Expression> = {
  happy: {
    brows: [{ inner: -8, outer: -8, arch: 20 }, { inner: -8, outer: -10, arch: 20 }],
    eyes: [{ up: 20, low: -4 }, { up: 18, low: -6 }],
    mouth: (id) => openMouth(id,
      'M232 640 C300 636 412 624 484 604 C472 682 420 724 356 726 C292 726 248 694 232 640 Z',
      'M246 690 C290 750 418 750 474 664 C462 738 414 766 354 768 C294 768 254 736 246 690 Z', 664),
  },
  laugh: {
    brows: [{ inner: -18, outer: -10, arch: 24 }, { inner: -18, outer: -12, arch: 24 }],
    eyes: [{ up: 18, low: 0, closed: true }, { up: 18, low: 0, closed: true }],
    mouth: (id) => openMouth(id,
      'M222 626 C300 624 414 610 494 590 C488 706 430 780 356 782 C280 782 232 726 222 626 Z',
      'M236 700 C276 790 436 792 486 690 C474 772 422 806 354 808 C288 808 244 774 236 700 Z', 656),
  },
  smug: {
    brows: [{ inner: 8, outer: 6, arch: 10 }, { inner: -20, outer: -34, arch: 26 }],
    eyes: [{ up: 10, low: 8, look: [10, 2] }, { up: 16, low: 8, look: [10, 2] }],
    mouth: () => `
      <path d="M420 532 C462 556 488 590 486 624" stroke="${DEEP}" stroke-width="9" fill="none" stroke-linecap="round" opacity=".85"/>
      <path d="M266 664 C300 680 380 682 452 622 C440 660 400 690 354 694 C306 694 280 684 266 664 Z" fill="${LIP}"/>
      <path d="M262 662 C316 664 392 658 456 614" stroke="${LINE}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M262 662 C300 646 350 648 456 614 C400 640 330 652 262 662 Z" fill="${UPPER_LIP}"/>
      <path d="M456 614 C472 612 480 626 472 640" stroke="${DEEP}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  },
  angry: {
    brows: [{ inner: 34, outer: -6, arch: 2, pinch: 14 }, { inner: 34, outer: -8, arch: 2, pinch: 14 }],
    eyes: [{ up: 22, low: 8, innerDrop: 18, iris: 0.9 }, { up: 22, low: 8, innerDrop: 18, iris: 0.9 }],
    mouth: (id) => `
      <path d="M268 548 C236 580 226 616 236 656" stroke="${SHADE}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M414 536 C458 566 478 604 470 648" stroke="${DEEP}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <clipPath id="${id}"><path d="M250 660 C300 640 410 634 466 646 C474 668 470 690 460 704 C400 712 310 716 258 708 C246 692 244 676 250 660 Z"/></clipPath>
      <path d="M250 660 C300 640 410 634 466 646 C474 668 470 690 460 704 C400 712 310 716 258 708 C246 692 244 676 250 660 Z" fill="#fbf8f1"/>
      <g clip-path="url(#${id})" stroke="#bdb2a4" stroke-width="3">
        <path d="M240 678 C320 670 400 668 480 672" fill="none" stroke="${MOUTH}" stroke-width="5"/>
        ${[286, 316, 346, 376, 406, 436].map((x) => `<line x1="${x}" y1="640" x2="${x + 2}" y2="720"/>`).join('')}
      </g>
      <path d="M250 660 C300 640 410 634 466 646 C474 668 470 690 460 704 C400 712 310 716 258 708 C246 692 244 676 250 660 Z" fill="none" stroke="${LINE}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M262 724 C320 738 400 736 448 722" stroke="${LIP}" stroke-width="10" fill="none" stroke-linecap="round"/>`,
  },
  sad: {
    brows: [{ inner: -28, outer: 14, arch: 4 }, { inner: -30, outer: 16, arch: 4 }],
    eyes: [{ up: 20, low: 12, outerDrop: 14, look: [0, 6] }, { up: 18, low: 12, outerDrop: 14, look: [0, 6] }],
    mouth: () => `
      <path d="M290 694 C330 708 384 708 424 694 C410 718 380 726 354 726 C326 726 300 716 290 694 Z" fill="${LIP}"/>
      <path d="M262 690 C300 652 404 646 448 678" stroke="${LINE}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M262 690 C300 646 404 640 448 678 C404 656 300 660 262 690 Z" fill="${UPPER_LIP}"/>`,
  },
  shocked: {
    brows: [{ inner: -36, outer: -30, arch: 24 }, { inner: -36, outer: -34, arch: 24 }],
    eyes: [{ up: 34, low: 20, iris: 0.72 }, { up: 32, low: 20, iris: 0.72 }],
    mouth: (id) => `
      <path d="M286 690 C286 740 320 772 356 772 C392 772 424 740 424 690 C424 646 392 622 356 622 C320 622 286 646 286 690 Z" fill="${LIP}" transform="translate(0 6)"/>
      <clipPath id="${id}"><path d="M298 686 C298 730 324 760 356 760 C388 760 414 730 414 686 C414 648 388 630 356 630 C324 630 298 648 298 686 Z"/></clipPath>
      <path d="M298 686 C298 730 324 760 356 760 C388 760 414 730 414 686 C414 648 388 630 356 630 C324 630 298 648 298 686 Z" fill="${MOUTH}"/>
      <g clip-path="url(#${id})">
        <path d="M290 620 L420 620 L420 652 C390 660 330 660 290 652 Z" fill="#fbf8f1"/>
        <ellipse cx="356" cy="760" rx="46" ry="26" fill="#b4505a"/>
      </g>
      <path d="M298 686 C298 730 324 760 356 760 C388 760 414 730 414 686 C414 648 388 630 356 630 C324 630 298 648 298 686 Z" fill="none" stroke="${LINE}" stroke-width="5"/>`,
  },
  determined: {
    brows: [{ inner: 20, outer: -2, arch: 6, pinch: 8 }, { inner: 20, outer: -4, arch: 6, pinch: 8 }],
    eyes: [{ up: 16, low: 6, innerDrop: 10 }, { up: 15, low: 6, innerDrop: 10 }],
    mouth: () => `
      <path d="M420 540 C456 566 474 600 468 636" stroke="${DEEP}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="M276 674 C320 690 392 688 440 664 C426 690 392 702 354 702 C318 702 290 692 276 674 Z" fill="${LIP}"/>
      <path d="M266 670 C320 662 396 654 448 654" stroke="${LINE}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M266 670 C320 652 396 642 448 654 C396 650 320 660 266 670 Z" fill="${UPPER_LIP}"/>`,
  },
};

export interface ExpressionMarkup {
  brows: string;
  eyes: string;
  mouth: string;
}

/** Markup for one expression's brows, eyes and mouth (not for 'neutral', which is the traced original). */
export function expressionMarkup(name: Exclude<MbappeExpression, 'neutral'>): ExpressionMarkup {
  const e = EXPRESSIONS[name];
  return {
    brows: brow(LEFT_BROW, e.brows[0], 1) + brow(RIGHT_BROW, e.brows[1], -1),
    eyes: eye(LEFT_EYE, e.eyes[0]) + eye(RIGHT_EYE, e.eyes[1]),
    mouth: e.mouth(uid('mbappe-mouth')),
  };
}
