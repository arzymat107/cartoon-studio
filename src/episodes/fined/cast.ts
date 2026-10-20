/**
 * Cast, set and props for the "Paid in 39 Seconds" Short. The judge is a generic character,
 * not a likeness of any real person.
 */
import { Character, type CharacterOptions } from '@/components';
import { Actor, type ActorOptions } from '@/engine';
import { GROUND_Y } from '../football/stadium';

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';

/** Top of the judge's bench (world y). */
export const BENCH_TOP = GROUND_Y - 260;

/** Generic disciplinary judge: white hair, black robe, white collar bands, gavel in the right hand. */
export function createJudge(options: Partial<CharacterOptions> = {}): Character {
  const judge = new Character({
    name: 'Judge',
    y: GROUND_Y - 110,
    scale: 1.5,
    headScale: 1.1,
    skin: '#eec39a',
    hair: '#ececec',
    hairStyle: 'short',
    shirt: '#17171c',
    pants: '#17171c',
    face: {
      width: 44, height: 50, jaw: 32, chin: 16,
      eyeColor: '#2e3b55', browColor: '#d9d9d9', browWeight: 7, browTilt: -1.5,
      nose: 'broad', lips: '#a8645a',
    },
    voice: { pitch: 0.8 },
    ...options,
  });
  for (const side of [-1, 1]) {
    judge.torsoDetail.draw('path', { d: `M ${side * 2} -96 L ${side * 9} -72 L ${side * 2} -70 Z`, fill: '#ffffff' });
  }
  // Gavel: the handle continues the arm, the head sits across its end.
  const gavel = new Actor({ name: 'gavel', y: 58 });
  gavel.draw('rect', { x: -4, y: 0, width: 8, height: 50, rx: 3, fill: '#6b3e1f' });
  gavel.draw('rect', { x: -22, y: 44, width: 44, height: 22, rx: 6, fill: '#8b5a2b' });
  gavel.draw('rect', { x: -22, y: 51, width: 44, height: 6, fill: '#c9a227' });
  judge.rightArm.add(gavel);
  return judge;
}

/** Judge's bench with a nameplate and the 28-page decision on top. Origin = bottom center. */
export function createBench({ x, width = 470 }: { x: number; width?: number }): Actor {
  const bench = new Actor({ name: 'bench', x, y: GROUND_Y });
  const h = GROUND_Y - BENCH_TOP;
  bench.draw('rect', { x: -width / 2, y: -h, width, height: h, fill: '#7a4524' });
  bench.draw('rect', { x: -width / 2 - 14, y: -h - 16, width: width + 28, height: 22, rx: 6, fill: '#5c321a' });
  for (const px of [-width / 2 + 24, 24]) {
    bench.draw('rect', { x: px, y: -h + 40, width: width / 2 - 48, height: h - 70, rx: 8, fill: 'none', stroke: '#5c321a', 'stroke-width': 6 });
  }
  bench.draw('rect', { x: -170, y: -h + 70, width: 340, height: 56, rx: 6, fill: '#c9a227' });
  const plate = bench.draw('text', {
    x: 0, y: -h + 108, 'text-anchor': 'middle', 'font-family': FONT, 'font-size': 30, fill: '#3b2412', 'letter-spacing': 2,
  });
  plate.textContent = 'DISCIPLINARY COUNCIL';
  // The decision: a fat stack of paper.
  for (let i = 0; i < 6; i++) {
    bench.draw('rect', { x: -width / 2 + 20 + (i % 2) * 4, y: -h - 22 - i * 8, width: 110, height: 8, fill: i % 2 ? '#f4f1e8' : '#e6e1d3' });
  }
  const pages = bench.draw('text', {
    x: -width / 2 + 75, y: -h - 80, 'text-anchor': 'middle', 'font-family': FONT, 'font-size': 22, fill: '#3b2412',
  });
  pages.textContent = '28 PAGES';
  return bench;
}

