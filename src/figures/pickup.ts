/**
 * Picking things up and putting them down, with the fingers doing the work:
 *
 *   pick up: squat with the hips back and lean over the item, the open hand comes down over the
 *            handle, the fingers curl round it, a beat to take the weight, then straighten up;
 *            the item hangs straight down from the fist.
 *   put down: squat until the item touches the ground, the fingers open, straighten up.
 *
 *   const bag = makeBag()                                  // origin = its handle
 *   tl.add(walk(kane, { to: reachSpot(kane, bag) }))       // stand where the hand meets the handle
 *     .add(pickUp(kane, bag))
 *     .add(walk(kane, { to: 700 }))
 *     .add(putDown(kane, bag))
 *
 * The item moves between the ground and the hand with a seek-safe switch, so the timeline can be
 * scrubbed both ways. On the ground it is drawn just behind him, at his scale.
 */
import { gsap } from 'gsap';
import type { Actor, Timeline } from '@/engine';
import { SHIN, THIGH, type Hand, type KaneFigure } from './kane';

type Side = 'left' | 'right';
type Pose = Record<string, number>;

const hand = (fig: KaneFigure, side: Side): Hand => (side === 'right' ? fig.rightHand : fig.leftHand);
const rad = (d: number) => (d * Math.PI) / 180;
const legDrop = (a1: number, a2: number) => THIGH + SHIN - (THIGH * Math.cos(rad(a1)) + SHIN * Math.cos(rad(a1 + a2)));
/** Foot x relative to the hip (forward = positive, facing right). */
const legReach = (a1: number, a2: number) => -(THIGH * Math.sin(rad(a1)) + SHIN * Math.sin(rad(a1 + a2)));

const PARTS = ['torso', 'head', 'leftLeg', 'leftShin', 'rightLeg', 'rightShin', 'leftArm', 'leftForearm', 'rightArm', 'rightForearm'] as const;

/** Squat-and-reach pose, `s` from 0 (standing) to 1 (deep squat, low reach) for the reaching `side`. */
function reachPose(s: number, side: Side): Pose {
  const lean = 14 + 38 * s;
  const [reach, other] = side === 'right' ? ['right', 'left'] : ['left', 'right'];
  const pose: Pose = {
    torso: lean, head: 14 + 10 * s,
    // Hips back: thighs swing forward, shins stay nearly upright over the feet.
    leftLeg: -78 * s, leftShin: 90 * s, rightLeg: -70 * s, rightShin: 80 * s,
    [`${reach}Arm`]: -lean - 6, [`${reach}Forearm`]: -8,
    [`${other}Arm`]: -lean + 24, [`${other}Forearm`]: -20,
  };
  // Drop the body and slide it over the feet so they stay planted.
  pose.bodyY = legDrop(pose.leftLeg, pose.leftShin);
  pose.bodyX = -legReach(pose.leftLeg, pose.leftShin);
  return pose;
}

function apply(fig: KaneFigure, pose: Pose): void {
  for (const part of PARTS) fig[part].rotation = pose[part] ?? 0;
  fig.body.y = pose.bodyY ?? 0;
  fig.body.x = pose.bodyX ?? 0;
}

/** Where the grip is, in `space`'s coordinates (live, from the DOM). */
function gripIn(fig: KaneFigure, side: Side, space: Actor): { x: number; y: number } {
  const to = space.el.getCTM();
  const from = hand(fig, side).slot.el.getCTM();
  if (!to || !from) throw new Error('pickup: the figure and the item must be on the stage');
  const m = to.inverse().multiply(from);
  return { x: m.e, y: m.f };
}

/**
 * The squat whose grip reaches `handleY`, and how far ahead of his origin the grip then is (stage
 * px, facing right). Found by bisection on the live rig, which is then put back as it was.
 */
function solve(fig: KaneFigure, space: Actor, handleY: number, side: Side): { pose: Pose; ahead: number } {
  const saved = PARTS.map((p) => fig[p].rotation);
  const [savedX, savedY] = [fig.body.x, fig.body.y];
  let lo = 0, hi = 1;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    apply(fig, reachPose(mid, side));
    if (gripIn(fig, side, space).y < handleY) lo = mid; else hi = mid;
  }
  const pose = reachPose((lo + hi) / 2, side);
  apply(fig, pose);
  const ahead = (gripIn(fig, side, space).x - fig.x) * Math.sign(fig.scaleX || 1);
  PARTS.forEach((p, i) => (fig[p].rotation = saved[i]));
  [fig.body.x, fig.body.y] = [savedX, savedY];
  return { pose, ahead };
}

