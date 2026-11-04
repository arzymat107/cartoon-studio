/**
 * "Klopp Can't Stop Laughing": a cut-out Klopp (from klopp.png) goes from a grin to a
 * chuckle to a full-body belly laugh and back.
 *
 * Techniques: anticipation (a squash before each big beat), squash & stretch around the feet,
 * exaggerated lean back / doubling over, overlapping action (the head lags and bobs on its own),
 * high-frequency shaking with shake lines, a flapping mouth, tears, popping "HA" lettering,
 * a spinning sunburst, camera zoom and shake, and an elastic follow-through when he settles.
 */
import { clip, popIn, sfx } from '@/animations';
import { synth } from '@/audio';
import { Actor, Scene, seededRandom, svg, type SceneClass, type Timeline } from '@/engine';
import { createParodyNotice } from '../football/overlay';
import { laughTrack } from '../madrid-laughs/sound';
import { EYE_CORNERS, KloppRig } from './klopp';

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const FEET_Y = 1830;
const SCALE = 0.7;
const END = 11.5;

/** Spinning cartoon sunburst behind him. */
function sunburst(width: number, height: number): { sky: Actor; rays: Actor } {
  const sky = new Actor({ name: 'sky' });
  const grad = sky.draw('radialGradient', { id: 'klopp-sky', cx: '50%', cy: '32%', r: '75%' });
  grad.appendChild(svg('stop', { offset: '0%', 'stop-color': '#fff1a8' }));
  grad.appendChild(svg('stop', { offset: '55%', 'stop-color': '#ffb43a' }));
  grad.appendChild(svg('stop', { offset: '100%', 'stop-color': '#e2572b' }));
  // Oversized so camera zoom and shake never show the edges.
  sky.draw('rect', { x: -300, y: -300, width: width + 600, height: height + 600, fill: 'url(#klopp-sky)' });

  const rays = new Actor({ name: 'rays', x: width / 2, y: 620, opacity: 0.35 });
  const count = 18;
  for (let i = 0; i < count; i += 2) {
    const a = (i / count) * Math.PI * 2;
    const b = ((i + 1) / count) * Math.PI * 2;
    const r = 2200;
    rays.draw('path', { d: `M 0 0 L ${Math.cos(a) * r} ${Math.sin(a) * r} L ${Math.cos(b) * r} ${Math.sin(b) * r} Z`, fill: '#fff6cf' });
  }
  return { sky, rays };
}

/** Bold "HA" lettering, centered on its origin. */
function ha(text: string, x: number, y: number, size: number, rotation: number, color = '#ffffff'): Actor {
  const label = new Actor({ name: 'ha', x, y, rotation, scale: 0, opacity: 0 });
  const t = label.draw('text', {
    'text-anchor': 'middle', y: size * 0.35, 'font-family': FONT, 'font-size': size, fill: color,
    stroke: '#5a0d0d', 'stroke-width': size * 0.13, 'paint-order': 'stroke', 'stroke-linejoin': 'round',
  });
  t.textContent = text;
  return label;
}

class LaughScene extends Scene {
  readonly title = 'Klopp laughs';
  private klopp!: KloppRig;
  private shadow!: Actor;
  private rays!: Actor;
  private tears: Actor[] = [];

  build(): void {
    const { width, height } = this.stage;
    const { sky, rays } = sunburst(width, height);
    this.rays = rays;
    this.shadow = new Actor({ name: 'shadow', x: width / 2, y: FEET_Y });
    this.shadow.draw('ellipse', { rx: 300, ry: 38, fill: 'rgba(90,20,0,0.28)' });
    this.klopp = new KloppRig({ x: width / 2, y: FEET_Y, scale: SCALE });
    this.add(sky, rays, this.shadow, this.klopp);

    for (let i = 0; i < 18; i++) {
      const tear = new Actor({ name: 'tear', opacity: 0 });
      tear.draw('path', { d: 'M 0 -26 Q 16 -2 14 10 Q 10 24 0 24 Q -10 24 -14 10 Q -16 -2 0 -26 Z', fill: '#7fd3ff', stroke: '#1f5e8a', 'stroke-width': 4 });
      tear.draw('ellipse', { cx: -5, cy: 4, rx: 4, ry: 7, fill: '#ffffff', opacity: 0.8 });
      this.klopp.head.add(tear);
      this.tears.push(tear);
    }
    this.overlay.add(createParodyNotice(width, height));
  }