/** Courtroom background: panelled wall, tall windows, floorboards and a wall clock. */
export function createCourtroom(width: number, height: number): { layers: Actor[]; clock: Clock } {
  const room = new Actor({ name: 'courtroom' });
  const wainscot = GROUND_Y - 430;
  const floor = GROUND_Y - 40;
  room.draw('rect', { x: 0, y: 0, width, height, fill: '#e3d3b2' });
  for (const wx of [140, 540]) {
    room.draw('rect', { x: wx - 12, y: 380, width: 304, height: 640, rx: 140, fill: '#6b3e1f' });
    room.draw('rect', { x: wx, y: 392, width: 280, height: 616, rx: 130, fill: '#bfe3f5' });
    room.draw('line', { x1: wx + 140, y1: 392, x2: wx + 140, y2: 1008, stroke: '#6b3e1f', 'stroke-width': 10 });
    room.draw('line', { x1: wx, y1: 700, x2: wx + 280, y2: 700, stroke: '#6b3e1f', 'stroke-width': 10 });
  }
  room.draw('rect', { x: 0, y: wainscot, width, height: floor - wainscot, fill: '#8a522c' });
  room.draw('rect', { x: 0, y: wainscot - 14, width, height: 18, fill: '#5c321a' });
  for (let px = 30; px < width; px += 210) {
    room.draw('rect', { x: px, y: wainscot + 40, width: 170, height: floor - wainscot - 80, rx: 8, fill: 'none', stroke: '#6b3e1f', 'stroke-width': 6 });
  }
  room.draw('rect', { x: 0, y: floor, width, height: height - floor, fill: '#a86d3d' });
  for (let py = floor + 50; py < height; py += 60) {
    room.draw('line', { x1: 0, y1: py, x2: width, y2: py, stroke: '#8f5a30', 'stroke-width': 4 });
  }
  const clock = new Clock({ x: width / 2, y: 230 });
  return { layers: [room, clock], clock };
}

/** Wall clock; spin `secondHand` to show time passing. */
export class Clock extends Actor {
  readonly secondHand: Actor;

  constructor(options: { x: number; y: number }) {
    super({ name: 'Clock', ...options });
    this.draw('circle', { r: 96, fill: '#5c321a' });
    this.draw('circle', { r: 82, fill: '#fffdf5' });
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      this.draw('line', {
        x1: Math.sin(a) * 66, y1: -Math.cos(a) * 66, x2: Math.sin(a) * 76, y2: -Math.cos(a) * 76,
        stroke: '#222', 'stroke-width': i % 3 ? 3 : 6,
      });
    }
    this.draw('line', { x1: 0, y1: 0, x2: 0, y2: -40, stroke: '#222', 'stroke-width': 8, 'stroke-linecap': 'round', transform: 'rotate(100)' });
    this.draw('line', { x1: 0, y1: 0, x2: 0, y2: -60, stroke: '#222', 'stroke-width': 5, 'stroke-linecap': 'round' });
    this.secondHand = new Actor({ name: 'secondHand' });
    this.secondHand.draw('line', { x1: 0, y1: 12, x2: 0, y2: -70, stroke: '#d62828', 'stroke-width': 3 });
    this.add(this.secondHand);
    this.draw('circle', { r: 7, fill: '#d62828' });
  }
}

/**
 * The 2,000-word statement: a fat stack of paper with a cover page and his CV clipped on.
 * Origin = bottom center, so it can sit on the bench or be held from below.
 */
export function createStatement(options: ActorOptions = {}): Actor {
  const doc = new Actor({ name: 'statement', ...options });
  // Pages behind the cover show how thick it is.
  for (let i = 6; i > 0; i--) {
    doc.draw('rect', { x: -70 + i * 3, y: -170 + i * 3, width: 140, height: 170, rx: 3, fill: i % 2 ? '#e9e2cc' : '#fbf6e6', stroke: '#c9b98a', 'stroke-width': 1 });
  }
  doc.draw('rect', { x: -70, y: -170, width: 140, height: 170, rx: 3, fill: '#ffffff', stroke: '#c9b98a', 'stroke-width': 2 });
  const font = { 'text-anchor': 'middle', 'font-family': FONT, fill: '#3b2412' };
  doc.draw('text', { x: 0, y: -132, 'font-size': 22, ...font }).textContent = 'MY STATEMENT';
  doc.draw('text', { x: 0, y: -104, 'font-size': 18, ...font, fill: '#d62828' }).textContent = '2,000 WORDS';
  for (let y = -84; y < -10; y += 12) {
    doc.draw('line', { x1: -52, y1: y, x2: 52, y2: y, stroke: '#b9b2a0', 'stroke-width': 3 });
  }
  doc.draw('rect', { x: 34, y: -192, width: 54, height: 38, rx: 2, fill: '#ffd60a', transform: 'rotate(12 61 -173)' });
  doc.draw('text', { x: 61, y: -166, 'font-size': 20, ...font, transform: 'rotate(12 61 -173)' }).textContent = '+ CV';
  return doc;
}

/** Gold £ coin seen from the side. Origin = bottom center. */
export function coin(x: number, y: number): Actor {
  const c = new Actor({ name: 'coin', x, y, opacity: 0 });
  c.draw('rect', { x: -32, y: -14, width: 64, height: 10, fill: '#b8860b' });
  c.draw('ellipse', { cx: 0, cy: -4, rx: 32, ry: 9, fill: '#b8860b' });
  c.draw('ellipse', { cx: 0, cy: -14, rx: 32, ry: 9, fill: '#ffd60a', stroke: '#c9971a', 'stroke-width': 2 });
  return c;
}
