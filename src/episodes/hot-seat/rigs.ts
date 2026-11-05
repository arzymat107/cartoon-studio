/**
 * Cut-out puppets for "The Hot Seat", made from the meta.ai drawings in src/assets/characters/
 * (1024 × 2448 each). A rig holds several full-body pictures and shows one at a time: switching
 * the picture switches the pose or the face. Every picture is placed so that the rig's origin is
 * the same body point in all of them, so the body stays put when the picture changes.
 */
import carrickJump from '@/assets/characters/Carrick/carrick_jump.png';
import carrickLaunch from '@/assets/characters/Carrick/carrick_launch.png';
import carrickPain from '@/assets/characters/Carrick/carrick_pain.png';
import carrickPanic from '@/assets/characters/Carrick/carrick_panic.png';
import carrickRelief from '@/assets/characters/Carrick/carrick_relief.png';
import carrickSitting from '@/assets/characters/Carrick/carrick_sitting.png';
import carrickSweat from '@/assets/characters/Carrick/carrick_sweat.png';
import brunoExtinguisher from '@/assets/characters/Bruno/bruno_extinguisher.png';
import brunoProud from '@/assets/characters/Bruno/bruno_proud.png';
import oleChair from '@/assets/characters/Ole/ole_chair.png';
import oleEager from '@/assets/characters/Ole/ole_eager.png';
import oleSeated from '@/assets/characters/Ole/ole_seated.png';
import { Actor, svg, uid, type Timeline } from '@/engine';

const W = 1024;
const H = 2448;

/** One full-body picture whose point `origin` (picture pixels) sits on the actor's origin. */
function picture(href: string, origin: [number, number]): SVGGElement {
  const g = svg('g', { transform: `translate(${-origin[0]} ${-origin[1]})` });
  g.appendChild(svg('image', { href, width: W, height: H }));
  return g;
}

/** A rig that shows one of its named pictures at a time. */
class PoseRig<P extends string> extends Actor {
  private readonly poses = new Map<P, Actor>();
  current: P;

  constructor(name: string, poses: Record<P, SVGGElement[]>, first: P, options: { x?: number; y?: number; scale?: number }) {
    super({ name, ...options });
    for (const [pose, parts] of Object.entries(poses) as [P, SVGGElement[]][]) {
      const actor = new Actor({ name: pose, opacity: pose === first ? 1 : 0 });
      for (const part of parts) actor.el.appendChild(part);
      this.poses.set(pose, actor);
      this.add(actor);
    }
    this.current = first;
  }

  /** Switch to `pose` at time `at` (an instant cut, like a cartoon drawing change). */
  show(tl: Timeline, pose: P, at: number): void {
    for (const [name, actor] of this.poses) tl.set(actor, { opacity: name === pose ? 1 : 0 }, at);
  }
}

// ── Carrick ──────────────────────────────────────────────────────────────

/** Where he sits on the seat (picture pixels of carrick_sitting.png): the underside of the thighs at the back. */
const SEAT: [number, number] = [700, 1690];
/**
 * The face pictures were redrawn from carrick_sitting.png and came back shifted by a few pixels;
 * these offsets (measured on the body) put each body exactly over the base one.
 */
const FACE_SHIFT = { sweat: [6, -6], pain: [8, -4], relief: [10, -4], panic: [4, -14] } as const;
/** Mid-body point of the jump and launch pictures (the rig's origin while he flies). */
const JUMP_ORIGIN: [number, number] = [560, 1400];
const LAUNCH_ORIGIN: [number, number] = [600, 1400];

/** The screaming head of carrick_panic.png: everything above the collar, plus the beard. */
const PANIC_HEAD = 'M 0 0 L 1024 0 L 1024 560 L 640 560 L 600 700 L 520 800 L 440 850 L 330 850 L 250 790 L 200 700 L 0 700 Z';
/** Chin point of the panic head – it is pinned onto the chin of the flying pictures. */
const PANIC_CHIN: [number, number] = [380, 830];

