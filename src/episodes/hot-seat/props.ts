/**
 * Everything in "The Hot Seat" that is drawn in code: the stadium and the dugout, the manager's
 * seat, the thermometer, flames, smoke, foam, roof debris and Ole's camping chair. Drawn in the
 * characters' style: thick dark maroon outlines, soft shading.
 */
import { Actor, seededRandom, svg, uid } from '@/engine';

export const OUTLINE = '#3a0a0a';
const LINE = { stroke: OUTLINE, 'stroke-width': 9, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } as const;

function gradient(actor: Actor, stops: [number, string][], { x2 = 0, y2 = 1 } = {}): string {
  const id = uid('hs-grad');
  const g = actor.draw('linearGradient', { id, x1: 0, y1: 0, x2, y2 });
  for (const [offset, color] of stops) g.appendChild(svg('stop', { offset, 'stop-color': color }));
  return `url(#${id})`;
}

// ── Stadium and dugout ──────────────────────────────────────────────────

/** Height of the world above the frame, for the camera to follow the launch upwards. */
export const SKY_TOP = -2600;
/** The dugout roof: Carrick goes through it here. */
export const ROOF = { y: 250, depth: 120 };
export const FLOOR_Y = 1560;

/** Night sky, floodlights and the stand behind the dugout (everything above the roof). */
export function stadium(width: number): Actor {
  const a = new Actor({ name: 'stadium' });
  const sky = gradient(a, [[0, '#0b0f2e'], [0.6, '#1c2463'], [0.85, '#3b3f8f'], [1, '#6a5aa8']]);
  a.draw('rect', { x: -400, y: SKY_TOP, width: width + 800, height: ROOF.y - SKY_TOP + 200, fill: sky });
  const rnd = seededRandom(11);
  for (let i = 0; i < 70; i++) {
    a.draw('circle', { cx: rnd.range(-200, width + 200), cy: rnd.range(SKY_TOP, -150), r: rnd.range(2, 5), fill: '#fff8d8', opacity: rnd.range(0.4, 0.95) });
  }
  // Floodlight towers with a glow.
  for (const x of [80, width - 80]) {
    a.draw('path', { d: `M ${x - 14} 260 L ${x - 8} -360 L ${x + 8} -360 L ${x + 14} 260 Z`, fill: '#4a4f6a', ...LINE, 'stroke-width': 6 });
    a.draw('ellipse', { cx: x, cy: -400, rx: 190, ry: 150, fill: '#fff6c4', opacity: 0.18 });
    a.draw('rect', { x: x - 70, y: -450, width: 140, height: 90, rx: 10, fill: '#59607e', ...LINE, 'stroke-width': 6 });
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) a.draw('circle', { cx: x - 42 + c * 42, cy: -428 + r * 44, r: 15, fill: '#fffbe2' });
    }
  }
  // The stand: tiers of red seats packed with fans (dots), rising behind the dugout.
  const standTop = -120;
  a.draw('path', { d: `M -400 ${ROOF.y + 40} L -400 ${standTop + 60} L ${width + 400} ${standTop} L ${width + 400} ${ROOF.y + 40} Z`, fill: '#6d0f1c' });
  const colors = ['#f4efe6', '#c8102e', '#e8c9a4', '#2b2b3a', '#ffd34d', '#9e1b2a'];
  for (let row = 0; row < 9; row++) {
    const y = standTop + 70 + row * 34;
    a.draw('rect', { x: -400, y: y + 10, width: width + 800, height: 6, fill: '#4c0812' });
    for (let x = -30; x < width + 30; x += 26) {
      const fx = x + rnd.range(-6, 6) + (row % 2) * 13;
      a.draw('circle', { cx: fx, cy: y + rnd.range(-3, 3), r: 10, fill: rnd.pick(colors) });
    }
  }
  return a;
}

