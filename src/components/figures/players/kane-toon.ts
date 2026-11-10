/**
 * Harry Kane – the "Toon" version (T1): the channel's own flat cartoon style, drawn in code (not
 * traced). Likeness taken from the K1 portrait, which was traced from a reference photo.
 *
 * Toon style rules (every Toon player follows them; only the shapes and colours change):
 *   - one outline weight (W) in one dark colour, round joins; flat fills, no gradients, no blur
 *   - small white eyes outlined all round with a black dot pupil; brows are solid shapes
 *   - likeness from the silhouette: hair shape, jaw, nose, ears, beard – not from facial detail
 *   - one or two traits per player pushed hard, everything else kept simple
 *
 * Kane's traits: a long, heavy jaw under a full beard, and light-brown hair swept straight back from
 * a receding hairline. Also: ears that stick out, a long straight nose, small eyes.
 *
 * Same 680 × 880 frame and data-parts as a traced portrait, so it plugs into PortraitFigure and all
 * the figure actions.
 *
 *   new KaneToonFigure({ x: 540, y: 1600, scale: 1.6 })
 */
import type { SvgArtOptions } from '../../SvgArt';
import { eyesAndBrowsMarkup, type EyesAndBrows, type FaceSpec, type DrawnFigureExpression } from '../expressions';
import { createPortrait, PortraitFigure, type FigureSpec, type PortraitFigureOptions } from '../PortraitFigure';
import { BAYERN_KIT } from './kane';

const ID = 'kane-t1';
const W = 9;
const LINE = '#2b1a12';
const SKIN = { base: '#e9b591', shade: '#cf946f', deep: '#a8694a' };
const HAIR = '#c0915a';
const HAIR_SHADE = '#94683a';
const BROW = '#6e4a28';
const BEARD = '#a97a52';
const STUBBLE = '#6e4a2c';
const MOUTH = '#4a1712';

const line = (w = W) => `stroke="${LINE}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const stroke = line();
const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${680 - Number(x)} ${y}`);

// ── head shapes (portrait coordinates, chin at 340, 846) ─────────────────────

const FACE = 'M 340 846 C 398 846 436 834 462 800 C 506 742 528 660 532 562 C 538 462 540 340 506 266 C 472 206 410 192 340 192 C 270 192 208 206 174 266 C 140 340 142 462 148 562 C 152 660 174 742 218 800 C 244 834 282 846 340 846 Z';
const EAR = 'M 158 446 C 112 418 74 446 80 510 C 86 584 126 626 166 604 Z';
const EAR_INNER = 'M 144 474 C 120 464 106 482 110 512 C 114 548 132 572 152 566';
const HAIR_SLAB = 'M 160 440 C 138 380 128 316 134 250 C 146 140 236 60 340 56 C 444 60 534 140 546 250 C 552 316 542 380 520 440 C 512 384 504 336 490 300 C 476 262 452 228 424 208 C 400 214 370 226 340 234 C 310 226 280 214 256 208 C 228 228 204 262 190 300 C 176 336 168 384 160 440 Z';
const COMB = [
  'M 340 232 C 334 178 344 128 374 78',
  'M 296 222 C 284 170 294 122 324 86',
  'M 384 222 C 398 170 410 124 436 96',
  'M 238 240 C 216 190 224 140 256 104',
  'M 444 240 C 468 190 468 146 454 110',
]
// Beard: everything below the cheek line, cut round the mouth by a moustache edge (clipped to the face).
const BEARD_SHAPE = 'M 100 560 C 150 640 200 646 254 630 C 290 620 318 616 340 620 C 362 616 390 620 426 630 C 480 646 530 640 580 560 L 600 900 L 80 900 Z';
const NOSE_FILL = 'M 320 470 C 316 526 306 564 296 592 C 288 622 318 638 342 632 C 364 638 394 624 386 596 C 378 572 364 530 358 470 Z';
const NOSE_LINE = 'M 320 474 C 316 528 306 566 296 594 C 288 624 320 640 344 632 C 366 638 394 622 384 594';
const NOSTRILS = 'M 312 612 Q 322 606 330 614 M 352 614 Q 360 606 370 612';

/** Short stubble strokes scattered over the beard (deterministic). */
function stubble(): string {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const marks: string[] = [];
  for (let i = 0; i < 170; i++) {
    const x = 130 + rnd() * 420, y = 600 + rnd() * 250;
    const a = (rnd() - 0.5) * 1.2, l = 7 + rnd() * 6;
    marks.push(`M ${x.toFixed(0)} ${y.toFixed(0)} l ${(Math.sin(a) * l).toFixed(1)} ${(Math.cos(a) * l).toFixed(1)}`);
  }
  return `<path d="${marks.join(' ')}" stroke="${STUBBLE}" stroke-width="4" stroke-linecap="round" opacity=".55"/>`;
}

