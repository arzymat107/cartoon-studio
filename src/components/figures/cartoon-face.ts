/**
 * Shared parts for the drawn caricature heads ('cartoon' style: flat colours, bold outlines): one
 * set of mouths for every expression plus the talking mouth, and eye shapes for small cartoon eyes.
 * Drawn for the Mbappé M2 face (mouth around (346, 690) in the 680 × 880 portrait frame); other
 * faces place them with `fit`.
 */
import type { DrawnFigureExpression, EyesAndBrows, FaceSpec } from './expressions';
import type { SkinPalette } from './paint';

export interface MouthPalette {
  skin: SkinPalette;
  line: string;
  lip: string;
  upperLip: string;
  /** Metal braces on the teeth (Yamal). */
  braces?: boolean;
}

const MOUTH = '#3a0e0b';
const TEETH = '#fbf8f1';
const TONGUE = '#b4505a';

const GRIT = 'M 262 664 C 310 654 392 650 436 660 C 444 682 440 704 430 716 C 380 724 312 726 270 718 C 258 702 256 684 262 664 Z';
const OH = 'M 300 704 C 300 750 322 778 346 778 C 372 778 394 750 394 704 C 394 666 372 646 346 646 C 322 646 300 666 300 704 Z';
const TALK = 'M 246 664 C 300 680 394 676 450 652 C 440 724 400 758 346 760 C 292 760 256 726 246 664 Z';

/** A wire with little brackets along the bottom of the upper teeth, at height `y`. */
function braces(y: number): string {
  const brackets = [270, 300, 330, 362, 394, 424].map((x) => `<rect x="${x - 7}" y="${y - 7}" width="14" height="12" rx="2" fill="#c9ced6" stroke="#6b7280" stroke-width="2"/>`).join('');
  return `<path d="M 220 ${y} C 300 ${y + 8} 400 ${y + 4} 470 ${y - 10}" stroke="#9aa1ab" stroke-width="4" fill="none"/>${brackets}`;
}

/** Where the mouth goes on another face: (346, 690) moves to (x, y) and is scaled by `scale`. */
export interface MouthFit {
  x: number;
  y: number;
  scale: number;
}

