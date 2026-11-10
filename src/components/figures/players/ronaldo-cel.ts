/**
 * Cristiano Ronaldo – Cel R2: flat 2D cartoon with a bold near-black outline, flat fills and one
 * hard-edged shadow tone, expressive heavy features, a long lanky body with drawn-in shirt folds.
 * Head shapes are the R1 tracing (references/Ronaldo/images.jpeg); only the drawing style changes.
 *
 * Cel rules (every Cel player follows them):
 *   - one outline colour (CEL_LINE), outer contours bold (OUT), inner features a bit thinner (IN)
 *   - flat fills; one shadow tone per colour with a hard edge, light from the upper left
 *   - small white eyes with a dot pupil under heavy black brows; nose and smile folds as lines
 *   - head about 1/4.5 of the height, on the 'lanky' build
 *
 *   new RonaldoCelFigure({ x: 540, y: 1600, scale: 1.6 })
 */
import type { SvgArtOptions } from '../../SvgArt';
import { eyesAndBrowsMarkup, type DrawnFigureExpression, type EyesAndBrows, type FaceSpec } from '../expressions';
import { CEL_LINE } from '../paint';
import { createPortrait, PortraitFigure, type FigureSpec, type PortraitFigureOptions } from '../PortraitFigure';
import { mirrorPath } from '../spline';
import { EAR, EAR_FOLD, FACE, FADE, HAIR_SHAPE, PORTUGAL_KIT } from './ronaldo';

const ID = 'ronaldo-r2';
const W = 680;
const OUT = 14;
const IN = 9;
const SKIN = { base: '#e2a57c', shade: '#bf7f5a', deep: '#8f5639' };
const HAIR = { base: '#1d1512', light: '#4b3a31' };
const FADE_TONE = '#a8806a';
const MOUTH = '#3e1410';

