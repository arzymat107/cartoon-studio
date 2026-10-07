import { gsap } from 'gsap';
import { Actor, type ActorOptions, type Timeline } from '@/engine';

export interface StatCounterOptions extends ActorOptions {
  /** Final number shown by `countUp()`. */
  value: number;
  /** Caption under the number, e.g. 'GOALS'. */
  label: string;
  /** Starting number (shown before counting). */
  from?: number;
  fontSize?: number;
  color?: string;
  labelColor?: string;
  background?: string;
  width?: number;
}

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';

/**
 * A big number with a caption under it, in a rounded card – match stats, records, scores.
 * Origin is the card center. Count up on a timeline with `tl.add(stat.countUp(), 2)`;
 * scrubbing back shows the earlier number again.
 */
export class StatCounter extends Actor {
  readonly target: number;
  private readonly number: SVGTextElement;
  private shown: number;

  constructor({
    value, label, from = 0, fontSize = 120, color = '#ffd60a', labelColor = '#fff',
    background = 'rgba(10,14,30,0.82)', width = 420, ...options
  }: StatCounterOptions) {
    super({ name: 'StatCounter', ...options });
    this.target = value;
    this.shown = from;
    const height = fontSize * 1.75;
    this.draw('rect', { x: -width / 2, y: -height / 2, width, height, rx: 28, fill: background });
    this.number = this.draw('text', {
      x: 0, y: -height / 2 + fontSize * 1.02, 'text-anchor': 'middle',
      'font-family': FONT, 'font-size': fontSize, fill: color,
    });
    const caption = this.draw('text', {
      x: 0, y: height / 2 - fontSize * 0.2, 'text-anchor': 'middle',
      'font-family': FONT, 'font-size': fontSize * 0.36, fill: labelColor, 'letter-spacing': 4,
    });
    caption.textContent = label;
    this.value = from;
  }

  /** The number currently shown (tweenable; always displayed as a whole number). */
  get value(): number {
    return this.shown;
  }

  set value(v: number) {
    this.shown = v;
    this.number.textContent = String(Math.round(v));
  }

  /** Count from the current number up to `value`, slowing down at the end. */
  countUp({ duration = 1.5, ease = 'power2.out' } = {}): Timeline {
    return gsap.timeline().to(this, { value: this.target, duration, ease });
  }
}
