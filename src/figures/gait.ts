/**
 * Walk cycle for the flat cartoon figures (KaneFigure).
 *
 *   tl.add(walk(kane, { to: 900 }))             // from where he stands to x = 900
 *   tl.add(walk(kane, { to: 200, cycle: 0.8 })) // back, faster
 *   tl.add(walk(kane, { to: 600, step: 0.5, cycle: 0.6 })) // small quick steps
 *
 * Contact, down, passing, push-off and swing for each leg; arms swing against the legs;
 * the body drops so one foot always stays on the ground.
 *
 * Starts and ends in the rest pose (the stride ramps in and out), so it is safe to scrub
 * and seek. The figure moves at the speed of its planted foot, so the feet don't slide.
 */
import { gsap } from 'gsap';
import type { Timeline } from '@/engine';
import { SHIN, THIGH, type KaneFigure } from './kane';

type Key = [thigh: number, shin: number];

interface Gait {
  /** One leg over a full cycle, starting at contact with this leg in front (evenly spaced keys). */
  leg: Key[];
  /** Fraction of the cycle a foot is on the ground, from contact. */
  stance: number;
  /** Upper arm swing (× the opposite thigh) and forearm bend: [rest, extra when swung forward]. */
  arm: number;
  forearm: [number, number];
  lean: number;
  /** Extra rise in the flight phase (figure units). */
  hop: number;
  rampCycles: number;
}

const WALK: Gait = {
  leg: [
    [-24, 4], // contact: heel down in front, leg almost straight
    [-14, 14], // down: weight on it, knee gives
    [-2, 4], // passing: straight under the body
    [10, 2],
    [20, 8], // heel off behind
    [14, 38], // push-off: knee bends, toe leaves the ground
    [-8, 55], // swing: knee forward, foot tucked up
    [-26, 22], // reach: leg swinging out in front
  ],
  stance: 0.5,
  arm: 0.75,
  forearm: [-6, -10],
  lean: 3,
  hop: 0,
  rampCycles: 0.35,
};

/** Periodic Catmull-Rom through the keys; `u` in cycles (any real number). */
function sample(keys: Key[], u: number, i: 0 | 1): number {
  const n = keys.length;
  const f = (((u % 1) + 1) % 1) * n;
  const k = Math.floor(f);
  const t = f - k;
  const p = (j: number) => keys[(k + j + n) % n][i];
  const [p0, p1, p2, p3] = [p(-1), p(0), p(1), p(2)];
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
}

const rad = (d: number) => (d * Math.PI) / 180;
/** Foot position below the hip for a thigh and shin angle (forward is negative rotation). */
const footX = ([a1, a2]: Key) => -(THIGH * Math.sin(rad(a1)) + SHIN * Math.sin(rad(a1 + a2)));
const footY = ([a1, a2]: Key) => THIGH * Math.cos(rad(a1)) + SHIN * Math.cos(rad(a1 + a2));
const legAt = (g: Gait, u: number, w = 1): Key => [sample(g.leg, u, 0) * w, sample(g.leg, u, 1) * w];

/** How far below the hip the ground is while the leg at phase `u` is planted. */
const plantedDrop = (g: Gait, u: number, w: number) => THIGH + SHIN - footY(legAt(g, u, w));

/**
 * Body drop (positive = down) at phase `u`: from the planted foot during stance; in flight, eased
 * from toe-off to the next contact with a hop on top.
 */
function bodyY(g: Gait, u: number, w: number): number {
  // Every half cycle one leg goes through the same phases, so the planted leg is at phase `half`.
  const half = ((u % 0.5) + 0.5) % 0.5;
  if (half <= g.stance) {
    // Walk: both feet can be down (stance 0.5), so use whichever foot is lower.
    const own = plantedDrop(g, half, w);
    return g.stance >= 0.5 ? Math.min(own, plantedDrop(g, half + 0.5, w)) : own;
  }
  const s = (half - g.stance) / (0.5 - g.stance);
  const from = plantedDrop(g, g.stance, w);
  const to = plantedDrop(g, 0, w);
  return from + (to - from) * s - g.hop * w * 4 * s * (1 - s);
}

/** Ground covered per cycle, in figure units: the planted foot's travel, scaled to the whole cycle. */
const stride = (g: Gait) => ((footX(legAt(g, 0)) - footX(legAt(g, g.stance))) / g.stance);

export interface GaitOptions {
  /** Where to stop (stage x). */
  to: number;
  /** Where he starts; default: where he stands when the timeline is built. */
  from?: number;
  /** Seconds per full cycle (two steps). Default 1. */
  cycle?: number;
  /** Step size: 1 = normal stride, 0.5 = small steps, 0.3 = shuffling. */
  step?: number;
}

/** The gait with its leg swing scaled: thighs by `k`, knee bends a little less so the feet still clear the ground. */
const scaled = (g: Gait, k: number): Gait => (k === 1 ? g : { ...g, leg: g.leg.map(([a1, a2]) => [a1 * k, a2 * k ** 0.6] as Key) });

function move(fig: KaneFigure, gait: Gait, { to, from = fig.x, cycle = 1, step = 1 }: GaitOptions): Timeline {
  const g = scaled(gait, step);
  const scale = Math.abs(fig.scaleY);
  const dir = Math.sign(to - from) || 1;
  const distance = Math.abs(to - from);
  const speed = (stride(g) * scale) / cycle;
  const ramp = cycle * g.rampCycles;
  const duration = distance / speed + ramp;
  const total = duration - ramp;

  const pose = (t: number) => {
    // Stride weight: ramps 0 → 1 → 0, and the distance walked so far (its integral).
    const w = Math.max(0, Math.min(1, t / ramp, (duration - t) / ramp));
    const done = t < ramp ? (t * t) / (2 * ramp) : t < duration - ramp ? ramp / 2 + (t - ramp) : total - (duration - t) ** 2 / (2 * ramp);
    const u = t / cycle;
    const left = legAt(g, u, w);
    const right = legAt(g, u + 0.5, w);
    [fig.leftLeg.rotation, fig.leftShin.rotation] = left;
    [fig.rightLeg.rotation, fig.rightShin.rotation] = right;
    // Each arm swings with the opposite leg; the elbow bends more as the arm comes forward.
    const arms: [number, typeof fig.leftArm, typeof fig.leftForearm][] = [
      [right[0], fig.leftArm, fig.leftForearm],
      [left[0], fig.rightArm, fig.rightForearm],
    ];
    for (const [thigh, arm, forearm] of arms) {
      arm.rotation = thigh * g.arm;
      const forward = Math.max(0, -thigh) / 50;
      forearm.rotation = w * (g.forearm[0] + g.forearm[1] * forward);
    }
    fig.torso.rotation = g.lean * w;
    fig.head.rotation = -g.lean * 0.4 * w - 1.5 * w * Math.sin(u * 4 * Math.PI);
    fig.body.y = bodyY(g, u, w);
    fig.x = from + dir * Math.min(distance, (done / total) * distance);
  };

  // A setter, not onUpdate: seeking a timeline with suppressed events still poses the figure.
  let time = 0;
  const clock = {
    get t() { return time; },
    set t(value: number) { time = value; pose(value); },
  };
  return gsap.timeline()
    .set(fig, { scaleX: dir * scale })
    .fromTo(clock, { t: 0 }, { t: duration, duration, ease: 'none', immediateRender: false });
}

export function walk(fig: KaneFigure, options: GaitOptions): Timeline {
  return move(fig, WALK, { cycle: 1, ...options });
}

