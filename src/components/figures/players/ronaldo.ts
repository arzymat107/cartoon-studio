/**
 * Cristiano Ronaldo – the "Portrait" version (R1), traced from the frontal photo in
 * data-for-cartoons/references/Ronaldo (images.jpeg): landmarks read off a grid over the photo and
 * mapped into the 680 × 880 frame with
 *
 *   x = 340 + (photoX − 164) × 2.2      (164 = midway between the eyes)
 *   y = 850 + (photoY − 345) × 2.2      (345 = bottom of the chin)
 *
 * then made symmetric. What makes him him, from the photo:
 *   - a wide head: broad cheekbones and a broad, square jaw; flat chin with a dimple
 *   - black hair slicked back and to one side on top (higher on his right), sides faded from the temples down
 *   - heavy straight brows sitting low over the eyes, dipping at the outer ends
 *   - hooded brown eyes; a long nose with a wide tip; a wide mouth with a pouting upper lip
 *   - deep smile folds, light stubble, glossy tanned skin; stud earrings
 * Portugal #7 kit by default.
 *
 * Same frame and data-parts as K1/M1/Y1, so it plugs into PortraitFigure and every figure action.
 *
 *   new RonaldoFigure({ x: 540, y: 1600, scale: 1.6 })
 *   createRonaldoPortrait({ x, y, scale: 0.6 })
 */
import type { SvgArtOptions } from '../../SvgArt';
import type { Kit } from '../../sport/Footballer';
import { eyesAndBrowsMarkup, type DrawnFigureExpression, type EyesAndBrows, type FaceSpec } from '../expressions';
import { createPortrait, PortraitFigure, type FigureSpec, type PortraitFigureOptions } from '../PortraitFigure';
import { mirrorPath, spline, symmetric } from '../spline';
import { MBAPPE } from './mbappe';

const ID = 'ronaldo-r1';
const W = 680;
const LINE = '#2b1a12';
const SKIN = { base: '#d9a07a', shade: '#b47a57', deep: '#87523a' };
const GLOSS = '#f3c9a6';
const HAIR = { base: '#16100d', mid: '#2a201a', light: '#5e4c41' };
const LIP = { upper: '#a35d48', lower: '#b96f57' };

