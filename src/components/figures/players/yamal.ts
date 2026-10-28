/**
 * Lamine Yamal: the "Portrait" version (Y1), traced from a reference photo in a three-quarter view – curly mop
 * with blond tips, faded sides, low thick brows, heavy-lidded smiling eyes and the braces.
 * Signature: shorts worn a little low, the undershorts' waistband peeking out (`hitchShorts()` pulls
 * them up – briefly; `flapShorts()` is a gust of wind). `{ shorts: 'baggy' }` for huge baggy ones.
 * Barça #10 kit by default (no crest), Spain #19 as `SPAIN_KIT`; lanky build.
 *
 *   new YamalFigure({ x: 540, y: 1600, scale: 1.6 })
 *   new YamalFigure({ kit: SPAIN_KIT, expression: 'laugh' })
 *   createYamalPortrait({ x, y, scale: 0.4 })
 */
import portrait from '@/assets/portraits/yamal-y1.svg?raw';
import type { SvgArtOptions } from '../../SvgArt';
import type { Kit } from '../../sport/Footballer';
import type { DrawnFigureExpression, FaceSpec } from '../expressions';
import { createPortrait, PortraitFigure, type FigureSpec, type PortraitFigureOptions } from '../PortraitFigure';
import { MBAPPE } from './mbappe';

const SKIN = { base: '#b98562', shade: '#8f5c3f', deep: '#6a3f2a' };
const LINE = '#2b1a12';
const BRACKET = '#9aa3ab';
const WIRE = '#7d868e';

/**
 * The expression mouths are the M1 set moved onto Yamal's mouth (narrower, tilted down to the
 * right with his head) and fitted with braces wherever teeth show.
 */
const fit = (markup: string) => `<g transform="translate(238 694) rotate(2) scale(0.9) translate(-356 -662)">${markup}</g>`;

/** Brackets and wire along the upper teeth, in M1 mouth coordinates. */
function braces(y: number, from: number, to: number): string {
  let s = `<path d="M ${from - 10} ${y} L ${to + 10} ${y - 6}" stroke="${WIRE}" stroke-width="3.5"/>`;
  for (let x = from; x <= to; x += 26) {
    const by = y - ((x - from) / (to - from)) * 6;
    s += `<rect x="${x - 7}" y="${(by - 7).toFixed(1)}" width="14" height="13" rx="2.5" fill="${BRACKET}" stroke="#5d656c" stroke-width="1.6"/>`;
  }
  return s;
}

const BRACES: Partial<Record<DrawnFigureExpression, string>> = {
  happy: braces(650, 268, 450),
  laugh: braces(642, 262, 462),
  angry: braces(662, 278, 440),
  shocked: braces(642, 324, 388),
};

const mouths = Object.fromEntries(
  (Object.keys(MBAPPE.face.mouths) as DrawnFigureExpression[]).map((name) => [
    name, (id: string) => fit(MBAPPE.face.mouths[name](id) + (BRACES[name] ?? '')),
  ]),
) as FaceSpec['mouths'];

const FACE: FaceSpec = {
  leftEye: [[98, 482], [180, 489]],
  rightEye: [[396, 499], [244, 498]],
  leftBrow: [[84, 436], [190, 430]],
  rightBrow: [[392, 466], [229, 451]],
  colors: { line: LINE, crease: SKIN.shade, brow: '#140d09', iris: '#2a170d', white: '#f1e8de' },
  mouths,
  lids: [
    { pivot: [139, 468], cover: 'M 88 494 C 102 456 174 452 190 488 C 172 508 106 510 88 494 Z', lash: 'M 96 492 C 118 502 160 502 184 492' },
    { pivot: [320, 478], cover: 'M 234 502 C 260 464 382 460 406 494 C 382 518 260 520 234 502 Z', lash: 'M 244 502 C 290 514 350 514 398 502' },
  ],
  talk: {
    pivot: [234, 671],
    markup: (id) => fit(MBAPPE.face.talk.markup(id) + braces(648, 262, 460)),
  },
};

export const BARCA_KIT: Kit = {
  shirt: '#a50044', stripes: '#004d98', number: 10, numberColor: '#edbb00', shorts: '#004d98', socks: '#a50044', boots: '#f2f2f2',
};
export const SPAIN_KIT: Kit = {
  shirt: '#c8102e', trim: '#f1bf00', number: 19, numberColor: '#f1bf00', shorts: '#1b2a59', socks: '#1b2a59', boots: '#f2f2f2',
};

export const YAMAL: FigureSpec = {
  name: 'Yamal',
  portrait,
  idPrefix: 'yamal-y1',
  chin: [380, 846],
  skin: SKIN,
  kit: BARCA_KIT,
  build: 'lanky',
  shorts: 'sagging',
  face: FACE,
};

/** Full-body Lamine Yamal. */
export class YamalFigure extends PortraitFigure {
  constructor(options: PortraitFigureOptions = {}) {
    super(YAMAL, options);
  }
}

/** Head and shoulders only, pivoted at the top of the neck. Use `scale` to size it. */
export function createYamalPortrait(options: Omit<SvgArtOptions, 'markup'> = {}) {
  return createPortrait(YAMAL, options);
}
