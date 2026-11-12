/**
 * A body made of cut-out PNG parts (cut from one meta.ai picture by data-for-cartoons/bodies/<body>/cut.py),
 * on the same skeleton as KaneFigure, so walk() drives it unchanged.
 *
 *   const man = new CutoutFigure('normal', { x: 200, y: GROUND, scale: 2.4 })
 *   tl.add(walk(man, { to: 900 }))
 *
 * The parts and parts.json live in the private data-for-cartoons repo (`@bodies`, see
 * scripts/characters-dir.mjs). parts.json gives each part's box and pivot in picture pixels;
 * here they become figure units: origin between the feet on the ground, about 372 tall.
 *
 * "near" parts are the ones closer to the camera (in front), "far" ones are behind:
 * far = left*, near = right* (the joint names KaneFigure and walk() use).
 */
import { Actor, svg, type ActorOptions } from '@/engine';
import { Joint } from './kane';

type P = [number, number];
interface PartInfo { box: [number, number, number, number]; pivot: P; z: number }
interface BodyInfo { size: P; joints: Record<string, P>; parts: Record<string, PartInfo> }

const pngs = import.meta.glob<string>('@bodies/*/*.png', { eager: true, import: 'default', query: '?url' });
const infos = import.meta.glob<BodyInfo>('@bodies/*/parts.json', { eager: true, import: 'default' });

function find<T>(files: Record<string, T>, suffix: string): T {
  const key = Object.keys(files).find((k) => k.endsWith(suffix));
  if (!key) throw new Error(`Body file ${suffix} is missing (data-for-cartoons/bodies, cut with its cut.py).`);
  return files[key];
}

/** Figure height in figure units (the same as KaneFigure). */
const HEIGHT = 372;

export interface Legs { thigh: number; shin: number }

const deg = (r: number) => (r * 180) / Math.PI;
/** Rotation (SVG degrees, clockwise) that takes "straight down" to the direction a → b. */
const angle = (a: P, b: P) => deg(Math.atan2(-(b[0] - a[0]), b[1] - a[1]));
const dist = (a: P, b: P) => Math.hypot(b[0] - a[0], b[1] - a[1]);

export class CutoutFigure extends Actor {
  readonly body: Actor;
  readonly torso: Joint;
  readonly shorts: Joint;
  readonly head: Joint;
  readonly leftArm: Joint;
  readonly rightArm: Joint;
  readonly leftForearm: Joint;
  readonly rightForearm: Joint;
  readonly leftLeg: Joint;
  readonly rightLeg: Joint;
  readonly leftShin: Joint;
  readonly rightShin: Joint;
  /** Leg lengths in figure units (hip → knee, knee → ground), for walk() to keep a foot planted. */
  readonly legs: Legs;
  /** Where the figure origin is in the source picture (px), and picture px per figure unit. */
  readonly picture: { origin: P; size: P; pxPerUnit: number };

  constructor(bodyName: string, options: ActorOptions = {}) {
    super({ name: bodyName, ...options });
    const info = find(infos, `/${bodyName}/parts.json`);
    const { parts, joints: J } = info;
    // Picture pixels → figure units: ground under the near boot, x between the hips.
    const top = parts.head.box[1];
    const ground = parts.nearShin.box[1] + parts.nearShin.box[3];
    const k = HEIGHT / (ground - top);
    const ox = (J.hipN[0] + J.hipF[0]) / 2;
    const fig = ([x, y]: P): P => [(x - ox) * k, (y - ground) * k];
    this.picture = { origin: [ox, ground], size: info.size, pxPerUnit: 1 / k };

    /**
     * A joint at `at` (figure units, in its parent's frame) showing part `name`, with the picture
     * turned by `-turn` round the part's pivot (to stand a slanted leg up straight).
     */
    const piece = (name: string, at: P, turn = 0): Joint => {
      const p = parts[name];
      const joint = new Joint({ name, x: at[0], y: at[1] });
      const [px, py] = fig(p.pivot);
      const [bx, by] = fig([p.box[0], p.box[1]]);
      const g = joint.draw('g', { transform: `rotate(${-turn}) translate(${-px} ${-py})` });
      g.appendChild(svg('image', {
        href: find(pngs, `/${bodyName}/${name}.png`), x: bx, y: by, width: p.box[2] * k, height: p.box[3] * k,
      }));
      return joint;
    };
    const rel = (a: P, b: P): P => { const [ax, ay] = fig(a); const [bx, by] = fig(b); return [ax - bx, ay - by]; };

    // Legs: stood up straight, so rotation 0 is a straight leg (as walk() expects).
    const leg = (side: 'N' | 'F', thighName: string, shinName: string): [Joint, Joint, number, number] => {
      const hip = J[`hip${side}`], knee = J[`knee${side}`], ankle = J[`ankle${side}`];
      const thighLen = dist(hip, knee) * k;
      const thigh = piece(thighName, fig(hip), angle(hip, knee));
      const shin = piece(shinName, [0, thighLen], angle(knee, ankle));
      thigh.add(shin);
      const sole = (parts[shinName].box[1] + parts[shinName].box[3] - knee[1]) * k;
      return [thigh, shin, thighLen, sole];
    };
    let nearThigh: number, nearShin: number;
    [this.rightLeg, this.rightShin, nearThigh, nearShin] = leg('N', 'nearLeg', 'nearShin');
    [this.leftLeg, this.leftShin] = leg('F', 'farLeg', 'farShin');
    this.legs = { thigh: nearThigh, shin: nearShin };

    const waist = parts.torso.pivot;
    this.torso = piece('torso', fig(waist));
    this.shorts = piece('shorts', fig(parts.shorts.pivot));
    this.head = piece('head', rel(parts.head.pivot, waist));
    this.rightArm = piece('nearArm', rel(parts.nearArm.pivot, waist));
    this.rightForearm = piece('nearForearm', rel(parts.nearForearm.pivot, parts.nearArm.pivot));
    this.leftArm = piece('farArm', rel(parts.farArm.pivot, waist));
    this.leftForearm = piece('farForearm', rel(parts.farForearm.pivot, parts.farArm.pivot));
    this.rightArm.add(this.rightForearm);
    this.leftArm.add(this.leftForearm);
    // The head goes under the collar; the near arm over the shirt.
    this.torso.add(this.head, this.rightArm);
    this.torso.el.prepend(this.head.el);

    // The far arm is behind the whole body, so it can't sit inside the torso: a layer at the
    // back that turns with it.
    const farShoulder = new Joint({ name: 'farShoulder', x: this.torso.x, y: this.torso.y });
    farShoulder.add(this.leftArm);
    this.torso.listeners.push(() => (farShoulder.rotation = this.torso.rotation));

    this.body = new Actor({ name: 'body' });
    this.body.add(farShoulder, this.leftLeg, this.rightLeg, this.shorts, this.torso);
    this.add(this.body);
  }
}
