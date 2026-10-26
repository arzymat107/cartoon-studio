/**
 * Acting for portrait figures (PortraitFigure, e.g. MbappeFigure): elbows, knees, a bending spine,
 * eyelids, expressions and an opening mouth. Use through the namespace:
 *   import { figureActions as act } from '@/animations';
 *   tl.add(act.run(mbappe, { to: 800 }))
 *     .add(act.crossArms(mbappe), '+=0.2');
 *
 * Rotation signs: positive swings a limb towards the screen left (−x in the figure's own space),
 * so with the figure facing right (scaleX > 0) "forward" is negative and a bent knee is positive.
 * Actions that change the face go back to 'neutral' when they end.
 */
import { gsap } from 'gsap';
import { synth } from '@/audio';
import { FIGURE_REST, type Ball, type FigureExpression, type PortraitFigure, type FigurePart, type SpeechBubble } from '@/components';
import type { Timeline } from '@/engine';
import { flight } from './football';
import { jump, popIn, popOut } from './motion';
import { clip, sfx, soundDuration } from './sound';

const VOICE_PITCH = 0.95;

/** Rotations (degrees) per rig part. */
export type Pose = Partial<Record<FigurePart, number>>;

/** Tween any rig parts to the given rotations; parts left out stay where they are. */
export function pose(m: PortraitFigure, target: Pose, { duration = 0.25, ease = 'power2.out' } = {}): Timeline {
  const tl = gsap.timeline();
  for (const [part, rotation] of Object.entries(target)) tl.to(m[part as FigurePart], { rotation, duration, ease }, 0);
  return tl;
}

/** Back to the relaxed standing pose (the face is left as it is). */
export function rest(m: PortraitFigure, { duration = 0.35 } = {}): Timeline {
  return pose(m, FIGURE_REST, { duration, ease: 'power2.inOut' })
    .to(m.torso, { y: m.hipY, duration }, 0)
    .to(m.head, { x: 0, y: m.headY, scaleY: 1, duration }, 0)
    .to(m.brows, { y: 0, duration }, 0)
    .to(m.mouth, { scaleY: 0, duration: 0.15 }, 0);
}

/** Turn to face right (1) or left (−1). */
export function face(m: PortraitFigure, direction: 1 | -1): Timeline {
  return gsap.timeline().set(m, { scaleX: () => direction * Math.abs(m.scaleX), immediateRender: false });
}

// ── Face ──────────────────────────────────────────────────────────────

/**
 * Change expression: 'neutral', 'happy', 'laugh', 'smug', 'angry', 'sad', 'shocked' or 'determined'.
 * Instant, like a cartoon cut; seeking back restores the previous face.
 */
export function emote(m: PortraitFigure, name: FigureExpression): Timeline {
  const tl = gsap.timeline();
  for (const [key, layers] of Object.entries(m.expressions)) {
    tl.set(layers, { opacity: key === name ? 1 : 0, immediateRender: false }, 0);
  }
  return tl;
}

export function blink(m: PortraitFigure, { times = 1 } = {}): Timeline {
  const lids = [m.leftLid, m.rightLid];
  const tl = gsap.timeline();
  for (let i = 0; i < times; i++) {
    tl.set(lids, { opacity: 1, immediateRender: false }, i === 0 ? 0 : '+=0.12')
      .to(lids, { scaleY: 1, duration: 0.06, ease: 'power1.in' })
      .to(lids, { scaleY: 0, duration: 0.08, ease: 'power1.out' })
      .set(lids, { opacity: 0, immediateRender: false });
  }
  return tl;
}

/** Natural random blinking spread over `duration` seconds. */
export function blinkRandomly(m: PortraitFigure, duration: number, { min = 1.8, max = 4.5 } = {}): Timeline {
  const tl = gsap.timeline();
  let t = gsap.utils.random(0.4, min);
  while (t < duration - 0.3) {
    tl.add(blink(m, { times: Math.random() < 0.2 ? 2 : 1 }), t);
    t += gsap.utils.random(min, max);
  }
  return tl.set({}, {}, duration);
}

