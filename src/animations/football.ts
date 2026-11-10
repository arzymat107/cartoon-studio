/**
 * Football props in motion: the ball, the net, the crowd. Like every animation helper, each returns a timeline to place on a scene timeline.
 *
 *   tl.add(flight(ball, { toX: 900, peak: 500, land: 150, duration: 1.2 }))
 */
import { gsap } from 'gsap';
import { synth } from '@/audio';
import type { Ball, Goal, Stands } from '@/components';
import type { Timeline } from '@/engine';
import { sfx } from './sound';

export interface FlightOptions {
  /** Where the ball comes down: absolute xвЂ¦ */
  toX?: number;
  /** вЂ¦or a distance from where it is. */
  dx?: number;
  /** Height above the ground at the start, the highest point and the end (0 = on the ground). */
  from?: number;
  peak?: number;
  land?: number;
  duration?: number;
  /** Turns of spin; negative spins the other way (use when flying left). */
  spin?: number;
  /** Fly in a straight line from `from` to `land` (a driven shot) instead of an arc. */
  straight?: boolean;
}

/**
 * Ball flight along a true parabola (lob, chip, cross, a ball dropping), or with `straight: true`
 * in a straight line (driven shot, low pass). The shadow on the ground shrinks with height.
 */
export function flight(
  ball: Ball, { toX, dx, from = 0, peak = 0, land = 0, duration = 0.8, spin = 1.5, straight = false }: FlightOptions,
): Timeline {
  const r = ball.radius;
  const easeUp = straight ? 'none' : 'power1.out';
  const easeDown = straight ? 'none' : 'power1.in';
  const top = Math.max(peak, from, land);
  const up = Math.sqrt(top - from);
  const down = Math.sqrt(top - land);
  const tUp = up + down > 0 ? (duration * up) / (up + down) : 0;
  const tDown = duration - tUp;
  const shadowAt = (height: number) => ({ scale: Math.max(0.35, 1 - height / 700), opacity: Math.max(0.3, 1 - height / 900) });

  const tl = gsap.timeline()
    .to(ball, { x: dx !== undefined ? `+=${dx}` : toX, duration, ease: 'none' }, 0)
    .to(ball.body, { rotation: `+=${360 * spin}`, duration, ease: 'none' }, 0);
  if (tUp > 0) {
    tl.to(ball.body, { y: -r - top, duration: tUp, ease: easeUp }, 0)
      .to(ball.shadow, { ...shadowAt(top), duration: tUp, ease: easeUp }, 0);
  }
  if (tDown > 0) {
    tl.to(ball.body, { y: -r - land, duration: tDown, ease: easeDown }, tUp)
      .to(ball.shadow, { ...shadowAt(land), duration: tDown, ease: easeDown }, tUp);
  }
  return tl;
}

/** Smaller and smaller hops after landing. */
export function bounce(ball: Ball, { dx = 120, height = 70, times = 3, duration = 0.45 } = {}): Timeline {
  const tl = gsap.timeline();
  const shares = Array.from({ length: times }, (_, i) => 0.6 ** i);
  const total = shares.reduce((a, b) => a + b, 0);
  shares.forEach((share, i) => {
    tl.add(flight(ball, {
      dx: (dx * share) / total, peak: height * 0.45 ** i, duration: duration * 0.75 ** i, spin: Math.sign(dx) * 0.5,
    }));
    tl.add(sfx(() => synth.kick(0.25 * 0.6 ** i)));
  });
  return tl;
}

/** Roll along the ground, slowing down. */
export function roll(ball: Ball, { dx = 200, duration = 1 } = {}): Timeline {
  return gsap.timeline()
    .to(ball, { x: `+=${dx}`, duration, ease: 'power2.out' }, 0)
    .to(ball.body, { rotation: `+=${(dx / (2 * Math.PI * ball.radius)) * 360}`, duration, ease: 'power2.out' }, 0);
}

/** When the foot meets the ball, counted from the start of `shoot()`. */
/** Wind up, kick, and send the ball on its flight (starts at `SHOT_CONTACT`). */
/** Net bulges back and wobbles. */
export function shakeNet(goal: Goal): Timeline {
  return gsap.timeline()
    .add(sfx(synth.swish), 0)
    .to(goal.net, { scaleX: 1.14, duration: 0.12, ease: 'power2.out' }, 0)
    .to(goal.net, { scaleX: 1, duration: 0.9, ease: 'elastic.out(1.2, 0.35)' }, 0.12);
}

/**
 * Keepy-uppies: each touch flicks the ball up off the right foot (ball in front of the player).
 * With `drop: true` the last touch lets the ball fall to the ground.
 */
/** Arms up and jumping вЂ“ goal celebration. */
/** Both hands on the head вЂ“ "I can't believe it!" */
/**
 * Over-the-top fall: flails, crashes onto the ground and kicks the legs.
 * `direction` 1 = falls to the right (head ends up right of the feet), в€’1 = to the left.
 */
/** Back on the feet after `flop()`. */
/** Whistle and show a card high in the air. */
/** Fans jump in a wave, with a roar. */
export function crowdCheer(stands: Stands, { duration = 2.5, height = 16 } = {}): Timeline {
  const hops = Math.max(1, Math.round(duration / 0.36));
  const tl = gsap.timeline().add(sfx(() => synth.cheer(duration + 0.5)), 0);
  stands.rows.forEach((row, i) => {
    tl.to(row, { y: `-=${height}`, duration: 0.18, repeat: hops * 2 - 1, yoyo: true, ease: 'sine.inOut' }, i * 0.04);
  });
  return tl;
}

/** Fans groan "ohhh" after a miss. */
export function crowdGroan(stands: Stands, { duration = 1.6 } = {}): Timeline {
  const tl = gsap.timeline().add(sfx(() => synth.groan(duration)), 0);
  stands.rows.forEach((row, i) => {
    tl.to(row, { y: '+=6', duration: duration / 2, repeat: 1, yoyo: true, ease: 'sine.inOut' }, i * 0.02);
  });
  return tl;
}

/** Fans shuffling in their seats for `duration` seconds. */
export function crowdIdle(stands: Stands, duration: number): Timeline {
  const tl = gsap.timeline();
  stands.rows.forEach((row, i) => {
    const period = 1.4 + (i % 3) * 0.35;
    const cycles = Math.max(1, Math.round(duration / period));
    tl.to(row, { y: '-=3', duration: period / 2, repeat: cycles * 2 - 1, yoyo: true, ease: 'sine.inOut' }, (i % 4) * 0.2);
  });
  return tl.set({}, {}, duration);
}

/** Continuous stadium background noise for `duration` seconds. */
export function crowdMurmur(duration: number): Timeline {
  const tl = gsap.timeline();
  for (let t = 0; t < duration; t += 1.8) tl.add(sfx(() => synth.murmur(2.3)), t);
  return tl.set({}, {}, duration);
}
