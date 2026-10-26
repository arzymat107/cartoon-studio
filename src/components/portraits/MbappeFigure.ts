import { Actor, svg, uid, SVG_NS, type ActorOptions } from '@/engine';
import { smoothPath } from '../characters/face';
import type { Kit } from '../sport/Footballer';
import { createMbappePortrait } from './mbappe';
import { expressionMarkup, MBAPPE_EXPRESSIONS, type MbappeExpression } from './mbappeFace';

type Point = [number, number];

const SKIN = '#b27a54';
const SKIN_SHADE = '#8a5638';
const SKIN_DEEP = '#64381f';
const LINE = '#2b1a12';
const STROKE = 1.3;
/** Chest pivot above the hip: the spine bends here. */
const WAIST = -34;

/** Real Madrid home kit, no crest: white with gold trim and a navy 10. */
const MADRID_KIT: Kit = {
  shirt: '#f7f7f2', trim: '#c9a227', number: 10, numberColor: '#1b2a59', shorts: '#f7f7f2', socks: '#f7f7f2', boots: '#2a2a2a',
};

export interface MbappeBuild {
  upperArm: number;
  forearm: number;
  thigh: number;
  shin: number;
  /** Width multipliers for arms, legs and the torso; size of hands and boots. */
  armWidth: number;
  legWidth: number;
  torsoWidth: number;
  hand: number;
  foot: number;
}

/** Body types. The head stays the same, so the builds read as different caricature styles. */
export const MBAPPE_BUILDS = {
  /** Realistic-ish footballer proportions under a big head. */
  athletic: { upperArm: 60, forearm: 56, thigh: 104, shin: 88, armWidth: 1, legWidth: 1, torsoWidth: 1, hand: 1, foot: 1 },
  /** Long, thin limbs and big hands and feet, like the football-cartoon style. */
  lanky: { upperArm: 74, forearm: 68, thigh: 128, shin: 112, armWidth: 0.78, legWidth: 0.74, torsoWidth: 0.86, hand: 1.2, foot: 1.2 },
  /** Short and powerful: huge thighs, chunky arms, big boots. */
  stocky: { upperArm: 50, forearm: 46, thigh: 82, shin: 66, armWidth: 1.3, legWidth: 1.35, torsoWidth: 1.14, hand: 1.3, foot: 1.35 },
} satisfies Record<string, MbappeBuild>;

export type MbappePart =
  | 'leftArm' | 'rightArm' | 'leftForearm' | 'rightForearm'
  | 'leftLeg' | 'rightLeg' | 'leftShin' | 'rightShin' | 'torso' | 'chest' | 'head';

/** Relaxed standing pose: weight on the screen-left leg, the other knee soft, arms loose. */
export const MBAPPE_REST: Record<MbappePart, number> = {
  torso: 2, chest: -3, head: 3,
  leftLeg: 2, leftShin: 0, rightLeg: -7, rightShin: 9,
  leftArm: 9, leftForearm: -10, rightArm: -11, rightForearm: 14,
};

export interface MbappeFigureOptions extends ActorOptions {
  kit?: Kit;
  build?: keyof typeof MBAPPE_BUILDS | MbappeBuild;
  expression?: MbappeExpression;
}

/**
 * Full-body Mbappé in the style of the M1 portrait: the traced head on a shaded, big-head body.
 * Origin (0, 0) is between the feet. Arms and legs are drawn as one smooth shape each, bending
 * at the elbow and knee (no hinge joints), recomputed whenever a joint rotates.
 *
 * Rig (tween `rotation`, degrees; positive swings a limb towards the screen left):
 *   MbappeFigure
 *   ├─ leftLeg, rightLeg            hip   → leftShin, rightShin          knee
 *   └─ torso                        hip   (y = hipY)
 *      └─ chest                     waist (bends the spine)
 *         ├─ head                   neck  (y = headY)
 *         │  ├─ eyes, brows         expression layers; brows.y raises them
 *         │  ├─ leftLid, rightLid   scaleY 0 → 1 closes the eye
 *         │  └─ mouth               scaleY 0 = closed, 1 = wide open (talking)
 *         └─ leftArm, rightArm      shoulder → leftForearm, rightForearm  elbow
 */
