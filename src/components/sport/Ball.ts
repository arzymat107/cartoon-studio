import { Actor, type ActorOptions } from '@/engine';

export interface BallOptions extends ActorOptions {
  radius?: number;
}

/**
 * A football. Origin is the ground point under the ball:
 *   x       – position along the ground
 *   body.y  – height above the ground (−radius when resting), body.rotation – spin
 *   shadow  – stays on the ground and shrinks while the ball is in the air
 */
export class Ball extends Actor {
  readonly radius: number;
  readonly body: Actor;
  readonly shadow: Actor;

  constructor({ radius = 22, ...options }: BallOptions = {}) {
    super({ name: 'Ball', ...options });
    this.radius = radius;

    this.shadow = new Actor({ name: 'shadow' });
    this.shadow.draw('ellipse', { rx: radius * 0.95, ry: radius * 0.28, fill: 'rgba(0,0,0,0.28)' });

    this.body = new Actor({ name: 'body', y: -radius });
    const r = radius;
    this.body.draw('circle', { r, fill: '#fff', stroke: '#222', 'stroke-width': r * 0.08 });
    this.body.draw('polygon', { points: pentagon(0, 0, r * 0.36), fill: '#222' });
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      this.body.draw('polygon', { points: pentagon(Math.cos(angle) * r * 0.86, Math.sin(angle) * r * 0.86, r * 0.26, angle), fill: '#222' });
    }
    this.body.draw('circle', { cx: -r * 0.35, cy: -r * 0.4, r: r * 0.18, fill: 'rgba(255,255,255,0.6)' });
    this.add(this.shadow, this.body);
  }
}

function pentagon(cx: number, cy: number, size: number, rotation = -Math.PI / 2): string {
  return Array.from({ length: 5 }, (_, i) => {
    const a = rotation + (i * 2 * Math.PI) / 5;
    return `${cx + Math.cos(a) * size},${cy + Math.sin(a) * size}`;
  }).join(' ');
}
