/**
 * Sets and props for "Who Is The Best?": one flat cartoon backdrop per judge, and the white
 * dust cloud a player leaves behind when he goes poof.
 */
import { gsap } from 'gsap';
import { sfx, sound } from '@/animations';
import { synth } from '@/audio';
import type { PortraitFigure } from '@/components';
import { Actor, seededRandom, svg, uid, type Timeline } from '@/engine';

/** Feet of the big judge in the middle, and of the two small players he chooses between. */
export const JUDGE = { x: 540, y: 1430, scale: 1.75 };
export const CANDIDATE_Y = 1590;
export const CANDIDATE_X = [175, 905] as const;
export const CANDIDATE_SCALE = 0.8;
/** Where the floor meets the wall. */
export const HORIZON = 1060;

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const LINE = '#1d120b';

function gradient(set: Actor, stops: string[]): string {
  const id = uid('wib-sky');
  const grad = set.draw('linearGradient', { id, x1: 0, x2: 0, y1: 0, y2: 1 });
  stops.forEach((color, i) => grad.appendChild(svg('stop', { offset: i / (stops.length - 1), 'stop-color': color })));
  return `url(#${id})`;
}

/** Grass from the horizon down, with the slanted mowing stripes and a few tufts. */
function grass(set: Actor, width: number, height: number, { color = '#2f8f2f', stripe = '#3aa13a', top = HORIZON } = {}): void {
  set.draw('rect', { y: top, width, height: height - top, fill: color });
  for (let x = -600; x < width; x += 300) {
    set.draw('path', { d: `M ${x} ${height} L ${x + 150} ${height} L ${x + 450} ${top} L ${x + 300} ${top} Z`, fill: stripe });
  }
  const rnd = seededRandom(5);
  for (let i = 0; i < 26; i++) {
    const x = rnd.range(0, width);
    const y = rnd.range(top + 60, height - 40);
    set.draw('path', { d: `M ${x} ${y} l 4 -18 M ${x + 9} ${y} l 2 -24 M ${x + 18} ${y} l -2 -16`, stroke: '#1f6b22', 'stroke-width': 4, 'stroke-linecap': 'round' });
  }
}

/** Kane's trophy cabinet: big, polished, lit – and completely empty. */
export function createTrophyRoom(width: number, height: number): Actor {
  const set = new Actor({ name: 'trophy-room' });
  set.draw('rect', { width, height: HORIZON, fill: gradient(set, ['#14214a', '#2b4592']) });
  // Wallpaper stripes.
  for (let x = 0; x < width; x += 90) set.draw('rect', { x, width: 40, height: HORIZON, fill: '#ffffff', opacity: 0.04 });

  // The cabinet.
  const [x0, x1, y0, y1] = [210, 870, 300, 1010];
  set.draw('rect', { x: x0 - 26, y: y0 - 40, width: x1 - x0 + 52, height: y1 - y0 + 60, rx: 10, fill: '#6b3f1f', stroke: LINE, 'stroke-width': 5 });
  set.draw('rect', { x: x0, y: y0, width: x1 - x0, height: y1 - y0, fill: '#bfe3ff', opacity: 0.25, stroke: LINE, 'stroke-width': 4 });
  for (const y of [470, 720, 960]) {
    set.draw('rect', { x: x0, y, width: x1 - x0, height: 18, fill: '#8a552b', stroke: LINE, 'stroke-width': 3 });
    // Pale dust-free rings where trophies would stand… none.
    set.draw('ellipse', { cx: (x0 + x1) / 2, cy: y + 4, rx: 60, ry: 6, fill: '#ffffff', opacity: 0.12 });
  }
  // Glass glare and the middle door frame.
  set.draw('path', { d: `M ${x0 + 40} ${y1 - 40} L ${x0 + 200} ${y0 + 30} L ${x0 + 250} ${y0 + 30} L ${x0 + 90} ${y1 - 40} Z`, fill: '#ffffff', opacity: 0.12 });
  set.draw('rect', { x: (x0 + x1) / 2 - 5, y: y0, width: 10, height: y1 - y0, fill: '#6b3f1f', stroke: LINE, 'stroke-width': 2 });
  // A cobweb in the top corner of the empty case.
  const web = `M ${x1} ${y0 + 2} L ${x1 - 120} ${y0 + 2} M ${x1} ${y0 + 2} L ${x1 - 100} ${y0 + 70} M ${x1} ${y0 + 2} L ${x1 - 30} ${y0 + 120} `
    + `M ${x1 - 50} ${y0 + 2} Q ${x1 - 45} ${y0 + 30} ${x1 - 15} ${y0 + 55} M ${x1 - 95} ${y0 + 2} Q ${x1 - 80} ${y0 + 55} ${x1 - 26} ${y0 + 100}`;
  set.draw('path', { d: web, stroke: '#ffffff', 'stroke-width': 2, fill: 'none', opacity: 0.55 });
  // Brass plate on top of the cabinet.
  set.draw('rect', { x: 400, y: y0 - 36, width: 280, height: 32, rx: 6, fill: '#e8b923', stroke: LINE, 'stroke-width': 3 });
  const plate = set.draw('text', { x: 540, y: y0 - 11, 'text-anchor': 'middle', 'font-family': FONT, 'font-size': 26, fill: '#4a3008' });
  plate.textContent = "KANE'S TROPHIES";

  // Carpet floor.
  set.draw('rect', { y: HORIZON, width, height: height - HORIZON, fill: '#7a2333' });
  set.draw('rect', { y: HORIZON, width, height: 14, fill: '#4c1420' });
  for (let x = -400; x < width; x += 160) {
    set.draw('path', { d: `M ${x} ${height} L ${x + 40} ${height} L ${x + 300} ${HORIZON} L ${x + 260} ${HORIZON} Z`, fill: '#86293a' });
  }
  return set;
}

