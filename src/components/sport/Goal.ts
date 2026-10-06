import { Actor, svg, uid, type ActorOptions } from '@/engine';

export interface GoalOptions extends ActorOptions {
  height?: number;
  depth?: number;
}

/**
 * Goal seen from the side, opening to the left. Origin is the bottom of the front post.
 * Aim shots between x = 0 … depth and height 0 … `height` (the crossbar is at y = −height).
 */
export class Goal extends Actor {
  readonly height: number;
  readonly depth: number;
  /** Pivots at the front post – stretch scaleX for a bulging net. */
  readonly net: Actor;

  constructor({ height = 240, depth = 150, ...options }: GoalOptions = {}) {
    super({ name: 'Goal', ...options });
    this.height = height;
    this.depth = depth;
    const back = depth * 1.25;

    const patternId = uid('net');
    const pattern = this.draw('pattern', { id: patternId, width: 16, height: 16, patternUnits: 'userSpaceOnUse' });
    pattern.appendChild(svg('path', { d: 'M 0 0 L 16 16 M 16 0 L 0 16', stroke: 'rgba(255,255,255,0.75)', 'stroke-width': 1.6 }));

    this.net = new Actor({ name: 'net' });
    this.net.draw('polygon', {
      points: `0,0 0,${-height} ${depth},${-height + 12} ${back},0`,
      fill: `url(#${patternId})`, stroke: 'rgba(255,255,255,0.8)', 'stroke-width': 2,
    });
    this.add(this.net);

    const bar = { stroke: '#f4f4f4', 'stroke-linecap': 'round', fill: 'none' };
    this.draw('path', { d: `M ${depth} ${-height + 12} L ${back} 0 L 0 0`, ...bar, 'stroke-width': 5 });
    this.draw('path', { d: `M 0 ${-height} L ${depth} ${-height + 12}`, ...bar, 'stroke-width': 7 });
    this.draw('line', { x1: 0, y1: 0, x2: 0, y2: -height, ...bar, 'stroke-width': 12 });
    this.draw('line', { x1: -6, y1: -height, x2: 6, y2: -height, ...bar, 'stroke-width': 12 });
  }
}
