import { Actor, svg, type ActorOptions } from '@/engine';

export interface SpeechBubbleOptions extends ActorOptions {
  /** Use "\n" for line breaks. */
  text: string;
  fontSize?: number;
  fill?: string;
  color?: string;
}

/**
 * A comic speech bubble. Origin is the tip of the tail, so place it just above a head.
 * Starts hidden (scale 0, opacity 0) – show it with popIn() or say().
 */
export class SpeechBubble extends Actor {
  constructor({ text, fontSize = 34, fill = '#fff', color = '#222', ...options }: SpeechBubbleOptions) {
    super({ name: 'SpeechBubble', scale: 0, opacity: 0, ...options });

    const lines = text.split('\n');
    const lineHeight = fontSize * 1.25;
    const padding = 22;
    const tail = 30;
    const width = Math.max(...lines.map((l) => l.length)) * fontSize * 0.56 + padding * 2.5;
    const height = lines.length * lineHeight + padding * 1.6;
    const top = -(height + tail);

    const stroke = { stroke: color, 'stroke-width': 4, 'stroke-linejoin': 'round' };
    this.draw('rect', { x: -width / 2, y: top, width, height, rx: Math.min(30, height / 2), fill, ...stroke });
    // Starts slightly inside the box so its fill hides the box border behind the tail.
    this.draw('path', { d: `M -16 ${-tail - 4} L 0 0 L 22 ${-tail - 4}`, fill, ...stroke });

    const label = this.draw('text', {
      'text-anchor': 'middle',
      'font-family': '"Comic Sans MS", "Comic Neue", "Chalkboard SE", system-ui, sans-serif',
      'font-size': fontSize,
      'font-weight': 700,
      fill: color,
    });
    lines.forEach((line, i) => {
      const tspan = svg('tspan', { x: 0, y: top + padding * 0.8 + fontSize + i * lineHeight });
      tspan.textContent = line;
      label.appendChild(tspan);
    });
  }
}
