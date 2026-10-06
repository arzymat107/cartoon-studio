/**
 * Acting for rigged Characters. Each returns a timeline to place on a scene timeline:
 *   tl.add(walk(bob, { to: 800, duration: 3 }), 1)
 *
 * Note: `fromTo` and `set` use `immediateRender: false` so building a timeline
 * never changes how the first frame looks.
 */
import { gsap } from 'gsap';
import { Character, type SpeechBubble } from '@/components';
import type { Timeline } from '@/engine';
import { popIn, popOut } from './motion';

const { ARM_REST, TORSO_Y, MOUTH_REST } = Character;

/** Return limbs and body to the neutral standing pose. */
export function standStill(char: Character, { duration = 0.25 } = {}): Timeline {
  return gsap.timeline()
    .to([char.leftLeg, char.rightLeg], { rotation: 0, duration }, 0)
    .to(char.leftArm, { rotation: ARM_REST, duration }, 0)
    .to(char.rightArm, { rotation: -ARM_REST, duration }, 0)
    .to(char.torso, { y: TORSO_Y, rotation: 0, duration }, 0);
}

/** Turn to face right (1) or left (-1). */
export function face(char: Character, direction: 1 | -1): Timeline {
  return gsap.timeline().set(char, { scaleX: () => direction * Math.abs(char.scaleX), immediateRender: false });
}

export interface WalkOptions {
  /** Target x position. */
  to: number;
  duration?: number;
  /** Seconds per step. */
  stepDuration?: number;
  ease?: string;
}

/** Walk to x = `to`, turning to face the direction of travel. */
export function walk(char: Character, { to, duration = 2, stepDuration = 0.32, ease = 'none' }: WalkOptions): Timeline {
  const steps = Math.max(2, Math.round(duration / stepDuration));
  const swing = {
    duration: duration / steps, repeat: steps - 1, yoyo: true, ease: 'sine.inOut', immediateRender: false,
  };
  const leg = 28;
  const arm = 22;

  return gsap.timeline()
    .set(char, { scaleX: () => (to >= char.x ? 1 : -1) * Math.abs(char.scaleX), immediateRender: false }, 0)
    .to(char, { x: to, duration, ease }, 0)
    .fromTo(char.leftLeg, { rotation: -leg }, { rotation: leg, ...swing }, 0)
    .fromTo(char.rightLeg, { rotation: leg }, { rotation: -leg, ...swing }, 0)
    .fromTo(char.leftArm, { rotation: ARM_REST + arm }, { rotation: ARM_REST - arm, ...swing }, 0)
    .fromTo(char.rightArm, { rotation: -ARM_REST - arm }, { rotation: -ARM_REST + arm, ...swing }, 0)
    .fromTo(char.torso, { y: TORSO_Y }, {
      y: TORSO_Y - 5, duration: duration / steps / 2, repeat: steps * 2 - 1, yoyo: true,
      ease: 'sine.inOut', immediateRender: false,
    }, 0)
    .add(standStill(char, { duration: 0.2 }));
}

/** Raise an arm and wave. */
export function wave(char: Character, { times = 3, arm = 'right' as 'left' | 'right' } = {}): Timeline {
  const limb = arm === 'right' ? char.rightArm : char.leftArm;
  const side = arm === 'right' ? -1 : 1;
  return gsap.timeline()
    .to(limb, { rotation: side * 155, duration: 0.3, ease: 'back.out(2)' })
    .to(limb, { rotation: side * 120, duration: 0.18, repeat: times * 2 - 1, yoyo: true, ease: 'sine.inOut' })
    .to(limb, { rotation: side * ARM_REST, duration: 0.3, ease: 'power2.inOut' });
}

/** Both arms up – celebrate! */
export function cheer(char: Character, { duration = 1 } = {}): Timeline {
  return gsap.timeline()
    .to(char.leftArm, { rotation: 150, duration: 0.25, ease: 'back.out(2)' }, 0)
    .to(char.rightArm, { rotation: -150, duration: 0.25, ease: 'back.out(2)' }, 0)
    .to(char.leftArm, { rotation: ARM_REST, duration: 0.3 }, duration)
    .to(char.rightArm, { rotation: -ARM_REST, duration: 0.3 }, duration);
}

export function blink(char: Character, { times = 1 } = {}): Timeline {
  const tl = gsap.timeline();
  for (let i = 0; i < times; i++) {
    tl.to(char.eyes, { scaleY: 0.1, duration: 0.06, ease: 'power1.in' }, i === 0 ? 0 : '+=0.12')
      .to(char.eyes, { scaleY: 1, duration: 0.08, ease: 'power1.out' });
  }
  return tl;
}

/** Natural random blinking spread over `duration` seconds. */
export function blinkRandomly(char: Character, duration: number, { min = 1.8, max = 4.5 } = {}): Timeline {
  const tl = gsap.timeline();
  let t = gsap.utils.random(0.4, min);
  while (t < duration - 0.3) {
    tl.add(blink(char, { times: Math.random() < 0.2 ? 2 : 1 }), t);
    t += gsap.utils.random(min, max);
  }
  return tl.set({}, {}, duration);
}

/** Flap the mouth for `duration` seconds. */
export function talk(char: Character, { duration = 1, speed = 0.11 } = {}): Timeline {
  const flaps = Math.max(1, Math.round(duration / (speed * 2)));
  return gsap.timeline().fromTo(char.mouth, { scaleY: MOUTH_REST }, {
    scaleY: 1, duration: speed, repeat: flaps * 2 - 1, yoyo: true, ease: 'sine.inOut', immediateRender: false,
  });
}

export interface SayOptions {
  /** How long the character talks. */
  duration?: number;
  /** Extra reading time after talking stops. */
  hold?: number;
  /** Bubble height above the feet (multiplied by the character's scale). */
  offsetY?: number;
  offsetX?: number;
}

/** Pop a speech bubble above the character (wherever it is at that moment) and talk. */
export function say(
  char: Character, bubble: SpeechBubble,
  { duration = 2, hold = 0.6, offsetY = 275, offsetX = 0 }: SayOptions = {},
): Timeline {
  return gsap.timeline()
    .set(bubble, {
      x: () => char.x + offsetX,
      y: () => char.y - offsetY * Math.abs(char.scaleY),
      immediateRender: false,
    }, 0)
    .add(popIn(bubble), 0)
    .add(talk(char, { duration }), 0.1)
    .add(popOut(bubble), duration + hold);
}
