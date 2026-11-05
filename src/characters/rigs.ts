/**
 * Ready-made puppets of the characters in library.json. Anchors and points come from the
 * catalog, so a rig only says which pictures it uses. Origins:
 *   sitting poses   where they sit (underside of the thighs) – put them on any seat
 *   standing poses  between the feet
 *   flying poses    the middle of the body
 */
import { svg, uid } from '@/engine';
import { picture, pictureInfo, pictureUrl, point, PoseRig, type PictureId } from './pictures';

type RigOptions = { x?: number; y?: number; scale?: number; opacity?: number };

// ── Carrick ──────────────────────────────────────────────────────────────

/** The screaming head of carrick_panic: everything above the collar, plus the beard. */
const PANIC_HEAD = 'M 0 0 L 1024 0 L 1024 560 L 640 560 L 600 700 L 520 800 L 440 850 L 330 850 L 250 790 L 200 700 L 0 700 Z';

/**
 * The panic face on top of a body picture whose own face is calmer, pinned at the body's
 * chin. Drawn slightly bigger (`scale`) so it covers the old head without erasing anything.
 */
function panicHead(body: PictureId, scale: number, rotation: number): SVGGElement {
  const [cx, cy] = point(body, 'chin');
  const chin = pictureInfo('carrick_panic').points.chin;
  const id = uid('carrick-panic-head');
  const g = svg('g', { transform: `translate(${cx} ${cy}) rotate(${rotation}) scale(${scale}) translate(${-chin[0]} ${-chin[1]})` });
  g.appendChild(svg('clipPath', { id })).appendChild(svg('path', { d: PANIC_HEAD }));
  const [w, h] = pictureInfo('carrick_panic').size;
  g.appendChild(svg('image', { href: pictureUrl('carrick_panic'), width: w, height: h, 'clip-path': `url(#${id})` }));
  return g;
}

export type CarrickPose = 'sitting' | 'sweat' | 'pain' | 'relief' | 'panic' | 'jump' | 'launch';

/** Carrick sitting (five faces) and flying (jump, launch – both with the screaming face). */
export class CarrickRig extends PoseRig<CarrickPose> {
  constructor(options: RigOptions = {}) {
    super('Carrick', {
      sitting: 'carrick_sitting',
      sweat: 'carrick_sweat',
      pain: 'carrick_pain',
      relief: 'carrick_relief',
      panic: 'carrick_panic',
      jump: [picture('carrick_jump'), panicHead('carrick_jump', 0.92, 4)],
      launch: [picture('carrick_launch'), panicHead('carrick_launch', 0.92, 3)],
    }, 'sitting', options);
  }
}

// ── Bruno ────────────────────────────────────────────────────────────────

export type BrunoPose = 'extinguisher' | 'proud';
/** Tip of the extinguisher's nozzle, relative to his feet. */
export const BRUNO_NOZZLE = point('bruno_extinguisher', 'nozzle');

export class BrunoRig extends PoseRig<BrunoPose> {
  constructor(options: RigOptions = {}) {
    super('Bruno', { extinguisher: 'bruno_extinguisher', proud: 'bruno_proud' }, 'extinguisher', options);
  }
}

// ── Ole ──────────────────────────────────────────────────────────────────

export type OlePose = 'chair' | 'eager';

/** Standing Ole. The pictures face right; flip with a negative scaleX. */
export class OleRig extends PoseRig<OlePose> {
  constructor(options: RigOptions = {}) {
    super('Ole', { chair: 'ole_chair', eager: 'ole_eager' }, 'chair', options);
  }
}

/** Ole sitting back, hands behind his head. */
export class OleSeated extends PoseRig<'seated'> {
  constructor(options: RigOptions = {}) {
    super('Ole seated', { seated: 'ole_seated' }, 'seated', options);
  }
}
