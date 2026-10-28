/**
 * Costumes for portrait figures: the comedy uniforms of "Kylian the dictator" – over-the-top and clearly
 * fictional: football medals, club colors and a French cockade, no real regime insignia – and a tuxedo
 * for award nights.
 * Torso parts are drawn in torso coordinates (hip at 0, 0); hats in head coordinates (neck at 0, 0).
 */
import { svg } from '@/engine';
import { smoothPath } from '../characters/face';
import { LINE, type Painter, type Point } from './paint';

export interface Costume {
  sleeve: string;
  cuff: string;
  trousers: string;
  boots: string;
  /** Below the waist: coat skirt, belt (does not bend with the chest). */
  hips(g: SVGGElement, p: Painter): void;
  /** Coat from the waist up, under the arms. */
  chest(g: SVGGElement, p: Painter): void;
  /** Over the arms: epaulettes at the shoulder roots (x = ±shoulder, y = −124). */
  shoulders(g: SVGGElement, p: Painter, shoulder: number): void;
  /** Hat over the hair. */
  hat(g: SVGGElement, p: Painter): void;
  /** How far the hat rises above the hair. */
  hatHeight: number;
}

const GOLD = '#c9a227';
const GOLD_DARK = '#8a6d12';

const line = (g: Element, d: string, stroke: string, width: number, extra: Record<string, string | number> = {}) =>
  g.appendChild(svg('path', { d, stroke, 'stroke-width': width, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra }));
const dot = (g: Element, cx: number, cy: number, r: number, fill: string) =>
  g.appendChild(svg('circle', { cx, cy, r, fill, stroke: LINE, 'stroke-width': 0.8 }));
const mirror = (points: Point[]): Point[] => [...points, ...points.slice(1, -1).reverse().map(([x, y]): Point => [-x, y])];

/** Coat body from the collar to the waist: the kit shirt's silhouette, a little roomier. */
const COAT = smoothPath(mirror([
  [0, -130], [17, -146], [48, -141], [60, -126], [56, -96], [51, -62], [51, -28], [26, -20], [0, -18],
]));

/** Gold epaulettes with a fringe. */
function epaulettes(g: SVGGElement, p: Painter, shoulder: number): void {
  for (const side of [-1, 1]) {
    const x = side * shoulder;
    for (let i = -3; i <= 3; i++) line(g, `M ${x + i * 3.4} -122 L ${x + i * 3.6} -110`, GOLD_DARK, 2);
    p.shape(g, smoothPath([[x - 16, -126], [x - 8, -134], [x + 8, -134], [x + 16, -126], [x + 8, -119], [x - 8, -119]]), GOLD, 3);
    dot(g, x - side * 10, -127, 2.6, '#f2d675');
  }
}

/** A football medal hanging from a ribbon. */
function medal(g: Element, x: number, y: number, ribbon: string, face: 'ball' | 'gold' | 'ten'): void {
  g.appendChild(svg('path', { d: `M ${x - 4} ${y - 16} L ${x + 4} ${y - 16} L ${x + 3} ${y - 6} L ${x - 3} ${y - 6} Z`, fill: ribbon, stroke: LINE, 'stroke-width': 0.8 }));
  if (face === 'ball') {
    dot(g, x, y, 6, '#ffffff');
    g.appendChild(svg('circle', { cx: x, cy: y, r: 2.2, fill: '#222' }));
  } else {
    dot(g, x, y, 6, GOLD);
    if (face === 'ten') {
      const t = g.appendChild(svg('text', { x, y: y + 2.6, 'text-anchor': 'middle', 'font-size': 7, 'font-weight': 900, fill: GOLD_DARK, 'font-family': 'Impact, sans-serif' }));
      t.textContent = '10';
    } else {
      g.appendChild(svg('path', { d: `M ${x} ${y - 4} L ${x + 1.2} ${y - 1} L ${x + 4} ${y - 1} L ${x + 1.8} ${y + 1} L ${x + 2.6} ${y + 4} L ${x} ${y + 2.2} L ${x - 2.6} ${y + 4} L ${x - 1.8} ${y + 1} L ${x - 4} ${y - 1} L ${x - 1.2} ${y - 1} Z`, fill: '#f2d675' }));
    }
  }
}

// ── Generalissimo of Madrid ──────────────────────────────────────────────

const WHITE = '#f4f1e8';
const PURPLE = '#6a3d9a';
const NAVY = '#1b2a59';

