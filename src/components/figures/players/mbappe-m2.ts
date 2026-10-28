/**
 * Kylian Mbappé as a full caricature, "M2": a head drawn (not traced) from a reference photo – domed
 * head with a sharp shaped-up hairline, big ears, small almond eyes, broad round nose and his wide
 * toothy grin as the resting face – on the 'cartoon' body (hard cel shadows, bold outlines) with a
 * bigger head. Same signature as M1: "Kylian the dictator" unless you ask for the kit.
 *
 *   new MbappeCaricatureFigure({ x: 540, y: 1600, scale: 1.6 })      animate with figureActions
 *   new MbappeCaricatureFigure({ costume: 'kit' })                   in the Madrid kit
 *   createMbappeCaricaturePortrait({ x, y, scale: 0.4 })              head and shoulders only
 */
import portrait from '@/assets/portraits/mbappe-m2.svg?raw';
import type { SvgArtOptions } from '../../SvgArt';
import { CARTOON_EYES, cartoonMouths } from '../cartoon-face';
import type { FaceSpec } from '../expressions';
import { createPortrait, PortraitFigure, type FigureSpec, type PortraitFigureOptions } from '../PortraitFigure';
import { MBAPPE } from './mbappe';

const SKIN = { base: '#a96f47', shade: '#86512f', deep: '#5d3219' };
const LINE = '#21130b';

const FACE: FaceSpec = {
  leftEye: [[222, 480], [298, 476]],
  rightEye: [[464, 478], [388, 474]],
  leftBrow: [[206, 452], [302, 434]],
  rightBrow: [[482, 450], [386, 432]],
  colors: { line: LINE, crease: SKIN.shade, brow: '#17110e', iris: '#2a160c', white: '#f4ede4' },
  shapes: CARTOON_EYES,
  ...cartoonMouths({ skin: SKIN, line: LINE, lip: '#8f4f3b', upperLip: '#6e3626' }),
  lids: [
    { pivot: [260, 456], cover: 'M 212 486 C 226 444 292 440 308 480 C 292 498 230 500 212 486 Z', lash: 'M 220 484 C 244 496 280 496 302 482' },
    { pivot: [426, 454], cover: 'M 380 478 C 396 442 460 444 474 482 C 458 498 398 496 380 478 Z', lash: 'M 388 480 C 410 494 446 494 468 482' },
  ],
};

export const MBAPPE_CARICATURE: FigureSpec = {
  ...MBAPPE,
  name: 'MbappeCaricature',
  portrait,
  idPrefix: 'mbappe-m2',
  chin: [340, 850],
  skin: SKIN,
  face: FACE,
  style: 'cartoon',
  headScale: 0.25,
  // Compact sprinter: short torso, huge powerful thighs, big hands and boots.
  build: {
    upperArm: 52, forearm: 48, thigh: 90, shin: 78, armWidth: 1.2, legWidth: 1.5, torsoWidth: 1.1,
    hand: 1.4, foot: 1.45, torso: 0.82, neckWidth: 1.25,
  },
};

/** Full-body Mbappé caricature. */
export class MbappeCaricatureFigure extends PortraitFigure {
  constructor(options: PortraitFigureOptions = {}) {
    super(MBAPPE_CARICATURE, options);
  }
}

/** Head and shoulders only, pivoted at the bottom of the chin (~680 px wide: size it with `scale`). */
export function createMbappeCaricaturePortrait(options: Omit<SvgArtOptions, 'markup'> = {}) {
  return createPortrait(MBAPPE_CARICATURE, options);
}