/** Flap the mouth for `duration` seconds, with a synthesized gibberish voice unless `voice` is false. */
export function talk(m: PortraitFigure, { duration = 1, speed = 0.11, voice = true } = {}): Timeline {
  const flaps = Math.max(1, Math.round(duration / (speed * 2)));
  const end = flaps * speed * 2;
  const tl = gsap.timeline()
    .fromTo(m.mouth, { scaleY: 0.15 }, {
      scaleY: 0.75, duration: speed, repeat: flaps * 2 - 1, yoyo: true, ease: 'sine.inOut', immediateRender: false,
    })
    // The head bobs a little with the words.
    .to(m.head, { rotation: FIGURE_REST.head - 3, duration: speed * 3, repeat: Math.max(1, Math.round(flaps / 3)) * 2 - 1, yoyo: true, ease: 'sine.inOut' }, 0)
    .to(m.mouth, { scaleY: 0, duration: 0.1 }, end)
    .to(m.head, { rotation: FIGURE_REST.head, duration: 0.2 }, end);
  if (voice) {
    for (let i = 0; i < flaps; i++) {
      if (i > 0 && Math.random() < 0.15) continue;
      tl.add(sfx(() => synth.blip(VOICE_PITCH)), i * speed * 2);
    }
  }
  return tl;
}

export interface SayOptions {
  /** Recorded voice line from src/assets/sounds/ (e.g. 'voices/mbappe-merci'). */
  voice?: string;
  /** How long he talks (ignored when `voice` is found). */
  duration?: number;
  /** Extra reading time after talking stops. */
  hold?: number;
  /** Bubble height above the feet, before scale. Default: just above the hair. */
  offsetY?: number;
  offsetX?: number;
}

/** Pop a speech bubble above his head and talk. */
export function say(m: PortraitFigure, bubble: SpeechBubble, { voice, duration = 2, hold = 0.6, offsetY, offsetX = 0 }: SayOptions = {}): Timeline {
  const recording = voice !== undefined ? soundDuration(voice) : undefined;
  const talkTime = recording ?? duration;
  const above = offsetY ?? m.height + 15;
  const tl = gsap.timeline()
    .set(bubble, { x: () => m.x + offsetX, y: () => m.y - above * Math.abs(m.scaleY), immediateRender: false }, 0)
    .add(sfx(synth.pop), 0)
    .add(popIn(bubble), 0)
    .add(talk(m, { duration: talkTime, voice: recording === undefined }), 0.1)
    .add(popOut(bubble), talkTime + hold);
  if (recording !== undefined) tl.add(clip(voice!), 0.1);
  else if (voice !== undefined) console.warn(`Voice "${voice}" not found – using the synthesized voice.`);
  return tl;
}

/** Show expressions in turn, `each` seconds apiece, with a little head squash on every change. */
export function expressions(m: PortraitFigure, names: FigureExpression[], { each = 1 } = {}): Timeline {
  const tl = gsap.timeline();
  names.forEach((name, i) => {
    tl.add(emote(m, name), i * each)
      .to(m.head, { scaleY: 1.04, scaleX: 0.97, duration: 0.08, yoyo: true, repeat: 1 }, i * each);
  });
  return tl.add(emote(m, 'neutral'), names.length * each);
}

/** Jolt back: shocked face, brows up, arms jump out, a little hop. */
export function surprised(m: PortraitFigure, { duration = 1.2 } = {}): Timeline {
  return gsap.timeline()
    .add(emote(m, 'shocked'), 0)
    .to(m.brows, { y: -8, duration: 0.12 }, 0)
    .add(pose(m, { leftArm: 55, leftForearm: 70, rightArm: -55, rightForearm: -70, chest: -6, head: -6 }, { duration: 0.15, ease: 'back.out(3)' }), 0)
    .add(jump(m, { height: 30, duration: 0.3, sound: false }), 0)
    .add(rest(m), duration)
    .add(emote(m, 'neutral'), duration);
}

