/**
 * Football acting. Like every animation helper, each returns a timeline to place on a scene timeline.
 *
 *   tl.add(walk(player, { to: ball.x - 70, duration: 0.6 }))
 *     .add(shoot(player, ball, { toX: 900, peak: 500, land: 150, duration: 1.2 }))
 */
import { gsap } from 'gsap';
import { synth } from '@/audio';
import { Character, type Ball, type Goal, type Referee, type Stands } from '@/components';
import type { Timeline } from '@/engine';
import { cheer } from './character';
import { jump } from './motion';
import { sfx } from './sound';

const { ARM_REST, TORSO_Y, MOUTH_REST } = Character;

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
export const SHOT_CONTACT = 0.4;

export interface ShootOptions extends FlightOptions {
  /** 0.5 = soft, 1 = normal, 1.5 = rocket. Affects the sound. */
  power?: number;
}

/** Wind up, kick, and send the ball on its flight (starts at `SHOT_CONTACT`). */
export function shoot(player: Character, ball: Ball, { power = 1, ...path }: ShootOptions): Timeline {
  const leg = player.rightLeg;
  return gsap.timeline()
    .to(leg, { rotation: 55, duration: 0.28, ease: 'power2.out' }, 0)
    .to(player.torso, { rotation: -7, duration: 0.28 }, 0)
    .to(player.leftArm, { rotation: 70, duration: 0.25 }, 0)
    .to(player.rightArm, { rotation: -55, duration: 0.25 }, 0)
    .to(leg, { rotation: -80, duration: 0.12, ease: 'power3.in' }, SHOT_CONTACT - 0.1)
    .add(sfx(() => synth.kick(power)), SHOT_CONTACT)
    .add(flight(ball, path), SHOT_CONTACT)
    .to(leg, { rotation: 0, duration: 0.35, ease: 'power2.inOut' }, SHOT_CONTACT + 0.2)
    .to(player.torso, { rotation: 0, duration: 0.35 }, SHOT_CONTACT + 0.2)
    .to(player.leftArm, { rotation: ARM_REST, duration: 0.35 }, SHOT_CONTACT + 0.2)
    .to(player.rightArm, { rotation: -ARM_REST, duration: 0.35 }, SHOT_CONTACT + 0.2);
}

/** Net bulges back and wobbles. */
export function shakeNet(goal: Goal): Timeline {
  return gsap.timeline()
    .add(sfx(synth.swish), 0)
    .to(goal.net, { scaleX: 1.14, duration: 0.12, ease: 'power2.out' }, 0)
    .to(goal.net, { scaleX: 1, duration: 0.9, ease: 'elastic.out(1.2, 0.35)' }, 0.12);
}

/** Arms up and jumping вЂ“ goal celebration. */
export function celebrate(char: Character, { jumps = 2, height = 110 } = {}): Timeline {
  return gsap.timeline()
    .add(cheer(char, { duration: jumps * 0.6 + 0.3 }), 0)
    .add(jump(char, { times: jumps, height, duration: 0.55 }), 0.05);
}

/** Both hands on the head вЂ“ "I can't believe it!" */
export function handsOnHead(char: Character, { duration = 1.4 } = {}): Timeline {
  return gsap.timeline()
    .to(char.leftArm, { rotation: 165, duration: 0.25, ease: 'back.out(2)' }, 0)
    .to(char.rightArm, { rotation: -165, duration: 0.25, ease: 'back.out(2)' }, 0)
    .to(char.mouth, { scaleY: 1, duration: 0.2 }, 0)
    .to(char.leftArm, { rotation: ARM_REST, duration: 0.35 }, duration)
    .to(char.rightArm, { rotation: -ARM_REST, duration: 0.35 }, duration)
    .to(char.mouth, { scaleY: MOUTH_REST, duration: 0.2 }, duration);
}

/**
 * Over-the-top fall: flails, crashes onto the ground and kicks the legs.
 * `direction` 1 = falls to the right (head ends up right of the feet), в€’1 = to the left.
 */
export function flop(char: Character, { direction = 1 as 1 | -1, kicks = 3 } = {}): Timeline {
  const lift = 30 * Math.abs(char.scaleY);
  return gsap.timeline()
    .to(char.leftArm, { rotation: 150, duration: 0.15 }, 0)
    .to(char.rightArm, { rotation: -150, duration: 0.15 }, 0)
    .to(char.mouth, { scaleY: 1, duration: 0.15 }, 0)
    .to(char, { rotation: direction * 90, y: `-=${lift}`, duration: 0.45, ease: 'power2.in' }, 0.1)
    .add(sfx(() => synth.kick(0.7)), 0.55)
    .to(char, { rotation: direction * 82, duration: 0.1, repeat: 1, yoyo: true }, 0.55)
    .to(char.leftLeg, { rotation: -35, duration: 0.11, repeat: kicks * 2 - 1, yoyo: true }, 0.8)
    .to(char.rightLeg, { rotation: 35, duration: 0.11, repeat: kicks * 2 - 1, yoyo: true }, 0.86);
}

/** Back on the feet after `flop()`. */
export function getUp(char: Character, { duration = 0.5 } = {}): Timeline {
  const lift = 30 * Math.abs(char.scaleY);
  return gsap.timeline()
    .to(char, { rotation: 0, y: `+=${lift}`, duration, ease: 'back.out(1.5)' }, 0)
    .to([char.leftLeg, char.rightLeg], { rotation: 0, duration: 0.2 }, 0)
    .to(char.leftArm, { rotation: ARM_REST, duration }, 0)
    .to(char.rightArm, { rotation: -ARM_REST, duration }, 0)
    .to(char.torso, { y: TORSO_Y, duration }, 0)
    .to(char.mouth, { scaleY: MOUTH_REST, duration: 0.2 }, 0);
}

/** Whistle and show a card high in the air. */
export function showCard(referee: Referee, color: 'yellow' | 'red' = 'yellow', { duration = 1.8 } = {}): Timeline {
  const card = color === 'yellow' ? referee.yellowCard : referee.redCard;
  return gsap.timeline()
    .add(sfx(() => synth.whistle(1, 0.45)), 0)
    .to(referee.rightArm, { rotation: -175, duration: 0.25, ease: 'back.out(2)' }, 0.1)
    .to(card, { opacity: 1, duration: 0.05 }, 0.2)
    .to(referee.rightArm, { rotation: -ARM_REST, duration: 0.35 }, duration)
    .to(card, { opacity: 0, duration: 0.1 }, duration + 0.15);
}

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