/**
 * The panic face on top of a flying body, which has a smaller, calmer face of its own.
 * `chin` is the body picture's chin; the head is drawn slightly bigger so it covers the old one.
 */
function panicHead(origin: [number, number], chin: [number, number], scale: number, rotation: number): SVGGElement {
  const id = uid('carrick-panic-head');
  const g = svg('g', {
    transform: `translate(${chin[0] - origin[0]} ${chin[1] - origin[1]}) rotate(${rotation}) scale(${scale}) translate(${-PANIC_CHIN[0]} ${-PANIC_CHIN[1]})`,
  });
  g.appendChild(svg('clipPath', { id })).appendChild(svg('path', { d: PANIC_HEAD }));
  g.appendChild(svg('image', { href: carrickPanic, width: W, height: H, 'clip-path': `url(#${id})` }));
  return g;
}

export type CarrickPose = 'sitting' | 'sweat' | 'pain' | 'relief' | 'panic' | 'jump' | 'launch';

/** Origin: where he sits on the seat (sitting poses) / the middle of his body (flying poses). */
export class CarrickRig extends PoseRig<CarrickPose> {
  constructor(options: { x?: number; y?: number; scale?: number }) {
    const face = (href: string, [dx, dy]: readonly [number, number]) => [picture(href, [SEAT[0] - dx, SEAT[1] - dy])];
    super('Carrick', {
      sitting: [picture(carrickSitting, SEAT)],
      sweat: face(carrickSweat, FACE_SHIFT.sweat),
      pain: face(carrickPain, FACE_SHIFT.pain),
      relief: face(carrickRelief, FACE_SHIFT.relief),
      panic: face(carrickPanic, FACE_SHIFT.panic),
      jump: [picture(carrickJump, JUMP_ORIGIN), panicHead(JUMP_ORIGIN, [378, 815], 0.92, 4)],
      launch: [picture(carrickLaunch, LAUNCH_ORIGIN), panicHead(LAUNCH_ORIGIN, [440, 855], 0.92, 3)],
    }, 'sitting', options);
  }
}

// ── Bruno ────────────────────────────────────────────────────────────────

/** Extinguisher nozzle tip in bruno_extinguisher.png, relative to his feet (the rig's origin). */
export const BRUNO_FEET: [number, number] = [470, 2385];
export const BRUNO_NOZZLE: [number, number] = [545 - BRUNO_FEET[0], 1000 - BRUNO_FEET[1]];

export type BrunoPose = 'extinguisher' | 'proud';

/** Origin: between his feet. */
export class BrunoRig extends PoseRig<BrunoPose> {
  constructor(options: { x?: number; y?: number; scale?: number }) {
    super('Bruno', {
      extinguisher: [picture(brunoExtinguisher, BRUNO_FEET)],
      // Measured on the head: the proud picture sits 8 px left and 10 px higher.
      proud: [picture(brunoProud, [BRUNO_FEET[0] + 8, BRUNO_FEET[1] + 10])],
    }, 'extinguisher', options);
  }
}

// ── Ole ──────────────────────────────────────────────────────────────────

export type OlePose = 'chair' | 'eager';

/** Standing Ole. Origin: between his feet. The pictures face right; flip with a negative scaleX. */
export class OleRig extends PoseRig<OlePose> {
  constructor(options: { x?: number; y?: number; scale?: number }) {
    super('Ole', {
      chair: [picture(oleChair, [538, 2354])],
      eager: [picture(oleEager, [552, 2351])],
    }, 'chair', options);
  }
}

/** Where seated Ole sits (picture pixels of ole_seated.png): the underside of his thighs. */
export const OLE_SEAT: [number, number] = [650, 1700];

/** Ole sitting back, hands behind his head. Origin: where he sits. */
export class OleSeated extends Actor {
  constructor(options: { x?: number; y?: number; scale?: number; opacity?: number }) {
    super({ name: 'Ole seated', ...options });
    this.el.appendChild(picture(oleSeated, OLE_SEAT));
  }
}
