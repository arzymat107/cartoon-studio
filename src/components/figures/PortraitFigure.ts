import { Actor, svg, uid, type ActorOptions } from '@/engine';
import { smoothPath } from '../characters/face';
import type { Kit } from '../sport/Footballer';
import { SvgArt, type SvgArtOptions } from '../SvgArt';
import { FIGURE_BUILDS, FIGURE_REST, type FigureBuild, type FigureBuildName } from './body';
import { COSTUMES, type Costume, type CostumeName } from './costumes';
import { FIGURE_EXPRESSIONS, expressionMarkup, type FigureExpression, type FaceSpec } from './expressions';
import { boot, Curve, hand, Joint, Limb } from './limbs';
import { f, fragment, LINE, Shape, shade, STROKE, type Look, type Painter, type Point, type SkinPalette } from './paint';

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
  /** Default kit and build. */
  kit: Kit;
  build?: FigureBuildName | FigureBuild;
  /**
   * Signature look, used unless the options say otherwise – what makes the player recognizable
   * in the cartoons: a costume (Mbappé the dictator) or how he wears his shorts (Yamal).
   */
  costume?: CostumeName;
  shorts?: ShortsStyle;
  face: FaceSpec;
  /**
   * 'painted' (default): soft shading and fine outlines, for portraits traced from photos.
   * 'cartoon': hard cel shadows and bold outlines, for fully drawn caricature heads.
   */
  style?: 'painted' | 'cartoon';
  /** Size of the head on the body (default 0.2); caricatures go bigger. */
  headScale?: number;
}

/**
 * 'low' = pulled down: sagging off the hips to the knees, the undershorts' waistband showing.
 * 'baggy' = the caricature: huge basketball-style shorts in one piece, hanging off the hips past the
 *   knees and flapping as he moves.
 */
export type ShortsStyle = 'normal' | 'low' | 'baggy';

/** Default scale of the 680 × 880 portrait on the body. */
const HEAD_SCALE = 0.2;
/** Outline width of the body in the 'cartoon' style. */
const CARTOON_STROKE = 2.2;
/** Chest pivot above the hip: the spine bends here. */
const WAIST = -34;

/** The portrait alone (head and shoulders) as an Actor, pivoted at the chin. Use `scale` to size it. */
export function createPortrait(spec: FigureSpec, options: Omit<SvgArtOptions, 'markup'> = {}): SvgArt {
  const markup = spec.portrait.replaceAll(`${spec.idPrefix}-`, `${uid(spec.idPrefix)}-`);
  return new SvgArt({ name: `${spec.name}Portrait`, markup, originX: spec.chin[0], originY: spec.chin[1], ...options });
}

export interface PortraitFigureOptions extends ActorOptions {
  /** Default: the player's kit and build. */
  kit?: Kit;
  build?: FigureBuildName | FigureBuild;
  expression?: FigureExpression;
  /** Dress up: 'generalissimo', 'emperor' or 'tuxedo'; 'kit' = the football kit even if the player's signature is a costume. */
  costume?: CostumeName | 'kit';
  /** Default: the player's signature. */
  shorts?: ShortsStyle;
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
  readonly headY: number;
  /** Height from the feet to the top of the hair (or hat), before scale. */
  readonly height: number;

  readonly torso: Actor;
  /** The shorts (or a costume's coat skirt) on the hips: move `y` to hitch them up. */
  readonly shorts: Actor;
  readonly shortsStyle: ShortsStyle;
  /** The baggy shorts (empty for other styles), pivot at the waistband: tween `rotation` / `scaleX` to flap them. */
  readonly shortsFlaps: Actor[] = [];
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
  readonly leftLeg: Joint;
  readonly rightLeg: Joint;
  readonly leftShin: Joint;
  readonly rightShin: Joint;
  /** Layers of each expression, shown by `setExpression()` / the `emote()` action. */
  readonly expressions = {} as Record<FigureExpression, SVGElement[]>;

  /** Shirt number; un-mirrored when the figure is flipped so it stays readable. */
  private numberGroup?: SVGGElement;
  private readonly softId = uid('figure-soft');
  /** How the body is shaded and outlined (see `FigureSpec.style`). */
  private readonly look: Look;