  /** A "HA" that pops up, wobbles and floats away. */
  private popHa(tl: Timeline, at: number, text: string, x: number, y: number, size: number, rotation: number, color?: string): void {
    const label = ha(text, x, y, size, rotation, color);
    this.overlay.add(label);
    tl.add(popIn(label, { scale: 1, duration: 0.22 }), at)
      .to(label, { rotation: rotation + (rotation < 0 ? -8 : 8), duration: 0.3, ease: 'sine.inOut', yoyo: true, repeat: 1 }, at + 0.22)
      .to(label, { y: y - 120, opacity: 0, scale: 1.2, duration: 0.45, ease: 'power1.in' }, at + 0.85);
  }

  /** Mouth flapping open and shut for each "HA". */
  private flap(tl: Timeline, from: number, to: number, beat: number, { min = 0.8, max = 1.15 } = {}): void {
    const { mouth } = this.klopp;
    for (let t = from; t + beat <= to; t += beat) {
      tl.to(mouth, { scaleY: max, scaleX: 1.04, duration: beat * 0.4, ease: 'power2.out' }, t)
        .to(mouth, { scaleY: min, scaleX: 1, duration: beat * 0.6, ease: 'sine.inOut' }, t + beat * 0.4);
    }
  }

  /** Rhythmic laugh bounce: squash on each "HA", stretch between, the head bobbing a bit later. */
  private bounce(tl: Timeline, from: number, to: number, beat: number, { squash = 0.04, head = 4, lean = 0, base = 1 } = {}): void {
    const { klopp } = this;
    const sy = SCALE * base;
    const sx = SCALE / Math.sqrt(base);
    const baseHead = klopp.head.rotation;
    for (let t = from, i = 0; t + beat <= to; t += beat, i++) {
      tl.to(klopp, { scaleY: sy * (1 - squash), scaleX: sx * (1 + squash * 0.7), duration: beat * 0.35, ease: 'power2.out' }, t)
        .to(klopp, { scaleY: sy * (1 + squash * 0.5), scaleX: sx * (1 - squash * 0.3), duration: beat * 0.65, ease: 'sine.inOut' }, t + beat * 0.35)
        .to(this.shadow, { scaleX: 1 + squash * 1.5, duration: beat * 0.35, yoyo: true, repeat: 1 }, t)
        // Overlapping action: the head follows a beat fraction later.
        .to(klopp.head, { rotation: baseHead + (i % 2 ? head : -head) * 0.6 + lean, y: klopp.head.y + head * 2, duration: beat * 0.5, ease: 'sine.inOut' }, t + beat * 0.15)
        .to(klopp.head, { y: klopp.head.y, duration: beat * 0.5, ease: 'sine.inOut' }, t + beat * 0.65);
    }
  }

  /** High-frequency shaking around a base position, with flickering shake lines. */
  private shake(tl: Timeline, from: number, to: number, amount: number, seed: number): void {
    const rnd = seededRandom(seed);
    const { klopp } = this;
    const x0 = klopp.x;
    for (let t = from; t < to; t += 0.05) {
      tl.to(klopp, { x: x0 + rnd.range(-amount, amount), duration: 0.05, ease: 'none' }, t);
      tl.set(klopp.shakeLines, { opacity: rnd.next() > 0.35 ? 1 : 0.2 }, t);
    }
    tl.to(klopp, { x: x0, duration: 0.08 }, to).set(klopp.shakeLines, { opacity: 0 }, to);
  }

  private cameraShake(tl: Timeline, from: number, to: number, amount: number, seed: number): void {
    const rnd = seededRandom(seed);
    for (let t = from; t < to; t += 0.06) {
      tl.to(this.camera, { x: `+=${rnd.range(-amount, amount)}`, y: `+=${rnd.range(-amount, amount)}`, duration: 0.03, yoyo: true, repeat: 1, ease: 'none' }, t);
    }
  }

