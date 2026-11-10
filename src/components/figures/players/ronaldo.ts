/**
 * Cristiano Ronaldo – the "Portrait" version (R1), drawn in code from the photos in
 * data-for-cartoons/references/Ronaldo, nearly frontal, with the caricature pushed a little:
 *   - long lean face, angular jaw, high sharp cheekbones over hollow cheeks, square chin with a dimple
 *   - black hair: short spikes swept up and back on top, skin-faded sides, an almost straight hairline
 *   - thick groomed brows breaking at the outer third; deep-set brown eyes under a heavy brow ridge
 *   - straight nose with wide nostrils; wide mouth with thin lips; deep smile folds
 *   - tanned skin with glossy highlights (forehead, nose, cheekbones), strong neck, stud earrings
 * Portugal #7 kit by default.
 *
 * Same 680 × 880 frame and data-parts as K1/M1/Y1, so it plugs into PortraitFigure and every action.
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

// ── shapes ───────────────────────────────────────────────────────────────────

const FACE = spline(symmetric([
  [340, 852], [384, 846], [430, 812], [474, 752], [500, 680], [516, 600], [530, 510], [536, 410], [528, 320], [506, 236], [462, 182], [404, 158], [340, 152],
], W));

const EAR = 'M 156 456 C 132 432 106 438 100 474 C 94 514 104 562 122 592 C 134 610 152 610 162 594 Z';
const EAR_FOLD = 'M 132 474 C 118 482 114 512 120 542 C 126 562 134 574 142 578';

const HAIR_SHAPE = spline([
  [152, 318], [150, 250], [170, 182], [222, 134], [296, 108], [372, 102], [446, 114], [502, 150], [530, 204], [530, 318],
  [512, 276], [476, 250], [420, 240], [340, 246], [262, 240], [208, 252], [168, 280],
]);
const FADE = spline([[146, 292], [140, 350], [146, 410], [172, 404], [178, 340], [178, 288]]);

/** Top edge of the hair cap at x (follows HAIR_SHAPE's crown). */
const capTop = (x: number) => 104 + ((x - 340) / 190) ** 2 * 96;

/** Short, chunky spikes swept up and back; their tips poke out of the cap's outline (deterministic). */
function spikes(): string {
  const out: string[] = [];
  for (let i = 0; i < 16; i++) {
    const x0 = 194 + i * 20, y0 = 228 + (i % 2) * 6;
    const x1 = x0 + 18 + (i % 3) * 6, y1 = capTop(x1) - 10 - (i % 2) * 8;
    const my = (y0 + y1) / 2;
    const d = `M ${x0 - 16} ${y0} Q ${x0 - 8} ${my} ${x1} ${y1} Q ${x0 + 12} ${my} ${x0 + 16} ${y0} Z`;
    out.push(`<path d="${d}" fill="${i % 2 ? HAIR.mid : HAIR.base}" ${stroke(3)}/>`);
    out.push(`<path d="M ${x0 - 2} ${y0 - 30} Q ${x0 + 3} ${my} ${x1 - 3} ${y1 + 22}" ${line(i % 3 ? 3 : 5, HAIR.light)} opacity="${i % 3 ? 0.5 : 0.8}"/>`);
  }
  return out.join('');
}

// Neck, shirt (Portugal red, green collar).
const NECK = 'M 232 748 C 234 800 226 852 210 900 L 470 900 C 454 852 446 800 448 748 Z';
const SHIRT = 'M -100 1010 C -120 960 -40 900 60 860 C 120 836 180 840 214 872 C 252 906 296 920 340 920 C 384 920 428 906 466 872 C 500 840 560 836 620 860 C 720 900 800 960 780 1010 Z';
const COLLAR = 'M 214 872 C 252 906 296 920 340 920 C 384 920 428 906 466 872';

// Nose.
const NOSE = {
  shadow: 'M 356 470 C 362 520 370 566 380 600 L 360 612 C 354 570 350 520 348 470 Z',
  bridge: 'M 324 476 C 320 530 314 570 308 596',
  wing: 'M 316 592 C 300 598 296 616 306 626 C 312 632 322 632 328 628',
  tip: 'M 322 630 C 330 640 350 640 358 630',
};

