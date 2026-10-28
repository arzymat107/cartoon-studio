/**
 * Lamine Yamal – the "Caricature" version (Y2): a head drawn (not traced) from a reference photo – a huge
 * curly mop with blond tips and faded sides, a long slim face, low thick brows, sleepy heavy-lidded
 * eyes and the braces grin – on the 'cartoon' body with a bigger head. Same signature as Y1: the
 * huge baggy shorts. Barça #10 kit by default (no crest), Spain #19 as `SPAIN_KIT`.
 *
 *   new YamalCaricatureFigure({ x: 540, y: 1600, scale: 1.6 })      animate with figureActions
 *   createYamalCaricaturePortrait({ x, y, scale: 0.4 })               head and shoulders only
 */
import portrait from '@/assets/portraits/yamal-y2.svg?raw';
import type { SvgArtOptions } from '../../SvgArt';
import { CARTOON_EYES, cartoonMouths } from '../cartoon-face';
import type { FaceSpec } from '../expressions';
import { createPortrait, PortraitFigure, type FigureSpec, type PortraitFigureOptions } from '../PortraitFigure';
import { YAMAL } from './yamal';

const SKIN = { base: '#b98562', shade: '#8f5c3f', deep: '#6a3f2a' };
const LINE = '#21130b';

const FACE: FaceSpec = {
  leftEye: [[238, 506], [314, 502]],
  rightEye: [[456, 504], [380, 500]],
  leftBrow: [[228, 476], [322, 470]],
  rightBrow: [[466, 474], [372, 468]],
  colors: { line: LINE, crease: SKIN.shade, brow: '#2b1a12', iris: '#2a160c', white: '#f4ede4' },
  shapes: CARTOON_EYES,
  ...cartoonMouths({ skin: SKIN, line: LINE, lip: '#9a5a45', upperLip: '#7a3f2e', braces: true }, { x: 346, y: 700, scale: 0.84 }),
  lids: [
    { pivot: [276, 480], cover: 'M 228 512 C 255 468 297 468 324 508 C 297 526 255 526 228 512 Z', lash: 'M 236 510 C 255 520 297 520 316 506' },
    { pivot: [418, 478], cover: 'M 370 506 C 397 466 439 466 466 510 C 439 524 397 524 370 506 Z', lash: 'M 378 504 C 397 518 439 518 458 508' },
  ],
};

export const YAMAL_CARICATURE: FigureSpec = {
  ...YAMAL,
  name: 'YamalCaricature',
  portrait,
  idPrefix: 'yamal-y2',
  chin: [346, 852],
  skin: SKIN,
  face: FACE,
  style: 'cartoon',
  headScale: 0.25,
  // Beanpole teenager: very long skinny legs and arms, narrow chest, long thin neck, big feet.
  build: {
    upperArm: 82, forearm: 76, thigh: 146, shin: 132, armWidth: 0.6, legWidth: 0.56, torsoWidth: 0.72,
    hand: 1.3, foot: 1.5, torso: 1.06, neck: 22, neckWidth: 0.7,
  },
};

/** Full-body Lamine Yamal caricature. */
export class YamalCaricatureFigure extends PortraitFigure {
  constructor(options: PortraitFigureOptions = {}) {
    super(YAMAL_CARICATURE, options);
  }
}

/** Head and shoulders only, pivoted at the bottom of the chin (~680 px wide: size it with `scale`). */
export function createYamalCaricaturePortrait(options: Omit<SvgArtOptions, 'markup'> = {}) {
  return createPortrait(YAMAL_CARICATURE, options);
}