  constructor(spec: FigureSpec, { kit = spec.kit, build = spec.build ?? 'athletic', expression = 'neutral', costume = spec.costume, shorts = spec.shorts ?? 'normal', ...options }: PortraitFigureOptions = {}) {
    super({ name: spec.name, ...options });
    this.spec = spec;
    this.kit = kit;
    this.costume = costume && costume !== 'kit' ? COSTUMES[costume] : null;
    this.shortsStyle = shorts;
    const b: FigureBuild = (this.build = typeof build === 'string' ? FIGURE_BUILDS[build] : build);
    this.hipY = -(b.thigh + b.shin + 12);
    this.headY = -150 * (b.torso ?? 1) - (b.neck ?? 0) - WAIST;
    const headScale = spec.headScale ?? HEAD_SCALE;
    this.height = -this.hipY - WAIST - this.headY + 168 * (headScale / HEAD_SCALE) + (this.costume?.hatHeight ?? 0);
    this.look = spec.style === 'cartoon' ? { stroke: CARTOON_STROKE } : { soft: this.softId, stroke: STROKE };
    const filter = this.draw('filter', { id: this.softId, x: '-50%', y: '-50%', width: '200%', height: '200%' });
    filter.appendChild(svg('feGaussianBlur', { stdDeviation: 2.5 }));

    const legs = new Actor({ name: 'legs' });
    [this.leftLeg, this.leftShin] = this.leg(legs, -1);
    [this.rightLeg, this.rightShin] = this.leg(legs, 1);

    this.torso = new Joint({ name: 'torso', y: this.hipY, rotation: FIGURE_REST.torso });
    this.chest = new Actor({ name: 'chest', y: WAIST, rotation: FIGURE_REST.chest });
    this.shorts = new Actor({ name: 'shorts' });
    this.drawNeck();
    if (this.costume) {
      this.torso.add(this.shorts);
      this.costume.hips(this.shorts.draw('g'), this.painter);
      this.costume.chest(this.chest.draw('g', { transform: `translate(0 ${-WAIST}) scale(1 ${b.torso ?? 1})` }), this.painter);
    } else {
      this.drawShorts();
      this.drawShirt();
    }

    this.head = new Actor({ name: 'head', y: this.headY, rotation: FIGURE_REST.head });
    this.head.add(createPortrait(spec, { y: -12, scale: headScale }));
    // The figure draws its own neck and shirt.
    for (const part of this.head.el.querySelectorAll('[data-part="neck"], [data-part="shirt"]')) part.remove();
    [this.eyes, this.brows, this.leftLid, this.rightLid, this.mouth] = this.faceParts();

    const arms = new Actor({ name: 'arms', y: -WAIST });
    [this.leftArm, this.leftForearm] = this.arm(arms, -1);
    [this.rightArm, this.rightForearm] = this.arm(arms, 1);

    this.chest.add(this.head, arms);
    if (this.costume) {
      this.costume.shoulders(this.chest.draw('g', { transform: `translate(0 ${-WAIST}) scale(1 ${b.torso ?? 1})` }), this.painter, 47 * b.torsoWidth);
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
    return { shape: (parent, d, color, depth = 6) => new Shape(parent, color, shade(color, 0.2), depth, this.look).set(d) };
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

  /** Shorts, in torso space (hip at 0, 0). Pulled-down shorts also get leg covers to the knees (see `leg()`). */
  private drawShorts(): void {
    const { kit } = this;
    const fabric = shade(kit.shorts, 0.17);
    const scale = `scale(${this.build.torsoWidth} 1)`;
    if (this.shortsStyle !== 'normal') {
      // Black undershorts with a white waistband, showing between the shirt and the sagging shorts.
      const under = this.torso.draw('g', { transform: scale });
      new Shape(under, '#1d1d1f', '#0e0e10', 6, this.look).set(smoothPath([[-47, -28], [-49, 0], [-50, 30], [0, 36], [50, 30], [49, 0], [47, -28], [0, -30]]));
      new Shape(under, '#f2f2f2', '#c9c9c9', 2, this.look).set('M -47 -26 Q 0 -32 47 -26 L 48 -12 Q 0 -18 -48 -12 Z');
    }
    this.torso.add(this.shorts);
    const g = this.shorts.draw('g', { transform: scale });
    if (this.shortsStyle === 'low') {
      // The waistband sags lower in the middle; the drawstrings dangle.
      new Shape(g, kit.shorts, fabric, 9, this.look)
        .set(smoothPath([[-52, 0], [-26, 8], [0, 14], [26, 8], [52, 0], [58, 22], [62, 44], [10, 46], [0, 36], [-10, 46], [-62, 44], [-58, 22]]));
      g.appendChild(svg('path', { d: 'M -52 6 Q 0 22 52 6', stroke: kit.trim ?? fabric, 'stroke-width': 3, fill: 'none' }));
      g.appendChild(svg('path', { d: 'M -4 16 Q -8 30 -5 40 M 4 16 Q 9 28 7 38', stroke: '#f2f2f2', 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' }));
      return;
    }
    if (this.shortsStyle === 'baggy') {
      // One piece hanging off the hips like oversized basketball shorts: the waistband dips low in
      // the middle, two wide legs flare out past the knees. Pivot at the waistband, so it can flap.
      const L = this.build.thigh;
      const flap = new Actor({ name: 'shortsFlap', y: 20 });
      const d = flap.draw('g', { transform: 'translate(0 -20)' });
      const crotch = L * 0.52;
      new Shape(d, kit.shorts, fabric, 12, this.look).set(smoothPath([
        [-58, 12], [-28, 22], [0, 30], [28, 22], [58, 12], [68, 40], [76, L * 0.55], [84, L],
        [58, L + 7], [32, L + 3], [12, L + 6], [4, crotch + 14], [0, crotch], [-4, crotch + 14], [-12, L + 6], [-32, L + 3], [-58, L + 7],
        [-84, L], [-76, L * 0.55], [-68, 40],
      ]));
      // Side stripes, folds and hems.
      for (const side of [-1, 1]) {
        d.appendChild(svg('path', { d: `M ${side * 64} 30 Q ${side * 74} ${L * 0.55} ${side * 80} ${L - 2}`, stroke: kit.trim ?? shade(kit.shorts, 0.3), 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }));
        d.appendChild(svg('path', { d: `M ${side * 30} ${L * 0.5} Q ${side * 36} ${L * 0.8} ${side * 34} ${L - 2}`, stroke: fabric, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }));
        d.appendChild(svg('path', { d: `M ${side * 82} ${L - 2} Q ${side * 46} ${L + 6} ${side * 12} ${L + 3}`, stroke: shade(kit.shorts, 0.3), 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' }));
      }
      d.appendChild(svg('path', { d: `M 0 ${crotch} L 0 ${crotch - 22}`, stroke: fabric, 'stroke-width': 2, fill: 'none' }));
      d.appendChild(svg('path', { d: 'M -58 18 Q 0 40 58 18', stroke: kit.trim ?? fabric, 'stroke-width': 3.5, fill: 'none' }));
      d.appendChild(svg('path', { d: 'M -4 32 Q -12 52 -6 70 M 4 32 Q 12 50 9 66', stroke: '#f2f2f2', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }));
      this.shorts.el.appendChild(flap.el);
      this.shortsFlaps.push(flap);
      return;
    }
    new Shape(g, kit.shorts, fabric, 9, this.look)
      .set(smoothPath([[-44, -38], [-49, -6], [-50, 18], [-30, 26], [-7, 24], [0, 16], [7, 24], [30, 26], [50, 18], [49, -6], [44, -38], [0, -40]]));
    g.appendChild(svg('path', { d: 'M 0 -18 L 0 16', stroke: fabric, 'stroke-width': 1.5, fill: 'none' }));
    this.drawShortsLegs(fabric);
  }

  /**
   * The legs of normal shorts, a little way down the thighs and moving with them. Drawn over the hip
   * piece and clipped just below the waistband, so the shorts read as one piece, not two.
   */
  private drawShortsLegs(fabric: string): void {
    const { kit, build: b } = this;
    const clipId = uid('figure-shorts');
    this.shorts.draw('clipPath', { id: clipId }).appendChild(svg('rect', { x: -300, y: 2, width: 600, height: 600 }));
    // Leg geometry is in figure space: undo the torso's transform.
    const layer = this.shorts.draw('g', { 'clip-path': `url(#${clipId})` }).appendChild(svg('g'));
    const legs = ([[-1, this.leftLeg, this.leftShin], [1, this.rightLeg, this.rightShin]] as const).map(([side, thigh, shin]) => ({
      side, thigh, shin,
      shape: new Shape(layer, kit.shorts, fabric, 9, this.look),
      hem: layer.appendChild(svg('path', { stroke: shade(kit.shorts, 0.3), 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' })),
    }));
    const LENGTH = 0.29;
    const width = (u: number) => (27 + u * 6) * b.legWidth;
    const update = () => {
      const t = this.torso;
      layer.setAttribute('transform', `scale(${1 / t.scaleX} ${1 / t.scaleY}) rotate(${-t.rotation}) translate(${-t.x} ${-t.y})`);
      for (const { side, thigh, shin, shape, hem } of legs) {
        const S: Point = [side * 25 * b.torsoWidth, this.hipY];
        const a1 = (thigh.rotation * Math.PI) / 180;
        const a2 = a1 + (shin.rotation * Math.PI) / 180;
        const E: Point = [S[0] - Math.sin(a1) * b.thigh, S[1] + Math.cos(a1) * b.thigh];
        const W: Point = [E[0] - Math.sin(a2) * b.shin, E[1] + Math.cos(a2) * b.shin];
        const curve = new Curve(S, E, W, b.thigh / (b.thigh + b.shin));
        shape.set(curve.outline(0, LENGTH, width));
        const { p, n } = curve.at(LENGTH - 0.02);
        const w = width(LENGTH) - 2;
        hem.setAttribute('d', `M ${f(p[0] + n[0] * w)} ${f(p[1] + n[1] * w)} L ${f(p[0] - n[0] * w)} ${f(p[1] - n[1] * w)}`);
      }
    };
    for (const joint of [this.torso as Joint, this.leftLeg, this.leftShin, this.rightLeg, this.rightShin]) joint.listeners.push(update);
    update();
  }

  /** Neck, in chest space but drawn in torso coordinates (shifted by the waist). */
  private drawNeck(): void {
    const { skin } = this.spec;
    const { torso = 1, neckWidth: w = 1 } = this.build;
    const neck = this.chest.draw('g', { transform: `translate(0 ${-WAIST})` });
    // From under the head down into the collar.
    const top = this.headY + WAIST - 22;
    const bottom = -132 * torso;
    const mid = (top + bottom) / 2 + 4;
    new Shape(neck, skin.base, skin.shade, 5, this.look)
      .set(`M ${-14 * w} ${top} L ${14 * w} ${top} Q ${16 * w} ${mid} ${20 * w} ${bottom} L ${-20 * w} ${bottom} Q ${-16 * w} ${mid} ${-14 * w} ${top} Z`);
    neck.appendChild(svg('path', { d: 'M -14 -156 Q 0 -146 14 -158', stroke: skin.deep, 'stroke-width': 4, fill: 'none', opacity: 0.45, 'stroke-linecap': 'round' }));
  }

  /** Kit shirt and number, in chest space but drawn in torso coordinates (shifted by the waist). */
  private drawShirt(): void {
    const { kit } = this;
    const g = this.chest.draw('g', { transform: `translate(0 ${-WAIST}) scale(${this.build.torsoWidth} ${this.build.torso ?? 1})` });
    const shirt = smoothPath([
      [-17, -142], [-46, -138], [-57, -124], [-53, -96], [-48, -62], [-49, -28], [-24, -18], [0, -16],
      [24, -18], [49, -28], [48, -62], [53, -96], [57, -124], [46, -138], [17, -142], [0, -128],
    ]);
    new Shape(g, kit.shirt, shade(kit.shirt, 0.17), 12, this.look).set(shirt);
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
        x: 0, y: -60 * (this.build.torso ?? 1) - WAIST, 'text-anchor': 'middle',
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
    return new Limb(parent, this.look, {
      names: [`${prefix}Arm`, `${prefix}Forearm`],
      root: [side * 47 * b.torsoWidth, -124 * (b.torso ?? 1)], lengths: [b.upperArm, b.forearm],
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
  private leg(parent: Actor, side: -1 | 1): [Joint, Joint] {
    const { kit, build: b, costume } = this;
    const w = b.legWidth;
    const prefix = side < 0 ? 'left' : 'right';
    return new Limb(parent, this.look, {
      names: [`${prefix}Leg`, `${prefix}Shin`],
      root: [side * 25 * b.torsoWidth, this.hipY], lengths: [b.thigh, b.shin],
      rest: [FIGURE_REST[`${prefix}Leg`], FIGURE_REST[`${prefix}Shin`]],
      skin: this.spec.skin,
      widths: [[0, 22 * w], [0.2, 22.5 * w], [0.5, 12.5 * w], [0.66, 14.5 * w], [1, 7.5 * w]],
      covers: costume
        // Trousers or breeches, then tall riding boots.
        ? [{ from: 0, to: 0.66, extra: 3, color: costume.trousers }, { from: 0.56, to: 1, extra: 2.5, color: costume.boots }]
        : [
          { from: 0.58, to: 1, extra: 1, color: kit.socks, band: kit.trim, bandAt: 0.06 },
          // Pulled-down shorts: baggy legs down to the knees.
          ...(this.shortsStyle === 'low' ? [{ from: 0.06, to: 0.5, extra: 9, color: kit.shorts, band: kit.trim ?? shade(kit.shorts, 0.3) }] : []),
        ],
      end: boot(side, b.foot, costume?.boots ?? kit.boots ?? '#1b1b1b'), endTurn: 0.7, endOnTop: true,
    }).joints;
  }
}