/** A sunny, windy pitch: yellow sky, rolling grass. Animate `wind` streaks with `blowWind()`. */
export function createWindyPitch(width: number, height: number): { set: Actor; wind: Actor[] } {
  const set = new Actor({ name: 'windy-pitch' });
  set.draw('rect', { width, height: HORIZON + 40, fill: gradient(set, ['#7fbf3f', '#ffd75e', '#ffe9a0']) });
  // Distant hill.
  set.draw('path', { d: `M 0 ${HORIZON - 40} Q 300 ${HORIZON - 150} 620 ${HORIZON - 70} T ${width} ${HORIZON - 90} L ${width} ${HORIZON + 40} L 0 ${HORIZON + 40} Z`, fill: '#5aa834' });
  grass(set, width, height, { color: '#2a7d2a', stripe: '#33902f' });
  const wind = [0, 1, 2, 3, 4].map((i) => {
    const streak = new Actor({ name: 'wind', x: -300, y: 300 + i * 230, opacity: 0 });
    streak.draw('path', { d: 'M 0 0 Q 90 -30 180 0 T 360 0', stroke: '#ffffff', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' });
    return streak;
  });
  set.add(...wind);
  return { set, wind };
}

/** Streaks of wind blowing across from left to right for `duration` seconds. */
export function blowWind(wind: Actor[], width: number, duration: number): Timeline {
  const tl = gsap.timeline();
  const rnd = seededRandom(9);
  for (let t = 0, i = 0; t < duration - 0.6; t += 0.35, i++) {
    const streak = wind[i % wind.length];
    tl.fromTo(streak, { x: -380, opacity: 0.7 }, { x: width + 40, opacity: 0.2, duration: rnd.range(0.7, 1), ease: 'none', immediateRender: false }, t);
  }
  return tl;
}

/** Kylian's palace hall: velvet drapes, gold columns, a red carpet up to his little podium. */
export function createPalace(width: number, height: number): Actor {
  const set = new Actor({ name: 'palace' });
  set.draw('rect', { width, height: HORIZON, fill: gradient(set, ['#2a0c3d', '#5a1740']) });
  // Columns.
  for (const x of [120, 960]) {
    set.draw('rect', { x: x - 55, y: 120, width: 110, height: HORIZON - 120, fill: '#e2b23a', stroke: LINE, 'stroke-width': 4 });
    for (const dx of [-28, 0, 28]) set.draw('path', { d: `M ${x + dx} 150 L ${x + dx} ${HORIZON - 30}`, stroke: '#b8860b', 'stroke-width': 7 });
    set.draw('rect', { x: x - 75, y: 90, width: 150, height: 40, fill: '#f2c94c', stroke: LINE, 'stroke-width': 4 });
    set.draw('rect', { x: x - 75, y: HORIZON - 40, width: 150, height: 40, fill: '#f2c94c', stroke: LINE, 'stroke-width': 4 });
  }
  // Drapes behind him, tied back.
  for (const side of [-1, 1]) {
    const x = 540 + side * 330;
    set.draw('path', { d: `M ${x} 60 L ${540 + side * 90} 60 C ${540 + side * 140} 400 ${x - side * 40} 560 ${x} 980 Z`, fill: '#9b1b30', stroke: LINE, 'stroke-width': 4 });
    set.draw('ellipse', { cx: x - side * 20, cy: 640, rx: 34, ry: 18, fill: '#e8b923', stroke: LINE, 'stroke-width': 3 });
  }
  set.draw('rect', { x: 200, y: 30, width: 680, height: 50, fill: '#7a1426', stroke: LINE, 'stroke-width': 4 });
  // A big gold star medallion – his own design.
  const star = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 40 : 95;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    return `${540 + Math.cos(a) * r} ${330 + Math.sin(a) * r}`;
  });
  set.draw('circle', { cx: 540, cy: 330, r: 120, fill: '#3a0f2a', stroke: '#e8b923', 'stroke-width': 10 });
  set.draw('path', { d: `M ${star.join(' L ')} Z`, fill: '#e8b923', stroke: LINE, 'stroke-width': 3 });

  // Marble floor and the red carpet.
  set.draw('rect', { y: HORIZON, width, height: height - HORIZON, fill: '#d9cdb8' });
  for (let y = HORIZON + 80; y < height; y += 120) set.draw('path', { d: `M 0 ${y} L ${width} ${y}`, stroke: '#bfae92', 'stroke-width': 4 });
  set.draw('path', { d: `M 400 ${HORIZON} L 680 ${HORIZON} L 860 ${height} L 220 ${height} Z`, fill: '#b3192e' });
  set.draw('path', { d: `M 400 ${HORIZON} L 220 ${height} M 680 ${HORIZON} L 860 ${height}`, stroke: '#e8b923', 'stroke-width': 8 });
  // His podium.
  set.draw('path', { d: `M 330 ${JUDGE.y} L 750 ${JUDGE.y} L 730 ${JUDGE.y + 70} L 350 ${JUDGE.y + 70} Z`, fill: '#e8b923', stroke: LINE, 'stroke-width': 4 });
  set.draw('rect', { x: 330, y: JUDGE.y - 8, width: 420, height: 16, fill: '#f6d36b', stroke: LINE, 'stroke-width': 3 });
  return set;
}

