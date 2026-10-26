import { Actor, svg, uid, type ActorOptions } from '@/engine';
import { smoothPath } from '../characters/face';
import type { Kit } from '../sport/Footballer';
import { SvgArt, type SvgArtOptions } from '../SvgArt';
import { FIGURE_BUILDS, FIGURE_REST, type FigureBuild, type FigureBuildName } from './body';
import { COSTUMES, type Costume, type CostumeName } from './costumes';
import { FIGURE_EXPRESSIONS, expressionMarkup, type FigureExpression, type FaceSpec } from './expressions';
import { boot, hand, Limb } from './limbs';
import { fragment, LINE, Shape, shade, type Painter, type Point, type SkinPalette } from './paint';

/**
 * Everything that makes a player: a portrait traced from a photo plus the data to animate it.
 * One file per player in `figures/players/` (see `players/mbappe.ts` and the README).
 */
export interface FigureSpec {
  name: string;
  /**
   * Head-and-shoulders SVG traced in a 680 × 880 frame, chin near the bottom. Groups marked with
   * `data-part`: neck, shirt (removed on the body), eyes, brows, mouth (the neutral expression).
   */
  portrait: string;
  /** Prefix of the ids inside the portrait, renamed per copy so copies don't share clip paths. */
  idPrefix: string;
  /** Bottom of the chin in portrait coordinates: the pivot of the portrait. */
  chin: Point;
  skin: SkinPalette;
  /** Default kit. */
  kit: Kit;
  face: FaceSpec;
}

/** Scale of the 680 × 880 portrait on the body. */
const HEAD_SCALE = 0.2;
/** Chest pivot above the hip: the spine bends here. */
const WAIST = -34;

/** The portrait alone (head and shoulders) as an Actor, pivoted at the chin. Use `scale` to size it. */
export function createPortrait(spec: FigureSpec, options: Omit<SvgArtOptions, 'markup'> = {}): SvgArt {
  const markup = spec.portrait.replaceAll(`${spec.idPrefix}-`, `${uid(spec.idPrefix)}-`);
  return new SvgArt({ name: `${spec.name}Portrait`, markup, originX: spec.chin[0], originY: spec.chin[1], ...options });
}

export interface PortraitFigureOptions extends ActorOptions {
  /** Defaults to the player's kit. */
  kit?: Kit;
  build?: FigureBuildName | FigureBuild;
  expression?: FigureExpression;
  /** Dress up instead of the kit: 'generalissimo' or 'emperor'. */
  costume?: CostumeName;
}

/**
 * A real player as a full-body cartoon: the traced portrait head on a shaded, big-head body.
 * Origin (0, 0) is between the feet. Arms and legs are drawn as one smooth shape each, bending
 * at the elbow and knee (no hinge joints), recomputed whenever a joint rotates.
 * Animate it with `figureActions` from '@/animations'.
 *
 * Rig (tween `rotation`, degrees; positive swings a limb towards the screen left):
 *   PortraitFigure
 *   ├─ leftLeg, rightLeg            hip   → leftShin, rightShin          knee
 *   └─ torso                        hip   (y = hipY)
 *      └─ chest                     waist (bends the spine)
 *         ├─ head                   neck  (y = headY)
 *         │  ├─ eyes, brows         expression layers; brows.y raises them
 *         │  ├─ leftLid, rightLid   scaleY 0 → 1 closes the eye
 *         │  └─ mouth               scaleY 0 = closed, 1 = wide open (talking)
 *         └─ leftArm, rightArm      shoulder → leftForearm, rightForearm  elbow
 */
export class PortraitFigure extends Actor {
  readonly spec: FigureSpec;
  readonly kit: Kit;
  readonly costume: Costume | null;
  readonly build: FigureBuild;
  /** Hip height (negative): the torso's resting y. */
  readonly hipY: number;
  /** Head's resting y in chest space. */
  readonly headY = -150 - WAIST;
  /** Height from the feet to the top of the hair (or hat), before scale. */
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
  readonly expressions = {} as Record<FigureExpression, SVGElement[]>;

  /** Shirt number; un-mirrored when the figure is flipped so it stays readable. */
  private numberGroup?: SVGGElement;
  private readonly softId = uid('figure-soft');