export class MbappeFigure extends Actor {
  readonly kit: Kit;
  readonly build: MbappeBuild;
  /** Hip height (negative): the torso's resting y. */
  readonly hipY: number;
  /** Head's resting y in chest space. */
  readonly headY = -150 - WAIST;
  /** Height from the feet to the top of the hair, before scale. */
  readonly height: number;

  readonly torso: Actor;
  readonly chest: Actor;
  readonly head: Actor;
  readonly eyes: Actor;
  readonly brows: Actor;
  readonly leftLid: Actor;
  readonly rightLid: Actor;
  readonly mouth: Actor;
  readonly leftArm: Actor;
  readonly rightArm: Actor;
  readonly leftForearm: Actor;
  readonly rightForearm: Actor;
  readonly leftLeg: Actor;
  readonly rightLeg: Actor;
  readonly leftShin: Actor;
  readonly rightShin: Actor;
  /** Layers of each expression, shown by `setExpression()` / the `emote()` action. */
  readonly expressions = {} as Record<MbappeExpression, SVGElement[]>;

  /** Shirt number; un-mirrored when the figure is flipped so it stays readable. */
  private numberGroup?: SVGGElement;
  private readonly softId = uid('mbappe-soft');

  constructor({ kit = MADRID_KIT, build = 'athletic', expression = 'neutral', ...options }: MbappeFigureOptions = {}) {
    super({ name: 'MbappeFigure', ...options });
    this.kit = kit;
    const b = (this.build = typeof build === 'string' ? MBAPPE_BUILDS[build] : build);
    this.hipY = -(b.thigh + b.shin + 12);
    this.height = -this.hipY - WAIST - this.headY + 168;
    const filter = this.draw('filter', { id: this.softId, x: '-50%', y: '-50%', width: '200%', height: '200%' });
    filter.appendChild(svg('feGaussianBlur', { stdDeviation: 2.5 }));

    const legs = new Actor({ name: 'legs' });
    [this.leftLeg, this.leftShin] = this.leg(legs, -1);
    [this.rightLeg, this.rightShin] = this.leg(legs, 1);

    this.torso = new Actor({ name: 'torso', y: this.hipY, rotation: MBAPPE_REST.torso });
    this.chest = new Actor({ name: 'chest', y: WAIST, rotation: MBAPPE_REST.chest });
    this.drawShorts();
    this.drawShirt();

    this.head = new Actor({ name: 'head', y: this.headY, rotation: MBAPPE_REST.head });
    this.head.add(createMbappePortrait({ y: -12, scale: 0.2 }));
    // The figure draws its own neck and shirt.
    for (const part of this.head.el.querySelectorAll('[data-part="neck"], [data-part="shirt"]')) part.remove();
    [this.eyes, this.brows, this.leftLid, this.rightLid, this.mouth] = this.faceParts();

    const arms = new Actor({ name: 'arms', y: -WAIST });
    [this.leftArm, this.leftForearm] = this.arm(arms, -1);
    [this.rightArm, this.rightForearm] = this.arm(arms, 1);

    this.chest.add(this.head, arms);
    this.torso.add(this.chest);
    this.add(legs, this.torso);
    this.setExpression(expression);
    this.render();
  }

  /** Switch expression immediately. On a timeline use the `emote()` action, so seeking back restores it. */
  setExpression(name: MbappeExpression): void {
    for (const [key, layers] of Object.entries(this.expressions)) {
      for (const layer of layers) layer.style.opacity = key === name ? '1' : '0';
    }
  }

  protected override render(): void {
    super.render();
    this.numberGroup?.setAttribute('transform', this.scaleX < 0 ? 'scale(-1 1)' : '');
  }