const mirror = (d: string) => mirrorPath(d, W);
const ink = (w: number, color = CEL_LINE) => `stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const line = (w: number, color = CEL_LINE) => `fill="none" ${ink(w, color)}`;
const both = (d: string, attrs: string) => `<path d="${d}" ${attrs}/><path d="${mirror(d)}" ${attrs}/>`;

// ── shadow shapes (hard-edged, one tone) ────────────────────────────────────

/** Shadow under the hair, across the forehead and down the temples. */
const HAIR_SHADOW = 'M 90 326 C 160 346 250 330 340 330 C 430 330 520 344 590 326 L 590 250 L 90 250 Z';
/** Right side of the nose and under its tip. */
const NOSE_SHADOW = 'M 356 488 C 362 530 374 566 384 592 C 396 610 384 626 366 628 C 378 612 374 596 366 584 C 358 556 354 522 356 488 Z';
const UNDER_NOSE = 'M 310 630 C 326 642 356 642 372 630 C 360 650 322 650 310 630 Z';
/** Under the lower lip and under the brows' inner ends. */
const UNDER_LIP = 'M 300 718 C 320 734 360 734 380 718 C 368 744 312 744 300 718 Z';
const BROW_SHADOW = 'M 292 434 C 310 448 318 470 314 494 C 306 470 298 452 284 444 Z';

// ── lines ───────────────────────────────────────────────────────────────────

const NOSE = 'M 324 492 C 320 534 308 568 298 590 C 280 604 286 628 308 626 C 322 640 358 640 372 626';
const NOSTRILS = 'M 314 618 Q 322 612 330 620 M 352 620 Q 360 612 368 618';
const NOSE_WING_R = 'M 372 626 C 392 626 398 604 382 592';
const FOLD = 'M 288 628 C 268 648 258 668 256 690';
const DIMPLE = 'M 340 800 C 338 812 338 822 340 830';

/** Hair highlights: flat tapered streaks sweeping up and back from the hairline. */
const STREAKS = [
  'M 176 296 C 190 240 230 196 290 170 C 250 204 220 246 204 296 Z',
  'M 262 290 C 276 232 318 188 380 160 C 340 196 308 240 292 288 Z',
  'M 356 290 C 372 236 416 196 470 176 C 432 208 402 248 386 292 Z',
  'M 448 296 C 466 252 500 222 540 212 C 510 238 488 268 476 302 Z',
];
const HAIR_LINES = 'M 230 294 C 244 240 280 200 330 176 M 410 292 C 428 246 462 214 500 196';

// ── face spec ────────────────────────────────────────────────────────────────

/** Mouths are drawn around (340, 690) and placed on his wide mouth. */
const MX = 340, MY = 690;
const placeMouth = (markup: string) => `<g transform="translate(340 690) scale(1.08) translate(-340 -690)">${markup}</g>`;
const S = line(IN / 1.08);

function openMouth(id: string, d: string, teethTo: number, tongueY: number): string {
  return placeMouth(`<clipPath id="${id}"><path d="${d}"/></clipPath>
    <path d="${d}" fill="${MOUTH}"/>
    <g clip-path="url(#${id})">
      <rect x="${MX - 90}" y="${MY - 40}" width="180" height="${teethTo - MY + 40}" fill="#fbf7ef"/>
      <ellipse cx="${MX}" cy="${tongueY}" rx="40" ry="20" fill="#c2463d"/>
    </g>
    <path d="${d}" ${S}/>`);
}

const MOUTHS: Record<DrawnFigureExpression, (id: string) => string> = {
  happy: (id) => openMouth(id, 'M 274 678 Q 340 692 406 678 Q 400 740 340 744 Q 280 740 274 678 Z', 698, 744),
  laugh: (id) => openMouth(id, 'M 264 670 Q 340 686 416 670 Q 412 776 340 782 Q 268 776 264 670 Z', 692, 782),
  smug: () => placeMouth(`<path d="M 284 698 Q 344 708 398 676" ${S}/><path d="M 398 676 L 406 668" ${S}/>`),
  angry: (id) => placeMouth(`<clipPath id="${id}"><rect x="278" y="674" width="124" height="42" rx="14"/></clipPath>
    <rect x="278" y="674" width="124" height="42" rx="14" fill="#fbf7ef"/>
    <path d="M 278 695 L 402 695 M 309 674 L 309 716 M 340 674 L 340 716 M 371 674 L 371 716" stroke="${CEL_LINE}" stroke-width="5" clip-path="url(#${id})"/>
    <rect x="278" y="674" width="124" height="42" rx="14" ${S}/>`),
  sad: () => placeMouth(`<path d="M 286 710 Q 340 676 394 710" ${S}/>`),
  shocked: () => placeMouth(`<ellipse cx="${MX}" cy="712" rx="28" ry="38" fill="${MOUTH}" ${S}/>`),
  determined: () => placeMouth(`<path d="M 280 694 Q 340 686 400 694" ${S}/>`),
};

/** Neutral: the wide mouth with his slight pout – a firm lip line and a short lower-lip curve. */
const NEUTRAL_MOUTH = `<path d="M 258 686 C 290 676 318 672 340 678 C 362 672 390 676 422 686" ${line(IN + 1)}/>
  <path d="M 306 706 Q 340 716 374 706" ${line(IN - 2)}/>`;

/** The default shapes shrunk to these smaller eyes. */
const k = 0.72;
const pair = (eye: EyesAndBrows['eyes'][0], brow: EyesAndBrows['brows'][0]): EyesAndBrows => ({ eyes: [eye, eye], brows: [brow, brow] });
const sized = (s: EyesAndBrows): EyesAndBrows => ({
  eyes: s.eyes.map((e) => ({
    ...e, up: e.up * k, low: e.low * k,
    innerDrop: e.innerDrop && e.innerDrop * k, outerDrop: e.outerDrop && e.outerDrop * k,
    look: e.look && [e.look[0] * k, e.look[1] * k],
  })) as EyesAndBrows['eyes'],
  brows: s.brows.map((b) => ({ ...b, inner: b.inner * 0.85, outer: b.outer * 0.85, arch: b.arch * 0.8 })) as EyesAndBrows['brows'],
});

const SHAPES: Record<DrawnFigureExpression, EyesAndBrows> = {
  happy: sized(pair({ up: 26, low: -2 }, { inner: -12, outer: -8, arch: 18 })),
  laugh: sized(pair({ up: 24, low: 0, closed: true }, { inner: -22, outer: -10, arch: 22 })),
  smug: sized({
    brows: [{ inner: 8, outer: 6, arch: 8 }, { inner: -22, outer: -34, arch: 24 }],
    eyes: [{ up: 14, low: 14, look: [8, 2] }, { up: 24, low: 14, look: [8, 2] }],
  }),
  angry: sized(pair({ up: 26, low: 14, innerDrop: 20, iris: 0.9 }, { inner: 30, outer: -6, arch: 2, pinch: 12 })),
  sad: sized(pair({ up: 24, low: 16, outerDrop: 14, look: [0, 5] }, { inner: -26, outer: 12, arch: 4 })),
  shocked: sized(pair({ up: 42, low: 30, iris: 0.8 }, { inner: -36, outer: -30, arch: 22 })),
  determined: sized(pair({ up: 20, low: 12, innerDrop: 12 }, { inner: 18, outer: -2, arch: 6, pinch: 6 })),
};

/** Neutral: hooded eyes, heavy straight brows sitting low and dipping at the outer ends. */
const NEUTRAL = sized(pair({ up: 22, low: 16, innerDrop: 4 }, { inner: 2, outer: 6, arch: 10 }));

const LID = 'M 200 474 C 214 446 280 446 292 474 C 280 492 214 492 200 474 Z';
const LASH = 'M 204 476 C 226 486 268 486 288 476';

const FACE_SPEC: FaceSpec = {
  eyeStyle: 'toon',
  eyeLine: 7,
  pupil: 9,
  browWeight: 1.3,
  leftEye: [[206, 474], [288, 476]],
  rightEye: [[474, 474], [392, 476]],
  leftBrow: [[180, 442], [298, 430]],
  rightBrow: [[500, 442], [382, 430]],
  colors: { line: CEL_LINE, crease: SKIN.shade, brow: CEL_LINE, iris: CEL_LINE, white: '#fbf7ef' },
  mouths: MOUTHS,
  shapes: SHAPES,
  lids: [
    { pivot: [246, 456], cover: LID, lash: LASH },
    { pivot: [434, 456], cover: mirror(LID), lash: mirror(LASH) },
  ],
  talk: {
    pivot: [MX, 680],
    markup: (id) => openMouth(id, 'M 290 678 Q 340 670 390 678 Q 394 734 340 738 Q 286 734 290 678 Z', 690, 736),
  },
};

const neutral = eyesAndBrowsMarkup(FACE_SPEC, NEUTRAL);

// ── the portrait ─────────────────────────────────────────────────────────────

const NECK = 'M 214 760 C 216 812 206 856 192 900 L 488 900 C 474 856 464 812 466 760 Z';
const NECK_SHADOW = 'M 214 760 C 260 830 420 830 466 760 L 466 850 L 214 850 Z';
const SHIRT = 'M -60 1000 C -70 950 0 900 90 868 C 140 852 180 856 206 876 C 250 910 296 922 340 922 C 384 922 430 910 474 876 C 500 856 540 852 590 868 C 680 900 750 950 740 1000 Z';
const COLLAR = 'M 206 876 C 250 910 296 922 340 922 C 384 922 430 910 474 876';

const PORTRAIT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 880">
<defs>
  <clipPath id="${ID}-face"><path d="${FACE}"/></clipPath>
  <clipPath id="${ID}-hair"><path d="${HAIR_SHAPE}"/></clipPath>
  <clipPath id="${ID}-neck"><path d="${NECK}"/></clipPath>
</defs>
<g data-part="neck">
  <path d="${NECK}" fill="${SKIN.base}"/>
  <path d="${NECK_SHADOW}" fill="${SKIN.shade}" clip-path="url(#${ID}-neck)"/>
  <path d="${NECK}" ${line(OUT)}/>
</g>
<g data-part="shirt">
  <path d="${SHIRT}" fill="${PORTUGAL_KIT.shirt}" ${ink(OUT)}/>
  <path d="${COLLAR}" ${line(20, PORTUGAL_KIT.trim)}/>
</g>
${both(EAR, `fill="${SKIN.base}" ${ink(OUT)}`)}
${both(EAR_FOLD, line(IN))}
<path d="${FACE}" fill="${SKIN.shade}"/>
<g clip-path="url(#${ID}-face)">
  <path d="${FACE}" fill="${SKIN.base}" transform="translate(-40 -14)"/>
  <path d="${FADE}" fill="${FADE_TONE}"/><path d="${mirror(FADE)}" fill="${FADE_TONE}"/>
  <path d="${HAIR_SHADOW}" fill="${SKIN.shade}"/>
  ${both(BROW_SHADOW, `fill="${SKIN.shade}"`)}
  <path d="${NOSE_SHADOW}" fill="${SKIN.shade}"/>
  <path d="${UNDER_NOSE}" fill="${SKIN.shade}"/>
  <path d="${UNDER_LIP}" fill="${SKIN.shade}"/>
</g>
<path d="${FACE}" ${line(OUT)}/>
<path d="${HAIR_SHAPE}" fill="${HAIR.base}"/>
<g clip-path="url(#${ID}-hair)">
  ${STREAKS.map((d) => `<path d="${d}" fill="${HAIR.light}"/>`).join('')}
  <path d="${HAIR_LINES}" ${line(6, '#000')}/>
</g>
<path d="${HAIR_SHAPE}" ${line(OUT)}/>
<path d="${NOSE}" ${line(IN)}/>
<path d="${NOSE_WING_R}" ${line(IN)}/>
<path d="${NOSTRILS}" ${line(IN - 2)}/>
${both(FOLD, line(IN - 1))}
<path d="${DIMPLE}" ${line(IN - 2)}/>
<circle cx="70" cy="642" r="9" fill="#f4f6f8" ${ink(5)}/>
<circle cx="610" cy="642" r="9" fill="#f4f6f8" ${ink(5)}/>
<g data-part="brows">${neutral.brows}</g>
<g data-part="eyes">${neutral.eyes}</g>
<g data-part="mouth">${NEUTRAL_MOUTH}</g>
</svg>`;

export const RONALDO_CEL: FigureSpec = {
  name: 'RonaldoCel',
  portrait: PORTRAIT,
  idPrefix: ID,
  chin: [340, 850],
  skin: SKIN,
  kit: PORTUGAL_KIT,
  face: FACE_SPEC,
  style: 'cel',
  build: 'lanky',
  headScale: 0.17,
};

/** Full-body Cristiano Ronaldo in the Cel R2 style. */
export class RonaldoCelFigure extends PortraitFigure {
  constructor(options: PortraitFigureOptions = {}) {
    super(RONALDO_CEL, options);
  }
}

/** Head and shoulders only, pivoted at the bottom of the chin. */
export function createRonaldoCelPortrait(options: Omit<SvgArtOptions, 'markup'> = {}) {
  return createPortrait(RONALDO_CEL, options);
}
