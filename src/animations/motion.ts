/**
 * Generic motions that work on any Actor.
 * Each returns a GSAP timeline/tween you place on a scene timeline: tl.add(sway(tree.foliage), 0)
 */
import { gsap } from 'gsap';
import type { Actor, Timeline, Tween } from '@/engine';

export interface MotionLoopOptions {
  angle?: number;
  amount?: number;
  /** Seconds per full back-and-forth cycle. */
  period?: number;
  /** Total length; rounded to whole cycles. */
  duration?: number;
}

export function fadeIn(actor: Actor, { duration = 0.5 } = {}): Tween {
  return gsap.to(actor, { opacity: 1, duration });
}

export function fadeOut(actor: Actor, { duration = 0.5 } = {}): Tween {
  return gsap.to(actor, { opacity: 0, duration });
}

/** Grow from nothing with a springy overshoot. */
export function popIn(actor: Actor, { scale = 1, duration = 0.35 } = {}): Tween {
  return gsap.to(actor, { scale, opacity: 1, duration, ease: 'back.out(2.2)' });
}

export function popOut(actor: Actor, { duration = 0.25 } = {}): Tween {
  return gsap.to(actor, { scale: 0, opacity: 0, duration, ease: 'back.in(2)' });
}

/** Move by a relative amount at constant speed (clouds, cars, backgrounds). */
export function drift(actor: Actor, { dx = 0, dy = 0, duration = 5, ease = 'none' } = {}): Tween {
  return gsap.to(actor, { x: `+=${dx}`, y: `+=${dy}`, duration, ease });
}

/** Rock back and forth around the pivot, ending at rotation 0 (leaves, flags, a nervous character). */
export function sway(actor: Actor, { angle = 3, period = 2.4, duration = period }: MotionLoopOptions = {}): Timeline {
  const cycles = Math.max(1, Math.round(duration / period));
  return gsap.timeline()
    .to(actor, { rotation: angle, duration: period / 4, ease: 'sine.out' })
    .to(actor, { rotation: -angle, duration: period / 2, ease: 'sine.inOut', repeat: cycles * 2 - 1, yoyo: true })
    .to(actor, { rotation: 0, duration: period / 4, ease: 'sine.in' });
}

/** Float up and down, ending where it started. */
export function bob(actor: Actor, { amount = 10, period = 1.2, duration = period }: MotionLoopOptions = {}): Tween {
  const cycles = Math.max(1, Math.round(duration / period));
  return gsap.to(actor, {
    y: `-=${amount}`, duration: period / 2, repeat: cycles * 2 - 1, yoyo: true, ease: 'sine.inOut',
  });
}

export function spin(actor: Actor, { turns = 1, duration = 2, ease = 'none' } = {}): Tween {
  return gsap.to(actor, { rotation: `+=${360 * turns}`, duration, ease });
}

/** Hop up and land, `times` in a row. */
export function jump(actor: Actor, { height = 140, duration = 0.6, times = 1 } = {}): Timeline {
  const tl = gsap.timeline();
  for (let i = 0; i < times; i++) {
    tl.to(actor, { y: `-=${height}`, duration: duration / 2, ease: 'power2.out' })
      .to(actor, { y: `+=${height}`, duration: duration / 2, ease: 'power2.in' });
  }
  return tl;
}
