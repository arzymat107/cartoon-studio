import { Actor, type ActorOptions } from '@/engine';

export interface GroundOptions extends ActorOptions {
  width: number;
  height: number;
  /** Top edge of the flat ground. */
  top: number;
  color?: string;
  hillColor?: string;
}

/** Rolling hills in the back and a flat field in front. Drawn in stage coordinates. */
export class Ground extends Actor {
  constructor({ width: w, height: h, top, color = '#7ccf5a', hillColor = '#5fb846', ...options }: GroundOptions) {
    super({ name: 'Ground', ...options });
    this.draw('path', {
      d: `M ${-w} ${top} L 0 ${top}
          C ${w * 0.15} ${top - 170}, ${w * 0.35} ${top - 170}, ${w * 0.5} ${top}
          C ${w * 0.65} ${top - 120}, ${w * 0.85} ${top - 120}, ${w} ${top}
          L ${w * 2} ${top} V ${h * 2} H ${-w} Z`,
      fill: hillColor,
    });
    this.draw('rect', { x: -w, y: top, width: w * 3, height: h * 2, fill: color });
    this.draw('rect', { x: -w, y: top, width: w * 3, height: 8, fill: 'rgba(0,0,0,0.06)' });
  }
}
