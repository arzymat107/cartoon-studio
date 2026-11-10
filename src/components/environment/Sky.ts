import { Actor, svg, uid, type ActorOptions } from '@/engine';

export interface SkyOptions extends ActorOptions {
  width: number;
  height: number;
  top?: string;
  bottom?: string;
}

/** Full-frame vertical gradient. Stack two and fade one out for a sunrise / sunset. */
export class Sky extends Actor {
  constructor({ width, height, top = '#5ec8ff', bottom = '#d8f3ff', ...options }: SkyOptions) {
    super({ name: 'Sky', ...options });
    const id = uid('sky');
    const gradient = this.draw('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
    gradient.append(
      svg('stop', { offset: 0, 'stop-color': top }),
      svg('stop', { offset: 1, 'stop-color': bottom }),
    );
    // Oversized so camera zoom/pan never shows the edges.
    this.draw('rect', { x: -width, y: -height, width: width * 3, height: height * 3, fill: `url(#${id})` });
  }
}
