/**
 * Everything in "Ronaldo – The Last Light" that is drawn in code: the empty stadium at night,
 * the crowd (only a memory until the end), floodlights, the spotlight, rain, the ball and the
 * captain's armband. Same style as the characters: thick dark outlines, flat fills.
 */
import { Actor, seededRandom, svg, uid } from '@/engine';

export const OUTLINE = '#2a0a0a';
const LINE = { stroke: OUTLINE, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } as const;
/** Where the stands end and the grass begins. */
export const PITCH_Y = 900;
/** The players stand on this line (feet). */
export const GROUND_Y = 1440;

function gradient(actor: Actor, stops: [number, string, number?][], { x2 = 0, y2 = 1, radial = false } = {}): string {
  const id = uid('ll-grad');
  const g = radial ? actor.draw('radialGradient', { id }) : actor.draw('linearGradient', { id, x1: 0, y1: 0, x2, y2 });
  for (const [offset, color, opacity = 1] of stops) g.appendChild(svg('stop', { offset, 'stop-color': color, 'stop-opacity': opacity }));
  return `url(#${id})`;
}

// ── Stadium ─────────────────────────────────────────────────────────────

/** Night sky, the empty stand of red seats and the dark pitch with the centre circle. */
export function stadium(width: number, height: number): Actor {
  const a = new Actor({ name: 'stadium' });
  const sky = gradient(a, [[0, '#04061a'], [0.7, '#0e1640'], [1, '#1c2558']]);
  a.draw('rect', { x: -600, y: -600, width: width + 1200, height: 900, fill: sky });
  const rnd = seededRandom(3);
  for (let i = 0; i < 40; i++) {
    a.draw('circle', { cx: rnd.range(-300, width + 300), cy: rnd.range(-500, 140), r: rnd.range(1.5, 3.5), fill: '#e8ecff', opacity: rnd.range(0.3, 0.8) });
  }
  // The stand: a roof edge, then rows of empty red seats getting bigger towards the pitch.
  a.draw('path', { d: `M -600 150 L ${width + 600} 150 L ${width + 600} 190 L -600 190 Z`, fill: '#1b1f33' });
  a.draw('rect', { x: -600, y: 190, width: width + 1200, height: PITCH_Y - 190, fill: '#3a0d16' });
  for (let row = 0; row < 12; row++) {
    const y = 210 + row * 54;
    const size = 12 + row * 1.6;
    a.draw('rect', { x: -600, y: y + size, width: width + 1200, height: 5, fill: '#24070d' });
    for (let x = -560 + (row % 2) * size; x < width + 560; x += size * 2.4) {
      a.draw('rect', { x, y, width: size * 1.6, height: size, rx: 4, fill: '#6e1622' });
    }
  }
  // Advertising boards along the bottom of the stand (blank: no logos).
  a.draw('rect', { x: -600, y: PITCH_Y - 60, width: width + 1200, height: 60, fill: '#14301f' });
  a.draw('rect', { x: -600, y: PITCH_Y - 60, width: width + 1200, height: 8, fill: '#0b1d12' });
  // The pitch: mowing stripes, halfway line, centre circle and spot, in perspective.
  const grass = gradient(a, [[0, '#123d1c'], [1, '#1f6a2c']]);
  a.draw('rect', { x: -600, y: PITCH_Y, width: width + 1200, height: height - PITCH_Y + 900, fill: grass });
  for (let i = 0; i < 9; i++) {
    const y0 = PITCH_Y + (i * (i + 1)) * 18;
    const y1 = PITCH_Y + ((i + 0.5) * (i + 1.5)) * 18;
    a.draw('rect', { x: -600, y: y0, width: width + 1200, height: y1 - y0, fill: '#ffffff', opacity: 0.035 });
  }
  const chalk = { fill: 'none', stroke: '#e9efe4', 'stroke-width': 10, opacity: 0.55 };
  a.draw('path', { d: `M ${width / 2 - 40} ${PITCH_Y} L ${width / 2 + 120} ${height + 900}`, ...chalk });
  a.draw('ellipse', { cx: width / 2 + 40, cy: GROUND_Y - 10, rx: 620, ry: 170, ...chalk });
  a.draw('ellipse', { cx: width / 2 + 40, cy: GROUND_Y - 10, rx: 16, ry: 6, fill: '#e9efe4', opacity: 0.6 });
  return a;
}