  // ── Face ──────────────────────────────────────────────────────────────

  /** Expression layers, eyelids and the talking mouth, in the portrait's own 680 × 880 coordinates. */
  private faceParts(): [Actor, Actor, Actor, Actor, Actor] {
    const art = this.head.el.querySelector<SVGGElement>(':scope > g > g')!;
    const part = (name: string) => art.querySelector<SVGGElement>(`[data-part="${name}"]`)!;
    const neutral = { eyes: part('eyes'), brows: part('brows'), mouth: part('mouth') };

    const eyes = new Actor({ name: 'eyes' });
    const brows = new Actor({ name: 'brows' });
    const mouths = new Actor({ name: 'mouths' });
    for (const [layer, actor] of [['eyes', eyes], ['brows', brows], ['mouth', mouths]] as const) actor.el.appendChild(neutral[layer]);
    this.expressions.neutral = [neutral.eyes, neutral.brows, neutral.mouth];
    for (const name of MBAPPE_EXPRESSIONS) {
      if (name === 'neutral') continue;
      const markup = expressionMarkup(name);
      this.expressions[name] = [
        eyes.el.appendChild(fragment(markup.eyes)),
        brows.el.appendChild(fragment(markup.brows)),
        mouths.el.appendChild(fragment(markup.mouth)),
      ];
    }

    const lid = (name: string, x: number, y: number, cover: string, lash: string) => {
      const actor = new Actor({ name, x, y, scaleY: 0, opacity: 0 });
      const g = actor.draw('g', { transform: `translate(${-x} ${-y})` });
      g.appendChild(svg('path', { d: cover, fill: SKIN }));
      g.appendChild(svg('path', { d: lash, stroke: LINE, 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }));
      return actor;
    };
    const leftLid = lid('leftLid', 212, 396,
      'M 140 450 C 168 380 252 376 286 438 C 250 468 176 470 140 450 Z', 'M 154 448 C 190 462 236 460 272 442');
    const rightLid = lid('rightLid', 449, 382,
      'M 376 438 C 406 366 488 362 522 404 C 486 452 416 454 376 438 Z', 'M 390 436 C 424 450 470 448 508 422');

    const mouth = new Actor({ name: 'mouth', x: 352, y: 636, scaleY: 0 });
    const m = mouth.draw('g', { transform: 'translate(-352 -636)' });
    const clipId = uid('mbappe-talk');
    const opening = 'M238 650 C296 640 400 632 478 614 C470 690 420 742 352 744 C292 744 250 706 238 650 Z';
    m.appendChild(svg('clipPath', { id: clipId })).appendChild(svg('path', { d: opening }));
    m.appendChild(svg('path', { d: 'M248 696 C290 754 410 758 466 684 C454 742 410 768 352 770 C298 770 260 742 248 696 Z', fill: '#a5604c' }));
    m.appendChild(svg('path', { d: opening, fill: '#3a0e0b' }));
    const inside = m.appendChild(svg('g', { 'clip-path': `url(#${clipId})` }));
    inside.appendChild(svg('ellipse', { cx: 356, cy: 736, rx: 76, ry: 30, fill: '#b4505a' }));
    inside.appendChild(svg('path', { d: 'M230 600 L490 600 L490 640 C430 662 330 672 230 670 Z', fill: '#fbf8f1' }));
    m.appendChild(svg('path', { d: opening, fill: 'none', stroke: LINE, 'stroke-width': 4, 'stroke-linejoin': 'round' }));

    art.append(eyes.el, leftLid.el, rightLid.el, brows.el, mouths.el, mouth.el);
    return [eyes, brows, leftLid, rightLid, mouth];
  }

  // ── Torso ─────────────────────────────────────────────────────────────

