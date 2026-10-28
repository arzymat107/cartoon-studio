/**
 * Harry Kane – the "Caricature" version (K2): a head drawn (not traced) from a reference photo – a
 * towering forehead under a receding M-shaped hairline, light-brown hair combed back with one loose
 * strand, small deep-set blue-grey eyes, a long straight nose, a short full beard and ears that
 * stick out – on the 'cartoon' body with a bigger head. Same signature as K1: the trophy curse.
 * Bayern #9 kit by default (no crest), England #9 as `ENGLAND_KIT`.
 *
 *   new KaneCaricatureFigure({ x: 540, y: 1600, scale: 1.6 })      animate with figureActions
 *   createKaneCaricaturePortrait({ x, y, scale: 0.4 })               head and shoulders only
 */
import portrait from '@/assets/portraits/kane-k2.svg?raw';
import type { SvgArtOptions } from '../../SvgArt';
import { CARTOON_EYES, cartoonMouths } from '../cartoon-face';
import type { FaceSpec } from '../expressions';
import { createPortrait, PortraitFigure, type FigureSpec, type PortraitFigureOptions } from '../PortraitFigure';
import { KANE } from './kane';

const SKIN = { base: '#dba383', shade: '#b77c5d', deep: '#8c5640' };
const LINE = '#2a170d';

const FACE: FaceSpec = {
  leftEye: [[236, 504], [306, 502]],
  rightEye: [[446, 502], [376, 500]],
  leftBrow: [[214, 470], [310, 462]],
  rightBrow: [[468, 466], [372, 458]],
  colors: { line: LINE, crease: SKIN.shade, brow: '#7a5232', iris: '#6f8a96', white: '#f4ede4' },
  shapes: CARTOON_EYES,
  ...cartoonMouths({ skin: SKIN, line: LINE, lip: '#b9705d', upperLip: '#9a5646' }, { x: 342, y: 704, scale: 0.78 }),
  lids: [
    { pivot: [271, 480], cover: 'M 226 510 C 251 468 291 468 316 508 C 291 525 251 525 226 510 Z', lash: 'M 234 508 C 251 519 291 519 308 506' },
    { pivot: [411, 478], cover: 'M 366 506 C 391 466 431 466 456 508 C 431 523 391 523 366 506 Z', lash: 'M 374 504 C 391 517 431 517 448 506' },
  ],
};

export const KANE_CARICATURE: FigureSpec = {
  ...KANE,
  name: 'KaneCaricature',
  portrait,
  idPrefix: 'kane-k2',
  chin: [340, 858],
  skin: SKIN,
  face: FACE,
  style: 'cartoon',
  headScale: 0.25,
  // Tall, barrel-chested striker: broad long torso, thick neck, solid limbs.
  build: {
    upperArm: 66, forearm: 60, thigh: 112, shin: 96, armWidth: 1.18, legWidth: 1.18, torsoWidth: 1.28,
    hand: 1.3, foot: 1.35, torso: 1.12, neckWidth: 1.35,
  },
};

/** Full-body Harry Kane caricature. */
export class KaneCaricatureFigure extends PortraitFigure {
  constructor(options: PortraitFigureOptions = {}) {
    super(KANE_CARICATURE, options);
  }
}

/** Head and shoulders only, pivoted at the bottom of the chin (~680 px wide: size it with `scale`). */
export function createKaneCaricaturePortrait(options: Omit<SvgArtOptions, 'markup'> = {}) {
  return createPortrait(KANE_CARICATURE, options);
}
