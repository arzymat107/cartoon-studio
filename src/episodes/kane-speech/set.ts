/**
 * The award-night set for "The Longest Speech": a gala stage with curtains, a spotlight, a lectern
 * with a microphone, the trophy on its stand and a front row of audience seen from behind – plus the
 * things that pile up as the speech goes on (the list, cobwebs, a tumbleweed).
 */
import { gsap } from 'gsap';
import { sfx } from '@/animations';
import { synth } from '@/audio';
import { TextLabel, Trophy } from '@/components';
import { Actor, seededRandom, svg, uid, type Timeline } from '@/engine';

/** Where Kane stands (and the lectern, the trophy stand). */
export const STAGE_Y = 1460;
export const LECTERN_X = 540;
export const TROPHY_X = 870;
export const FIGURE_SCALE = 1.5;

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const GOLD = '#e8b923';
const CURTAIN = '#9b1b30';
const CURTAIN_DARK = '#5e0d1c';
const WOOD = '#6b3f1f';
const WOOD_DARK = '#40240f';
const LINE = '#1d120b';

/** Back wall, banner, curtains and the stage floor. */
export function createBackdrop(width: number, height: number): Actor {
  const set = new Actor({ name: 'gala' });
  const wallId = uid('gala-wall');
  const wall = set.draw('linearGradient', { id: wallId, x1: 0, x2: 0, y1: 0, y2: 1 });
  wall.appendChild(svg('stop', { offset: 0, 'stop-color': '#120a24' }));
  wall.appendChild(svg('stop', { offset: 1, 'stop-color': '#3b1d55' }));
  set.draw('rect', { width, height, fill: `url(#${wallId})` });

  // Glitter on the back wall.
  const rnd = seededRandom(7);
  for (let i = 0; i < 90; i++) {
    set.draw('circle', { cx: rnd.range(0, width), cy: rnd.range(380, 1360), r: rnd.range(1.5, 4), fill: GOLD, opacity: rnd.range(0.2, 0.7) });
  }

  // Banner.
  set.draw('rect', { x: 150, y: 250, width: width - 300, height: 140, rx: 70, fill: '#1a0f2e', stroke: GOLD, 'stroke-width': 6 });
  const banner = set.draw('text', {
    x: width / 2, y: 345, 'text-anchor': 'middle', 'font-family': FONT, 'font-size': 76, fill: GOLD, 'letter-spacing': 3,
  });
  banner.textContent = "★ BALLON D'OR ★";

  // Stage floor: planks, then the front edge.
  set.draw('rect', { x: 0, y: 1370, width, height: 190, fill: WOOD });
  for (let y = 1392; y < 1560; y += 26) set.draw('path', { d: `M 0 ${y} L ${width} ${y}`, stroke: WOOD_DARK, 'stroke-width': 2, opacity: 0.6 });
  set.draw('rect', { x: 0, y: 1556, width, height: 40, fill: WOOD_DARK });
  set.draw('rect', { x: 0, y: 1596, width, height: height - 1596, fill: '#0d0812' });

  // Curtains with folds, and a scalloped valance with gold fringe.
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? 0 : width;
    const inner = x0 - side * 190;
    set.draw('path', {
      d: `M ${x0} 0 L ${inner} 0 C ${inner + side * 40} 500 ${inner - side * 60} 1000 ${x0 - side * 90} 1560 L ${x0} 1560 Z`,
      fill: CURTAIN, stroke: LINE, 'stroke-width': 3,
    });
    for (const k of [0.3, 0.55, 0.8]) {
      const x = x0 - side * 190 * k;
      set.draw('path', { d: `M ${x} 0 C ${x + side * 20} 600 ${x - side * 30} 1100 ${x0 - side * 90 * k} 1560`, stroke: CURTAIN_DARK, 'stroke-width': 10, fill: 'none', opacity: 0.7 });
    }
  }
  let valance = `M 0 0 L ${width} 0 L ${width} 150`;
  for (let x = width; x > 0; x -= 90) valance += ` Q ${x - 45} 210 ${x - 90} 150`;
  set.draw('path', { d: `${valance} Z`, fill: CURTAIN, stroke: LINE, 'stroke-width': 3 });
  let fringe = 'M 0 150';
  for (let x = 0; x < width; x += 90) fringe += ` Q ${x + 45} 210 ${x + 90} 150`;
  set.draw('path', { d: fringe, stroke: GOLD, 'stroke-width': 8, fill: 'none' });
  return set;
}

