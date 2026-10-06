import { Actor, type ActorOptions } from '@/engine';

export interface CloudOptions extends ActorOptions {
  color?: string;
}

export class Cloud extends Actor {
  constructor({ color = '#ffffff', ...options }: CloudOptions = {}) {
    super({ name: 'Cloud', opacity: 0.95, ...options });
    const puffs: [number, number, number, number][] = [
      [0, 0, 80, 50],
      [-70, 18, 55, 35],
      [70, 15, 60, 38],
      [20, -30, 50, 42],
    ];
    for (const [cx, cy, rx, ry] of puffs) this.draw('ellipse', { cx, cy, rx, ry, fill: color });
  }
}
