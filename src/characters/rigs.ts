/**
 * Ready-made puppets of the characters in library.json. Anchors and points come from the
 * catalog, so a rig only says which pictures it uses. Origins:
 *   sitting poses   where they sit (underside of the thighs) – put them on any seat
 *   standing poses  between the feet
 *   flying poses    the middle of the body
 */
import { Actor, svg, uid, type Timeline } from '@/engine';
import { picture, pictureInfo, pictureUrl, pictureWithout, point, PoseRig, type PictureId } from './pictures';

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

// ── Ronaldo ──────────────────────────────────────────────────────────────

/** The armband in each banded picture, as [x0, y0, x1, y1] picture pixels. */
const ARMBAND = { ronaldo_sad: [688, 1018, 815, 1170], ronaldo_smile: [690, 1018, 817, 1170] } as const;
/** ronaldo_siuu draws him smaller than the standing pictures. */
const RONALDO_SIUU_SCALE = 1.33;

function scaled(parts: SVGGElement[], scale: number): SVGGElement[] {
  const g = svg('g', { transform: `scale(${scale})` });
  for (const p of parts) g.appendChild(p);
  return [g];
}

export type RonaldoPose = 'standing' | 'sad' | 'smile' | 'bare' | 'bareSad' | 'bareSmile' | 'siuu';

/**
 * Ronaldo standing (calm, sad, smiling) with the captain's armband, the same three without it
 * (`bare…`: the sad/smile pictures with the armband cut out, over ronaldo_bare), and the siuu
 * jump without it. Origin between the feet; the standing pictures face right.
 * The siuu face is drawn in code (see siuuFace).
 */
export class RonaldoRig extends PoseRig<RonaldoPose> {
  private readonly number: Actor;
  /** The siuu mouth: a long tube, origin where it leaves the face – grow it with scaleX. */
  readonly tube: Actor;

  constructor(options: RigOptions = {}) {
    const bare = 'ronaldo_bare';
    const tube = siuuTube();
    super('Ronaldo', {
      standing: 'ronaldo_standing',
      sad: 'ronaldo_sad',
      smile: 'ronaldo_smile',
      bare,
      bareSad: [picture(bare), pictureWithout('ronaldo_sad', [...ARMBAND.ronaldo_sad])],
      bareSmile: [picture(bare), pictureWithout('ronaldo_smile', [...ARMBAND.ronaldo_smile])],
      siuu: scaled([siuuFace(tube)], RONALDO_SIUU_SCALE),
    }, 'standing', options);
    this.tube = tube;
    this.number = new Actor({ name: 'number 7, unmirrored', opacity: 0 });
    this.number.el.appendChild(mirroredSpot('ronaldo_sad', NUMBER_7.ronaldo_sad));
    this.add(this.number);
  }

  /**
   * Turn him to face left (true) or right. Flipping mirrors the 7 on his shirt, so while he faces
   * left the 7 is mirrored back – that patch is made for the bareSad pose (the walk away).
   */
  face(tl: Timeline, left: boolean, at: number, scale: number): void {
    tl.set(this, { scaleX: left ? -scale : scale }, at).set(this.number, { opacity: left ? 1 : 0 }, at);
  }
}

const SKIN = '#f4c09d';

/** The siuu mouth: a long, straight skin-coloured tube with a hole at the tip, base at (0, 0). */
function siuuTube(): Actor {
  const a = new Actor({ name: 'siuu tube' });
  a.draw('path', { d: 'M -60 -34 Q -25 -24 10 -22 L 178 -20 L 178 22 L 10 22 Q -25 26 -60 40 Z', fill: SKIN });
  const line = { fill: 'none', stroke: '#2a0a0a', 'stroke-width': 7, 'stroke-linecap': 'round' };
  a.draw('path', { d: 'M 18 -22 L 178 -20 A 21 21 0 0 1 178 22 L 18 22', ...line });
  a.draw('path', { d: 'M 40 -12 L 160 -11', stroke: '#ffffff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.35 });
  a.draw('ellipse', { cx: 186, cy: 1, rx: 8, ry: 13, fill: '#1e0e0e' });
  return a;
}

/**
 * The siuu face on ronaldo_siuu_bare: the fierce eyes and brows of ronaldo_siuu (its heads line
 * up 3 px left and 6 px up), the open mouth covered with skin, and the tube in its place.
 */
function siuuFace(tube: Actor): SVGGElement {
  const body = pictureInfo('ronaldo_siuu_bare');
  const [ox, oy] = body.points[body.anchor];
  const [mx, my] = body.points.mouth;
  const g = svg('g', { transform: `translate(${-ox} ${-oy})` });
  g.appendChild(svg('image', { href: pictureUrl('ronaldo_siuu_bare'), width: body.size[0], height: body.size[1] }));
  const mask = uid('siuu-eyes');
  const blur = uid('siuu-blur');
  g.appendChild(svg('filter', { id: blur })).appendChild(svg('feGaussianBlur', { stdDeviation: 6 }));
  g.appendChild(svg('mask', { id: mask })).appendChild(svg('rect', { x: 540, y: 588, width: 172, height: 80, rx: 30, fill: '#ffffff', filter: `url(#${blur})` }));
  const eyes = pictureInfo('ronaldo_siuu');
  g.appendChild(svg('image', { href: pictureUrl('ronaldo_siuu'), x: -3, y: -6, width: eyes.size[0], height: eyes.size[1], mask: `url(#${mask})` }));
  g.appendChild(svg('ellipse', { cx: mx + 5, cy: my - 2, rx: 60, ry: 50, fill: SKIN }));
  tube.x = mx + 40;
  tube.y = my + 2;
  tube.scaleY = 1.3;
  g.appendChild(tube.el);
  return g;
}

/** The 7 on the shirt, as [x0, y0, x1, y1] picture pixels. */
const NUMBER_7 = { ronaldo_sad: [504, 1008, 636, 1236] } as const;

/** A spot of a picture mirrored onto itself, placed like picture(): undoes a flip there. */
function mirroredSpot(id: PictureId, [x0, y0, x1, y1]: readonly [number, number, number, number]): SVGGElement {
  const info = pictureInfo(id);
  const [ox, oy] = info.points[info.anchor];
  const cx = (x0 + x1) / 2;
  const clip = uid('spot');
  const g = svg('g', { transform: `translate(${-ox} ${-oy}) translate(${cx} 0) scale(-1 1) translate(${-cx} 0)` });
  g.appendChild(svg('clipPath', { id: clip })).appendChild(svg('rect', { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }));
  g.appendChild(svg('image', { href: pictureUrl(id), width: info.size[0], height: info.size[1], 'clip-path': `url(#${clip})` }));
  return g;
}

// ── Kid ──────────────────────────────────────────────────────────────────

/** kid_siuu draws the boy's head smaller than kid_standing. */
const KID_SIUU_SCALE = 1.2;

/** A young fan in an oversized number 7 shirt. Standing faces left; origin between the feet. */
export class KidRig extends PoseRig<'standing' | 'siuu'> {
  constructor(options: RigOptions = {}) {
    super('Kid', { standing: 'kid_standing', siuu: scaled([picture('kid_siuu')], KID_SIUU_SCALE) }, 'standing', options);
  }
}