/** A cone of light from above, aimed with `x`; `opacity` dims it. */
export function createSpotlight(x: number): Actor {
  const spot = new Actor({ name: 'spotlight', x });
  const id = uid('spot');
  const grad = spot.draw('linearGradient', { id, x1: 0, x2: 0, y1: 0, y2: 1 });
  grad.appendChild(svg('stop', { offset: 0, 'stop-color': '#fff6d6', 'stop-opacity': 0.05 }));
  grad.appendChild(svg('stop', { offset: 1, 'stop-color': '#fff6d6', 'stop-opacity': 0.28 }));
  spot.draw('path', { d: `M -60 0 L 60 0 L 250 ${STAGE_Y} L -250 ${STAGE_Y} Z`, fill: `url(#${id})` });
  spot.draw('ellipse', { cy: STAGE_Y, rx: 250, ry: 46, fill: '#fff6d6', opacity: 0.3 });
  return spot;
}

/** The lectern in front of Kane, with a gooseneck microphone. */
export class Lectern extends Actor {
  /** Cobwebs between the microphone and the lectern (hidden until the speech gets really long). */
  readonly webs: Actor;

  constructor() {
    super({ name: 'lectern', x: LECTERN_X, y: STAGE_Y });
    this.draw('path', { d: 'M -130 0 L -112 -330 L 112 -330 L 130 0 Z', fill: WOOD, stroke: LINE, 'stroke-width': 4, 'stroke-linejoin': 'round' });
    this.draw('path', { d: 'M 60 -10 L 70 -320', stroke: '#82502a', 'stroke-width': 26, opacity: 0.6 });
    this.draw('path', { d: 'M -150 -330 L 150 -330 L 140 -366 L -140 -366 Z', fill: '#7d4a25', stroke: LINE, 'stroke-width': 4, 'stroke-linejoin': 'round' });
    // A gold ball emblem on the front.
    this.draw('circle', { cy: -190, r: 44, fill: '#2b1a10', stroke: GOLD, 'stroke-width': 6 });
    this.draw('circle', { cy: -190, r: 24, fill: GOLD, stroke: LINE, 'stroke-width': 2 });
    // Gooseneck microphone, bending up towards his mouth.
    this.draw('path', { d: 'M 70 -366 C 80 -430 110 -470 92 -520', stroke: '#2a2a30', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' });
    this.draw('ellipse', { cx: 88, cy: -534, rx: 13, ry: 19, fill: '#3a3a44', stroke: LINE, 'stroke-width': 3, transform: 'rotate(-20 88 -534)' });

    this.webs = new Actor({ name: 'webs', opacity: 0 });
    this.webs.add(cobweb({ x: 70, y: -366, size: 70, flip: false }), cobweb({ x: -112, y: -330, size: 90, flip: true, down: true }));
    this.add(this.webs);
  }
}

/** A corner cobweb: radial threads and sagging rings. */
export function cobweb({ x = 0, y = 0, size = 80, flip = false, down = false } = {}): Actor {
  const web = new Actor({ name: 'cobweb', x, y, scaleX: flip ? -1 : 1, scaleY: down ? 1 : -1 });
  const angles = [0, 22, 45, 68, 90].map((a) => (a * Math.PI) / 180);
  const at = (a: number, r: number) => `${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;
  for (const a of angles) web.draw('path', { d: `M 0 0 L ${at(a, size)}`, stroke: '#e8e8f0', 'stroke-width': 1.6, opacity: 0.85 });
  for (const r of [0.3, 0.55, 0.8]) {
    let d = `M ${at(angles[0], size * r)}`;
    for (let i = 1; i < angles.length; i++) {
      const mid = (angles[i - 1] + angles[i]) / 2;
      d += ` Q ${at(mid, size * r * 0.8)} ${at(angles[i], size * r)}`;
    }
    web.draw('path', { d, stroke: '#e8e8f0', 'stroke-width': 1.4, fill: 'none', opacity: 0.85 });
  }
  return web;
}

/**
 * The list he reads from: a paper strip over the lectern's edge, down to the floor and along it.
 * `length` = how far it runs along the floor (0 = just a card on the lectern).
 */
export function createList(length: number): Actor {
  const list = new Actor({ name: 'list' });
  const x = LECTERN_X - 70;
  const top = STAGE_Y - 360;
  if (length <= 0) {
    list.draw('rect', { x: x - 10, y: top - 14, width: 70, height: 20, fill: '#fbf7ec', stroke: LINE, 'stroke-width': 2, transform: `rotate(-6 ${x} ${top})` });
    return list;
  }
  // Down the front of the lectern, then out along the stage towards the audience (and over the edge).
  const floor = STAGE_Y + 30;
  const end = x - 40 - length;
  const edge = Math.max(end, -200);
  const d = `M ${x} ${top - 10} L ${x + 60} ${top - 10} L ${x + 60} ${floor - 20} Q ${x + 60} ${floor + 10} ${x + 30} ${floor + 30} `
    + `L ${edge} ${floor + 30} L ${edge} ${floor - 16} L ${x - 30} ${floor - 16} Q ${x} ${floor - 30} ${x} ${floor - 60} Z`;
  list.draw('path', { d, fill: '#fbf7ec', stroke: LINE, 'stroke-width': 3, 'stroke-linejoin': 'round' });
  // Lines of names.
  for (let y = top + 10; y < floor - 60; y += 22) list.draw('path', { d: `M ${x + 10} ${y} L ${x + 50} ${y}`, stroke: '#9a9488', 'stroke-width': 4 });
  for (let lx = x - 60; lx > edge + 10; lx -= 34) list.draw('path', { d: `M ${lx} ${floor - 4} L ${lx - 20} ${floor - 4} M ${lx} ${floor + 14} L ${lx - 14} ${floor + 14}`, stroke: '#9a9488', 'stroke-width': 4 });
  if (end > -200) list.draw('ellipse', { cx: end, cy: floor + 7, rx: 16, ry: 24, fill: '#efe9da', stroke: LINE, 'stroke-width': 3 });
  return list;
}

/** One audience member in the front row, seen from behind. */
export class Spectator extends Actor {
  readonly head: Actor;

  constructor(x: number, rnd: ReturnType<typeof seededRandom>) {
    super({ name: 'spectator', x, y: 1790 });
    const hair = rnd.pick(['#1b1210', '#3a2416', '#6b4423', '#a8743d', '#c9b089', '#2b2b2b', '#8a8a8a']);
    const suit = rnd.pick(['#15151c', '#232340', '#3a1d2e', '#1d2b24']);
    this.draw('path', { d: 'M -70 140 C -70 40 -40 20 0 20 C 40 20 70 40 70 140 Z', fill: suit, stroke: '#000', 'stroke-width': 3 });
    this.head = new Actor({ name: 'head', y: 20 });
    const skin = rnd.pick(['#e2b08e', '#c68b62', '#8d5a3b', '#5e3b26', '#f0c9a8']);
    this.head.draw('ellipse', { cx: -44, cy: -52, rx: 11, ry: 18, fill: skin, stroke: '#000', 'stroke-width': 2 });
    this.head.draw('ellipse', { cx: 44, cy: -52, rx: 11, ry: 18, fill: skin, stroke: '#000', 'stroke-width': 2 });
    this.head.draw('ellipse', { cy: -56, rx: 46, ry: 54, fill: skin, stroke: '#000', 'stroke-width': 3 });
    // Seen from behind: hair over the whole back of the head (a bald crown for some), the nape below.
    const bald = rnd.next() > 0.8;
    const d = bald
      ? 'M -46 -40 C -50 -70 -44 -84 -36 -86 C -24 -66 24 -66 36 -86 C 44 -84 50 -70 46 -40 C 30 -16 -30 -16 -46 -40 Z'
      : 'M -47 -44 C -52 -96 -26 -112 0 -112 C 26 -112 52 -96 47 -44 C 38 -22 20 -14 0 -14 C -20 -14 -38 -22 -47 -44 Z';
    this.head.draw('path', { d, fill: hair, stroke: '#000', 'stroke-width': 3 });
    if (!bald) this.head.draw('path', { d: 'M -20 -96 C -10 -80 -14 -50 -6 -30 M 18 -94 C 10 -70 16 -46 8 -28', stroke: 'rgba(0,0,0,0.25)', 'stroke-width': 3, fill: 'none' });
    this.add(this.head);
  }
}

/** The front row of the audience, with a red seat back in front of each. */
export function createAudience(width: number): { row: Actor; spectators: Spectator[] } {
  const row = new Actor({ name: 'audience' });
  const rnd = seededRandom(23);
  const spectators: Spectator[] = [];
  for (let x = 70; x < width; x += 160) {
    const s = new Spectator(x + rnd.range(-12, 12), rnd);
    spectators.push(s);
  }
  const seats = new Actor({ name: 'seats' });
  for (let x = 70; x < width + 80; x += 160) {
    seats.draw('path', { d: `M ${x - 74} 1920 L ${x - 70} 1820 Q ${x} 1800 ${x + 70} 1820 L ${x + 74} 1920 Z`, fill: '#7d1426', stroke: '#000', 'stroke-width': 3 });
    seats.draw('path', { d: `M ${x - 60} 1836 Q ${x} 1820 ${x + 60} 1836`, stroke: '#a3243a', 'stroke-width': 6, fill: 'none' });
  }
  row.add(...spectators, seats);
  return { row, spectators };
}

/** A tumbleweed: a tangle of brown loops. */
export function createTumbleweed(): Actor {
  const weed = new Actor({ name: 'tumbleweed' });
  const ball = new Actor({ name: 'ball', y: -50 });
  const rnd = seededRandom(5);
  for (let i = 0; i < 14; i++) {
    const r = rnd.range(26, 50);
    ball.draw('ellipse', {
      rx: r, ry: r * rnd.range(0.5, 0.9), fill: 'none', stroke: rnd.pick(['#8a6a3a', '#a5824c', '#6b4f2a']), 'stroke-width': 3,
      transform: `rotate(${rnd.range(0, 180).toFixed(0)})`,
    });
  }
  weed.add(ball);
  return weed;
}

/** Roll a tumbleweed across the stage, bouncing. */
export function tumble(weed: Actor, { from = -150, to = 1250, duration = 2.6 } = {}): Timeline {
  const ball = weed.children[0];
  const tl = gsap.timeline()
    .fromTo(weed, { x: from }, { x: to, duration, ease: 'none', immediateRender: false }, 0)
    .fromTo(ball, { rotation: 0 }, { rotation: 720, duration, ease: 'none', immediateRender: false }, 0);
  const hops = 4;
  for (let i = 0; i < hops; i++) {
    tl.to(ball, { y: -110, duration: duration / hops / 2, ease: 'power1.out' }, (i * duration) / hops)
      .to(ball, { y: -50, duration: duration / hops / 2, ease: 'power1.in' }, ((i + 0.5) * duration) / hops);
  }
  return tl;
}

/** Applause: many overlapping claps, `density` per second. */
export function applause(duration: number, { density = 26, seed = 1 } = {}): Timeline {
  const tl = gsap.timeline();
  const rnd = seededRandom(seed);
  for (let t = 0; t < duration; t += 1 / density) tl.add(sfx(() => synth.step()), t + rnd.range(0, 1 / density));
  return tl;
}

/** Crickets in the empty hall. */
export function crickets(duration: number): Timeline {
  const tl = gsap.timeline();
  for (let t = 0; t < duration; t += 0.9) {
    for (let k = 0; k < 3; k++) tl.add(sfx(() => synth.note(4200, 0.04, 'sine', 0.03)), t + k * 0.07);
  }
  return tl.set({}, {}, duration);
}

/** A "Z" floating up from a sleeping head. */
export function snoreZ(x: number, y: number): TextLabel {
  return new TextLabel({ text: 'Z', x, y, fontSize: 54, font: FONT, weight: 400, color: '#cfd8ff', opacity: 0 });
}

/** Golden ball trophy on its stand, at the side of the stage. */
export function createAward(): Trophy {
  return new Trophy({ x: TROPHY_X, y: STAGE_Y, shape: 'ball', size: 180, stand: 330 });
}
