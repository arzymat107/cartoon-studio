/**
 * Kylian Mbappé: the "Portrait" version (M1), traced from a reference photo with his natural asymmetry kept
 * (head tilt, the right brow higher, a lopsided smile). Signature: "Kylian the dictator" – he wears
 * the generalissimo uniform unless you ask for the kit. Real Madrid #10 kit, no crest.
 *
 *   new MbappeFigure({ x: 540, y: 1600, scale: 1.6 })            the dictator; animate with figureActions
 *   new MbappeFigure({ costume: 'kit' })                         in the Madrid kit, for match scenes
 *   new MbappeFigure({ costume: 'emperor', expression: 'smug' }) Emperor Kylian
 *   createMbappePortrait({ x, y, scale: 0.4 })                   head and shoulders only
 */
import portrait from '@/assets/portraits/mbappe-m1.svg?raw';
import type { SvgArtOptions } from '../../SvgArt';
import type { FaceSpec } from '../expressions';
import { createPortrait, PortraitFigure, type FigureSpec, type PortraitFigureOptions } from '../PortraitFigure';

const SKIN = { base: '#b27a54', shade: '#8a5638', deep: '#64381f' };
const LINE = '#2b1a12';
const LIP = '#a5604c';
const UPPER_LIP = '#7d4434';
const MOUTH = '#3a0e0b';
const TEETH = '#fbf8f1';
const TONGUE = '#b4505a';

/** Smile folds from the nose wings to the mouth corners. */
const FOLDS = `
  <path d="M260 548 C230 574 214 610 222 648" stroke="${SKIN.shade}" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M420 532 C462 556 488 590 486 630" stroke="${SKIN.deep}" stroke-width="9" fill="none" stroke-linecap="round" opacity=".85"/>`;

/** Open mouth with upper teeth and a tongue, outlined, with a lower lip. */
function openMouth(id: string, d: string, lowerLip: string, teethBottom: number): string {
  return `${FOLDS}
    <path d="${lowerLip}" fill="${LIP}"/>
    <clipPath id="${id}"><path d="${d}"/></clipPath>
    <path d="${d}" fill="${MOUTH}"/>
    <g clip-path="url(#${id})">
      <ellipse cx="358" cy="${teethBottom + 70}" rx="80" ry="34" fill="${TONGUE}"/>
      <path d="M200 560 L520 560 L520 ${teethBottom - 6} C440 ${teethBottom + 6} 300 ${teethBottom + 14} 200 ${teethBottom + 6} Z" fill="${TEETH}"/>
    </g>
    <path d="${d}" fill="none" stroke="${LINE}" stroke-width="5" stroke-linejoin="round"/>`;
}

const GRIT = 'M250 660 C300 640 410 634 466 646 C474 668 470 690 460 704 C400 712 310 716 258 708 C246 692 244 676 250 660 Z';
const OH = 'M298 686 C298 730 324 760 356 760 C388 760 414 730 414 686 C414 648 388 630 356 630 C324 630 298 648 298 686 Z';
const TALK = 'M238 650 C296 640 400 632 478 614 C470 690 420 742 352 744 C292 744 250 706 238 650 Z';