  /** Shorts, in torso space (hip at 0, 0). */
  private drawShorts(): void {
    const { kit } = this;
    const fabric = shade(kit.shorts, 0.17);
    const g = this.torso.draw('g', { transform: `scale(${this.build.torsoWidth} 1)` });
    new Shape(g, kit.shorts, fabric, 9, this.softId)
      .set(smoothPath([[-44, -38], [-49, -6], [-54, 30], [-30, 36], [-7, 30], [0, 16], [7, 30], [30, 36], [54, 30], [49, -6], [44, -38], [0, -40]]));
    g.appendChild(svg('path', { d: 'M 0 -18 L 0 16', stroke: fabric, 'stroke-width': 1.5, fill: 'none' }));
  }

  /** Neck and shirt, in chest space but drawn in torso coordinates (shifted by the waist). */
  private drawShirt(): void {
    const { kit } = this;
    const neck = this.chest.draw('g', { transform: `translate(0 ${-WAIST})` });
    new Shape(neck, SKIN, SKIN_SHADE, 5, this.softId).set('M -14 -172 L 14 -172 Q 16 -150 20 -132 L -20 -132 Q -16 -150 -14 -172 Z');
    neck.appendChild(svg('path', { d: 'M -14 -156 Q 0 -146 14 -158', stroke: SKIN_DEEP, 'stroke-width': 4, fill: 'none', opacity: 0.45, 'stroke-linecap': 'round' }));

    const g = this.chest.draw('g', { transform: `translate(0 ${-WAIST}) scale(${this.build.torsoWidth} 1)` });
    const shirt = smoothPath([
      [-17, -142], [-46, -138], [-57, -124], [-53, -96], [-48, -62], [-49, -28], [-24, -18], [0, -16],
      [24, -18], [49, -28], [48, -62], [53, -96], [57, -124], [46, -138], [17, -142], [0, -128],
    ]);
    new Shape(g, kit.shirt, shade(kit.shirt, 0.17), 12, this.softId).set(shirt);
    for (const d of ['M -36 -112 Q -30 -86 -36 -60', 'M 34 -104 Q 26 -80 30 -52', 'M -24 -30 Q -6 -38 12 -28']) {
      g.appendChild(svg('path', { d, stroke: shade(kit.shirt, 0.12), 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }));
    }
    if (kit.stripes) {
      const clipId = uid('mbappe-kit');
      g.appendChild(svg('clipPath', { id: clipId })).appendChild(svg('path', { d: shirt }));
      const stripes = g.appendChild(svg('g', { 'clip-path': `url(#${clipId})`, opacity: 0.9 }));
      for (const x of [-38, -12, 14]) stripes.appendChild(svg('rect', { x, y: -150, width: 13, height: 140, fill: kit.stripes }));
    }
    g.appendChild(svg('path', { d: 'M -17 -141 Q 0 -122 17 -141', stroke: kit.trim ?? kit.shirt, 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round' }));
    if (kit.number !== undefined) {
      this.numberGroup = this.chest.draw('g');
      const label = svg('text', {
        x: 0, y: -60 - WAIST, 'text-anchor': 'middle',
        'font-family': 'Impact, "Arial Black", system-ui, sans-serif', 'font-size': 34,
        fill: kit.numberColor ?? '#fff', stroke: 'rgba(0,0,0,0.25)', 'stroke-width': 1.5, 'paint-order': 'stroke',
      });
      label.textContent = String(kit.number);
      this.numberGroup.appendChild(label);
    }
  }

  // ── Limbs ─────────────────────────────────────────────────────────────

  /** Arm from the shoulder, in torso coordinates. `side` −1 = screen left. */
  private arm(parent: Actor, side: -1 | 1): [Actor, Actor] {
    const { kit, build: b } = this;
    const w = b.armWidth;
    const prefix = side < 0 ? 'left' : 'right';
    return new Limb(parent, this.softId, {
      names: [`${prefix}Arm`, `${prefix}Forearm`],
      root: [side * 47 * b.torsoWidth, -124], lengths: [b.upperArm, b.forearm],
      rest: [MBAPPE_REST[`${prefix}Arm`], MBAPPE_REST[`${prefix}Forearm`]],
      widths: [[0, 11.5 * w], [0.22, 12 * w], [0.5, 8.5 * w], [0.66, 9.5 * w], [1, 6 * w]],
      covers: [{ from: 0, to: 0.36, extra: 4, color: kit.shirt, band: kit.trim, shoulder: true }],
      end: hand(side, b.hand), endTurn: 1, endOnTop: false,
    }).joints;
  }

  /** Leg from the hip, in figure coordinates. */
  private leg(parent: Actor, side: -1 | 1): [Actor, Actor] {
    const { kit, build: b } = this;
    const w = b.legWidth;
    const prefix = side < 0 ? 'left' : 'right';
    return new Limb(parent, this.softId, {
      names: [`${prefix}Leg`, `${prefix}Shin`],
      root: [side * 25 * b.torsoWidth, this.hipY], lengths: [b.thigh, b.shin],
      rest: [MBAPPE_REST[`${prefix}Leg`], MBAPPE_REST[`${prefix}Shin`]],
      widths: [[0, 22 * w], [0.2, 22.5 * w], [0.5, 12.5 * w], [0.66, 14.5 * w], [1, 7.5 * w]],
      covers: [{ from: 0.58, to: 1, extra: 1, color: kit.socks, band: kit.trim, bandAt: 0.06 }],
      end: boot(side, b.foot, kit.boots ?? '#1b1b1b'), endTurn: 0.7, endOnTop: true,
    }).joints;
  }
}

// ── Smooth limbs ─────────────────────────────────────────────────────────

/** An invisible rig joint: tweening it redraws the limb it belongs to. */
class Joint extends Actor {
  onChange?: () => void;
  protected override render(): void {
    super.render();
    this.onChange?.();
  }
}

interface Cover {
  from: number;
  to: number;
  /** Extra half-width over the limb. */
  extra: number;
  color: string;
  /** Trim line at the cover's open end (or `bandAt` along it, for socks). */
  band?: string;
  bandAt?: number;
  /** Starts with a rounder cap, for a sleeve over the shoulder. */
  shoulder?: boolean;
}

interface LimbSpec {
  names: [string, string];
  root: Point;
  lengths: [number, number];
  rest: [number, number];
  /** Half-width along the limb: [u (0 = root, 1 = tip), width]. */
  widths: [number, number][];
  covers: Cover[];
  /** Draws the hand / boot into a group, pointing down from the wrist / ankle. */
  end: (g: SVGGElement, softId: string) => void;
  /** How much the hand / boot turns with the lower segment (1 = fully). */
  endTurn: number;
  /** Boots go over the sock; hands go under the arm. */
  endOnTop: boolean;
}

/**
 * Two joints (upper and lower) drawn as one tapered shape along a smooth curve through
 * root → elbow/knee → wrist/ankle, with sleeve or sock covers and a hand or boot at the end.
 */
class Limb {
  readonly joints: [Joint, Joint];
  private readonly skin: Shape;
  private readonly covers: { cover: Cover; shape: Shape; band?: SVGPathElement }[];
  private readonly endGroup: SVGGElement;

  constructor(parent: Actor, softId: string, private readonly spec: LimbSpec) {
    const upper = new Joint({ name: spec.names[0], rotation: spec.rest[0] });
    const lower = new Joint({ name: spec.names[1], rotation: spec.rest[1] });
    this.joints = [upper, lower];
    const layer = parent.draw('g');
    this.endGroup = svg('g');
    spec.end(this.endGroup, softId);
    if (!spec.endOnTop) layer.appendChild(this.endGroup);
    this.skin = new Shape(layer, SKIN, SKIN_SHADE, 5, softId);
    this.covers = spec.covers.map((cover) => ({
      cover,
      shape: new Shape(layer, cover.color, shade(cover.color, 0.17), 7, softId),
      band: cover.band ? layer.appendChild(svg('path', { stroke: cover.band, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' })) : undefined,
    }));
    if (spec.endOnTop) layer.appendChild(this.endGroup);
    upper.onChange = lower.onChange = () => this.update();
    this.update();
  }

  private update(): void {
    const { root: S, lengths: [l1, l2], widths, endTurn } = this.spec;
    const a1 = rad(this.joints[0].rotation);
    const a2 = a1 + rad(this.joints[1].rotation);
    const E: Point = [S[0] - Math.sin(a1) * l1, S[1] + Math.cos(a1) * l1];
    const W: Point = [E[0] - Math.sin(a2) * l2, E[1] + Math.cos(a2) * l2];
    const curve = new Curve(S, E, W, l1 / (l1 + l2));
    const width = (u: number) => interpolate(widths, u);

    this.skin.set(curve.outline(0, 1, width));
    for (const { cover, shape, band } of this.covers) {
      shape.set(curve.outline(cover.from, cover.to, (u) => width(u) + cover.extra, cover.shoulder));
      if (band) {
        const at = cover.bandAt !== undefined ? cover.from + cover.bandAt : cover.to - 0.015;
        const { p, n } = curve.at(at);
        const w = width(at) + cover.extra - 1;
        band.setAttribute('d', `M ${f(p[0] + n[0] * w)} ${f(p[1] + n[1] * w)} L ${f(p[0] - n[0] * w)} ${f(p[1] - n[1] * w)}`);
      }
    }
    this.endGroup.setAttribute('transform', `translate(${f(W[0])} ${f(W[1])}) rotate(${f(deg(a2) * endTurn)})`);
  }
}

/** Smooth curve root → joint → tip (Hermite segments meeting at the joint), parameterized 0–1 by length. */
class Curve {
  constructor(private readonly S: Point, private readonly E: Point, private readonly W: Point, private readonly split: number) {}

  /** Point and unit normal at `u`. */
  at(u: number): { p: Point; n: Point } {
    const { S, E, W, split } = this;
    const mid: Point = [(W[0] - S[0]) / 2, (W[1] - S[1]) / 2];
    const [P0, P1, T0, T1, t]: [Point, Point, Point, Point, number] = u <= split
      ? [S, E, [E[0] - S[0], E[1] - S[1]], mid, u / split]
      : [E, W, mid, [W[0] - E[0], W[1] - E[1]], (u - split) / (1 - split)];
    const t2 = t * t;
    const t3 = t2 * t;
    const h = [2 * t3 - 3 * t2 + 1, t3 - 2 * t2 + t, -2 * t3 + 3 * t2, t3 - t2];
    const d = [6 * t2 - 6 * t, 3 * t2 - 4 * t + 1, -6 * t2 + 6 * t, 3 * t2 - 2 * t];
    const mix = (k: number[], i: 0 | 1) => k[0] * P0[i] + k[1] * T0[i] + k[2] * P1[i] + k[3] * T1[i];
    const tx = mix(d, 0);
    const ty = mix(d, 1);
    const len = Math.hypot(tx, ty) || 1;
    return { p: [mix(h, 0), mix(h, 1)], n: [-ty / len, tx / len] };
  }

  /** Closed outline between `from` and `to`, with rounded ends. */
  outline(from: number, to: number, width: (u: number) => number, roundStart = false): string {
    const steps = 14;
    const left: Point[] = [];
    const right: Point[] = [];
    for (let i = 0; i <= steps; i++) {
      const u = from + ((to - from) * i) / steps;
      const { p, n } = this.at(u);
      const w = width(u);
      left.push([p[0] + n[0] * w, p[1] + n[1] * w]);
      right.push([p[0] - n[0] * w, p[1] - n[1] * w]);
    }
    // Rounded end: a point beyond the end along the curve (sign 1 = forwards, −1 = backwards).
    const cap = (u: number, sign: number, size: number): Point => {
      const { p, n } = this.at(u);
      const w = width(u) * size;
      return [p[0] + n[1] * w * sign, p[1] - n[0] * w * sign];
    };
    return smoothPath([...left, cap(to, 1, 0.55), ...right.reverse(), cap(from, -1, roundStart ? 0.9 : 0.55)]);
  }
}

/** A filled shape shaded like the portrait (soft shadow on the right edge), redrawable with `set()`. */
class Shape {
  private readonly paths: SVGPathElement[];

  constructor(parent: Element, color: string, shadow: string, depth: number, softId: string) {
    const clipId = uid('mbappe-form');
    const clip = parent.appendChild(svg('clipPath', { id: clipId })).appendChild(svg('path'));
    const base = parent.appendChild(svg('path', { fill: shadow }));
    const light = parent.appendChild(svg('g', { 'clip-path': `url(#${clipId})` })).appendChild(svg('path', {
      fill: color, transform: `translate(${-depth} ${-depth * 0.3})`, filter: `url(#${softId})`,
    }));
    const line = parent.appendChild(svg('path', { fill: 'none', stroke: LINE, 'stroke-width': STROKE, 'stroke-linejoin': 'round' }));
    this.paths = [clip, base, light, line];
  }

  set(d: string): this {
    for (const path of this.paths) path.setAttribute('d', d);
    return this;
  }
}

function interpolate(table: [number, number][], u: number): number {
  for (let i = 1; i < table.length; i++) {
    const [u0, w0] = table[i - 1];
    const [u1, w1] = table[i];
    if (u <= u1) {
      const t = (u - u0) / (u1 - u0);
      return w0 + (w1 - w0) * t * t * (3 - 2 * t);
    }
  }
  return table[table.length - 1][1];
}

/** Relaxed open hand pointing down from the wrist, the thumb on the body side. */
function hand(side: -1 | 1, size: number) {
  return (g: SVGGElement, softId: string) => {
    const s = -side;
    const inner = g.appendChild(svg('g', { transform: `scale(${size})` }));
    new Shape(inner, SKIN, SKIN_SHADE, 3, softId).set(smoothPath([[s * 4, -2], [s * 11, 6], [s * 12, 13], [s * 8, 14], [s * 4, 8]]));
    new Shape(inner, SKIN, SKIN_SHADE, 3, softId)
      .set(smoothPath([[-6, -3], [-8.5, 6], [-8.5, 15], [-7, 22], [-3.5, 25], [0.5, 25.5], [4.5, 24], [7.5, 19], [8.5, 11], [8, 3], [6, -3]]));
    for (const x of [-3.5, 0.5, 4.5]) {
      inner.appendChild(svg('path', { d: `M ${x} 17 L ${x + 0.3} 24`, stroke: SKIN_DEEP, 'stroke-width': 1, 'stroke-linecap': 'round', opacity: 0.7 }));
    }
  };
}

/** Football boot under the ankle, toes pointing outwards. */
function boot(side: -1 | 1, size: number, color: string) {
  return (g: SVGGElement, softId: string) => {
    const inner = g.appendChild(svg('g', { transform: `scale(${size})` }));
    new Shape(inner, color, shade(color, 0.5), 5, softId).set(smoothPath([[-10, -8], [-14, 6], [side * 7 - 16, 13], [side * 7 + 16, 13], [14, 6], [10, -8]]));
    inner.appendChild(svg('path', { d: `M ${side * 3 - 8} 4 L ${side * 3 + 8} 4`, stroke: 'rgba(255,255,255,0.35)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  };
}

/** Parse trusted SVG markup into a group. */
function fragment(markup: string): SVGGElement {
  const doc = new DOMParser().parseFromString(`<svg xmlns="${SVG_NS}"><g>${markup}</g></svg>`, 'image/svg+xml');
  return document.importNode(doc.documentElement.firstElementChild as SVGGElement, true);
}

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const f = (n: number) => n.toFixed(1);

/** Darken a #rrggbb color by `amount` (0–1). */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(v * (1 - amount));
  return `rgb(${c(n >> 16)}, ${c((n >> 8) & 255)}, ${c(n & 255)})`;
}
