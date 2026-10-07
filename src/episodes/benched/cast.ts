/**
 * Cast and props for the "Benched?!" Short. The coach is a generic character, not a likeness
 * of any real coach.
 */
import { Character, type CharacterOptions } from '@/components';
import { Actor, svg, uid } from '@/engine';
import { GROUND_Y } from '../football/stadium';

/** Generic national-team coach: grey hair, navy tracksuit, clipboard in the left hand. */
export function createCoach(options: Partial<CharacterOptions> = {}): Character {
  const coach = new Character({
    name: 'Coach',
    y: GROUND_Y,
    scale: 1.5,
    skin: '#e8b98f',
    hair: '#a3a3a3',
    hairStyle: 'short',
    shirt: '#1d2a44',
    pants: '#1d2a44',
    shoes: '#f2f2f2',
    face: {
      width: 42, height: 48, jaw: 30, chin: 15,
      eyeColor: '#3b2414', browColor: '#7d7d7d', browWeight: 6, browTilt: -1,
      nose: 'broad', lips: '#a8645a',
    },
    voice: { pitch: 0.85 },
    ...options,
  });
  // Tracksuit stripe and a clipboard.
  coach.torsoDetail.draw('path', { d: 'M -14 -95 L 0 -78 L 14 -95', stroke: '#f2f2f2', 'stroke-width': 4, fill: 'none' });
  const clipboard = new Actor({ name: 'clipboard', y: 66, rotation: -12 });
  clipboard.draw('rect', { x: -18, y: -6, width: 36, height: 48, rx: 4, fill: '#8b5a2b' });
  clipboard.draw('rect', { x: -14, y: 0, width: 28, height: 38, fill: '#fafafa' });
  for (const y of [8, 15, 22, 29]) clipboard.draw('line', { x1: -10, y1: y, x2: 10, y2: y, stroke: '#9aa4b2', 'stroke-width': 2 });
  clipboard.draw('rect', { x: -7, y: -9, width: 14, height: 7, rx: 2, fill: '#c0c0c0' });
  coach.leftArm.add(clipboard);
  return coach;
}

/** Kit bag. Origin is the handle top, so it can hang from a hand or sit on the ground at y − 64. */
export function createKitBag(options: { x?: number; y?: number; opacity?: number } = {}): Actor {
  const bag = new Actor({ name: 'kitBag', ...options });
  bag.draw('path', { d: 'M -20 24 Q 0 -6 20 24', stroke: '#1b1b1b', 'stroke-width': 5, fill: 'none' });
  bag.draw('rect', { x: -44, y: 20, width: 88, height: 44, rx: 18, fill: '#1e7f3a' });
  bag.draw('rect', { x: -44, y: 36, width: 88, height: 9, fill: '#c8102e' });
  for (const side of [-1, 1]) bag.draw('circle', { cx: side * 38, cy: 42, r: 9, fill: '#16602c' });
  return bag;
}

/** Three press microphones on booms, coming in from the right; the mic heads are at x ≈ 0. */
export function createPress(options: { x?: number; y?: number; scale?: number } = {}): Actor {
  const press = new Actor({ name: 'press', ...options });
  const mics: [number, number, string, string][] = [[-38, -7, '#e63946', 'TV1'], [0, 0, '#3a86ff', 'NEWS'], [38, 7, '#ffb703', '24']];
  for (const [y, rotation, color, label] of mics) {
    const mic = new Actor({ name: 'mic', y, rotation });
    mic.draw('rect', { x: 30, y: -4, width: 560, height: 8, rx: 4, fill: '#55606e' });
    mic.draw('rect', { x: -22, y: -14, width: 44, height: 28, rx: 14, fill: '#222' });
    mic.draw('rect', { x: 14, y: -17, width: 44, height: 34, rx: 4, fill: color });
    const text = mic.draw('text', {
      x: 36, y: 6, 'text-anchor': 'middle', 'font-family': 'Impact, "Arial Black", sans-serif', 'font-size': 15, fill: '#fff',
    });
    text.textContent = label;
    press.add(mic);
  }
  return press;
}

/** TV news ticker across the screen: red BREAKING tag and a scrolling headline (`scrollTicker()`). */
export class NewsTicker extends Actor {
  readonly headline: Actor;

  constructor({ width, y, text }: { width: number; y: number; text: string }) {
    super({ name: 'NewsTicker', y, x: -width });
    const h = 74;
    const tag = 250;
    this.draw('rect', { x: 0, y: -h / 2, width, height: h, fill: '#f8f8f8' });
    const clipId = uid('ticker');
    this.draw('clipPath', { id: clipId }).appendChild(svg('rect', { x: tag, y: -h / 2, width: width - tag, height: h }));
    const lane = this.draw('g', { 'clip-path': `url(#${clipId})` });
    this.headline = new Actor({ name: 'headline', x: width });
    const label = this.headline.draw('text', {
      x: 0, y: 14, 'font-family': 'Impact, "Arial Black", sans-serif', 'font-size': 40, fill: '#15192b', 'letter-spacing': 1,
    });
    label.textContent = text;
    lane.appendChild(this.headline.el);
    this.draw('rect', { x: 0, y: -h / 2, width: tag, height: h, fill: '#d62828' });
    const breaking = this.draw('text', {
      x: tag / 2, y: 14, 'text-anchor': 'middle', 'font-family': 'Impact, "Arial Black", sans-serif', 'font-size': 40, fill: '#fff',
    });
    breaking.textContent = 'BREAKING';
  }
}
