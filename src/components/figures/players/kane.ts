/**
 * Harry Kane: the "Portrait" version (K1), traced from a reference photo, nearly frontal – light-brown hair
 * combed back from a high, receding hairline, small deep-set blue-grey eyes, a long nose, a short
 * full beard and ears that stick out a little.
 * Bayern #9 kit by default (no crest), England #9 as `ENGLAND_KIT`.
 *
 *   new KaneFigure({ x: 540, y: 1600, scale: 1.6 })
 *   new KaneFigure({ kit: ENGLAND_KIT, expression: 'determined' })
 *   createKanePortrait({ x, y, scale: 0.4 })
 */
import portrait from '@/assets/portraits/kane-k1.svg?raw';
import type { SvgArtOptions } from '../../SvgArt';
import type { Kit } from '../../sport/Footballer';
import { DEFAULT_SHAPES, type DrawnFigureExpression, type FaceSpec } from '../expressions';
import { createPortrait, PortraitFigure, type FigureSpec, type PortraitFigureOptions } from '../PortraitFigure';
import { MBAPPE } from './mbappe';

const SKIN = { base: '#dba383', shade: '#b77c5d', deep: '#8c5640' };
const LINE = '#2b1a12';

/** The expression mouths are the M1 set moved onto Kane's mouth: smaller, and levelled. */
const fit = (markup: string) => `<g transform="translate(342 646) rotate(5) scale(0.66) translate(-356 -640)">${markup}</g>`;

const mouths = Object.fromEntries(
  (Object.keys(MBAPPE.face.mouths) as DrawnFigureExpression[]).map((name) => [name, (id: string) => fit(MBAPPE.face.mouths[name](id))]),
) as FaceSpec['mouths'];

const FACE: FaceSpec = {
  leftEye: [[213, 450], [296, 452]],
  rightEye: [[462, 448], [384, 450]],
  leftBrow: [[171, 423], [291, 404]],
  rightBrow: [[509, 425], [389, 399]],
  colors: { line: LINE, crease: SKIN.shade, brow: '#5a3f26', iris: '#6f8b98', white: '#f1ebe4' },
  mouths,
  // His eyes are small: the default happy squint would shut them.
  shapes: {
    happy: { ...DEFAULT_SHAPES.happy, eyes: [{ up: 22, low: 6 }, { up: 21, low: 6 }] },
    smug: { ...DEFAULT_SHAPES.smug, eyes: [{ up: 14, low: 8, look: [10, 2] }, { up: 20, low: 8, look: [10, 2] }] },
  },
  lids: [
    { pivot: [254, 432], cover: 'M 204 452 C 222 424 288 422 304 452 C 288 470 222 470 204 452 Z', lash: 'M 212 454 C 234 464 278 464 298 454' },
    { pivot: [423, 430], cover: 'M 376 450 C 392 422 456 422 470 450 C 456 468 392 468 376 450 Z', lash: 'M 382 452 C 404 462 448 462 464 452' },
  ],
  talk: {
    pivot: [342, 640],
    markup: (id) => fit(MBAPPE.face.talk.markup(id)),
  },
};

export const BAYERN_KIT: Kit = {
  shirt: '#dc052d', trim: '#ffffff', number: 9, numberColor: '#ffffff', shorts: '#dc052d', socks: '#dc052d', boots: '#f2f2f2',
};
export const ENGLAND_KIT: Kit = {
  shirt: '#f7f7f2', trim: '#1b2a59', number: 9, numberColor: '#c8102e', shorts: '#1b2a59', socks: '#f7f7f2', boots: '#2a2a2a',
};

export const KANE: FigureSpec = {
  name: 'Kane',
  portrait,
  idPrefix: 'kane-k1',
  chin: [340, 846],
  skin: SKIN,
  kit: BAYERN_KIT,
  face: FACE,
};

/** Full-body Harry Kane. */
export class KaneFigure extends PortraitFigure {
  constructor(options: PortraitFigureOptions = {}) {
    super(KANE, options);
  }
}

/** Head and shoulders only, pivoted at the bottom of the chin. Use `scale` to size it. */
export function createKanePortrait(options: Omit<SvgArtOptions, 'markup'> = {}) {
  return createPortrait(KANE, options);
}