// Mouth (neutral): wide, thin upper lip, slightly fuller lower lip.
const MOUTH_NEUTRAL = `
  <path d="M 278 690 C 300 680 324 675 340 680 C 356 675 380 680 402 690 C 380 693 356 695 340 695 C 324 695 300 693 278 690 Z" fill="${LIP.upper}"/>
  <path d="M 288 693 C 312 714 368 714 392 693 C 368 698 312 698 288 693 Z" fill="${LIP.lower}"/>
  <ellipse cx="340" cy="702" rx="20" ry="4" fill="#d8927a" opacity=".7"/>
  <path d="M 278 690 C 306 697 374 697 402 690" ${line(5)}/>
  <path d="M 272 684 C 276 688 278 692 276 698 M 408 684 C 404 688 402 692 404 698" ${line(3.5, SKIN.deep)} opacity=".8"/>`;

// ── face spec: expressions reuse the M1 mouth set, moved onto his mouth ─────

const fit = (markup: string) => `<g transform="translate(340 692) scale(0.8) translate(-356 -640)">${markup}</g>`;
const mouths = Object.fromEntries(
  (Object.keys(MBAPPE.face.mouths) as DrawnFigureExpression[]).map((name) => [name, (id: string) => fit(MBAPPE.face.mouths[name](id))]),
) as FaceSpec['mouths'];

const FACE_SPEC: FaceSpec = {
  leftEye: [[212, 462], [298, 466]],
  rightEye: [[468, 462], [382, 466]],
  leftBrow: [[192, 422], [302, 412]],
  rightBrow: [[488, 422], [378, 412]],
  colors: { line: LINE, crease: SKIN.shade, brow: '#1d1410', iris: '#6b4a2a', white: '#efe6dc' },
  mouths,
  shapes: {
    happy: { brows: [{ inner: -8, outer: -6, arch: 14 }, { inner: -8, outer: -6, arch: 14 }], eyes: [{ up: 18, low: 4 }, { up: 18, low: 4 }] },
    smug: { brows: [{ inner: 6, outer: 4, arch: 6 }, { inner: -16, outer: -26, arch: 20 }], eyes: [{ up: 12, low: 9, look: [10, 2] }, { up: 18, low: 9, look: [10, 2] }] },
  },
  lids: [
    { pivot: [255, 446], cover: 'M 202 464 C 220 436 288 434 306 466 C 288 482 220 482 202 464 Z', lash: 'M 210 466 C 234 476 280 476 300 466' },
    { pivot: [425, 446], cover: mirror('M 202 464 C 220 436 288 434 306 466 C 288 482 220 482 202 464 Z'), lash: mirror('M 210 466 C 234 476 280 476 300 466') },
  ],
  talk: { pivot: [340, 690], markup: (id) => fit(MBAPPE.face.talk.markup(id)) },
};

/** Neutral: narrow almond eyes (deep-set), brows level with a break at the outer third. */
const NEUTRAL: EyesAndBrows = {
  eyes: [{ up: 19, low: 12 }, { up: 19, low: 12 }],
  brows: [{ inner: 2, outer: 8, arch: 16 }, { inner: 2, outer: 8, arch: 16 }],
};
const neutral = eyesAndBrowsMarkup(FACE_SPEC, NEUTRAL);

// ── the portrait ─────────────────────────────────────────────────────────────

const PORTRAIT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 880">
<defs>
  <filter id="${ID}-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="${ID}-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
  <clipPath id="${ID}-face"><path d="${FACE}"/></clipPath>
  <clipPath id="${ID}-hair"><path d="${HAIR_SHAPE}"/></clipPath>
  <linearGradient id="${ID}-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${HAIR.base}" stop-opacity=".6"/><stop offset="1" stop-color="${HAIR.base}" stop-opacity="0"/></linearGradient>
</defs>
<g data-part="neck">
  <path d="${NECK}" fill="${SKIN.shade}" ${stroke(5)}/>
  <ellipse cx="340" cy="790" rx="110" ry="40" fill="${SKIN.deep}" opacity=".55" ${soft}/>
  <path d="M 262 790 C 274 830 290 870 300 900 M 418 790 C 406 830 390 870 380 900" ${line(5, SKIN.deep)} opacity=".45"/>
