/**
 * A cut-out puppet built from separately drawn pieces (a meta.ai rig sheet cut up by
 * data-for-cartoons/bodies/parts/rig.py): head, torso, upper arm, forearm + hand, thigh,
 * shin + foot. The limbs are drawn once and used for both sides (the screen-left arm mirrored).
 *
 *   const man = new PuppetFigure('hoodie', { x: 200, y: GROUND, scale: 2 })
 *   tl.add(walk(man, { to: 540 }))          // gait.ts drives it like any other figure
 *   tl.add(clap(man, { claps: 4 }))
 *
 * Body front-on, feet in profile (pointing the way he walks): the usual cut-out cheat.
 * Figure units match the other figures: origin on the ground between the feet, about 372 tall.
 */
import { gsap } from 'gsap';
import { Actor, svg, type ActorOptions, type Timeline } from '@/engine';
import { Joint } from './kane';

type P = [number, number];
interface Piece { size: P; pivot: P; [point: string]: P }
interface Rig { pieces: Record<string, Piece> }

const pngs = import.meta.glob<string>('@bodies/*/*.png', { eager: true, import: 'default', query: '?url' });
const rigs = import.meta.glob<Rig>('@bodies/*/rig.json', { eager: true, import: 'default' });

function find<T>(files: Record<string, T>, suffix: string): T {
  const key = Object.keys(files).find((k) => k.endsWith(suffix));
  if (!key) throw new Error(`Puppet file ${suffix} is missing (data-for-cartoons/bodies, made with parts/rig.py).`);
  return files[key];
}