/** Mouths for every expression and the talking mouth, in one caricature style. */
export function cartoonMouths(p: MouthPalette, fit?: MouthFit): Pick<FaceSpec, 'mouths' | 'talk'> {
  const { skin, line, lip, upperLip } = p;
  const transform = fit ? `translate(${fit.x} ${fit.y}) scale(${fit.scale}) translate(-346 -690)` : '';
  const wrap = (markup: string) => (transform ? `<g transform="${transform}">${markup}</g>` : markup);
  const place = ([x, y]: [number, number]): [number, number] =>
    fit ? [fit.x + (x - 346) * fit.scale, fit.y + (y - 690) * fit.scale] : [x, y];
  const folds = `
  <path d="M 262 606 C 234 632 226 664 240 700" stroke="${skin.shade}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M 430 600 C 460 626 468 660 452 696" stroke="${skin.deep}" stroke-width="9" fill="none" stroke-linecap="round"/>`;

  /** Open mouth: lower lip, dark inside, upper teeth down to `teethBottom`, a tongue, outlined. */
  const open = (id: string, d: string, lowerLip: string, teethBottom: number, tongueY: number) => wrap(`${folds}
    <path d="${lowerLip}" fill="${lip}"/>
    <clipPath id="${id}"><path d="${d}"/></clipPath>
    <path d="${d}" fill="${MOUTH}"/>
    <g clip-path="url(#${id})">
      <ellipse cx="346" cy="${tongueY}" rx="70" ry="30" fill="${TONGUE}"/>
      <path d="M 210 600 L 480 600 L 480 ${teethBottom - 8} C 410 ${teethBottom + 8} 300 ${teethBottom + 12} 210 ${teethBottom} Z" fill="${TEETH}"/>
      ${p.braces ? braces(teethBottom - 16) : ''}
    </g>
    <path d="${d}" fill="none" stroke="${line}" stroke-width="8" stroke-linejoin="round"/>`);

  return {
    mouths: {
      happy: (id) => open(id,
        'M 236 660 C 298 680 394 676 452 648 C 442 724 400 760 344 762 C 288 762 248 726 236 660 Z',
        'M 248 712 C 282 778 406 780 444 702 C 430 770 392 796 344 798 C 294 798 260 770 248 712 Z', 704, 750),
      laugh: (id) => open(id,
        'M 226 648 C 298 670 396 666 464 632 C 460 752 410 804 344 806 C 276 806 232 752 226 648 Z',
        'M 240 724 C 276 812 412 814 456 712 C 444 800 400 834 344 836 C 288 836 248 802 240 724 Z', 698, 776),
      smug: () => wrap(`${folds}
      <path d="M 274 698 C 310 716 392 710 432 676 C 420 704 388 724 346 726 C 304 726 284 714 274 698 Z" fill="${lip}"/>
      <path d="M 266 694 C 320 702 400 690 448 650" stroke="${line}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M 266 694 C 310 680 380 676 448 650 C 400 676 330 690 266 694 Z" fill="${upperLip}"/>
      <path d="M 448 650 C 464 648 470 662 462 676" stroke="${skin.deep}" stroke-width="6" fill="none" stroke-linecap="round"/>`),
      angry: (id) => wrap(`
      <path d="M 268 608 C 240 636 232 668 244 704" stroke="${skin.shade}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M 424 604 C 452 632 460 666 450 700" stroke="${skin.deep}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <clipPath id="${id}"><path d="${GRIT}"/></clipPath>
      <path d="${GRIT}" fill="${TEETH}"/>
      <g clip-path="url(#${id})" stroke="#bdb2a4" stroke-width="3">
        <path d="M 250 688 C 320 682 390 680 450 684" fill="none" stroke="${MOUTH}" stroke-width="5"/>
        ${[292, 320, 348, 376, 404].map((x) => `<line x1="${x}" y1="650" x2="${x + 2}" y2="726"/>`).join('')}
        ${p.braces ? braces(676) : ''}
      </g>
      <path d="${GRIT}" fill="none" stroke="${line}" stroke-width="8" stroke-linejoin="round"/>
      <path d="M 274 734 C 320 746 380 746 424 732" stroke="${lip}" stroke-width="10" fill="none" stroke-linecap="round"/>`),
      sad: () => wrap(`
      <path d="M 296 716 C 330 730 370 730 404 716 C 392 740 368 748 350 748 C 328 748 306 738 296 716 Z" fill="${lip}"/>
      <path d="M 268 714 C 300 674 396 670 430 704" stroke="${line}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M 268 714 C 300 668 396 664 430 704 C 396 682 300 686 268 714 Z" fill="${upperLip}"/>`),
      shocked: (id) => wrap(`
      <path d="${OH}" fill="${lip}" transform="translate(0 8)"/>
      <clipPath id="${id}"><path d="${OH}"/></clipPath>
      <path d="${OH}" fill="${MOUTH}"/>
      <g clip-path="url(#${id})">
        <path d="M 296 640 L 400 640 L 400 670 C 370 678 326 678 296 670 Z" fill="${TEETH}"/>
        <ellipse cx="346" cy="770" rx="40" ry="24" fill="${TONGUE}"/>
      </g>
      <path d="${OH}" fill="none" stroke="${line}" stroke-width="8"/>`),
      determined: () => wrap(`
      <path d="M 426 604 C 452 630 460 662 450 694" stroke="${skin.deep}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="M 280 696 C 320 712 382 710 424 690 C 410 714 382 724 348 724 C 316 724 292 714 280 696 Z" fill="${lip}"/>
      <path d="M 266 690 C 318 684 388 680 436 680" stroke="${line}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M 266 690 C 318 676 388 668 436 680 C 388 676 318 682 266 690 Z" fill="${upperLip}"/>`),
    },
    talk: {
      pivot: place([346, 664]),
      markup: (id) => wrap(`
      <clipPath id="${id}"><path d="${TALK}"/></clipPath>
      <path d="M 256 712 C 290 770 404 772 440 700 C 426 764 390 786 346 788 C 300 788 266 762 256 712 Z" fill="${lip}"/>
      <path d="${TALK}" fill="${MOUTH}"/>
      <g clip-path="url(#${id})">
        <ellipse cx="346" cy="748" rx="66" ry="28" fill="${TONGUE}"/>
        <path d="M 230 620 L 470 620 L 470 682 C 410 700 300 706 230 696 Z" fill="${TEETH}"/>
        ${p.braces ? braces(668) : ''}
      </g>
      <path d="${TALK}" fill="none" stroke="${line}" stroke-width="7" stroke-linejoin="round"/>`),
    },
  };
}

/** Small cartoon eyes: the default shapes (tuned on the traced M1 portrait) a size smaller. */
export const CARTOON_EYES: Partial<Record<DrawnFigureExpression, EyesAndBrows>> = {
  happy: {
    brows: [{ inner: -6, outer: -6, arch: 14 }, { inner: -6, outer: -8, arch: 14 }],
    eyes: [{ up: 14, low: -4 }, { up: 13, low: -5 }],
  },
  smug: {
    brows: [{ inner: 6, outer: 4, arch: 8 }, { inner: -16, outer: -26, arch: 20 }],
    eyes: [{ up: 8, low: 6, look: [8, 2] }, { up: 12, low: 6, look: [8, 2] }],
  },
  angry: {
    brows: [{ inner: 28, outer: -6, arch: 2, pinch: 10 }, { inner: 28, outer: -8, arch: 2, pinch: 10 }],
    eyes: [{ up: 16, low: 6, innerDrop: 12, iris: 0.85 }, { up: 16, low: 6, innerDrop: 12, iris: 0.85 }],
  },
  sad: {
    brows: [{ inner: -22, outer: 12, arch: 4 }, { inner: -24, outer: 12, arch: 4 }],
    eyes: [{ up: 15, low: 9, outerDrop: 10, look: [0, 5] }, { up: 14, low: 9, outerDrop: 10, look: [0, 5] }],
  },
  shocked: {
    brows: [{ inner: -30, outer: -26, arch: 20 }, { inner: -30, outer: -28, arch: 20 }],
    eyes: [{ up: 26, low: 16, iris: 0.7 }, { up: 25, low: 16, iris: 0.7 }],
  },
  determined: {
    brows: [{ inner: 16, outer: -2, arch: 5, pinch: 6 }, { inner: 16, outer: -4, arch: 5, pinch: 6 }],
    eyes: [{ up: 12, low: 5, innerDrop: 8 }, { up: 11, low: 5, innerDrop: 8 }],
  },
};
