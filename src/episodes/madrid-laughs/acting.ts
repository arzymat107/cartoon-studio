/** Extra acting for the "Same Night, Different Vibes" Short. Each returns a timeline. */
import { gsap } from 'gsap';
import { clip, soundDuration, talk } from '@/animations';
import { Character } from '@/components';
import type { Actor, Timeline } from '@/engine';

const { ARM_REST, TORSO_Y } = Character;

/**
 * Belly laugh: head back, shoulders bouncing, mouth flapping. With `voice`, plays the
 * character's recorded laugh (`laughs/<name>`) if there is one, else the synth voice.
 */
export function laugh(char: Character, { duration = 1.6, voice = true } = {}): Timeline {
  const bounces = Math.max(2, Math.round(duration / 0.16));
  const recording = `laughs/${char.name.toLowerCase()}`;
  const recorded = voice && soundDuration(recording) !== undefined;
  const tl = gsap.timeline()
    .to(char.head, { rotation: -14, duration: 0.15 }, 0)
    .to(char.torso, { y: TORSO_Y + 6, duration: 0.08, yoyo: true, repeat: bounces * 2 - 1, ease: 'sine.inOut' }, 0)
    .add(talk(char, { duration, speed: 0.08, voice: voice && !recorded }), 0)
    .to(char.head, { rotation: 0, duration: 0.2 }, duration)
    .to(char.torso, { y: TORSO_Y, duration: 0.1 }, duration);
  if (recorded) tl.add(clip(recording, { volume: 0.75, duration: Math.min(duration + 0.6, soundDuration(recording)!) }), 0);
  return tl;
}

/** On the floor laughing: lying on the back, legs kicking in the air. `undo` sits back up. */
export function rollOnFloor(char: Character, { kicks = 6, undo = false } = {}): Timeline {
  const lift = 40 * Math.abs(char.scaleY);
  if (undo) {
    return gsap.timeline()
      .to(char, { rotation: 0, y: `+=${lift}`, duration: 0.3, ease: 'back.out(1.6)' }, 0)
      .to([char.leftLeg, char.rightLeg], { rotation: 0, duration: 0.25 }, 0);
  }
  const tl = gsap.timeline()
    .to(char, { rotation: -80, y: `-=${lift}`, duration: 0.3, ease: 'power2.in' }, 0);
  for (let i = 0; i < kicks; i++) {
    tl.to(i % 2 ? char.leftLeg : char.rightLeg, { rotation: -55, duration: 0.12, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.3 + i * 0.2);
  }
  return tl;
}

/** Right hand to the eye, a tear rolls down the cheek: "so sad…" (fake). */
export function wipeTear(char: Character, drop: Actor, { duration = 1.6 } = {}): Timeline {
  return gsap.timeline()
    .to(char.rightArm, { rotation: -165, duration: 0.3, ease: 'back.out(1.6)' }, 0)
    .to(char.head, { rotation: 8, duration: 0.3 }, 0)
    .fromTo(drop, { y: drop.y, opacity: 1 }, { y: drop.y + 60, opacity: 0, duration: 0.9, ease: 'power1.in', immediateRender: false }, 0.3)
    .to(char.rightArm, { rotation: -150, duration: 0.15, yoyo: true, repeat: 3 }, 0.4)
    .to(char.rightArm, { rotation: -ARM_REST, duration: 0.3 }, duration)
    .to(char.head, { rotation: 0, duration: 0.3 }, duration);
}

/** Arms stretched out wide and a little up – the "here I am" pose. `undo` drops them. */
export function armsWide(char: Character, { duration = 0.25, undo = false } = {}): Timeline {
  return gsap.timeline()
    .to(char.leftArm, { rotation: undo ? ARM_REST : 105, duration, ease: 'back.out(2)' }, 0)
    .to(char.rightArm, { rotation: undo ? -ARM_REST : -105, duration, ease: 'back.out(2)' }, 0);
}

/** Corner-flag samba: hips swing, arms pump, quick little hops. */
export function samba(char: Character, { beats = 8, beat = 0.22 } = {}): Timeline {
  const tl = gsap.timeline();
  for (let i = 0; i < beats; i++) {
    const side = i % 2 ? 1 : -1;
    const t = i * beat;
    tl.to(char.torso, { rotation: side * 12, duration: beat, ease: 'sine.inOut' }, t)
      .to(char.leftArm, { rotation: ARM_REST + 60 + side * 40, duration: beat, ease: 'sine.inOut' }, t)
      .to(char.rightArm, { rotation: -ARM_REST - 60 + side * 40, duration: beat, ease: 'sine.inOut' }, t)
      .to(side > 0 ? char.leftLeg : char.rightLeg, { rotation: side * 30, duration: beat / 2, yoyo: true, repeat: 1 }, t)
      .to(char, { y: '-=18', duration: beat / 2, yoyo: true, repeat: 1, ease: 'sine.out' }, t);
  }
  return tl
    .to(char.torso, { rotation: 0, duration: 0.2 }, beats * beat)
    .to(char.leftArm, { rotation: ARM_REST, duration: 0.2 }, beats * beat)
    .to(char.rightArm, { rotation: -ARM_REST, duration: 0.2 }, beats * beat);
}

/** Big stretchy yawn: arms up, head back, mouth wide. */
export function yawn(char: Character, { duration = 1.2 } = {}): Timeline {
  return gsap.timeline()
    .to(char.leftArm, { rotation: 165, duration: 0.4 }, 0)
    .to(char.rightArm, { rotation: -165, duration: 0.4 }, 0)
    .to(char.head, { rotation: -10, duration: 0.4 }, 0)
    .to(char.mouth, { scaleY: () => char.mouthOpen * 1.4, duration: 0.4 }, 0)
    .to(char.leftArm, { rotation: ARM_REST, duration: 0.4 }, duration)
    .to(char.rightArm, { rotation: -ARM_REST, duration: 0.4 }, duration)
    .to(char.head, { rotation: 0, duration: 0.4 }, duration)
    .to(char.mouth, { scaleY: () => char.mouthRest, duration: 0.3 }, duration);
}