/** Fans filling every seat – faded in as a memory, and for real at the end. */
export function crowd(width: number): Actor {
  const a = new Actor({ name: 'crowd', opacity: 0 });
  const rnd = seededRandom(17);
  const colors = ['#d81e2c', '#1f7a3a', '#f4efe6', '#ffd23f', '#b3141f', '#e8c9a4', '#2b2b3a'];
  for (let row = 0; row < 12; row++) {
    const y = 205 + row * 54;
    const r = 10 + row * 1.3;
    for (let x = -560 + (row % 2) * r; x < width + 560; x += r * 2.3) {
      const fx = x + rnd.range(-4, 4);
      a.draw('circle', { cx: fx, cy: y + rnd.range(-3, 3), r, fill: rnd.pick(colors) });
      a.draw('circle', { cx: fx, cy: y - r * 1.1, r: r * 0.6, fill: '#e2b58f' });
    }
  }
  // A few flags waving in the crowd.
  for (const [x, y, c] of [[120, 300, '#c8102e'], [420, 380, '#1f7a3a'], [760, 260, '#c8102e'], [980, 420, '#1f7a3a'], [260, 560, '#1f7a3a'], [640, 520, '#c8102e']] as const) {
    a.draw('path', { d: `M ${x} ${y} L ${x} ${y - 110}`, stroke: '#2a2a2a', 'stroke-width': 6 });
    a.draw('path', { d: `M ${x} ${y - 110} q 40 -14 80 0 q 0 30 0 56 q -40 -14 -80 0 Z`, fill: c, ...LINE, 'stroke-width': 4 });
  }
  return a;
}

/** Camera flashes popping in the stands: a group of white bursts, each animated by the scene. */
export function flashBursts(width: number, count: number, seed: number): Actor[] {
  const rnd = seededRandom(seed);
  const out: Actor[] = [];
  for (let i = 0; i < count; i++) {
    const f = new Actor({ name: 'flash', x: rnd.range(-80, width + 80), y: rnd.range(230, 820), opacity: 0, scale: rnd.range(0.6, 1.2) });
    f.draw('circle', { cx: 0, cy: 0, r: 26, fill: '#ffffff', opacity: 0.35 });
    f.draw('path', { d: 'M 0 -22 L 5 -5 L 22 0 L 5 5 L 0 22 L -5 5 L -22 0 L -5 -5 Z', fill: '#ffffff' });
    out.push(f);
  }
  return out;
}

/** Floodlight towers in the corners. `glow` (opacity 0 → 1) switches them on. */
export class Floodlights extends Actor {
  readonly glow: Actor;

  constructor(width: number) {
    super({ name: 'floodlights' });
    this.glow = new Actor({ name: 'floodlight glow', opacity: 0 });
    for (const x of [70, width - 70]) {
      this.draw('path', { d: `M ${x - 12} 190 L ${x - 7} -330 L ${x + 7} -330 L ${x + 12} 190 Z`, fill: '#2b3047', ...LINE, 'stroke-width': 5 });
      this.draw('rect', { x: x - 80, y: -440, width: 160, height: 110, rx: 10, fill: '#2f3550', ...LINE, 'stroke-width': 6 });
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          this.draw('circle', { cx: x - 48 + c * 48, cy: -412 + r * 54, r: 18, fill: '#535a78' });
          this.glow.draw('circle', { cx: x - 48 + c * 48, cy: -412 + r * 54, r: 18, fill: '#fffbe0' });
        }
      }
      const halo = gradient(this.glow, [[0, '#fff8d0', 0.7], [1, '#fff8d0', 0]], { radial: true });
      this.glow.draw('ellipse', { cx: x, cy: -385, rx: 420, ry: 320, fill: halo });
    }
    this.add(this.glow);
  }
}

/** A cone of light from high above onto a pool on the grass at (0, 0). Move it with x. */
export function spotlight(): Actor {
  const a = new Actor({ name: 'spotlight' });
  const beam = gradient(a, [[0, '#fff6d5', 0.0], [0.25, '#fff6d5', 0.12], [1, '#fff6d5', 0.28]]);
  a.draw('path', { d: 'M -70 -2200 L 70 -2200 L 330 0 L -330 0 Z', fill: beam });
  const pool = gradient(a, [[0, '#fff6d5', 0.55], [0.6, '#fff6d5', 0.25], [1, '#fff6d5', 0]], { radial: true });
  a.draw('ellipse', { cx: 0, cy: 0, rx: 380, ry: 110, fill: pool });
  return a;
}

