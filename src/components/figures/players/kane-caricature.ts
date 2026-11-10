/**
 * Harry Kane – Toon T2, the "caricature" look: flat 2D, thin outline, oversized long head, big nose,
 * small dot eyes, thin brows, slim body. Drawn in code; likeness from the K1 portrait (traced from a
 * reference photo), not from any other cartoon.
 *
 * Caricature rules (every T2 player follows them; only shapes and colours change):
 *   - one thin outline (W) in one dark colour; flat fills, at most one shadow tone, no texture
 *   - long face, the nose pushed big; small white eyes with a dot pupil, set close; thin brows
 *   - head about 25% bigger on the body than a T1 head, on the slim 'caricature' build
 *
 * Kane's traits: long heavy jaw under a full beard, light-brown hair swept back from a receding
 * hairline, long straight nose, small ears.
 *
 *   new KaneCaricatureFigure({ x: 540, y: 1600, scale: 1.6 })
 */
import type { SvgArtOptions } from '../../SvgArt';
import { eyesAndBrowsMarkup, type EyesAndBrows, type FaceSpec, type DrawnFigureExpression } from '../expressions';
import { createPortrait, PortraitFigure, type FigureSpec, type PortraitFigureOptions } from '../PortraitFigure';
import { BAYERN_KIT } from './kane';

const ID = 'kane-t2';
const W = 6;
const LINE = '#2b1a12';
const SKIN = { base: '#efbe9c', shade: '#d69d7a', deep: '#b0734f' };
const HAIR = '#c99a5e';
const HAIR_SHADE = '#a77a44';
const BROW = '#7a5430';
const BEARD = '#b8895d';
const BEARD_SHADE = '#a2774e';
const MOUTH = '#4a1712';

const line = (w = W) => `stroke="${LINE}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const stroke = line();
const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${680 - Number(x)} ${y}`);

// ── head shapes (portrait coordinates, chin at 340, 850) ─────────────────────

const FACE = 'M 340 852 C 404 852 460 834 486 780 C 506 730 510 650 506 570 C 502 460 490 340 464 270 C 440 206 394 184 340 184 C 286 184 240 206 216 270 C 190 340 178 460 174 570 C 170 650 174 730 194 780 C 220 834 276 852 340 852 Z';
const EAR = 'M 182 438 C 146 418 122 446 128 494 C 134 540 158 560 186 546 Z';
const EAR_INNER = 'M 168 466 C 152 462 144 478 148 498 C 152 516 162 528 174 524';
const HAIR_SLAB = 'M 196 400 C 178 330 172 262 186 206 C 206 128 268 86 344 84 C 424 86 482 130 498 206 C 510 262 504 330 484 400 C 478 352 470 318 460 296 C 450 270 440 250 420 236 C 396 244 372 254 352 262 L 340 272 L 328 262 C 308 254 284 244 260 236 C 240 250 230 270 220 296 C 210 318 202 352 196 400 Z';
const HAIR_LINES = 'M 302 256 C 290 206 300 156 330 116 M 364 258 C 370 204 384 164 414 128 M 252 242 C 238 200 242 160 264 130 M 432 244 C 452 204 454 168 442 136';
const BEARD_SHAPE = 'M 150 540 C 186 622 230 664 276 676 C 300 682 318 680 340 680 C 362 680 380 682 404 676 C 450 664 494 622 530 540 L 560 900 L 120 900 Z';
const BEARD_UNDER = 'M 120 790 C 230 846 450 846 560 790 L 560 900 L 120 900 Z';
const CHEEK_SHADE = 'M 470 300 C 496 380 504 470 500 560 C 488 520 478 440 470 300 Z';
const NOSE_FILL = 'M 326 480 C 322 540 308 586 296 612 C 280 646 306 668 340 664 C 376 668 402 646 386 612 C 374 586 358 540 354 480 Z';
const NOSE_SHADE = 'M 354 500 C 362 548 374 590 386 614 C 394 636 384 652 366 660 C 380 640 376 620 366 600 C 358 572 354 540 354 500 Z';
const NOSE_LINE = 'M 326 484 C 322 542 308 588 296 614 C 282 646 308 668 340 664 C 374 668 400 646 386 614';
const NOSTRILS = 'M 314 644 Q 322 638 330 646 M 352 646 Q 360 638 368 644';

// ── face spec: eyes, brows, mouths ──────────────────────────────────────────