// ── face spec: eyes, brows, mouths ──────────────────────────────────────────

const MX = 340, MY = 690;

/** A filled mouth with teeth along the top edge and a tongue at the bottom. */
function openMouth(id: string, d: string, teethTo: number, tongueY: number): string {
  return `<clipPath id="${id}"><path d="${d}"/></clipPath>
    <path d="${d}" fill="${MOUTH}"/>
    <g clip-path="url(#${id})">
      <rect x="${MX - 80}" y="${MY - 40}" width="160" height="${teethTo - MY + 40}" fill="#fbf7ef"/>
      <ellipse cx="${MX}" cy="${tongueY}" rx="38" ry="20" fill="#c2463d"/>
    </g>
    <path d="${d}" fill="none" ${stroke}/>`;
}

const MOUTHS: Record<DrawnFigureExpression, (id: string) => string> = {
  happy: (id) => openMouth(id, `M 282 680 Q 340 692 398 680 Q 394 740 340 744 Q 286 740 282 680 Z`, 700, 744),
  laugh: (id) => openMouth(id, `M 270 672 Q 340 686 410 672 Q 408 772 340 778 Q 272 772 270 672 Z`, 694, 778),
  smug: () => `<path d="M 296 700 Q 344 708 386 680" fill="none" ${stroke}/><path d="M 378 672 Q 390 676 392 690" fill="none" ${line(W * 0.7)}/>`,
  angry: (id) => `<clipPath id="${id}"><rect x="286" y="676" width="108" height="40" rx="14"/></clipPath>
    <rect x="286" y="676" width="108" height="40" rx="14" fill="#fbf7ef"/>
    <path d="M 286 696 L 394 696 M 313 676 L 313 716 M 340 676 L 340 716 M 367 676 L 367 716" stroke="${LINE}" stroke-width="4" clip-path="url(#${id})"/>
    <rect x="286" y="676" width="108" height="40" rx="14" fill="none" ${stroke}/>`,
  sad: () => `<path d="M 292 708 Q 340 678 388 708" fill="none" ${stroke}/>`,
  shocked: () => `<ellipse cx="${MX}" cy="712" rx="26" ry="36" fill="${MOUTH}" ${stroke}/>`,
  determined: () => `<path d="M 294 694 Q 340 688 386 694" fill="none" ${stroke}/>`,
};

const NEUTRAL_MOUTH = `<path d="M 292 690 Q 340 702 388 688" fill="none" ${stroke}/>`;

const SHAPES: Record<DrawnFigureExpression, EyesAndBrows> = {
  happy: {
    brows: [{ inner: -10, outer: -8, arch: 18 }, { inner: -10, outer: -8, arch: 18 }],
    eyes: [{ up: 26, low: -4 }, { up: 26, low: -4 }],
  },
  laugh: {
    brows: [{ inner: -20, outer: -10, arch: 22 }, { inner: -20, outer: -10, arch: 22 }],
    eyes: [{ up: 24, low: 0, closed: true }, { up: 24, low: 0, closed: true }],
  },
  smug: {
    brows: [{ inner: 8, outer: 6, arch: 8 }, { inner: -20, outer: -32, arch: 24 }],
    eyes: [{ up: 12, low: 14, look: [8, 2] }, { up: 22, low: 14, look: [8, 2] }],
  },
  angry: {
    brows: [{ inner: 30, outer: -6, arch: 2, pinch: 12 }, { inner: 30, outer: -6, arch: 2, pinch: 12 }],
    eyes: [{ up: 26, low: 14, innerDrop: 20, iris: 0.9 }, { up: 26, low: 14, innerDrop: 20, iris: 0.9 }],
  },
  sad: {
    brows: [{ inner: -26, outer: 12, arch: 4 }, { inner: -26, outer: 12, arch: 4 }],
    eyes: [{ up: 24, low: 16, outerDrop: 14, look: [0, 5] }, { up: 24, low: 16, outerDrop: 14, look: [0, 5] }],
  },
  shocked: {
    brows: [{ inner: -34, outer: -28, arch: 22 }, { inner: -34, outer: -28, arch: 22 }],
    eyes: [{ up: 40, low: 30, iris: 0.8 }, { up: 40, low: 30, iris: 0.8 }],
  },
  determined: {
    brows: [{ inner: 18, outer: -2, arch: 6, pinch: 6 }, { inner: 18, outer: -2, arch: 6, pinch: 6 }],
    eyes: [{ up: 20, low: 12, innerDrop: 12 }, { up: 20, low: 12, innerDrop: 12 }],
  },
};