/** Night darkness laid over the stadium (not the players): fade it out to switch the lights on. */
export function nightTint(width: number, height: number): Actor {
  const a = new Actor({ name: 'night tint' });
  a.draw('rect', { x: -800, y: -800, width: width + 1600, height: height + 1800, fill: '#050818', opacity: 0.55 });
  return a;
}

/** One rain streak; the scene drops many of them on a loop. */
export function raindrop(): Actor {
  const a = new Actor({ name: 'rain', opacity: 0 });
  a.draw('path', { d: 'M 0 0 L -10 46', stroke: '#b9c6ff', 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0.55 });
  return a;
}

/** A small splash ring on the grass. */
export function splash(): Actor {
  const a = new Actor({ name: 'splash', opacity: 0 });
  a.draw('ellipse', { cx: 0, cy: 0, rx: 16, ry: 5, fill: 'none', stroke: '#b9c6ff', 'stroke-width': 3 });
  return a;
}

/** A classic black-and-white ball, radius 55, origin at its centre. */
export function ball(): Actor {
  const a = new Actor({ name: 'ball' });
  const r = 55;
  a.draw('ellipse', { cx: 6, cy: r - 4, rx: r * 1.1, ry: 12, fill: '#000000', opacity: 0.3 });
  a.draw('circle', { cx: 0, cy: 0, r, fill: '#f6f6f2', ...LINE, 'stroke-width': 7 });
  a.draw('path', { d: 'M 0 -18 L 17 -6 L 11 15 L -11 15 L -17 -6 Z', fill: '#1d1d1d' });
  for (const angle of [0, 72, 144, 216, 288]) {
    const g = svg('g', { transform: `rotate(${angle})` });
    g.appendChild(svg('path', { d: 'M -10 -50 L 10 -50 L 14 -38 L 0 -30 L -14 -38 Z', fill: '#1d1d1d' }));
    g.appendChild(svg('path', { d: 'M 0 -18 L 0 -30', stroke: '#1d1d1d', 'stroke-width': 4 }));
    a.el.appendChild(g);
  }
  a.draw('path', { d: 'M -32 -30 Q -20 -44 -2 -46', fill: 'none', stroke: '#ffffff', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.8 });
  return a;
}

/**
 * The captain's armband, the size it is drawn on ronaldo_standing (picture pixels), centred on
 * (0, 0): a yellow band with a strap. Scale it like the rig.
 */
export function armband(): Actor {
  const a = new Actor({ name: 'armband' });
  a.draw('path', { d: 'M -46 -52 Q 0 -60 46 -48 L 46 50 Q 0 60 -46 52 Z', fill: '#f8c22e', ...LINE, 'stroke-width': 7 });
  a.draw('path', { d: 'M -40 -30 Q 0 -36 40 -26', fill: 'none', stroke: '#d79a12', 'stroke-width': 5 });
  a.draw('rect', { x: 18, y: -66, width: 22, height: 120, rx: 8, fill: '#f8c22e', ...LINE, 'stroke-width': 6 });
  a.draw('rect', { x: 10, y: -24, width: 38, height: 30, rx: 6, fill: '#f8c22e', ...LINE, 'stroke-width': 6 });
  return a;
}

/** A soft white sparkle (four points) – for the armband catching the light. */
export function sparkle(): Actor {
  const a = new Actor({ name: 'sparkle', opacity: 0, scale: 0 });
  a.draw('path', { d: 'M 0 -40 L 8 -8 L 40 0 L 8 8 L 0 40 L -8 8 L -40 0 L -8 -8 Z', fill: '#fffbe6' });
  return a;
}

/** Full-screen colour for flashes and the fade to black (put it on the scene overlay). */
export function screenFill(width: number, height: number, color: string): Actor {
  const a = new Actor({ name: `screen ${color}`, opacity: 0 });
  a.draw('rect', { x: 0, y: 0, width, height, fill: color });
  return a;
}
