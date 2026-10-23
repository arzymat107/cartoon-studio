/** Extra acting for the PSG–Barça Short. Each returns a timeline, like the shared animations. */
import { gsap } from 'gsap';
import { sfx } from '@/animations';
import { synth } from '@/audio';
import { Character } from '@/components';
import type { Actor, Timeline } from '@/engine';

const { ARM_REST, TORSO_Y } = Character;

/** A quick jolt (heavy landing, bonk). */
export function shake(target: Actor, { amount = 14, times = 4 } = {}): Timeline {
  return gsap.timeline().to(target, { y: `+=${amount}`, duration: 0.05, yoyo: true, repeat: times * 2 - 1, ease: 'none' });
}

/** Plop down on the bottom, legs out in front, head wobbling. */
export function sitDown(char: Character): Timeline {
  const drop = 55 * Math.abs(char.scaleY);
  return gsap.timeline()
    .to(char, { y: `+=${drop}`, duration: 0.25, ease: 'bounce.out' }, 0)
    .to([char.leftLeg, char.rightLeg], { rotation: -80, duration: 0.2 }, 0)
    .add(sfx(() => synth.kick(0.5)), 0.2)
    .to(char.head, { rotation: 12, duration: 0.25, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 0.25);
}

/** Goalkeeper's low ready stance: knees bent, arms out low. `undo` stands back up. */
export function crouch(char: Character, { duration = 0.2, undo = false } = {}): Timeline {
  return gsap.timeline()
    .to(char.torso, { y: undo ? TORSO_Y : TORSO_Y + 45, duration }, 0)
    .to(char.leftLeg, { rotation: undo ? 0 : 40, duration }, 0)
    .to(char.rightLeg, { rotation: undo ? 0 : -40, duration }, 0)
    .to(char.leftArm, { rotation: undo ? ARM_REST : 45, duration }, 0)
    .to(char.rightArm, { rotation: undo ? -ARM_REST : -45, duration }, 0);
}

/** Exaggerated sneaking walk on tiptoes: high knees, slow, hunched. */
export function tiptoe(char: Character, { to, duration = 2, steps = 6 } = {} as { to: number; duration?: number; steps?: number }): Timeline {
  const step = duration / steps;
  const tl = gsap.timeline()
    .set(char, { scaleX: () => (to >= char.x ? 1 : -1) * Math.abs(char.scaleX), immediateRender: false }, 0)
    .to(char, { x: to, duration, ease: 'none' }, 0)
    .to(char.torso, { rotation: 10, duration: 0.2 }, 0);
  for (let i = 0; i < steps; i++) {
    const leg = i % 2 ? char.leftLeg : char.rightLeg;
    tl.to(leg, { rotation: -50, duration: step / 2, yoyo: true, repeat: 1, ease: 'sine.inOut' }, i * step)
      .to(char, { y: '-=14', duration: step / 2, yoyo: true, repeat: 1, ease: 'sine.inOut' }, i * step);
  }
  return tl.to(char.torso, { rotation: 0, duration: 0.2 }, duration);
}

/** Look one way, then the other ("where did it go?"), flipping to face each side. */
export function lookAround(char: Character, { times = 2, interval = 0.18 } = {}): Timeline {
  const facing = char.scaleX;
  const tl = gsap.timeline();
  for (let i = 0; i < times * 2; i++) tl.set(char, { scaleX: i % 2 ? facing : -facing, immediateRender: false }, i * interval);
  return tl.set(char, { scaleX: facing, immediateRender: false }, times * 2 * interval);
}

/** Raise the cup in the right hand to the mouth and back, keeping it upright. */
export function sip(char: Character, cup: Actor): Timeline {
  return gsap.timeline()
    .to(char.rightArm, { rotation: -150, duration: 0.3 }, 0)
    .to(cup, { rotation: 150, duration: 0.3 }, 0)
    .to(char.head, { rotation: -10, duration: 0.3 }, 0.2)
    .to(char.rightArm, { rotation: -ARM_REST, duration: 0.3 }, 0.9)
    .to(cup, { rotation: ARM_REST, duration: 0.3 }, 0.9)
    .to(char.head, { rotation: 0, duration: 0.3 }, 0.9);
}