const FACE: FaceSpec = {
  leftEye: [[160, 442], [264, 438]],
  rightEye: [[502, 414], [396, 428]],
  leftBrow: [[152, 396], [297, 366]],
  rightBrow: [[533, 345], [398, 372]],
  colors: { line: LINE, crease: SKIN.shade, brow: '#141010', iris: '#2e1a10', white: '#f3ece3' },
  mouths: {
    happy: (id) => openMouth(id,
      'M232 640 C300 636 412 624 484 604 C472 682 420 724 356 726 C292 726 248 694 232 640 Z',
      'M246 690 C290 750 418 750 474 664 C462 738 414 766 354 768 C294 768 254 736 246 690 Z', 664),
    laugh: (id) => openMouth(id,
      'M222 626 C300 624 414 610 494 590 C488 706 430 780 356 782 C280 782 232 726 222 626 Z',
      'M236 700 C276 790 436 792 486 690 C474 772 422 806 354 808 C288 808 244 774 236 700 Z', 656),
    smug: () => `
      <path d="M420 532 C462 556 488 590 486 624" stroke="${SKIN.deep}" stroke-width="9" fill="none" stroke-linecap="round" opacity=".85"/>
      <path d="M266 664 C300 680 380 682 452 622 C440 660 400 690 354 694 C306 694 280 684 266 664 Z" fill="${LIP}"/>
      <path d="M262 662 C316 664 392 658 456 614" stroke="${LINE}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M262 662 C300 646 350 648 456 614 C400 640 330 652 262 662 Z" fill="${UPPER_LIP}"/>
      <path d="M456 614 C472 612 480 626 472 640" stroke="${SKIN.deep}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    angry: (id) => `
      <path d="M268 548 C236 580 226 616 236 656" stroke="${SKIN.shade}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M414 536 C458 566 478 604 470 648" stroke="${SKIN.deep}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <clipPath id="${id}"><path d="${GRIT}"/></clipPath>
      <path d="${GRIT}" fill="${TEETH}"/>
      <g clip-path="url(#${id})" stroke="#bdb2a4" stroke-width="3">
        <path d="M240 678 C320 670 400 668 480 672" fill="none" stroke="${MOUTH}" stroke-width="5"/>
        ${[286, 316, 346, 376, 406, 436].map((x) => `<line x1="${x}" y1="640" x2="${x + 2}" y2="720"/>`).join('')}
      </g>
      <path d="${GRIT}" fill="none" stroke="${LINE}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M262 724 C320 738 400 736 448 722" stroke="${LIP}" stroke-width="10" fill="none" stroke-linecap="round"/>`,
    sad: () => `
      <path d="M290 694 C330 708 384 708 424 694 C410 718 380 726 354 726 C326 726 300 716 290 694 Z" fill="${LIP}"/>
      <path d="M262 690 C300 652 404 646 448 678" stroke="${LINE}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M262 690 C300 646 404 640 448 678 C404 656 300 660 262 690 Z" fill="${UPPER_LIP}"/>`,
    shocked: (id) => `
      <path d="M286 690 C286 740 320 772 356 772 C392 772 424 740 424 690 C424 646 392 622 356 622 C320 622 286 646 286 690 Z" fill="${LIP}" transform="translate(0 6)"/>
      <clipPath id="${id}"><path d="${OH}"/></clipPath>
      <path d="${OH}" fill="${MOUTH}"/>
      <g clip-path="url(#${id})">
        <path d="M290 620 L420 620 L420 652 C390 660 330 660 290 652 Z" fill="${TEETH}"/>
        <ellipse cx="356" cy="760" rx="46" ry="26" fill="${TONGUE}"/>
      </g>
      <path d="${OH}" fill="none" stroke="${LINE}" stroke-width="5"/>`,
    determined: () => `
      <path d="M420 540 C456 566 474 600 468 636" stroke="${SKIN.deep}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="M276 674 C320 690 392 688 440 664 C426 690 392 702 354 702 C318 702 290 692 276 674 Z" fill="${LIP}"/>
      <path d="M266 670 C320 662 396 654 448 654" stroke="${LINE}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M266 670 C320 652 396 642 448 654 C396 650 320 660 266 670 Z" fill="${UPPER_LIP}"/>`,
  },
  lids: [
    { pivot: [212, 396], cover: 'M 140 450 C 168 380 252 376 286 438 C 250 468 176 470 140 450 Z', lash: 'M 154 448 C 190 462 236 460 272 442' },
    { pivot: [449, 382], cover: 'M 376 438 C 406 366 488 362 522 404 C 486 452 416 454 376 438 Z', lash: 'M 390 436 C 424 450 470 448 508 422' },
  ],
  talk: {
    pivot: [352, 636],
    markup: (id) => `
      <clipPath id="${id}"><path d="${TALK}"/></clipPath>
      <path d="M248 696 C290 754 410 758 466 684 C454 742 410 768 352 770 C298 770 260 742 248 696 Z" fill="${LIP}"/>
      <path d="${TALK}" fill="${MOUTH}"/>
      <g clip-path="url(#${id})">
        <ellipse cx="356" cy="736" rx="76" ry="30" fill="${TONGUE}"/>
        <path d="M230 600 L490 600 L490 640 C430 662 330 672 230 670 Z" fill="${TEETH}"/>
      </g>
      <path d="${TALK}" fill="none" stroke="${LINE}" stroke-width="4" stroke-linejoin="round"/>`,
  },
};

export const MBAPPE: FigureSpec = {
  name: 'Mbappe',
  portrait,
  idPrefix: 'mbappe-m1',
  chin: [352, 842],
  skin: SKIN,
  kit: { shirt: '#f7f7f2', trim: '#c9a227', number: 10, numberColor: '#1b2a59', shorts: '#f7f7f2', socks: '#f7f7f2', boots: '#2a2a2a' },
  costume: 'generalissimo',
  face: FACE,
};

/** Full-body Mbappé. */
export class MbappeFigure extends PortraitFigure {
  constructor(options: PortraitFigureOptions = {}) {
    super(MBAPPE, options);
  }
}

/**
 * Head and shoulders only, pivoted at the bottom of the chin. The artwork is ~680 px wide,
 * so use `scale` to size it (e.g. 0.3 for a head on a full-body character).
 */
export function createMbappePortrait(options: Omit<SvgArtOptions, 'markup'> = {}) {
  return createPortrait(MBAPPE, options);
}