/** White-and-gold dress uniform, Madrid-purple sash, a chest full of football medals, peaked cap. */
export const GENERALISSIMO: Costume = {
  sleeve: WHITE, cuff: GOLD, trousers: NAVY, boots: '#161616', hatHeight: 50,
  hips(g, p) {
    p.shape(g, smoothPath(mirror([[0, 8], [10, 22], [58, 26], [55, 0], [50, -36], [0, -38]])), WHITE, 9);
    line(g, 'M 0 -30 L 0 10', '#cfcabd', 1.5);
    p.shape(g, 'M -51 -36 L 51 -36 L 52 -24 L -52 -24 Z', GOLD, 2);
    p.shape(g, 'M -8 -38 L 8 -38 L 8 -22 L -8 -22 Z', '#f2d675', 1);
  },
  chest(g, p) {
    p.shape(g, COAT, WHITE, 12);
    line(g, 'M 0 -132 L 0 -24', '#cfcabd', 1.5);
    for (const y of [-118, -100, -82, -64, -46]) for (const x of [-11, 11]) dot(g, x, y, 2.6, GOLD);
    // Aiguillette: gold rope from the shoulder to the chest.
    line(g, 'M -46 -128 C -46 -100 -30 -92 -14 -112', GOLD, 2.5);
    line(g, 'M -46 -128 C -40 -108 -28 -100 -14 -112', GOLD_DARK, 1.6);
    // Sash, shoulder to hip.
    p.shape(g, 'M 36 -138 L 50 -128 L -40 -26 L -54 -36 Z', PURPLE, 4);
    line(g, 'M 38 -136 L -52 -34', GOLD, 1.5);
    line(g, 'M 50 -126 L -40 -26', GOLD, 1.5);
    // Ribbon bars and medals over the heart (the screen right).
    const bars = ['#c8102e', GOLD, '#2a9d4b', NAVY, '#ffffff', '#c8102e'];
    bars.forEach((c, i) => g.appendChild(svg('rect', { x: 12 + (i % 3) * 9, y: -128 + Math.floor(i / 3) * 6, width: 9, height: 6, fill: c, stroke: LINE, 'stroke-width': 0.6 })));
    medal(g, 16, -98, '#c8102e', 'ball');
    medal(g, 28, -96, NAVY, 'ten');
    medal(g, 40, -98, GOLD, 'gold');
    // High gold collar.
    p.shape(g, 'M -21 -152 L 21 -152 L 23 -134 Q 0 -128 -23 -134 Z', GOLD, 3);
  },
  shoulders: epaulettes,
  hat(g, p) {
    // Peaked cap: white crown, gold band and football badge, black visor.
    p.shape(g, smoothPath([[-78, -192], [-44, -216], [0, -222], [46, -216], [82, -194], [64, -178], [0, -174], [-62, -178]]), WHITE, 7);
    p.shape(g, 'M -62 -182 Q 0 -172 64 -182 L 62 -164 Q 0 -156 -60 -164 Z', GOLD, 3);
    line(g, 'M -60 -173 Q 0 -165 62 -173', GOLD_DARK, 1.5);
    dot(g, 2, -194, 10, GOLD);
    dot(g, 2, -194, 6, '#ffffff');
    g.appendChild(svg('circle', { cx: 2, cy: -194, r: 2.4, fill: '#222' }));
    p.shape(g, 'M -58 -164 Q 0 -152 60 -164 Q 56 -146 0 -140 Q -54 -146 -58 -164 Z', '#161616', 3);
    line(g, 'M -40 -152 Q 0 -146 42 -152', 'rgba(255,255,255,0.35)', 2);
  },
};

// ── Emperor Kylian ──────────────────────────────────────────────────────

const BLUE = '#1f2f6b';
const RED = '#b3202a';
const CREAM = '#efe9dc';