/** Bumpy cloud outline: arcs bulging out between points on a circle of radius `r`. */
function cloudPath(r: number, bumps: number): string {
  const pts = Array.from({ length: bumps }, (_, i) => {
    const a = (i / bumps) * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
  const bump = r * Math.sin(Math.PI / bumps) * 1.15;
  return `M ${pts[0][0]} ${pts[0][1]} ${pts.map((_, i) => {
    const [x, y] = pts[(i + 1) % bumps];
    return `A ${bump} ${bump} 0 0 1 ${x} ${y}`;
  }).join(' ')} Z`;
}

/** The white cartoon dust cloud: a solid puff, then a dashed ring that spreads out and fades. */
export class Dust extends Actor {
  readonly puff: Actor;
  readonly ring: Actor;

  constructor(size: number) {
    super({ name: 'dust', opacity: 0 });
    this.puff = new Actor({ name: 'puff' });
    this.puff.draw('path', { d: cloudPath(size, 9), fill: '#ffffff', stroke: '#ffffff', 'stroke-width': 4 });
    for (const [x, y, r] of [[-0.3, -0.15, 0.22], [0.25, 0.1, 0.26], [-0.05, 0.35, 0.17]]) {
      this.puff.draw('circle', { cx: x * size, cy: y * size, r: r * size, fill: '#e6ece6' });
    }
    this.ring = new Actor({ name: 'ring', opacity: 0 });
    this.ring.draw('path', {
      d: cloudPath(size, 11), fill: 'none', stroke: '#ffffff', 'stroke-width': 7, 'stroke-dasharray': '30 16', 'stroke-linecap': 'round',
    });
    this.add(this.ring, this.puff);
  }
}

/** Where a figure's middle is, for centering the dust on him. */
function middle(m: PortraitFigure): [number, number] {
  return [m.x, m.y - (m.height * Math.abs(m.scaleY)) / 2];
}

/**
 * Poof: the player vanishes in a dust cloud. The puff bursts, then thins into a dashed ring that
 * spreads and fades (about 0.7 s).
 */
export function poof(m: PortraitFigure, dust: Dust): Timeline {
  const [x, y] = middle(m);
  return gsap.timeline()
    .add(sound('sfx/poof', () => sfx(synth.poof)), 0)
    .set(dust, { x, y, opacity: 1, immediateRender: false }, 0)
    .set(m, { opacity: 0, immediateRender: false }, 0.03)
    .fromTo(dust.puff, { scale: 0.45, opacity: 1 }, { scale: 1, duration: 0.12, ease: 'back.out(2)', immediateRender: false }, 0)
    .to(dust.puff, { opacity: 0, scale: 1.08, duration: 0.15 }, 0.16)
    .fromTo(dust.ring, { scale: 0.95, opacity: 1 }, { scale: 1.3, duration: 0.55, ease: 'power1.out', immediateRender: false }, 0.12)
    .to(dust.ring, { opacity: 0, duration: 0.3 }, 0.4)
    .set(dust, { opacity: 0 }, 0.75);
}