/** Stage x to stand at (facing right, or `dir` −1 for left) so the reaching hand meets `item`'s handle. */
export function reachSpot(fig: KaneFigure, item: Actor, { side = 'right' as Side, dir = 1 as 1 | -1 } = {}): number {
  if (!item.parent) throw new Error('reachSpot: the item must be on the stage');
  return item.x - dir * solve(fig, item.parent, item.y, side).ahead;
}

/** Ground layer and handle height each item was picked up from, so putDown() puts it back level. */
const grounds = new WeakMap<Actor, { space: Actor; y: number }>();

/**
 * Seek-safe switch: `held` 1 = the item is in the hand, 0 = on the ground at `place()`. It looks at
 * where the item actually is rather than remembering what it did last, so it stays right however
 * the playhead jumps (the exporter plays the whole timeline for the sound, then seeks back to 0).
 */
function holder(fig: KaneFigure, item: Actor, side: Side, space: Actor, place: () => { x: number; y: number }, before: 0 | 1) {
  const h = hand(fig, side);
  // Its value before the switch: GSAP puts this back when the playhead goes back past it.
  let value: number = before;
  return {
    get held() { return value; },
    set held(v: number) {
      value = v;
      const inHand = item.parent === h.slot;
      if (v >= 0.5 && !inHand) {
        h.hold(item, { hang: true });
        Object.assign(item, { x: 0, y: 0, rotation: 0, scale: 1 });
      } else if (v < 0.5 && inHand) {
        const { x, y } = place();
        h.release();
        space.add(item);
        if (fig.parent === space) space.el.insertBefore(item.el, fig.el);
        Object.assign(item, { x, y, rotation: 0, scale: Math.abs(fig.scaleY) });
      } else if (v < 0.5 && item.parent === space) {
        Object.assign(item, place());
      }
    },
  };
}

/** Timing (s): bend down, fingers close (or open), a beat, straighten up. */
const DOWN = 0.6;
const FINGERS = 0.18;
const BEAT = 0.14;
const UP = 0.55;
/** The ground ↔ hand switch: a very short tween (GSAP renders real tweens on every playhead jump). */
const SWITCH = 0.001;

function bend(fig: KaneFigure, pose: Pose, at: number, tl: Timeline, duration: number, ease = 'power2.inOut'): void {
  for (const part of PARTS) tl.to(fig[part], { rotation: pose[part] ?? 0, duration, ease }, at);
  tl.to(fig.body, { y: pose.bodyY ?? 0, x: pose.bodyX ?? 0, duration, ease }, at);
}

/** Bend down, curl the fingers round `item`'s handle (its origin), straighten up holding it. */
export function pickUp(fig: KaneFigure, item: Actor, { side = 'right' as Side } = {}): Timeline {
  const space = item.parent;
  if (!space) throw new Error('pickUp: the item must be on the stage');
  grounds.set(item, { space, y: item.y });
  const { pose } = solve(fig, space, item.y, side);
  const start = { x: item.x, y: item.y };
  const grab = holder(fig, item, side, space, () => start, 0);
  const h = hand(fig, side);
  const tl = gsap.timeline();
  bend(fig, pose, 0, tl, DOWN);
  // The hand is over the handle: from here the item is in it, between the palm and the fingers.
  tl.to(grab, { held: 1, duration: SWITCH, ease: 'none' }, DOWN);
  tl.to(h, { curl: 1, duration: FINGERS, ease: 'power2.in' }, DOWN);
  // Lifting the weight: a slower start off the ground.
  bend(fig, {}, DOWN + FINGERS + BEAT, tl, UP, 'power1.inOut');
  return tl;
}

/** Bend down until `item` touches the ground, open the fingers, straighten up. */
export function putDown(fig: KaneFigure, item: Actor, { side = 'right' as Side } = {}): Timeline {
  const ground = grounds.get(item);
  if (!ground) throw new Error('putDown: pick the item up with pickUp() first');
  const { space, y } = ground;
  // Bend as deep as when it was picked up: the handle goes back to the same height, under the hand.
  const { pose } = solve(fig, space, y, side);
  const drop = holder(fig, item, side, space, () => ({ x: gripIn(fig, side, space).x, y }), 1);
  const h = hand(fig, side);
  const tl = gsap.timeline();
  bend(fig, pose, 0, tl, DOWN);
  tl.to(h, { curl: 0, duration: FINGERS, ease: 'power2.out' }, DOWN + 0.05);
  tl.to(drop, { held: 0, duration: SWITCH, ease: 'none' }, DOWN + 0.05 + FINGERS);
  bend(fig, {}, DOWN + 0.05 + FINGERS + BEAT * 0.5, tl, UP);
  return tl;
}