/** Napoleon's blue coat with white lapels and red collar, cream breeches, tall boots, bicorne. */
export const EMPEROR: Costume = {
  sleeve: BLUE, cuff: RED, trousers: CREAM, boots: '#161616', hatHeight: 44,
  hips(g, p) {
    p.shape(g, smoothPath(mirror([[0, 14], [10, 26], [44, 30], [46, 0], [44, -36], [0, -38]])), CREAM, 7);
    for (const side of [-1, 1]) {
      // Coat tails, open at the front.
      p.shape(g, smoothPath([[side * 18, -36], [side * 52, -36], [side * 60, 4], [side * 66, 44], [side * 44, 48], [side * 22, 0]]), BLUE, 8);
    }
    p.shape(g, 'M -50 -38 L 50 -38 L 50 -27 L -50 -27 Z', CREAM, 2);
  },
  chest(g, p) {
    p.shape(g, COAT, BLUE, 12);
    // Cream waistcoat with gold buttons.
    p.shape(g, 'M -16 -134 L 16 -134 L 20 -24 L -20 -24 Z', CREAM, 4);
    for (const y of [-118, -102, -86, -70, -54, -38]) dot(g, 0, y, 2.2, GOLD);
    // White lapels with gold buttons.
    for (const side of [-1, 1]) {
      p.shape(g, `M ${side * 15} -140 L ${side * 36} -132 L ${side * 30} -70 L ${side * 17} -60 Z`, '#f7f5ef', 3);
      for (const y of [-124, -108, -92, -78]) dot(g, side * 27, y, 2, GOLD);
    }
    // Hand-in-coat gap.
    line(g, 'M 6 -96 L 6 -80', '#3a3020', 1.5);
    p.shape(g, 'M -22 -154 L 22 -154 L 24 -134 Q 0 -128 -24 -134 Z', RED, 3);
    line(g, 'M -22 -150 L 22 -150', GOLD, 1.5);
  },
  shoulders: epaulettes,
  hat(g, p) {
    // Bicorne worn sideways, with a French cockade.
    g.setAttribute('transform', 'translate(0 12)'); // sits down on the curls
    p.shape(g, smoothPath([[-112, -158], [-70, -194], [0, -226], [70, -194], [112, -158], [64, -174], [0, -170], [-64, -174]]), '#161616', 6);
    line(g, 'M -110 -160 Q -70 -190 0 -222 Q 70 -190 110 -160', GOLD, 3);
    line(g, 'M -62 -176 Q 0 -168 64 -176', 'rgba(255,255,255,0.25)', 2);
    for (const [r, c] of [[13, '#1f3fa0'], [8.5, '#ffffff'], [4, RED]] as const) dot(g, 40, -192, r, c);
  },
};

// ── Tuxedo ─────────────────────────────────────────────────────────────

const BLACK = '#17171c';
const SATIN = '#2c2c36';
const SHIRT = '#f7f6f2';

/** Black tie for award nights: tuxedo with satin lapels, white shirt, bow tie and pocket square. */
export const TUXEDO: Costume = {
  sleeve: BLACK, cuff: SHIRT, trousers: BLACK, boots: '#0c0c0e', hatHeight: 0,
  hips(g, p) {
    p.shape(g, smoothPath(mirror([[0, 10], [10, 24], [50, 28], [50, 0], [47, -36], [0, -38]])), BLACK, 7);
    line(g, 'M 0 -30 L 0 12', '#000', 1.5);
  },
  chest(g, p) {
    p.shape(g, COAT, BLACK, 12);
    // Shirt front in the V of the jacket, with studs.
    p.shape(g, 'M -17 -140 L 17 -140 L 4 -64 L -4 -64 Z', SHIRT, 3);
    for (const y of [-118, -102, -86]) dot(g, 0, y, 1.8, '#222');
    // Satin lapels down to the single button.
    for (const side of [-1, 1]) {
      p.shape(g, `M ${side * 17} -142 L ${side * 30} -138 L ${side * 24} -112 L ${side * 6} -62 L ${side * 4} -66 Z`, SATIN, 2);
    }
    dot(g, 0, -56, 2.6, '#222');
    // Pocket square over the heart (the screen right).
    p.shape(g, 'M 24 -100 L 40 -100 L 37 -94 L 33 -98 L 29 -93 L 26 -98 Z', SHIRT, 1);
    line(g, 'M 22 -100 L 42 -100', '#000', 1.2);
    // White collar and black bow tie.
    p.shape(g, 'M -17 -150 L 17 -150 L 16 -140 Q 0 -134 -16 -140 Z', SHIRT, 2);
    p.shape(g, 'M -16 -147 L -3 -142 L -3 -137 L -16 -132 Z', BLACK, 1);
    p.shape(g, 'M 16 -147 L 3 -142 L 3 -137 L 16 -132 Z', BLACK, 1);
    dot(g, 0, -139.5, 3.2, BLACK);
  },
  shoulders() {},
  hat() {},
};

export const COSTUMES = { generalissimo: GENERALISSIMO, emperor: EMPEROR, tuxedo: TUXEDO };
export type CostumeName = keyof typeof COSTUMES;