/** Inside of the dugout: back wall, floor and the grass in front. */
export function dugout(width: number, height: number): Actor {
  const a = new Actor({ name: 'dugout' });
  const wall = gradient(a, [[0, '#2a3046'], [1, '#3c4460']]);
  a.draw('rect', { x: -300, y: ROOF.y, width: width + 600, height: FLOOR_Y - ROOF.y, fill: wall });
  for (let x = -60; x < width + 60; x += 180) {
    a.draw('path', { d: `M ${x} ${ROOF.y + 60} L ${x} ${FLOOR_Y}`, stroke: '#232839', 'stroke-width': 6 });
  }
  a.draw('rect', { x: -300, y: 1010, width: width + 600, height: 34, fill: '#b3122b' });
  a.draw('rect', { x: -300, y: 1044, width: width + 600, height: 10, fill: '#7d0c1d' });
  // Floor of the dugout, then the grass in front with the touchline.
  a.draw('rect', { x: -300, y: FLOOR_Y, width: width + 600, height: 90, fill: '#565d70' });
  a.draw('rect', { x: -300, y: FLOOR_Y - 8, width: width + 600, height: 16, fill: '#2b3040' });
  const grass = gradient(a, [[0, '#3e9b3a'], [1, '#2c7a2b']]);
  a.draw('rect', { x: -300, y: FLOOR_Y + 90, width: width + 600, height: height - FLOOR_Y + 500, fill: grass });
  for (let x = -300; x < width + 300; x += 160) {
    a.draw('rect', { x, y: FLOOR_Y + 90, width: 80, height: height - FLOOR_Y + 500, fill: '#ffffff', opacity: 0.05 });
  }
  a.draw('rect', { x: -300, y: FLOOR_Y + 210, width: width + 600, height: 16, fill: '#f4f4ea', opacity: 0.9 });
  return a;
}

/** The curved perspex roof of the dugout, with a hole that can open where he bursts through. */
export class Roof extends Actor {
  readonly hole: Actor;

  constructor(width: number, holeX: number) {
    super({ name: 'roof' });
    const { y, depth } = ROOF;
    const glass = gradient(this, [[0, '#9fb3d9'], [1, '#56688f']]);
    this.draw('path', { d: `M -300 ${y - 30} Q ${width / 2} ${y - 90} ${width + 300} ${y - 30} L ${width + 300} ${y + depth} Q ${width / 2} ${y + depth - 40} -300 ${y + depth} Z`, fill: glass, opacity: 0.92 });
    this.draw('path', { d: `M -300 ${y + depth} Q ${width / 2} ${y + depth - 40} ${width + 300} ${y + depth}`, fill: 'none', stroke: '#c8102e', 'stroke-width': 26 });
    this.draw('path', { d: `M -300 ${y - 30} Q ${width / 2} ${y - 90} ${width + 300} ${y - 30} L ${width + 300} ${y + depth} Q ${width / 2} ${y + depth - 40} -300 ${y + depth} Z`, fill: 'none', ...LINE });
    for (let x = 60; x < width; x += 240) {
      this.draw('path', { d: `M ${x} ${y - 50} L ${x + 30} ${y + depth - 30}`, stroke: '#ffffff', 'stroke-width': 10, opacity: 0.35, 'stroke-linecap': 'round' });
    }
    // The hole: night sky seen through a jagged break, hidden until he goes through.
    this.hole = new Actor({ name: 'hole', x: holeX, y: y + 20, scale: 0 });
    const d = 'M -150 -40 L -95 -95 L -40 -60 L 10 -110 L 60 -70 L 120 -100 L 160 -30 L 130 40 L 170 85 L 90 95 L 30 70 L -30 105 L -90 75 L -160 90 L -130 30 Z';
    this.hole.draw('path', { d, fill: '#141a44', ...LINE, 'stroke-width': 8 });
    for (let i = 0; i < 6; i++) this.hole.draw('circle', { cx: -100 + i * 40, cy: -30 + (i % 3) * 30, r: 4, fill: '#fff8d8' });
    this.add(this.hole);
  }
}

// ── The hot seat ────────────────────────────────────────────────────────

