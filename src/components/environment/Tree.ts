import { Actor, type ActorOptions } from '@/engine';

export interface TreeOptions extends ActorOptions {
  height?: number;
  trunk?: string;
  leaves?: string;
}

/** Origin is the base of the trunk. */
export class Tree extends Actor {
  /** Pivots at the top of the trunk – rotate it slightly for wind. */
  readonly foliage: Actor;

  constructor({ height = 260, trunk = '#8b5a2b', leaves = '#3fa34d', ...options }: TreeOptions = {}) {
    super({ name: 'Tree', ...options });
    this.draw('rect', { x: -14, y: -height, width: 28, height, rx: 8, fill: trunk });

    this.foliage = new Actor({ name: 'foliage', y: -height + 20 });
    const blobs: [number, number, number][] = [[-70, 0, 65], [70, 0, 65], [0, 25, 70], [0, -45, 90]];
    for (const [cx, cy, r] of blobs) this.foliage.draw('circle', { cx, cy, r, fill: leaves });
    this.foliage.draw('circle', { cx: -30, cy: -70, r: 28, fill: 'rgba(255,255,255,0.12)' });
    this.add(this.foliage);
  }
}