/** Mouths are drawn at the T1 spot (340, 690) and moved down/narrowed onto this longer face. */
const MX = 340, MY = 690;
const placeMouth = (markup: string) => `<g transform="translate(340 730) scale(0.82) translate(-340 -690)">${markup}</g>`;

function openMouth(id: string, d: string, teethTo: number, tongueY: number): string {
  return placeMouth(`<clipPath id="${id}"><path d="${d}"/></clipPath>
    <path d="${d}" fill="${MOUTH}"/>
    <g clip-path="url(#${id})">
      <rect x="${MX - 80}" y="${MY - 40}" width="160" height="${teethTo - MY + 40}" fill="#fbf7ef"/>
      <ellipse cx="${MX}" cy="${tongueY}" rx="38" ry="20" fill="#c2463d"/>
    </g>
    <path d="${d}" fill="none" ${line(W / 0.82)}/>`);
}

const S = line(W / 0.82);
const MOUTHS: Record<DrawnFigureExpression, (id: string) => string> = {
  happy: (id) => openMouth(id, `M 282 680 Q 340 692 398 680 Q 394 740 340 744 Q 286 740 282 680 Z`, 700, 744),
  laugh: (id) => openMouth(id, `M 270 672 Q 340 686 410 672 Q 408 772 340 778 Q 272 772 270 672 Z`, 694, 778),
  smug: () => placeMouth(`<path d="M 296 700 Q 344 708 386 680" fill="none" ${S}/>`),
  angry: (id) => placeMouth(`<clipPath id="${id}"><rect x="286" y="676" width="108" height="40" rx="14"/></clipPath>
    <rect x="286" y="676" width="108" height="40" rx="14" fill="#fbf7ef"/>
    <path d="M 286 696 L 394 696 M 313 676 L 313 716 M 340 676 L 340 716 M 367 676 L 367 716" stroke="${LINE}" stroke-width="4" clip-path="url(#${id})"/>
    <rect x="286" y="676" width="108" height="40" rx="14" fill="none" ${S}/>`),
  sad: () => placeMouth(`<path d="M 292 708 Q 340 678 388 708" fill="none" ${S}/>`),
  shocked: () => placeMouth(`<ellipse cx="${MX}" cy="712" rx="26" ry="36" fill="${MOUTH}" ${S}/>`),
  determined: () => placeMouth(`<path d="M 294 694 Q 340 688 386 694" fill="none" ${S}/>`),
};

const NEUTRAL_MOUTH = placeMouth(`<path d="M 296 692 Q 340 702 384 690" fill="none" ${S}/>`);

/** Eye/brow shapes: the T1 set, shrunk to the smaller eyes. */
const k = 0.62;
const pair = (eye: EyesAndBrows['eyes'][0], brow: EyesAndBrows['brows'][0]): EyesAndBrows => ({ eyes: [eye, eye], brows: [brow, brow] });
const sized = (s: EyesAndBrows): EyesAndBrows => ({
  eyes: s.eyes.map((e) => ({
    ...e, up: e.up * k, low: e.low * k,
    innerDrop: e.innerDrop && e.innerDrop * k, outerDrop: e.outerDrop && e.outerDrop * k,
    look: e.look && [e.look[0] * k, e.look[1] * k],
  })) as EyesAndBrows['eyes'],
  brows: s.brows.map((b) => ({ ...b, inner: b.inner * 0.8, outer: b.outer * 0.8, arch: b.arch * 0.7 })) as EyesAndBrows['brows'],
});

const SHAPES: Record<DrawnFigureExpression, EyesAndBrows> = {
  happy: sized(pair({ up: 26, low: -4 }, { inner: -10, outer: -8, arch: 18 })),
  laugh: sized(pair({ up: 24, low: 0, closed: true }, { inner: -20, outer: -10, arch: 22 })),
  smug: sized({
    brows: [{ inner: 8, outer: 6, arch: 8 }, { inner: -20, outer: -32, arch: 24 }],
    eyes: [{ up: 12, low: 14, look: [8, 2] }, { up: 22, low: 14, look: [8, 2] }],
  }),
  angry: sized(pair({ up: 26, low: 14, innerDrop: 20, iris: 0.9 }, { inner: 30, outer: -6, arch: 2, pinch: 12 })),
  sad: sized(pair({ up: 24, low: 16, outerDrop: 14, look: [0, 5] }, { inner: -26, outer: 12, arch: 4 })),
  shocked: sized(pair({ up: 40, low: 30, iris: 0.8 }, { inner: -34, outer: -28, arch: 22 })),
  determined: sized(pair({ up: 20, low: 12, innerDrop: 12 }, { inner: 18, outer: -2, arch: 6, pinch: 6 })),
};