/** Seat top in front of the backrest, where Carrick sits; origin = that point. */
export class HotSeat extends Actor {
  /** Orange glow on the cushions, its opacity = how hot the seat is. */
  readonly glow: Actor;
  /** Black scorch, for after the fire. */
  readonly scorch: Actor;

  constructor(options: { x?: number; y?: number; scale?: number }) {
    super({ name: 'hot seat', ...options });
    // Backrest on the right (he faces left), pedestal under the seat.
    const red = gradient(this, [[0, '#e0263f'], [1, '#8f0b1e']], { x2: 1, y2: 0 });
    const shade = '#8f0b1e';
    this.draw('rect', { x: -60, y: 20, width: 70, height: 250, fill: '#3b3f52', ...LINE });
    this.draw('path', { d: 'M -190 272 Q -25 240 140 272 L 140 290 L -190 290 Z', fill: '#2b2e3c', ...LINE });
    this.draw('path', { d: 'M 60 -620 Q 120 -650 180 -610 L 210 -40 Q 200 30 120 40 L 70 40 Z', fill: red, ...LINE });
    this.draw('path', { d: 'M 95 -560 Q 130 -580 160 -550 L 178 -120', fill: 'none', stroke: '#ff8a98', 'stroke-width': 10, opacity: 0.6, 'stroke-linecap': 'round' });
    this.draw('path', { d: 'M -230 -10 Q -240 -40 -200 -45 L 150 -45 Q 200 -40 195 0 L 185 40 Q 175 60 140 60 L -200 60 Q -235 55 -230 20 Z', fill: red, ...LINE });
    this.draw('path', { d: 'M -200 30 L 150 30', stroke: shade, 'stroke-width': 8, 'stroke-linecap': 'round' });

    this.glow = new Actor({ name: 'glow', opacity: 0 });
    const glow = this.glow.draw('radialGradient', { id: uid('hs-glow') });
    glow.appendChild(svg('stop', { offset: '0%', 'stop-color': '#ffef7a' }));
    glow.appendChild(svg('stop', { offset: '60%', 'stop-color': '#ff7a1a', 'stop-opacity': 0.8 }));
    glow.appendChild(svg('stop', { offset: '100%', 'stop-color': '#ff3d00', 'stop-opacity': 0 }));
    this.glow.draw('ellipse', { cx: -20, cy: 0, rx: 300, ry: 120, fill: `url(#${glow.id})` });
    this.glow.draw('ellipse', { cx: 135, cy: -300, rx: 110, ry: 360, fill: `url(#${glow.id})` });
    this.add(this.glow);

    this.scorch = new Actor({ name: 'scorch', opacity: 0 });
    for (const [cx, cy, rx, ry] of [[-120, 5, 70, 30], [40, 10, 90, 34], [130, -250, 40, 120], [150, -520, 30, 60]]) {
      this.scorch.draw('ellipse', { cx, cy, rx, ry, fill: '#1a0d0a', opacity: 0.75 });
    }
    this.add(this.scorch);
  }
}

// ── Thermometer ─────────────────────────────────────────────────────────

/** A big cartoon thermometer; origin = centre of the bulb. `level` 0 … 1 fills the tube. */
export class Thermometer extends Actor {
  static readonly TUBE = 520;
  private readonly liquid: Actor;
  readonly cap: Actor;
  readonly crack: Actor;
  /** Blue liquid and bulb on top of the red ones: ice cold. */
  readonly cold: Actor;