const HEIGHT = 372;
const deg = (r: number) => (r * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;

export class PuppetFigure extends Actor {
  readonly body: Actor;
  readonly torso: Joint;
  readonly head: Joint;
  readonly leftArm: Joint;
  readonly rightArm: Joint;
  readonly leftForearm: Joint;
  readonly rightForearm: Joint;
  readonly leftLeg: Joint;
  readonly rightLeg: Joint;
  readonly leftShin: Joint;
  readonly rightShin: Joint;
  readonly legs: { thigh: number; shin: number };
  /** For clap(): shoulder points (torso frame), upper arm and elbow → palm lengths, figure units. */
  readonly arms: { shoulders: [P, P]; upper: number; lower: number };

  constructor(name: string, options: ActorOptions = {}) {
    super({ name, ...options });
    const { pieces: R } = find(rigs, `/${name}/rig.json`);
    const T = R.torso;
    // Picture px → figure units: head top to sole.
    const hipY = T.hipL[1];
    const thighLen = R.thigh.knee[1] - R.thigh.pivot[1];
    const shinLen = R.shin.sole[1] - R.shin.pivot[1];
    const top = T.neck[1] - R.head.pivot[1];
    const k = HEIGHT / (hipY + thighLen + shinLen - top);
    const groundY = hipY + thighLen + shinLen;
    const ox = T.pivot[0];
    /** A torso-px point in figure units (origin on the ground below the torso's centre). */
    const fig = ([x, y]: P): P => [(x - ox) * k, (y - groundY) * k];
    const sub = (a: P, b: P): P => [(a[0] - b[0]) * k, (a[1] - b[1]) * k];

    const piece = (part: string, at: P, mirror = false): Joint => {
      const p = R[part];
      const joint = new Joint({ name: part, x: at[0], y: at[1] });
      const flip = mirror ? 'scale(-1 1) ' : '';
      const g = joint.draw('g', { transform: `${flip}translate(${-p.pivot[0] * k} ${-p.pivot[1] * k})` });
      g.appendChild(svg('image', { href: find(pngs, `/${name}/${part}.png`), width: p.size[0] * k, height: p.size[1] * k }));
      return joint;
    };

    this.torso = piece('torso', fig(T.pivot));
    this.head = piece('head', sub(T.neck, T.pivot));
    // Screen-left arm = his right arm (mirrored drawing), screen-right = his left.
    // The upper arm goes behind the hoodie (its short sleeve becomes the arm's sleeve top); the
    // forearm in front of it (claps happen in front of the chest), on an elbow that follows the
    // upper arm.
    const elbowAt = sub(R.upperArm.elbow, R.upperArm.pivot);
    const arm = (shoulder: P, mirror: boolean): [Joint, Joint] => {
      const s = sub(shoulder, T.pivot);
      const upper = piece('upperArm', s, mirror);
      const elbow = new Joint({ name: 'elbow', x: s[0] + elbowAt[0], y: s[1] + elbowAt[1] });
      const fore = piece('forearm', [0, 0], mirror);
      elbow.add(fore);
      upper.listeners.push(() => {
        const r = rad(upper.rotation);
        elbow.x = s[0] + elbowAt[0] * Math.cos(r) - elbowAt[1] * Math.sin(r);
        elbow.y = s[1] + elbowAt[0] * Math.sin(r) + elbowAt[1] * Math.cos(r);
        elbow.rotation = upper.rotation;
      });
      return [upper, fore];
    };
    [this.rightArm, this.rightForearm] = arm(T.shoulderL, true);
    [this.leftArm, this.leftForearm] = arm(T.shoulderR, false);
    this.torso.add(this.rightArm, this.leftArm, this.head, this.rightForearm.parent as Joint, this.leftForearm.parent as Joint);
    this.torso.el.prepend(this.rightArm.el, this.leftArm.el);

    const leg = (hip: P): [Joint, Joint] => {
      const thigh = piece('thigh', fig(hip));
      const shin = piece('shin', sub(R.thigh.knee, R.thigh.pivot));
      thigh.add(shin);
      return [thigh, shin];
    };
    [this.leftLeg, this.leftShin] = leg(T.hipR);
    [this.rightLeg, this.rightShin] = leg(T.hipL);
    this.legs = { thigh: thighLen * k, shin: shinLen * k };

    this.arms = {
      shoulders: [sub(T.shoulderL, T.pivot), sub(T.shoulderR, T.pivot)],
      upper: (R.upperArm.elbow[1] - R.upperArm.pivot[1]) * k,
      lower: Math.hypot(R.forearm.palm[0] - R.forearm.pivot[0], R.forearm.palm[1] - R.forearm.pivot[1]) * k,
    };

    this.body = new Actor({ name: 'body' });
    this.body.add(this.leftLeg, this.rightLeg, this.torso);
    this.add(this.body);
  }
}

/** Rotation (SVG degrees, clockwise) that takes "straight down" to the direction a → b. */
const angle = (a: P, b: P) => deg(Math.atan2(-(b[0] - a[0]), b[1] - a[1]));

/** Upper arm and forearm rotations that put the palm at `target` (torso frame), elbow out to the side. */
function reach(S: P, target: P, a: number, b: number): [number, number] {
  const d = Math.min(Math.hypot(target[0] - S[0], target[1] - S[1]), a + b - 0.01);
  const phi = angle(S, target);
  const alpha = deg(Math.acos((a * a + d * d - b * b) / (2 * a * d)));
  const elbow = (u: number): P => [S[0] - a * Math.sin(rad(u)), S[1] + a * Math.cos(rad(u))];
  // The elbow that hangs lower (down and out to the side, not up like a wing).
  const [u1, u2] = [phi + alpha, phi - alpha];
  const upper = elbow(u1)[1] > elbow(u2)[1] ? u1 : u2;
  return [upper, angle(elbow(upper), target) - upper];
}

/**
 * Clap in front of the chest (forearms foreshortened, pointing at the camera): arms come up (0.3 s), `claps` claps at `rate` a second, arms
 * back down (0.3 s). A little bob on each clap.
 */
export function clap(fig: PuppetFigure, { claps = 4, rate = 2.5 }: { claps?: number; rate?: number } = {}): Timeline {
  const { shoulders, upper, lower } = fig.arms;
  const chestY = shoulders[0][1] + upper * 0.9;
  // Seen from the front, clapping forearms point at the camera: drawn shorter (foreshortened).
  const SHORT = 0.6;
  const up = 0.3;
  const clapping = claps / rate;
  const duration = up + clapping + up;
  const pose = (t: number) => {
    // Hands' half gap: wide when raised, closed at each clap.
    const c = t < up ? 0 : t > up + clapping ? 0 : (t - up) * rate;
    const half = 3 + 30 * (0.5 + 0.5 * Math.cos(2 * Math.PI * c));
    const w = Math.min(1, t / up, (duration - t) / up);
    const ease = w * w * (3 - 2 * w);
    const sides: [P, Joint, Joint, number][] = [
      [shoulders[0], fig.rightArm, fig.rightForearm, -1],
      [shoulders[1], fig.leftArm, fig.leftForearm, 1],
    ];
    for (const [S, arm, fore, side] of sides) {
      const shorten = 1 - (1 - SHORT) * ease;
      const [u, f] = reach(S, [side * half, chestY], upper, lower * SHORT);
      arm.rotation = u * ease;
      fore.rotation = f * ease;
      fore.scaleY = shorten;
    }
    // At each clap (c whole) the body dips a touch and the head nods.
    const beat = t > up && t < up + clapping ? Math.max(0, Math.cos(2 * Math.PI * c)) : 0;
    fig.body.y = 2 * beat ** 4;
    fig.head.rotation = 3 * Math.sin(2 * Math.PI * c) * ease;
  };
  let time = 0;
  const clock = {
    get t() { return time; },
    set t(value: number) { time = value; pose(value); },
  };
  return gsap.timeline().fromTo(clock, { t: 0 }, { t: duration, duration, ease: 'none', immediateRender: false });
}