/** Sad: slumped shoulders, hanging head, a sigh. */
export function sulk(m: PortraitFigure, { duration = 1.8 } = {}): Timeline {
  return gsap.timeline()
    .add(emote(m, 'sad'), 0)
    .to(m.torso, { y: m.hipY + 8, duration: 0.5, ease: 'sine.inOut' }, 0)
    .to(m.head, { y: m.headY + 8, duration: 0.5, ease: 'sine.inOut' }, 0)
    .add(pose(m, { chest: 6, head: 9, leftArm: 4, rightArm: -4, leftForearm: -2, rightForearm: 2, rightLeg: -4, rightShin: 14 }, { duration: 0.5, ease: 'sine.inOut' }), 0)
    .to(m.chest, { rotation: 4, duration: 0.6, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.6)
    .add(rest(m, { duration: 0.5 }), duration)
    .add(emote(m, 'neutral'), duration + 0.3);
}

/** Angry: fists down, leaning in, stamping a foot. */
export function rage(m: PortraitFigure, { stamps = 3 } = {}): Timeline {
  const tl = gsap.timeline()
    .add(emote(m, 'angry'), 0)
    .add(pose(m, { leftArm: 22, leftForearm: 30, rightArm: -22, rightForearm: -30, chest: 6, head: -2 }, { duration: 0.2, ease: 'back.out(2)' }), 0)
    .to(m.head, { y: m.headY + 4, duration: 0.2 }, 0);
  for (let i = 0; i < stamps; i++) {
    const t = 0.25 + i * 0.32;
    tl.to(m.rightLeg, { rotation: -22, duration: 0.13, yoyo: true, repeat: 1, ease: 'power2.out' }, t)
      .to(m.rightShin, { rotation: 40, duration: 0.13, yoyo: true, repeat: 1, ease: 'power2.out' }, t)
      .to(m.chest, { rotation: 9, duration: 0.13, yoyo: true, repeat: 1 }, t)
      .add(sfx(() => synth.kick(0.5)), t + 0.26);
  }
  const end = 0.3 + stamps * 0.32;
  return tl.add(rest(m), end).add(emote(m, 'neutral'), end + 0.2);
}

/** Nod "yes" a few times. */
export function nod(m: PortraitFigure, { times = 2 } = {}): Timeline {
  return gsap.timeline()
    .add(emote(m, 'happy'), 0)
    .to(m.head, { y: m.headY + 6, scaleY: 0.95, duration: 0.14, yoyo: true, repeat: times * 2 - 1, ease: 'sine.inOut' }, 0)
    .add(emote(m, 'neutral'), times * 0.28 + 0.2);
}

/** Shake the head "no". */
export function shakeHead(m: PortraitFigure, { times = 3 } = {}): Timeline {
  const r = FIGURE_REST.head;
  return gsap.timeline()
    .add(emote(m, 'determined'), 0)
    .to(m.head, { x: -5, rotation: r - 6, duration: 0.09, ease: 'sine.out' })
    .to(m.head, { x: 5, rotation: r + 6, duration: 0.16, yoyo: true, repeat: times * 2 - 2, ease: 'sine.inOut' })
    .to(m.head, { x: 0, rotation: r, duration: 0.09 })
    .add(emote(m, 'neutral'), '+=0.2');
}

/** Head thrown back, belly held, mouth wide, the body shaking. */
export function laugh(m: PortraitFigure, { duration = 1.8, voice = true } = {}): Timeline {
  const shakes = Math.round(duration / 0.16);
  const tl = gsap.timeline()
    .add(emote(m, 'laugh'), 0)
    .add(pose(m, { chest: -8, head: -10, leftArm: -14, leftForearm: -95, rightArm: -32, rightForearm: -38 }, { duration: 0.2 }), 0)
    .to(m.chest, { rotation: -4, duration: 0.08, yoyo: true, repeat: shakes - 1, ease: 'sine.inOut' }, 0.2)
    .to(m.torso, { y: m.hipY - 4, duration: 0.08, yoyo: true, repeat: shakes - 1, ease: 'sine.inOut' }, 0.2)
    .to(m.head, { rotation: -6, duration: 0.16, yoyo: true, repeat: Math.round(shakes / 2) * 2 - 1, ease: 'sine.inOut' }, 0.2);
  if (voice) for (let i = 0; i < shakes / 2; i++) tl.add(sfx(() => synth.blip(1.35)), 0.15 + i * 0.32);
  return tl.add(rest(m), duration).add(emote(m, 'neutral'), duration + 0.2);
}

// ── Moving around ─────────────────────────────────────────────────────

export interface MoveOptions {
  /** Target x position. */
  to: number;
  duration?: number;
  /** Seconds per step. */
  stepDuration?: number;
  ease?: string;
  footsteps?: boolean;
}

interface Gait {
  leg: number;
  knee: number;
  arm: number;
  elbow: number;
  lean: number;
  bounce: number;
  /** Chest twist against the hips. */
  twist: number;
}

function stride(m: PortraitFigure, { to, duration, stepDuration, ease, footsteps }: Required<MoveOptions>, g: Gait): Timeline {
  const steps = Math.max(2, Math.round(duration / stepDuration));
  const step = duration / steps;
  const swing = { duration: step, repeat: steps - 1, yoyo: true, ease: 'sine.inOut', immediateRender: false };
  // Arms and head follow a beat late, so they look loose.
  const late = { ...swing, delay: step * 0.15 };
  const tl = gsap.timeline();
  if (footsteps) for (let i = 1; i <= steps; i++) tl.add(sfx(synth.step), i * step);
  return tl
    .set(m, { scaleX: () => (to >= m.x ? 1 : -1) * Math.abs(m.scaleX), immediateRender: false }, 0)
    .to(m, { x: to, duration, ease }, 0)
    .to(m.torso, { rotation: g.lean, duration: 0.15 }, 0)
    .fromTo(m.leftLeg, { rotation: -g.leg }, { rotation: g.leg, ...swing }, 0)
    .fromTo(m.rightLeg, { rotation: g.leg }, { rotation: -g.leg, ...swing }, 0)
    // The knee bends as the leg swings back (+) and straightens as it reaches forward.
    .fromTo(m.leftShin, { rotation: 4 }, { rotation: g.knee, ...swing }, 0)
    .fromTo(m.rightShin, { rotation: g.knee }, { rotation: 4, ...swing }, 0)
    .fromTo(m.leftArm, { rotation: FIGURE_REST.leftArm + g.arm }, { rotation: FIGURE_REST.leftArm - g.arm, ...late }, 0)
    .fromTo(m.rightArm, { rotation: FIGURE_REST.rightArm - g.arm }, { rotation: FIGURE_REST.rightArm + g.arm, ...late }, 0)
    .fromTo(m.leftForearm, { rotation: -g.elbow * 0.6 }, { rotation: -g.elbow, ...late }, 0)
    .fromTo(m.rightForearm, { rotation: -g.elbow }, { rotation: -g.elbow * 0.6, ...late }, 0)
    .fromTo(m.chest, { rotation: -g.twist }, { rotation: g.twist, ...swing }, 0)
    .fromTo(m.head, { rotation: g.twist * 0.6 }, { rotation: -g.twist * 0.6, ...late }, 0)
    .fromTo(m.torso, { y: m.hipY }, {
      y: m.hipY - g.bounce, duration: step / 2, repeat: steps * 2 - 1, yoyo: true, ease: 'sine.inOut', immediateRender: false,
    }, 0)
    .add(rest(m, { duration: 0.25 }));
}

/** Walk to x = `to`, turning to face the direction of travel. */
export function walk(m: PortraitFigure, { to, duration = 2, stepDuration = 0.34, ease = 'none', footsteps = true }: MoveOptions): Timeline {
  return stride(m, { to, duration, stepDuration, ease, footsteps }, { leg: 22, knee: 28, arm: 16, elbow: 14, lean: 2, bounce: 5, twist: 3 });
}

/** Sprint to x = `to`: long strides, high knees, pumping arms, leaning forward, game face on. */
export function run(m: PortraitFigure, { to, duration = 1.2, stepDuration = 0.17, ease = 'none', footsteps = true }: MoveOptions): Timeline {
  return gsap.timeline()
    .add(emote(m, 'determined'), 0)
    .add(stride(m, { to, duration, stepDuration, ease, footsteps }, { leg: 42, knee: 80, arm: 38, elbow: 88, lean: 8, bounce: 12, twist: 6 }), 0)
    .add(emote(m, 'neutral'), duration + 0.1);
}

/** Breathe, sway and look around for `duration` seconds. */
export function idle(m: PortraitFigure, duration: number): Timeline {
  const breaths = Math.max(1, Math.round(duration / 1.6));
  const each = duration / breaths;
  const breathe = { duration: each / 2, repeat: breaths * 2 - 1, yoyo: true, ease: 'sine.inOut' };
  return gsap.timeline()
    .to(m.torso, { y: m.hipY - 3, ...breathe }, 0)
    .to(m.chest, { rotation: FIGURE_REST.chest - 2, ...breathe }, 0)
    .to(m.leftArm, { rotation: FIGURE_REST.leftArm + 4, ...breathe }, 0.15)
    .to(m.rightArm, { rotation: FIGURE_REST.rightArm - 4, ...breathe }, 0.15)
    .to(m.leftForearm, { rotation: FIGURE_REST.leftForearm - 6, ...breathe }, 0.3)
    .to(m.rightForearm, { rotation: FIGURE_REST.rightForearm + 6, ...breathe }, 0.3)
    .to(m.head, { rotation: FIGURE_REST.head - 5, duration: each, repeat: breaths - 1, yoyo: true, ease: 'sine.inOut' }, 0);
}

/** Crouch, spring up with the arms thrown up, land with soft knees. */
export function hop(m: PortraitFigure, { height = 140, times = 1 } = {}): Timeline {
  const tl = gsap.timeline().add(emote(m, 'happy'), 0);
  for (let i = 0; i < times; i++) {
    tl.add(pose(m, { leftLeg: 14, leftShin: -30, rightLeg: -14, rightShin: 30, leftArm: 30, rightArm: -30, chest: 8 }, { duration: 0.14 }))
      .to(m.torso, { y: m.hipY + 22, duration: 0.14 }, '<')
      .add(pose(m, { leftLeg: 4, leftShin: 6, rightLeg: -4, rightShin: -6, leftArm: 165, rightArm: -165, leftForearm: 10, rightForearm: -10, chest: -6 }, { duration: 0.12 }))
      .to(m.torso, { y: m.hipY, duration: 0.12 }, '<')
      .add(jump(m, { height, duration: 0.55 }), '<')
      .add(pose(m, { leftLeg: 10, leftShin: -20, rightLeg: -10, rightShin: 20 }, { duration: 0.1 }), '>-0.05')
      .to(m.torso, { y: m.hipY + 14, duration: 0.1, yoyo: true, repeat: 1 }, '<');
  }
  return tl.add(rest(m, { duration: 0.25 })).add(emote(m, 'neutral'));
}

/**
 * Over-the-top fall: flails, crashes onto the ground and kicks the legs.
 * `direction` 1 = falls to the right, −1 = to the left. Follow with `getUp()`.
 */
export function flop(m: PortraitFigure, { direction = 1 as 1 | -1, kicks = 3 } = {}): Timeline {
  const lift = 36 * Math.abs(m.scaleY);
  return gsap.timeline()
    .add(emote(m, 'shocked'), 0)
    .add(pose(m, { leftArm: 150, rightArm: -150, leftForearm: 30, rightForearm: -30, chest: -direction * 10 }, { duration: 0.15 }), 0)
    .to(m, { rotation: direction * 90, y: `-=${lift}`, duration: 0.45, ease: 'power2.in' }, 0.1)
    .add(sfx(() => synth.kick(0.7)), 0.55)
    .add(emote(m, 'sad'), 0.6)
    .to(m, { rotation: direction * 82, duration: 0.1, repeat: 1, yoyo: true }, 0.55)
    .to([m.leftLeg, m.rightShin], { rotation: -35, duration: 0.11, repeat: kicks * 2 - 1, yoyo: true }, 0.8)
    .to([m.rightLeg, m.leftShin], { rotation: 35, duration: 0.11, repeat: kicks * 2 - 1, yoyo: true }, 0.86);
}

/** Back on his feet after `flop()`. */
export function getUp(m: PortraitFigure, { duration = 0.5 } = {}): Timeline {
  const lift = 36 * Math.abs(m.scaleY);
  return gsap.timeline()
    .to(m, { rotation: 0, y: `+=${lift}`, duration, ease: 'back.out(1.5)' }, 0)
    .add(rest(m, { duration }), 0)
    .add(emote(m, 'neutral'), duration);
}

// ── Arms and gestures ─────────────────────────────────────────────────

/** Raise an arm and wave from the elbow, with a smile. */
export function wave(m: PortraitFigure, { times = 3, arm = 'right' as 'left' | 'right' } = {}): Timeline {
  const s = arm === 'right' ? -1 : 1;
  const upper = arm === 'right' ? m.rightArm : m.leftArm;
  const fore = arm === 'right' ? m.rightForearm : m.leftForearm;
  const end = 0.3 + times * 0.36;
  return gsap.timeline()
    .add(emote(m, 'happy'), 0)
    .to(upper, { rotation: s * 125, duration: 0.3, ease: 'back.out(2)' }, 0)
    .to(m.chest, { rotation: -s * 4, duration: 0.3 }, 0)
    .to(m.head, { rotation: s * 5, duration: 0.3 }, 0)
    .to(fore, { rotation: s * 40, duration: 0.3 }, 0)
    .to(fore, { rotation: -s * 5, duration: 0.18, repeat: times * 2 - 1, yoyo: true, ease: 'sine.inOut' }, 0.3)
    .add(rest(m), end)
    .add(emote(m, 'neutral'), end + 0.2);
}

/** Both arms up, mouth wide. */
export function cheer(m: PortraitFigure, { duration = 1 } = {}): Timeline {
  return gsap.timeline()
    .add(emote(m, 'laugh'), 0)
    .add(pose(m, { leftArm: 155, rightArm: -155, leftForearm: 18, rightForearm: -18, head: -6, chest: -5 }, { duration: 0.25, ease: 'back.out(2)' }), 0)
    .add(rest(m), duration)
    .add(emote(m, 'neutral'), duration + 0.2);
}

/** Arms up and jumping – goal celebration. */
export function celebrate(m: PortraitFigure, { jumps = 2, height = 120 } = {}): Timeline {
  return gsap.timeline()
    .add(cheer(m, { duration: jumps * 0.6 + 0.3 }), 0)
    .add(jump(m, { times: jumps, height, duration: 0.55 }), 0.05);
}

/** His trademark celebration: arms folded high on the chest, chin up, leaning back, smug. */
export function crossArms(m: PortraitFigure, { duration = 0.35, hold = 1.6, release = true } = {}): Timeline {
  const tl = gsap.timeline()
    .add(sfx(synth.whoosh), 0)
    .add(emote(m, 'smug'), 0.1)
    .add(pose(m, {
      leftArm: -14, leftForearm: -108, rightArm: 14, rightForearm: 108, chest: -7, head: -6, rightLeg: -10, rightShin: 6,
    }, { duration, ease: 'back.out(1.6)' }), 0)
    .to(m.head, { y: m.headY - 4, duration }, 0);
  return release ? tl.add(rest(m), duration + hold).add(emote(m, 'neutral'), duration + hold + 0.2) : tl;
}

export function handsOnHips(m: PortraitFigure, { hold = 1.4, release = true } = {}): Timeline {
  const tl = gsap.timeline()
    .add(emote(m, 'smug'), 0)
    .add(pose(m, { leftArm: 38, leftForearm: -95, rightArm: -38, rightForearm: 95, leftLeg: 7, rightLeg: -7, rightShin: 0, chest: -4 }, { duration: 0.3 }), 0);
  return release ? tl.add(rest(m), 0.3 + hold).add(emote(m, 'neutral'), 0.5 + hold) : tl;
}

/** Both hands on the head – "I can't believe it!" */
export function handsOnHead(m: PortraitFigure, { hold = 1.4 } = {}): Timeline {
  return gsap.timeline()
    .add(emote(m, 'shocked'), 0)
    .add(pose(m, { leftArm: 150, leftForearm: 52, rightArm: -150, rightForearm: -52, chest: 5 }, { duration: 0.25, ease: 'back.out(2)' }), 0)
    .add(emote(m, 'sad'), 0.25 + hold * 0.6)
    .add(rest(m, { duration: 0.35 }), 0.25 + hold)
    .add(emote(m, 'neutral'), 0.5 + hold);
}

/** "What?" – palms out, shoulders up, head tilted. */
export function shrug(m: PortraitFigure, { hold = 1 } = {}): Timeline {
  return gsap.timeline()
    .add(emote(m, 'smug'), 0)
    .add(pose(m, { leftArm: 32, leftForearm: 62, rightArm: -32, rightForearm: -62, head: 10, chest: -3 }, { duration: 0.25, ease: 'back.out(2)' }), 0)
    .to(m.torso, { y: m.hipY - 8, duration: 0.25 }, 0)
    .to(m.head, { y: m.headY - 6, duration: 0.25 }, 0)
    .to(m.brows, { y: -10, duration: 0.2 }, 0)
    .add(rest(m), 0.25 + hold)
    .add(emote(m, 'neutral'), 0.45 + hold);
}

/** Point straight out with one arm (`up` points at the sky). */
export function point(m: PortraitFigure, { arm = 'right' as 'left' | 'right', up = false, hold = 1.2 } = {}): Timeline {
  const s = arm === 'right' ? -1 : 1;
  const target: Pose = arm === 'right'
    ? { rightArm: up ? -160 : -92, rightForearm: up ? -10 : -4 }
    : { leftArm: up ? 160 : 92, leftForearm: up ? 10 : 4 };
  return gsap.timeline()
    .add(emote(m, up ? 'happy' : 'determined'), 0)
    .add(pose(m, { ...target, head: s * -6, chest: -s * 5 }, { duration: 0.2, ease: 'back.out(2.5)' }), 0)
    .add(rest(m), 0.2 + hold)
    .add(emote(m, 'neutral'), 0.4 + hold);
}

/** Hand on the chin, the other arm across the belly – then an idea. */
export function think(m: PortraitFigure, { hold = 1.6 } = {}): Timeline {
  return gsap.timeline()
    .add(emote(m, 'determined'), 0)
    .add(pose(m, { rightArm: 25, rightForearm: 142, leftArm: -18, leftForearm: -84, head: 8, chest: 3 }, { duration: 0.35 }), 0)
    .to(m.head, { x: -2, duration: 0.5, yoyo: true, repeat: 2, ease: 'sine.inOut' }, 0.4)
    .add(emote(m, 'happy'), 0.35 + hold * 0.75)
    .add(rest(m), 0.35 + hold)
    .add(emote(m, 'neutral'), 0.55 + hold);
}

/** Clap in front of the chest. */
export function clap(m: PortraitFigure, { times = 5, speed = 0.16 } = {}): Timeline {
  const tl = gsap.timeline()
    .add(emote(m, 'happy'), 0)
    .add(pose(m, { leftArm: -10, rightArm: 10, leftForearm: -120, rightForearm: 120 }, { duration: 0.2 }), 0);
  for (let i = 0; i < times; i++) {
    const t = 0.2 + i * speed * 2;
    tl.to(m.leftForearm, { rotation: -138, duration: speed, yoyo: true, repeat: 1, ease: 'power2.in' }, t)
      .to(m.rightForearm, { rotation: 138, duration: speed, yoyo: true, repeat: 1, ease: 'power2.in' }, t)
      .to(m.chest, { rotation: FIGURE_REST.chest + 2, duration: speed, yoyo: true, repeat: 1 }, t)
      .add(sfx(() => synth.kick(0.15)), t + speed);
  }
  const end = 0.2 + times * speed * 2;
  return tl.add(rest(m), end).add(emote(m, 'neutral'), end + 0.2);
}

/** Hips and arms to the beat. */
export function dance(m: PortraitFigure, { beats = 8, beat = 0.25 } = {}): Timeline {
  const tl = gsap.timeline().add(emote(m, 'happy'), 0);
  for (let i = 0; i < beats; i++) {
    const s = i % 2 ? 1 : -1;
    tl.add(pose(m, {
      torso: s * 7, chest: -s * 6, head: -s * 7,
      leftArm: s > 0 ? 150 : 40, leftForearm: s > 0 ? 25 : -70,
      rightArm: s > 0 ? -40 : -150, rightForearm: s > 0 ? 70 : -25,
      leftLeg: s > 0 ? 14 : 0, leftShin: s > 0 ? -12 : 4, rightLeg: s > 0 ? 0 : -14, rightShin: s > 0 ? 4 : 12,
    }, { duration: beat * 0.7, ease: 'power2.out' }), i * beat)
      .to(m.torso, { y: m.hipY + 8, duration: beat / 2, yoyo: true, repeat: 1, ease: 'sine.inOut' }, i * beat);
  }
  return tl.add(rest(m), beats * beat).add(emote(m, 'neutral'), beats * beat + 0.2);
}

// ── With the ball ─────────────────────────────────────────────────────

/** When the foot meets the ball, counted from the start of `kick()`. */
export const KICK_CONTACT = 0.4;

/**
 * Wind up and strike with the right leg; with a `ball` it flies along `path` (see `flight()`).
 * He kicks towards the side he faces.
 */
export function kick(m: PortraitFigure, ball?: Ball, { power = 1, ...path }: Parameters<typeof flight>[1] & { power?: number } = {}): Timeline {
  const tl = gsap.timeline()
    .add(emote(m, 'determined'), 0)
    .add(pose(m, { rightLeg: 40, rightShin: 75, torso: -4, chest: 6, leftArm: 60, leftForearm: 30, rightArm: -45, rightForearm: -20 }, { duration: 0.28 }), 0)
    .add(pose(m, { rightLeg: -78, rightShin: -4, torso: -10, chest: -8 }, { duration: 0.12, ease: 'power3.in' }), KICK_CONTACT - 0.1)
    .add(sfx(() => synth.kick(power)), KICK_CONTACT)
    .add(rest(m, { duration: 0.4 }), KICK_CONTACT + 0.25)
    .add(emote(m, 'happy'), KICK_CONTACT + 0.4)
    .add(emote(m, 'neutral'), KICK_CONTACT + 1.1);
  if (ball) tl.add(flight(ball, path), KICK_CONTACT);
  return tl;
}

/**
 * Keepy-uppies on the right knee. Put the ball over his raised knee: ball.x ≈ m.x + 110 × his scale
 * (facing right, athletic build). `touch` = height of the knee top above the ground, in the ball's space.
 * With `drop: true` the last touch lets the ball fall to the ground.
 */
export function juggle(
  m: PortraitFigure, ball: Ball, { touches = 5, step = 0.55, height = 170, touch = 150 * Math.abs(m.scaleY), drop = true } = {},
): Timeline {
  const tl = gsap.timeline()
    .add(emote(m, 'determined'), 0)
    .add(flight(ball, { dx: 0, peak: height + touch, land: touch, duration: step }), 0)
    .add(pose(m, { leftArm: 40, rightArm: -30, leftForearm: 20, rightForearm: -20 }, { duration: 0.2 }), 0);
  for (let i = 0; i < touches; i++) {
    const t = step + i * step;
    const last = i === touches - 1;
    tl.to(m.rightLeg, { rotation: -55, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' }, t - 0.12)
      .to(m.rightShin, { rotation: 55, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' }, t - 0.12)
      .to(m.chest, { rotation: 4, duration: 0.12, yoyo: true, repeat: 1 }, t - 0.12)
      .add(sfx(() => synth.kick(0.3)), t)
      .add(flight(ball, { dx: 0, from: touch, peak: touch + height, land: last && drop ? 0 : touch, duration: step - 0.02, spin: 0.6 }), t);
  }
  const end = step * (touches + 1);
  return tl.add(rest(m), end).add(emote(m, 'happy'), end).add(emote(m, 'neutral'), end + step);
}

// ── "Kylian the dictator" (best in a costume) ─────────────────────────

/** Snap a military salute to the temple, chin up. */
export function salute(m: PortraitFigure, { hold = 1.2 } = {}): Timeline {
  return gsap.timeline()
    .add(emote(m, 'determined'), 0)
    .add(sfx(synth.whoosh), 0)
    .add(pose(m, { rightArm: -125, rightForearm: -86, chest: -4, head: -4, leftArm: 4, leftForearm: 0, rightLeg: 0, rightShin: 0, leftLeg: 0 }, { duration: 0.22, ease: 'back.out(2.5)' }), 0)
    .to(m.head, { y: m.headY - 4, duration: 0.22 }, 0)
    .add(rest(m), 0.22 + hold)
    .add(emote(m, 'neutral'), 0.42 + hold);
}

/** Napoleon's pose: hand tucked into the coat, chest out, chin up, smug. */
export function handInCoat(m: PortraitFigure, { hold = 1.6, release = true } = {}): Timeline {
  const tl = gsap.timeline()
    .add(emote(m, 'smug'), 0)
    .add(pose(m, { rightArm: 18, rightForearm: 120, leftArm: 4, leftForearm: -30, chest: -6, head: -7, rightLeg: -12, rightShin: 4 }, { duration: 0.4, ease: 'power2.inOut' }), 0)
    .to(m.head, { y: m.headY - 4, duration: 0.4 }, 0);
  return release ? tl.add(rest(m), 0.4 + hold).add(emote(m, 'neutral'), 0.6 + hold) : tl;
}

/** Bark orders: angry face, finger jabbing forward, shouting. */
export function command(m: PortraitFigure, { duration = 1.6 } = {}): Timeline {
  const jabs = Math.round(duration / 0.3);
  return gsap.timeline()
    .add(emote(m, 'angry'), 0)
    .add(pose(m, { rightArm: -95, rightForearm: -4, leftArm: 30, leftForearm: -95, chest: 6, head: 3 }, { duration: 0.18, ease: 'back.out(2)' }), 0)
    .to(m.rightForearm, { rotation: 10, duration: 0.15, yoyo: true, repeat: jabs * 2 - 1, ease: 'power2.inOut' }, 0.2)
    .to(m.chest, { rotation: 9, duration: 0.15, yoyo: true, repeat: jabs * 2 - 1, ease: 'sine.inOut' }, 0.2)
    .add(talk(m, { duration, speed: 0.08 }), 0.15)
    .add(rest(m), duration + 0.3)
    .add(emote(m, 'neutral'), duration + 0.5);
}