  constructor(options: { x?: number; y?: number; scale?: number }) {
    super({ name: 'thermometer', ...options });
    const T = Thermometer.TUBE;
    this.draw('rect', { x: -70, y: -T - 70, width: 140, height: T + 70, rx: 30, fill: '#f6efe2', ...LINE });
    // Ticks with a cold-to-hot colour scale beside them.
    for (let i = 0; i <= 10; i++) {
      const y = -50 - (i / 10) * (T - 60);
      this.draw('path', { d: `M 28 ${y} L ${i % 5 ? 46 : 56} ${y}`, stroke: OUTLINE, 'stroke-width': 5, 'stroke-linecap': 'round' });
    }
    const scale = gradient(this, [[0, '#ff3b1f'], [0.5, '#ffb21f'], [1, '#3fa9f5']]);
    this.draw('rect', { x: -58, y: -T + 10, width: 14, height: T - 60, rx: 7, fill: scale });
    this.draw('rect', { x: -22, y: -T - 40, width: 44, height: T, rx: 22, fill: '#ffffff', ...LINE, 'stroke-width': 7 });

    this.liquid = new Actor({ name: 'liquid', y: -20, scaleY: 0.15 });
    this.liquid.draw('rect', { x: -13, y: -(T - 10), width: 26, height: T - 10, rx: 13, fill: '#e3142d' });
    this.add(this.liquid);
    this.draw('circle', { cx: 0, cy: 0, r: 52, fill: '#e3142d', ...LINE });
    this.draw('circle', { cx: -16, cy: -16, r: 14, fill: '#ff8a8a' });
    this.cold = new Actor({ name: 'cold', opacity: 0 });
    this.cold.draw('rect', { x: -13, y: -60, width: 26, height: 40, rx: 13, fill: '#2f9be8' });
    this.cold.draw('circle', { cx: 0, cy: 0, r: 52, fill: '#2f9be8', ...LINE });
    this.cold.draw('circle', { cx: -16, cy: -16, r: 14, fill: '#bfe6ff' });
    this.add(this.cold);

    this.cap = new Actor({ name: 'cap', y: -T - 40 });
    this.cap.draw('path', { d: 'M -26 4 Q -26 -30 0 -32 Q 26 -30 26 4 Z', fill: '#cfd6e3', ...LINE, 'stroke-width': 7 });
    this.add(this.cap);
    this.crack = new Actor({ name: 'crack', y: -T - 30, opacity: 0 });
    this.crack.draw('path', { d: 'M -22 0 L -6 18 L -16 34 L 4 52 M 22 4 L 10 22 L 20 40', fill: 'none', stroke: OUTLINE, 'stroke-width': 5, 'stroke-linecap': 'round' });
    this.add(this.crack);
  }

  /** Tween target for a fill level 0 … 1. */
  get tube(): Actor {
    return this.liquid;
  }

  static level(value: number) {
    return { scaleY: Math.max(0.02, value) };
  }
}

// ── Fire, smoke, foam ───────────────────────────────────────────────────

/** One cartoon flame (red, orange, yellow tongues), pivot at its base. */
export function flame(x: number, y: number, size: number): Actor {
  const f = new Actor({ name: 'flame', x, y, scale: size });
  const tongue = (w: number, h: number) => `M ${-w} 0 Q ${-w * 1.1} ${-h * 0.45} ${-w * 0.3} ${-h * 0.7} Q ${-w * 0.2} ${-h * 0.85} 0 ${-h} Q ${w * 0.35} ${-h * 0.75} ${w * 0.45} ${-h * 0.55} Q ${w * 1.2} ${-h * 0.4} ${w} 0 Q 0 ${h * 0.12} ${-w} 0 Z`;
  f.draw('path', { d: tongue(70, 230), fill: '#e8251b', ...LINE, 'stroke-width': 8 });
  f.draw('path', { d: tongue(48, 165), fill: '#ff8a1c' });
  f.draw('path', { d: tongue(26, 95), fill: '#ffe55a' });
  return f;
}

/** A cartoon cloud puff (smoke, steam or dust). */
export function puff(color: string, outline: string): Actor {
  const p = new Actor({ name: 'puff', opacity: 0, scale: 0 });
  p.draw('path', {
    d: 'M -60 20 Q -90 -10 -55 -35 Q -45 -75 0 -65 Q 40 -90 65 -45 Q 100 -30 75 10 Q 80 45 35 40 Q 0 65 -30 42 Q -75 50 -60 20 Z',
    fill: color, stroke: outline, 'stroke-width': 7, 'stroke-linejoin': 'round',
  });
  p.draw('ellipse', { cx: -18, cy: -30, rx: 22, ry: 12, fill: '#ffffff', opacity: 0.45 });
  return p;
}