  constructor(spec: FigureSpec, { kit = spec.kit, build = 'athletic', expression = 'neutral', costume, ...options }: PortraitFigureOptions = {}) {
    super({ name: spec.name, ...options });
    this.spec = spec;
    this.kit = kit;
    this.costume = costume ? COSTUMES[costume] : null;
    const b = (this.build = typeof build === 'string' ? FIGURE_BUILDS[build] : build);
    this.hipY = -(b.thigh + b.shin + 12);
    this.height = -this.hipY - WAIST - this.headY + 168 + (this.costume?.hatHeight ?? 0);
    const filter = this.draw('filter', { id: this.softId, x: '-50%', y: '-50%', width: '200%', height: '200%' });
    filter.appendChild(svg('feGaussianBlur', { stdDeviation: 2.5 }));

    const legs = new Actor({ name: 'legs' });
    [this.leftLeg, this.leftShin] = this.leg(legs, -1);
    [this.rightLeg, this.rightShin] = this.leg(legs, 1);

    this.torso = new Actor({ name: 'torso', y: this.hipY, rotation: FIGURE_REST.torso });
    this.chest = new Actor({ name: 'chest', y: WAIST, rotation: FIGURE_REST.chest });
    this.drawNeck();
    if (this.costume) {
      this.costume.hips(this.torso.draw('g'), this.painter);
      this.costume.chest(this.chest.draw('g', { transform: `translate(0 ${-WAIST})` }), this.painter);
    } else {
      this.drawShorts();
      this.drawShirt();
    }

    this.head = new Actor({ name: 'head', y: this.headY, rotation: FIGURE_REST.head });
    this.head.add(createPortrait(spec, { y: -12, scale: HEAD_SCALE }));
    // The figure draws its own neck and shirt.
    for (const part of this.head.el.querySelectorAll('[data-part="neck"], [data-part="shirt"]')) part.remove();
    [this.eyes, this.brows, this.leftLid, this.rightLid, this.mouth] = this.faceParts();

    const arms = new Actor({ name: 'arms', y: -WAIST });
    [this.leftArm, this.leftForearm] = this.arm(arms, -1);
    [this.rightArm, this.rightForearm] = this.arm(arms, 1);

    this.chest.add(this.head, arms);
    if (this.costume) {
      this.costume.shoulders(this.chest.draw('g', { transform: `translate(0 ${-WAIST})` }), this.painter, 47 * b.torsoWidth);
      this.costume.hat(this.head.draw('g'), this.painter);
    }
    this.torso.add(this.chest);
    this.add(legs, this.torso);
    this.setExpression(expression);
    this.render();
  }

  /** Switch expression immediately. On a timeline use the `emote()` action, so seeking back restores it. */
  setExpression(name: FigureExpression): void {
    for (const [key, layers] of Object.entries(this.expressions)) {
      for (const layer of layers) layer.style.opacity = key === name ? '1' : '0';
    }
  }

  protected override render(): void {
    super.render();
    this.numberGroup?.setAttribute('transform', this.scaleX < 0 ? 'scale(-1 1)' : '');
  }

  /** Draws costume parts with the figure's shading. */
  private get painter(): Painter {
    return { shape: (parent, d, color, depth = 6) => new Shape(parent, color, shade(color, 0.2), depth, this.softId).set(d) };
  }

  // ── Face ──────────────────────────────────────────────────────────────