</g>
<g data-part="shirt">
  <path d="${SHIRT}" fill="#c8102e" ${stroke(5)}/>
  <path d="${COLLAR}" stroke="#046a38" stroke-width="18" fill="none" stroke-linecap="round"/>
</g>
${both(EAR, `fill="${SKIN.base}" ${stroke(5)}`)}
${both(EAR_FOLD, line(6, SKIN.shade))}
<ellipse cx="124" cy="524" rx="10" ry="26" fill="${SKIN.deep}" opacity=".45"/><ellipse cx="556" cy="524" rx="10" ry="26" fill="${SKIN.deep}" opacity=".45"/>
<path d="${FACE}" fill="${SKIN.base}"/>
<g clip-path="url(#${ID}-face)">
  <g ${soft}>
    <ellipse cx="160" cy="520" rx="40" ry="220" fill="${SKIN.shade}" opacity=".9"/>
    <ellipse cx="520" cy="520" rx="40" ry="220" fill="${SKIN.shade}" opacity=".9"/>
    <ellipse cx="236" cy="630" rx="42" ry="74" fill="${SKIN.shade}" opacity=".75"/>
    <ellipse cx="444" cy="630" rx="42" ry="74" fill="${SKIN.shade}" opacity=".75"/>
    <ellipse cx="255" cy="452" rx="62" ry="26" fill="${SKIN.deep}" opacity=".7"/>
    <ellipse cx="425" cy="452" rx="62" ry="26" fill="${SKIN.deep}" opacity=".7"/>
    <ellipse cx="340" cy="836" rx="130" ry="36" fill="${SKIN.deep}" opacity=".7"/>
    <ellipse cx="340" cy="740" rx="150" ry="110" fill="#5a4030" opacity=".14"/>
    <ellipse cx="340" cy="300" rx="120" ry="42" fill="${GLOSS}" opacity=".95"/>
    <ellipse cx="340" cy="530" rx="14" ry="62" fill="${GLOSS}" opacity=".85"/>
    <ellipse cx="224" cy="534" rx="44" ry="18" fill="${GLOSS}" opacity=".85"/>
    <ellipse cx="456" cy="534" rx="44" ry="18" fill="${GLOSS}" opacity=".7"/>
    <ellipse cx="340" cy="808" rx="34" ry="14" fill="${GLOSS}" opacity=".6"/>
  </g>
  <path d="${FADE}" fill="url(#${ID}-fade)"/><path d="${mirror(FADE)}" fill="url(#${ID}-fade)"/>
  <g filter="url(#${ID}-blur)">
    ${both('M 300 612 C 280 640 268 668 266 700', line(6, SKIN.deep))}
    <path d="${NOSE.shadow}" fill="${SKIN.shade}" opacity=".8"/>
    <ellipse cx="340" cy="728" rx="34" ry="8" fill="${SKIN.deep}" opacity=".5"/>
  </g>
</g>
<path d="${FACE}" ${line(5)}/>
<path d="${HAIR_SHAPE}" fill="${HAIR.base}"/>
<path d="${HAIR_SHAPE}" ${line(4)}/>
${spikes()}
<g clip-path="url(#${ID}-hair)"><ellipse cx="320" cy="160" rx="110" ry="24" fill="${HAIR.light}" opacity=".35" ${soft}/></g>
<path d="${NOSE.bridge}" ${line(4, SKIN.shade)} opacity=".8"/>
${both(NOSE.wing, line(4.5))}
<path d="${NOSE.tip}" ${line(4)}/>
<ellipse cx="325" cy="629" rx="7" ry="3" fill="#5a3020" opacity=".8"/><ellipse cx="355" cy="629" rx="7" ry="3" fill="#5a3020" opacity=".8"/>
<ellipse cx="341" cy="608" rx="9" ry="6" fill="${GLOSS}" opacity=".8"/>
<path d="M 340 788 C 338 800 338 810 340 820" ${line(4, SKIN.deep)} opacity=".8"/>
<circle cx="128" cy="594" r="7" fill="#e9eef3" stroke="#8a96a3" stroke-width="2"/><circle cx="126" cy="592" r="2.5" fill="#fff"/>
<circle cx="552" cy="594" r="7" fill="#e9eef3" stroke="#8a96a3" stroke-width="2"/><circle cx="550" cy="592" r="2.5" fill="#fff"/>
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