const NEUTRAL: EyesAndBrows = {
  brows: [{ inner: 0, outer: 0, arch: 10 }, { inner: 0, outer: 0, arch: 10 }],
  eyes: [{ up: 26, low: 18 }, { up: 26, low: 18 }],
};

const LID = 'M 222 455 C 236 416 286 416 300 455 C 286 484 236 484 222 455 Z';
const LASH = 'M 228 458 C 246 470 276 470 294 458';

const FACE_SPEC: FaceSpec = {
  eyeStyle: 'toon',
  leftEye: [[230, 455], [292, 455]],
  rightEye: [[450, 455], [388, 455]],
  leftBrow: [[208, 412], [298, 398]],
  rightBrow: [[472, 412], [382, 398]],
  colors: { line: LINE, crease: SKIN.shade, brow: BROW, iris: LINE, white: '#fbf7ef' },
  mouths: MOUTHS,
  shapes: SHAPES,
  lids: [
    { pivot: [261, 430], cover: LID, lash: LASH },
    { pivot: [419, 430], cover: mirror(LID), lash: mirror(LASH) },
  ],
  talk: {
    pivot: [MX, 680],
    markup: (id) => openMouth(id, `M 300 680 Q 340 672 380 680 Q 384 732 340 736 Q 296 732 300 680 Z`, 690, 734),
  },
};

// ── the portrait markup ──────────────────────────────────────────────────────

const neutral = eyesAndBrowsMarkup(FACE_SPEC, NEUTRAL);

const PORTRAIT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 880">
<defs><clipPath id="${ID}-face"><path d="${FACE}"/></clipPath></defs>
<g data-part="neck">
  <path d="M 262 780 L 258 880 L 422 880 L 418 780 Z" fill="${SKIN.shade}" ${stroke}/>
</g>
<g data-part="shirt">
  <path d="M 40 880 C 60 830 160 806 262 820 Q 340 860 418 820 C 520 806 620 830 640 880 Z" fill="${BAYERN_KIT.shirt}" ${stroke}/>
</g>
<path d="${EAR}" fill="${SKIN.base}" ${stroke}/>
<path d="${EAR_INNER}" fill="none" ${line(W * 0.7)}/>
<path d="${mirror(EAR)}" fill="${SKIN.base}" ${stroke}/>
<path d="${mirror(EAR_INNER)}" fill="none" ${line(W * 0.7)}/>
<path d="${FACE}" fill="${SKIN.base}"/>
<g clip-path="url(#${ID}-face)">
  <path d="${BEARD_SHAPE}" fill="${BEARD}"/>
  <g clip-path="url(#${ID}-face)">${stubble()}</g>
</g>
<path d="${FACE}" fill="none" ${stroke}/>
<path d="${HAIR_SLAB}" fill="${HAIR}" ${stroke}/>
<path d="${COMB.join(' ')}" fill="none" stroke="${HAIR_SHADE}" stroke-width="7" stroke-linecap="round"/>
<path d="${NOSE_FILL}" fill="${SKIN.base}"/>
<path d="${NOSE_LINE}" fill="none" ${stroke}/>
<path d="${NOSTRILS}" fill="none" ${line(W * 0.6)}/>
<g data-part="brows">${neutral.brows}</g>
<g data-part="eyes">${neutral.eyes}</g>
<g data-part="mouth">${NEUTRAL_MOUTH}</g>
</svg>`;

export const KANE_TOON: FigureSpec = {
  name: 'KaneToon',
  portrait: PORTRAIT,
  idPrefix: ID,
  chin: [340, 846],
  skin: SKIN,
  kit: BAYERN_KIT,
  face: FACE_SPEC,
  style: 'toon',
  build: 'toon',
};

/** Full-body Harry Kane in the Toon style. */
export class KaneToonFigure extends PortraitFigure {
  constructor(options: PortraitFigureOptions = {}) {
    super(KANE_TOON, options);
  }
}

/** Head and shoulders only, pivoted at the bottom of the chin. */
export function createKaneToonPortrait(options: Omit<SvgArtOptions, 'markup'> = {}) {
  return createPortrait(KANE_TOON, options);
}
