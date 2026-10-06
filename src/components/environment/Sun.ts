import { Actor, type ActorOptions } from '@/engine';

export interface SunOptions extends ActorOptions {
  radius?: number;
  color?: string;
  rayColor?: string;
  face?: boolean;
}

export class Sun extends Actor {
  /** Spin this for animated rays. */
  readonly rays: Actor;

  constructor({ radius = 70, color = '#ffd23f', rayColor = '#ffb703', face = true, ...options }: SunOptions = {}) {
    super({ name: 'Sun', ...options });

    this.rays = new Actor({ name: 'rays' });
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
      this.rays.draw('line', {
        x1: cos * radius * 1.25, y1: sin * radius * 1.25,
        x2: cos * radius * 1.7, y2: sin * radius * 1.7,
        stroke: rayColor, 'stroke-width': 10, 'stroke-linecap': 'round',
      });
    }
    this.add(this.rays);

    this.draw('circle', { r: radius, fill: color });
    if (face) {
      const ink = '#9a5b00';
      this.draw('circle', { cx: -radius * 0.3, cy: -radius * 0.15, r: radius * 0.08, fill: ink });
      this.draw('circle', { cx: radius * 0.3, cy: -radius * 0.15, r: radius * 0.08, fill: ink });
      this.draw('path', {
        d: `M ${-radius * 0.35} ${radius * 0.2} Q 0 ${radius * 0.5} ${radius * 0.35} ${radius * 0.2}`,
        stroke: ink, 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none',
      });
    }
  }
}
