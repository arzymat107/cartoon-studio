import { Actor, svg, uid, type ActorOptions } from '@/engine';

export interface TrophyOptions extends ActorOptions {
  /** Height of the cup from the bottom of its base. */
  size?: number;
  /** Height of the display stand under it (0 = no stand, the cup stands on the ground). */
  stand?: number;
}

const GOLD = '#f2c230';
const GOLD_DARK = '#b8860b';
const GOLD_LIGHT = '#fff1a8';
const LINE = '#5a3a06';

/**
 * A generic gold cup with two handles on a dark base – no real competition's trophy. Origin is the
 * ground point under it (under the stand if it has one):
 *   cup   – the trophy itself, sitting on top of the stand; move it to lift it off
 *   stand – the white display stand (empty when `stand` is 0)
 */
export class Trophy extends Actor {
  readonly size: number;
  readonly cup: Actor;
  readonly stand: Actor;

  constructor({ size = 150, stand = 0, ...options }: TrophyOptions = {}) {
    super({ name: 'Trophy', ...options });
    this.size = size;

    this.stand = new Actor({ name: 'stand' });
    if (stand > 0) {
      this.stand.draw('ellipse', { cy: 0, rx: size * 0.55, ry: size * 0.1, fill: 'rgba(0,0,0,0.25)' });
      this.stand.draw('path', {
        d: `M ${-size * 0.36} 0 L ${-size * 0.3} ${-stand + 14} L ${size * 0.3} ${-stand + 14} L ${size * 0.36} 0 Z`,
        fill: '#f4f1ea', stroke: '#6b6458', 'stroke-width': 3, 'stroke-linejoin': 'round',
      });
      this.stand.draw('path', { d: `M ${size * 0.12} -6 L ${size * 0.1} ${-stand + 18}`, stroke: '#d9d3c6', 'stroke-width': size * 0.12 });
      this.stand.draw('rect', { x: -size * 0.42, y: -stand, width: size * 0.84, height: 16, rx: 4, fill: GOLD, stroke: LINE, 'stroke-width': 3 });
    }

    // The cup, drawn upwards from the bottom of its base (s = size / 100).
    this.cup = new Actor({ name: 'cup', y: -stand });
    const s = size / 100;
    const shine = uid('trophy-shine');
    const grad = this.cup.draw('linearGradient', { id: shine, x1: 0, x2: 1, y1: 0, y2: 0 });
    for (const [offset, color] of [[0, GOLD_DARK], [0.3, GOLD_LIGHT], [0.55, GOLD], [1, GOLD_DARK]] as const) {
      grad.appendChild(svg('stop', { offset, 'stop-color': color }));
    }
    const fill = `url(#${shine})`;
    const p = (pts: number[][]) => pts.map(([x, y]) => `${x * s} ${y * s}`).join(' ');
    // Base: two dark steps with a gold plate.
    this.cup.draw('path', { d: `M ${p([[-30, 0]])} L ${p([[30, 0], [26, -14], [-26, -14]])} Z`, fill: '#3b2a1e', stroke: '#1d140d', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
    this.cup.draw('path', { d: `M ${p([[-22, -14]])} L ${p([[22, -14], [19, -26], [-19, -26]])} Z`, fill: '#4a3626', stroke: '#1d140d', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
    this.cup.draw('rect', { x: -12 * s, y: -11 * s, width: 24 * s, height: 7 * s, fill: GOLD, rx: 1.5 });
    // Handles behind the bowl.
    for (const side of [-1, 1]) {
      this.cup.draw('path', {
        d: `M ${p([[side * 26, -84]])} C ${p([[side * 52, -92], [side * 54, -58], [side * 20, -50]])}`,
        fill: 'none', stroke: LINE, 'stroke-width': 11 * s + 3, 'stroke-linecap': 'round',
      });
      this.cup.draw('path', {
        d: `M ${p([[side * 26, -84]])} C ${p([[side * 52, -92], [side * 54, -58], [side * 20, -50]])}`,
        fill: 'none', stroke: GOLD, 'stroke-width': 11 * s, 'stroke-linecap': 'round',
      });
    }
    // Stem, knot and bowl.
    this.cup.draw('path', { d: `M ${p([[-14, -26]])} C ${p([[-6, -34], [-6, -40], [-5, -46]])} L ${p([[5, -46]])} C ${p([[6, -40], [6, -34], [14, -26]])} Z`, fill, stroke: LINE, 'stroke-width': 2.5 });
    this.cup.draw('ellipse', { cy: -46 * s, rx: 10 * s, ry: 4 * s, fill, stroke: LINE, 'stroke-width': 2.5 });
    this.cup.draw('path', {
      d: `M ${p([[-34, -100]])} C ${p([[-34, -70], [-20, -50], [0, -50]])} C ${p([[20, -50], [34, -70], [34, -100]])} Z`,
      fill, stroke: LINE, 'stroke-width': 3, 'stroke-linejoin': 'round',
    });
    this.cup.draw('ellipse', { cy: -100 * s, rx: 34 * s, ry: 6 * s, fill: GOLD_DARK, stroke: LINE, 'stroke-width': 3 });
    // A star on the bowl and a glint.
    this.cup.draw('path', { d: star(0, -76 * s, 9 * s), fill: GOLD_LIGHT, stroke: GOLD_DARK, 'stroke-width': 1.5 });
    this.cup.draw('path', { d: `M ${p([[-22, -92]])} C ${p([[-22, -76], [-16, -64], [-10, -58]])}`, fill: 'none', stroke: '#fff', 'stroke-width': 4 * s, 'stroke-linecap': 'round', opacity: 0.75 });

    this.add(this.stand, this.cup);
  }
}

function star(cx: number, cy: number, r: number): string {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const d = i % 2 ? r * 0.45 : r;
    return `${(cx + Math.cos(a) * d).toFixed(1)} ${(cy + Math.sin(a) * d).toFixed(1)}`;
  });
  return `M ${pts.join(' L ')} Z`;
}