  /** Tears springing from both eye corners in arcs, falling with gravity. */
  private cry(tl: Timeline, from: number, count: number, seed: number): void {
    const rnd = seededRandom(seed);
    for (let i = 0; i < count; i++) {
      const tear = this.tears[i % this.tears.length];
      const side = i % 2 ? 1 : -1;
      const [x, y] = EYE_CORNERS[side < 0 ? 0 : 1];
      const at = from + i * 0.16;
      const dx = side * rnd.range(160, 320);
      tl.set(tear, { x, y, opacity: 1, scale: rnd.range(1.5, 2.2), rotation: side * -40 }, at)
        .to(tear, { x: x + dx, duration: 0.75, ease: 'none' }, at)
        .to(tear, { y: y - rnd.range(70, 140), duration: 0.28, ease: 'power2.out' }, at)
        .to(tear, { y: y + rnd.range(380, 560), rotation: side * 20, duration: 0.47, ease: 'power2.in' }, at + 0.28)
        .set(tear, { opacity: 0 }, at + 0.75);
    }
  }

  animate(tl: Timeline): void {
    const { klopp, camera } = this;
    const head = klopp.head;
    const mouth = klopp.mouth;

    tl.to(this.rays, { rotation: 140, duration: END, ease: 'none' }, 0)
      .add(laughTrack(1.4), 7.2)

      // 1. The grin (0–1.2): breathing, then a snort – anticipation.
      .to(klopp, { scaleY: SCALE * 1.012, duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0)
      .to(head, { rotation: 4, duration: 0.4, ease: 'sine.inOut' }, 0.2)
      .to(klopp, { scaleY: SCALE * 0.95, scaleX: SCALE * 1.03, duration: 0.15, ease: 'power2.in' }, 1.0)
      .to(head, { rotation: 7, y: head.y + 14, duration: 0.15, ease: 'power2.in' }, 1.0)
      .add(sfx(() => synth.blip(0.7, 'square')), 1.1)

      // 2. Chuckle (1.2–3.2): the mouth pops open, small rhythmic bounces.
      .set(mouth, { opacity: 1, scaleY: 0.4, scaleX: 0.9 }, 1.2)
      .to(mouth, { scaleY: 1, scaleX: 1, duration: 0.18, ease: 'back.out(3)' }, 1.2)
      .to(head, { rotation: 0, y: head.y, duration: 0.2, ease: 'back.out(2)' }, 1.2)
      .add(clip('laughs/valverde', { volume: 0.9, duration: 2 }), 1.2);
    this.flap(tl, 1.3, 3.2, 0.24, { min: 0.8, max: 1 });
    this.bounce(tl, 1.3, 3.2, 0.24, { squash: 0.025, head: 3 });
    this.popHa(tl, 1.5, 'ha', 250, 470, 80, -12);
    this.popHa(tl, 2.1, 'ha', 830, 430, 90, 10);
    this.popHa(tl, 2.7, 'ha!', 810, 300, 100, 8);

    // 3. Anticipation (3.2–3.5): crouch down hard…
    tl.to(klopp, { scaleY: SCALE * 0.86, scaleX: SCALE * 1.1, rotation: 2, duration: 0.3, ease: 'power2.in' }, 3.2)
      .to(this.shadow, { scaleX: 1.2, duration: 0.3 }, 3.2)
      .to(head, { rotation: 10, y: head.y + 30, duration: 0.3, ease: 'power2.in' }, 3.2)
      .to(mouth, { scaleY: 0.8, duration: 0.3 }, 3.2)

      // 4. …and EXPLODE (3.5–6.4): stretch up tall, lean back, head thrown back, zoom in.
      .to(klopp, { scaleY: SCALE * 1.12, scaleX: SCALE * 0.92, rotation: -7, duration: 0.22, ease: 'back.out(2.5)' }, 3.5)
      .to(this.shadow, { scaleX: 0.85, duration: 0.22 }, 3.5)
      .to(head, { rotation: -16, y: head.y - 10, duration: 0.3, ease: 'back.out(3)' }, 3.55)
      .to(camera, { ...camera.focus(470, 940, 1.08), duration: 0.35, ease: 'power3.out' }, 3.5)
      .to(this.rays, { opacity: 0.6, duration: 0.3 }, 3.5)
      .add(sfx(synth.boing), 3.5)
      .add(clip('laughs/rudiger', { volume: 1, duration: 3 }), 3.5);
    this.flap(tl, 3.6, 6.4, 0.14, { min: 0.85, max: 1.25 });
    this.bounce(tl, 3.7, 6.4, 0.28, { squash: 0.05, head: 5, lean: -16, base: 1.08 });
    this.shake(tl, 3.7, 6.4, 9, 3);
    this.cameraShake(tl, 3.6, 4.6, 12, 4);
    this.cry(tl, 4.3, 12, 5);
    this.popHa(tl, 3.6, 'HA', 820, 760, 150, 14, '#ffe14d');
    this.popHa(tl, 3.95, 'HA', 860, 360, 160, 12, '#ffe14d');
    this.popHa(tl, 4.3, 'HA!', 640, 200, 190, -4, '#ffe14d');
    this.popHa(tl, 5.0, 'HAHA', 190, 1080, 110, -18);
    this.popHa(tl, 5.5, 'HAHA', 850, 600, 120, 16);

    // 5. Doubling over (6.4–8.8): lean forward, squashed, head bouncing down, faster shaking.
    tl.to(klopp, { scaleY: SCALE * 0.9, scaleX: SCALE * 1.06, rotation: 9, duration: 0.3, ease: 'power3.inOut' }, 6.4)
      .to(head, { rotation: 14, y: head.y + 24, duration: 0.3, ease: 'power3.inOut' }, 6.4)
      .to(camera, { ...camera.focus(600, 900, 1.08), duration: 0.5, ease: 'sine.inOut' }, 6.4)
      .add(clip('laughs/bellingham', { volume: 1, duration: 2.4 }), 6.5);
    this.flap(tl, 6.5, 8.8, 0.12, { min: 0.8, max: 1.2 });
    this.bounce(tl, 6.7, 8.8, 0.2, { squash: 0.045, head: 4, lean: 14, base: 0.93 });
    this.shake(tl, 6.7, 8.8, 12, 6);
    this.cameraShake(tl, 6.7, 7.4, 9, 7);
    this.cry(tl, 6.8, 10, 8);
    this.popHa(tl, 6.6, 'HAHAHA', 540, 300, 170, 6, '#ffe14d');
    this.popHa(tl, 7.4, 'HA', 200, 520, 130, -20);
    this.popHa(tl, 7.8, 'HA', 880, 480, 130, 18);
    this.popHa(tl, 8.2, 'HAHA!', 540, 220, 140, -6);

    // 6. Follow-through (8.8–11.5): spring back upright with an elastic wobble, one last chuckle.
    tl.to(klopp, { scaleY: SCALE, scaleX: SCALE, rotation: 0, duration: 1.1, ease: 'elastic.out(1.1, 0.35)' }, 8.8)
      .to(this.shadow, { scaleX: 1, duration: 0.6 }, 8.8)
      .to(head, { rotation: 0, y: head.y, duration: 1.2, ease: 'elastic.out(1.2, 0.3)' }, 8.85)
      .to(camera, { ...camera.reset(), duration: 0.8, ease: 'power2.inOut' }, 8.8)
      .to(mouth, { scaleY: 0.85, scaleX: 1, duration: 0.3 }, 8.8)
      .to(this.rays, { opacity: 0.35, duration: 0.8 }, 8.8)
      .add(sfx(() => synth.blip(0.9)), 9.9)
      .to(klopp, { scaleY: SCALE * 0.96, duration: 0.1, yoyo: true, repeat: 3 }, 9.9)
      .to(mouth, { scaleY: 1.05, duration: 0.1, yoyo: true, repeat: 3 }, 9.9);
    this.popHa(tl, 9.9, 'ha…', 820, 420, 80, 8);
    // The grin returns.
    tl.to(mouth, { scaleY: 0.4, scaleX: 0.9, opacity: 0, duration: 0.15 }, 10.5)
      .to(head, { rotation: 4, duration: 0.5, ease: 'sine.inOut' }, 10.5)
      .set({}, {}, END);
  }
}

export const LAUGH_SCENES: SceneClass[] = [LaughScene];