const mirror = (d: string) => mirrorPath(d, W);
const both = (d: string, attrs: string) => `<path d="${d}" ${attrs}/><path d="${mirror(d)}" ${attrs}/>`;
/** Stroke attributes only – for outlines over a fill. */
const stroke = (w: number, color = LINE) => `stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
/** A bare line: stroke with no fill. */
const line = (w: number, color = LINE) => `fill="none" ${stroke(w, color)}`;
const soft = `filter="url(#${ID}-soft)"`;

// ── shapes (traced, see the mapping above) ──────────────────────────────────

export const FACE = spline(symmetric([
  [340, 852], [395, 844], [440, 830], [490, 808], [526, 774], [544, 730], [556, 642], [566, 540], [580, 440], [584, 360], [574, 290], [548, 226], [496, 184], [420, 162], [340, 156],
], W));

export const EAR = 'M 114 488 C 84 460 50 466 44 506 C 38 552 50 606 72 636 C 86 656 106 658 118 640 Z';
export const EAR_FOLD = 'M 80 506 C 64 516 60 552 68 584 C 74 604 84 618 94 622';

/** Dark hair: the head's silhouette on top, then the hairline back across the forehead. */
export const HAIR_SHAPE = spline([
  [104, 330], [99, 267], [133, 212], [188, 176], [265, 146], [353, 124], [441, 135], [507, 168], [548, 222], [578, 290], [582, 346],
  [548, 326], [518, 308], [485, 290], [400, 284], [309, 286], [230, 294], [177, 302], [140, 316],
]);
/** Skin-faded side under the dark hair (left; mirrored). */
export const FADE = spline([[92, 262], [88, 360], [98, 470], [146, 478], [160, 380], [150, 300], [120, 264]]);

const hairline = (x: number) => 286 + ((x - 330) / 230) ** 2 * 30;
const crown = (x: number) => 124 + ((x - 350) / 215) ** 2 * 95;

/** Slicked-back strands: tapered clumps from the hairline sweeping up and back (deterministic). */
function strands(): string {
  const out: string[] = [];
  for (let i = 0; i < 15; i++) {
    const x0 = 140 + i * 27, y0 = hairline(x0) - 4;
    const x1 = x0 + 56, y1 = crown(x1) + 10;
    const cx = x0 + 6, cy = (y0 + y1) / 2 - 10;
    const d = `M ${x0 - 14} ${y0} Q ${cx - 10} ${cy} ${x1} ${y1} Q ${cx + 12} ${cy + 6} ${x0 + 14} ${y0} Z`;
    out.push(`<path d="${d}" fill="${i % 2 ? HAIR.mid : HAIR.base}"/>`);
    if (i % 2 === 0) out.push(`<path d="M ${x0 + 2} ${y0 - 12} Q ${cx} ${cy + 4} ${x1 - 8} ${y1 + 8}" ${line(i % 4 ? 3 : 5, HAIR.light)} opacity="${i % 4 ? 0.45 : 0.8}"/>`);
  }
  return out.join('');
}

// Neck and shirt (Portugal red, green collar).
const NECK = 'M 196 760 C 198 810 188 856 172 900 L 508 900 C 492 856 482 810 484 760 Z';
const COLLAR = 'M 190 872 C 236 908 290 924 340 924 C 390 924 444 908 490 872';
const SHIRT = `M -100 1010 C -120 960 -40 900 60 860 C 110 840 160 844 190 872 C 236 908 290 924 340 924 C 390 924 444 908 490 872 C 520 844 570 840 620 860 C 720 900 800 960 780 1010 Z`;

// Nose: long, wide tip.
const NOSE = {
  shadow: 'M 362 478 C 368 524 380 562 392 588 L 368 602 C 362 566 356 524 352 478 Z',
  bridge: 'M 322 478 C 318 524 310 560 300 584',
  wing: 'M 304 574 C 280 580 272 600 286 612 C 296 620 312 618 320 612',
  tip: 'M 316 612 C 326 626 354 626 364 612',
  fold: 'M 286 614 C 264 638 252 666 250 702',
};

// Mouth (neutral): wide, the upper lip pouting a little.
const MOUTH_NEUTRAL = `
  <path d="M 256 684 C 284 670 318 662 340 668 C 362 662 396 670 424 684 C 396 688 362 690 340 690 C 318 690 284 688 256 684 Z" fill="${LIP.upper}"/>
  <path d="M 266 688 C 296 716 384 716 414 688 C 384 694 296 694 266 688 Z" fill="${LIP.lower}"/>
  <ellipse cx="340" cy="700" rx="26" ry="5" fill="#d8927a" opacity=".7"/>
  <ellipse cx="340" cy="672" rx="18" ry="3" fill="#c27a64" opacity=".6"/>
  <path d="M 256 684 C 292 692 388 692 424 684" ${line(5)}/>
  <path d="M 248 676 C 252 682 254 688 252 696 M 432 676 C 428 682 426 688 428 696" ${line(3.5, SKIN.deep)} opacity=".8"/>`;

// ── face spec: expressions reuse the M1 mouth set, moved onto his (wider) mouth ──

const fit = (markup: string) => `<g transform="translate(340 686) scale(0.95) translate(-356 -640)">${markup}</g>`;
const mouths = Object.fromEntries(
  (Object.keys(MBAPPE.face.mouths) as DrawnFigureExpression[]).map((name) => [name, (id: string) => fit(MBAPPE.face.mouths[name](id))]),
) as FaceSpec['mouths'];

const LID = 'M 178 470 C 200 436 284 434 302 472 C 284 490 200 490 178 470 Z';
const LASH = 'M 186 472 C 214 484 270 484 296 472';

const FACE_SPEC: FaceSpec = {
  leftEye: [[188, 468], [292, 472]],
  rightEye: [[492, 468], [388, 472]],
  leftBrow: [[156, 438], [292, 420]],
  rightBrow: [[524, 438], [388, 420]],
  colors: { line: LINE, crease: SKIN.shade, brow: '#1d1410', iris: '#5e4026', white: '#efe6dc' },
  mouths,
  shapes: {
    happy: { brows: [{ inner: -8, outer: -4, arch: 18 }, { inner: -8, outer: -4, arch: 18 }], eyes: [{ up: 18, low: 4 }, { up: 18, low: 4 }] },
    smug: { brows: [{ inner: 6, outer: 6, arch: 10 }, { inner: -16, outer: -22, arch: 24 }], eyes: [{ up: 12, low: 9, look: [10, 2] }, { up: 18, low: 9, look: [10, 2] }] },
  },
  lids: [
    { pivot: [240, 452], cover: LID, lash: LASH },
    { pivot: [440, 452], cover: mirror(LID), lash: mirror(LASH) },
  ],
  talk: { pivot: [340, 684], markup: (id) => fit(MBAPPE.face.talk.markup(id)) },
};

/** Neutral: hooded eyes; heavy brows low over them, dipping at the outer ends. */
const NEUTRAL: EyesAndBrows = {
  eyes: [{ up: 20, low: 12 }, { up: 20, low: 12 }],
  brows: [{ inner: 0, outer: 4, arch: 16 }, { inner: 0, outer: 4, arch: 16 }],
};
const neutral = eyesAndBrowsMarkup(FACE_SPEC, NEUTRAL);

// ── the portrait ─────────────────────────────────────────────────────────────

const PORTRAIT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 880">
<defs>
  <filter id="${ID}-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="${ID}-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
  <clipPath id="${ID}-face"><path d="${FACE}"/></clipPath>
  <clipPath id="${ID}-hair"><path d="${HAIR_SHAPE}"/></clipPath>
  <linearGradient id="${ID}-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${HAIR.mid}" stop-opacity=".8"/><stop offset="1" stop-color="${HAIR.mid}" stop-opacity="0"/></linearGradient>
</defs>
<g data-part="neck">
  <path d="${NECK}" fill="${SKIN.shade}" ${stroke(5)}/>
  <ellipse cx="340" cy="790" rx="130" ry="40" fill="${SKIN.deep}" opacity=".55" ${soft}/>
  <path d="M 252 800 C 266 840 282 874 292 900 M 428 800 C 414 840 398 874 388 900" ${line(5, SKIN.deep)} opacity=".45"/>
</g>
<g data-part="shirt">
  <path d="${SHIRT}" fill="#c8102e" ${stroke(5)}/>
  <path d="${COLLAR}" stroke="#046a38" stroke-width="18" fill="none" stroke-linecap="round"/>
</g>
${both(EAR, `fill="${SKIN.base}" ${stroke(5)}`)}
${both(EAR_FOLD, line(6, SKIN.shade))}
<ellipse cx="78" cy="560" rx="10" ry="30" fill="${SKIN.deep}" opacity=".45"/><ellipse cx="602" cy="560" rx="10" ry="30" fill="${SKIN.deep}" opacity=".45"/>
<path d="${FACE}" fill="${SKIN.base}"/>
<g clip-path="url(#${ID}-face)">
  <g ${soft}>
    <ellipse cx="116" cy="560" rx="44" ry="230" fill="${SKIN.shade}" opacity=".9"/>
    <ellipse cx="564" cy="560" rx="44" ry="230" fill="${SKIN.shade}" opacity=".9"/>
    <ellipse cx="214" cy="640" rx="46" ry="72" fill="${SKIN.shade}" opacity=".7"/>
    <ellipse cx="466" cy="640" rx="46" ry="72" fill="${SKIN.shade}" opacity=".7"/>
    <ellipse cx="240" cy="452" rx="72" ry="26" fill="${SKIN.deep}" opacity=".7"/>
    <ellipse cx="440" cy="452" rx="72" ry="26" fill="${SKIN.deep}" opacity=".7"/>
    <ellipse cx="340" cy="842" rx="150" ry="36" fill="${SKIN.deep}" opacity=".7"/>
    <ellipse cx="340" cy="760" rx="190" ry="110" fill="#4a3a30" opacity=".2"/>
    <ellipse cx="340" cy="362" rx="150" ry="44" fill="${GLOSS}" opacity=".95"/>
    <ellipse cx="342" cy="522" rx="14" ry="62" fill="${GLOSS}" opacity=".85"/>
    <ellipse cx="206" cy="552" rx="50" ry="18" fill="${GLOSS}" opacity=".85"/>
    <ellipse cx="474" cy="552" rx="50" ry="18" fill="${GLOSS}" opacity=".7"/>
    <ellipse cx="340" cy="812" rx="38" ry="14" fill="${GLOSS}" opacity=".6"/>
  </g>
  <path d="${FADE}" fill="url(#${ID}-fade)"/><path d="${mirror(FADE)}" fill="url(#${ID}-fade)"/>
  <g filter="url(#${ID}-blur)">
    ${both(NOSE.fold, line(6, SKIN.deep))}
    <path d="${NOSE.shadow}" fill="${SKIN.shade}" opacity=".8"/>
    <ellipse cx="340" cy="730" rx="40" ry="9" fill="${SKIN.deep}" opacity=".5"/>
  </g>
</g>
<path d="${FACE}" ${line(5)}/>
<path d="${HAIR_SHAPE}" fill="${HAIR.base}"/>
<g clip-path="url(#${ID}-hair)">
  ${strands()}
  <ellipse cx="300" cy="176" rx="130" ry="26" fill="${HAIR.light}" opacity=".35" ${soft}/>
</g>
<path d="${HAIR_SHAPE}" ${line(4)}/>
<path d="${NOSE.bridge}" ${line(4, SKIN.shade)} opacity=".8"/>
${both(NOSE.wing, line(4.5))}
<path d="${NOSE.tip}" ${line(4)}/>
<ellipse cx="324" cy="610" rx="9" ry="4" fill="#5a3020" opacity=".85"/><ellipse cx="356" cy="610" rx="9" ry="4" fill="#5a3020" opacity=".85"/>
<ellipse cx="342" cy="588" rx="12" ry="8" fill="${GLOSS}" opacity=".85"/>
<path d="M 340 792 C 338 806 338 818 340 828" ${line(4, SKIN.deep)} opacity=".8"/>
<circle cx="76" cy="640" r="7" fill="#e9eef3" stroke="#8a96a3" stroke-width="2"/><circle cx="74" cy="638" r="2.5" fill="#fff"/>
<circle cx="604" cy="640" r="7" fill="#e9eef3" stroke="#8a96a3" stroke-width="2"/><circle cx="602" cy="638" r="2.5" fill="#fff"/>
<g data-part="brows">${neutral.brows}</g>
<g data-part="eyes">${neutral.eyes}</g>
<g data-part="mouth">${MOUTH_NEUTRAL}</g>
</svg>`;

export const PORTUGAL_KIT: Kit = {
  shirt: '#c8102e', trim: '#046a38', number: 7, numberColor: '#f1d27a', shorts: '#046a38', socks: '#c8102e', boots: '#f2f2f2',
};

export const RONALDO: FigureSpec = {
  name: 'Ronaldo',
  portrait: PORTRAIT,
  idPrefix: ID,
  chin: [340, 850],
  skin: SKIN,
  kit: PORTUGAL_KIT,
  face: FACE_SPEC,
};

/** Full-body Cristiano Ronaldo. */
export class RonaldoFigure extends PortraitFigure {
  constructor(options: PortraitFigureOptions = {}) {
    super(RONALDO, options);
  }
}

/** Head and shoulders only, pivoted at the bottom of the chin. Use `scale` to size it. */
export function createRonaldoPortrait(options: Omit<SvgArtOptions, 'markup'> = {}) {
  return createPortrait(RONALDO, options);
}