/** A foam blob from the extinguisher. */
export function foamBlob(): Actor {
  const b = new Actor({ name: 'foam', opacity: 0, scale: 0 });
  b.draw('path', {
    d: 'M -50 10 Q -60 -30 -20 -40 Q 0 -65 30 -40 Q 62 -32 52 5 Q 58 38 20 40 Q -5 55 -28 38 Q -58 38 -50 10 Z',
    fill: '#fbfdff', stroke: '#8fa6c0', 'stroke-width': 6, 'stroke-linejoin': 'round',
  });
  b.draw('ellipse', { cx: 12, cy: 14, rx: 24, ry: 12, fill: '#d6e4f2' });
  return b;
}

/** A shard of the perspex roof. */
export function debris(seed: number): Actor {
  const rnd = seededRandom(seed);
  const d = new Actor({ name: 'debris' });
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2;
    const r = rnd.range(18, 46);
    return `${Math.cos(a) * r * 1.4} ${Math.sin(a) * r}`;
  });
  d.draw('path', { d: `M ${pts.join(' L ')} Z`, fill: rnd.next() > 0.3 ? '#8ea3cc' : '#c8102e', ...LINE, 'stroke-width': 6 });
  return d;
}

/** A twinkling star (he disappears into the night sky). */
export function twinkle(x: number, y: number): Actor {
  const s = new Actor({ name: 'twinkle', x, y, scale: 0, opacity: 0 });
  s.draw('path', { d: 'M 0 -60 Q 8 -8 60 0 Q 8 8 0 60 Q -8 8 -60 0 Q -8 -8 0 -60 Z', fill: '#fff6b0', stroke: '#ffffff', 'stroke-width': 4 });
  s.draw('circle', { r: 12, fill: '#ffffff' });
  return s;
}

// ── Ole's camping chair ─────────────────────────────────────────────────

/** Unfolded camping chair, seen from the front-left; origin = middle of the seat. Backrest on the left. */
export function campingChair(options: { x?: number; y?: number; scale?: number; opacity?: number }): Actor {
  const c = new Actor({ name: 'camping chair', ...options });
  const metal = { stroke: '#2b2d36', 'stroke-width': 16, 'stroke-linecap': 'round' } as const;
  const legs = (x: number) => {
    c.draw('path', { d: `M ${x - 120} 300 L ${x + 120} 0 M ${x + 120} 300 L ${x - 120} 0`, ...metal });
    c.draw('path', { d: `M ${x - 120} 300 L ${x + 120} 0 M ${x + 120} 300 L ${x - 120} 0`, stroke: '#8a8f9e', 'stroke-width': 5, 'stroke-linecap': 'round' });
  };
  legs(-60);
  // Backrest (behind him) and seat sling.
  c.draw('path', { d: 'M -230 10 L -250 -470 Q -160 -500 -60 -470 L -60 10 Z', fill: '#2f6fb3', ...LINE });
  c.draw('path', { d: 'M -230 -300 Q -150 -320 -65 -300', stroke: '#245a92', 'stroke-width': 10, fill: 'none' });
  c.draw('path', { d: 'M -240 -20 Q -20 40 220 -20 L 230 30 Q -20 90 -250 30 Z', fill: '#3b82c9', ...LINE });
  legs(110);
  // Armrest with a cup holder.
  c.draw('path', { d: 'M 150 -150 L 260 -150', ...metal });
  c.draw('path', { d: 'M 250 -150 L 250 0', ...metal });
  c.draw('rect', { x: 220, y: -195, width: 60, height: 46, rx: 8, fill: '#2f6fb3', ...LINE, 'stroke-width': 6 });
  return c;
}
