import { Actor, type ActorOptions } from '@/engine';

export interface TextLabelOptions extends ActorOptions {
  text: string;
  fontSize?: number;
  color?: string;
  /** Rounded background box color, or none. */
  background?: string;
  font?: string;
  weight?: number | string;
}

/** A line of text centered on its origin – titles, captions, notices. */
export class TextLabel extends Actor {
  constructor({
    text, fontSize = 32, color = '#fff', background, weight = 700,
    font = 'system-ui, -apple-system, "Segoe UI", sans-serif', ...options
  }: TextLabelOptions) {
    super({ name: 'TextLabel', ...options });
    if (background) {
      const width = text.length * fontSize * 0.55 + fontSize * 1.2;
      const height = fontSize * 1.6;
      this.draw('rect', { x: -width / 2, y: -height / 2, width, height, rx: height / 2, fill: background });
    }
    const label = this.draw('text', {
      x: 0, y: fontSize * 0.35, 'text-anchor': 'middle',
      'font-family': font, 'font-size': fontSize, 'font-weight': weight, fill: color,
    });
    label.textContent = text;
  }
}