  /** FigureExpression layers, eyelids and the talking mouth, in the portrait's own 680 × 880 coordinates. */
  private faceParts(): [Actor, Actor, Actor, Actor, Actor] {
    const { face, skin } = this.spec;
    const art = this.head.el.querySelector<SVGGElement>(':scope > g > g')!;
    const part = (name: string) => art.querySelector<SVGGElement>(`[data-part="${name}"]`)!;
    const neutral = { eyes: part('eyes'), brows: part('brows'), mouth: part('mouth') };

    const eyes = new Actor({ name: 'eyes' });
    const brows = new Actor({ name: 'brows' });
    const mouths = new Actor({ name: 'mouths' });
    for (const [layer, actor] of [['eyes', eyes], ['brows', brows], ['mouth', mouths]] as const) actor.el.appendChild(neutral[layer]);
    this.expressions.neutral = [neutral.eyes, neutral.brows, neutral.mouth];
    for (const name of FIGURE_EXPRESSIONS) {
      if (name === 'neutral') continue;
      const markup = expressionMarkup(face, name);
      this.expressions[name] = [
        eyes.el.appendChild(fragment(markup.eyes)),
        brows.el.appendChild(fragment(markup.brows)),
        mouths.el.appendChild(fragment(markup.mouth)),
      ];
    }

    const [leftLid, rightLid] = face.lids.map(({ pivot: [x, y], cover, lash }, i) => {
      const actor = new Actor({ name: i ? 'rightLid' : 'leftLid', x, y, scaleY: 0, opacity: 0 });
      const g = actor.draw('g', { transform: `translate(${-x} ${-y})` });
      g.appendChild(svg('path', { d: cover, fill: skin.base }));
      g.appendChild(svg('path', { d: lash, stroke: LINE, 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }));
      return actor;
    });

    const [mx, my] = face.talk.pivot;
    const mouth = new Actor({ name: 'mouth', x: mx, y: my, scaleY: 0 });
    mouth.draw('g', { transform: `translate(${-mx} ${-my})` }).appendChild(fragment(face.talk.markup(uid('figure-talk'))));

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

  /** Neck, in chest space but drawn in torso coordinates (shifted by the waist). */
  private drawNeck(): void {
    const { skin } = this.spec;
    const neck = this.chest.draw('g', { transform: `translate(0 ${-WAIST})` });
    new Shape(neck, skin.base, skin.shade, 5, this.softId).set('M -14 -172 L 14 -172 Q 16 -150 20 -132 L -20 -132 Q -16 -150 -14 -172 Z');
    neck.appendChild(svg('path', { d: 'M -14 -156 Q 0 -146 14 -158', stroke: skin.deep, 'stroke-width': 4, fill: 'none', opacity: 0.45, 'stroke-linecap': 'round' }));
  }

  /** Kit shirt and number, in chest space but drawn in torso coordinates (shifted by the waist). */
  private drawShirt(): void {
    const { kit } = this;
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
      const clipId = uid('figure-kit');
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
    const { kit, build: b, costume } = this;
    const w = b.armWidth;
    const prefix = side < 0 ? 'left' : 'right';
    return new Limb(parent, this.softId, {
      names: [`${prefix}Arm`, `${prefix}Forearm`],
      root: [side * 47 * b.torsoWidth, -124], lengths: [b.upperArm, b.forearm],
      rest: [FIGURE_REST[`${prefix}Arm`], FIGURE_REST[`${prefix}Forearm`]],
      skin: this.spec.skin,
      widths: [[0, 11.5 * w], [0.22, 12 * w], [0.5, 8.5 * w], [0.66, 9.5 * w], [1, 6 * w]],
      covers: costume
        ? [{ from: 0, to: 0.97, extra: 3.5, color: costume.sleeve, band: costume.cuff, shoulder: true }]
        : [{ from: 0, to: 0.36, extra: 4, color: kit.shirt, band: kit.trim, shoulder: true }],
      end: hand(side, b.hand, this.spec.skin), endTurn: 1, endOnTop: false,
    }).joints;
  }

  /** Leg from the hip, in figure coordinates. */
  private leg(parent: Actor, side: -1 | 1): [Actor, Actor] {
    const { kit, build: b, costume } = this;
    const w = b.legWidth;
    const prefix = side < 0 ? 'left' : 'right';
    return new Limb(parent, this.softId, {
      names: [`${prefix}Leg`, `${prefix}Shin`],
      root: [side * 25 * b.torsoWidth, this.hipY], lengths: [b.thigh, b.shin],
      rest: [FIGURE_REST[`${prefix}Leg`], FIGURE_REST[`${prefix}Shin`]],
      skin: this.spec.skin,
      widths: [[0, 22 * w], [0.2, 22.5 * w], [0.5, 12.5 * w], [0.66, 14.5 * w], [1, 7.5 * w]],
      covers: costume
        // Trousers or breeches, then tall riding boots.
        ? [{ from: 0, to: 0.66, extra: 3, color: costume.trousers }, { from: 0.56, to: 1, extra: 2.5, color: costume.boots }]
        : [{ from: 0.58, to: 1, extra: 1, color: kit.socks, band: kit.trim, bandAt: 0.06 }],
      end: boot(side, b.foot, costume?.boots ?? kit.boots ?? '#1b1b1b'), endTurn: 0.7, endOnTop: true,
    }).joints;
  }
}