const NEUTRAL = sized(pair({ up: 26, low: 18 }, { inner: 0, outer: 0, arch: 10 }));

const LID = 'M 254 470 C 262 444 312 444 320 470 C 312 490 262 490 254 470 Z';
const LASH = 'M 258 472 C 272 482 302 482 316 472';

const FACE_SPEC: FaceSpec = {
  eyeStyle: 'toon',
  eyeLine: 5,
  pupil: 8,
  browWeight: 0.5,
  leftEye: [[262, 470], [312, 470]],
  rightEye: [[418, 470], [368, 470]],
  leftBrow: [[250, 436], [316, 428]],
  rightBrow: [[430, 436], [364, 428]],
  colors: { line: LINE, crease: SKIN.shade, brow: BROW, iris: LINE, white: '#fbf7ef' },
  mouths: MOUTHS,
  shapes: SHAPES,
  lids: [
    { pivot: [287, 452], cover: LID, lash: LASH },
    { pivot: [393, 452], cover: mirror(LID), lash: mirror(LASH) },
  ],
  talk: {
    pivot: [MX, 722],
    markup: (id) => openMouth(id, `M 300 680 Q 340 672 380 680 Q 384 732 340 736 Q 296 732 300 680 Z`, 690, 734),
  },
};

// ── the portrait markup ──────────────────────────────────────────────────────

const neutral = eyesAndBrowsMarkup(FACE_SPEC, NEUTRAL);

const PORTRAIT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 880">
<defs><clipPath id="${ID}-face"><path d="${FACE}"/></clipPath></defs>
<g data-part="neck">
  <path d="M 270 790 L 266 880 L 414 880 L 410 790 Z" fill="${SKIN.shade}" ${stroke}/>
</g>
<g data-part="shirt">
  <path d="M 60 880 C 80 836 170 814 266 826 Q 340 862 414 826 C 510 814 600 836 620 880 Z" fill="${BAYERN_KIT.shirt}" ${stroke}/>
</g>
<path d="${EAR}" fill="${SKIN.base}" ${stroke}/>
<path d="${EAR_INNER}" fill="none" ${line(W * 0.8)}/>
<path d="${mirror(EAR)}" fill="${SKIN.base}" ${stroke}/>
<path d="${mirror(EAR_INNER)}" fill="none" ${line(W * 0.8)}/>
<path d="${FACE}" fill="${SKIN.base}"/>
<g clip-path="url(#${ID}-face)">
  <path d="${CHEEK_SHADE}" fill="${SKIN.shade}"/>
  <path d="${BEARD_SHAPE}" fill="${BEARD}"/>
  <path d="${BEARD_UNDER}" fill="${BEARD_SHADE}"/>
</g>
<path d="${FACE}" fill="none" ${stroke}/>
<path d="${HAIR_SLAB}" fill="${HAIR}" ${stroke}/>
<path d="${HAIR_LINES}" fill="none" stroke="${HAIR_SHADE}" stroke-width="6" stroke-linecap="round"/>
<path d="${NOSE_FILL}" fill="${SKIN.base}"/>
<path d="${NOSE_SHADE}" fill="${SKIN.shade}"/>
<path d="${NOSE_LINE}" fill="none" ${stroke}/>
<path d="${NOSTRILS}" fill="none" ${line(W * 0.8)}/>
<g data-part="brows">${neutral.brows}</g>
<g data-part="eyes">${neutral.eyes}</g>
<g data-part="mouth">${NEUTRAL_MOUTH}</g>
</svg>`;

export const KANE_CARICATURE: FigureSpec = {
  name: 'KaneCaricature',
  portrait: PORTRAIT,
  idPrefix: ID,
  chin: [340, 850],
  skin: SKIN,
  kit: BAYERN_KIT,
  face: FACE_SPEC,
  style: 'toon',
  build: 'caricature',
  headScale: 0.25,
};

/** Full-body Harry Kane in the T2 caricature style. */
export class KaneCaricatureFigure extends PortraitFigure {
  constructor(options: PortraitFigureOptions = {}) {
    super(KANE_CARICATURE, options);
  }
}

/** Head and shoulders only, pivoted at the bottom of the chin. */
export function createKaneCaricaturePortrait(options: Omit<SvgArtOptions, 'markup'> = {}) {
  return createPortrait(KANE_CARICATURE, options);
}
