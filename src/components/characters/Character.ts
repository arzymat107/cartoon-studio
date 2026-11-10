import { Actor, type ActorOptions } from '@/engine';
import { MOUTH_RANGE, type Expression, type ExpressionLayers } from './expressions';
import { DEFAULT_FACE, drawDetailedHead, type FaceFeatures } from './face';

export interface CharacterLook {
  skin: string;
  hair: string;
  shirt: string;
  /** Trousers, or shorts when `legWear` is 'shorts'. */
  pants: string;
  shoes: string;
  /** 'quiff' = styled up at the front. */
  hairStyle: 'short' | 'long' | 'quiff' | 'bald';
  /** Beard color, or null for clean-shaven. */
  beard: string | null;
  sleeves: 'long' | 'short';
  legWear: 'pants' | 'shorts';
  /** Sock color (only visible with shorts). */
  socks: string;
  /** Head size multiplier: > 1 for a caricature. */
  headScale: number;
}

/** Settings for the synthesized gibberish voice used when a line has no recording. */
export interface CharacterVoice {
  /** 1 = medium, 0.8 = deeper, 1.5 = higher. */
  pitch: number;
  wave: OscillatorType;
}

export interface CharacterOptions extends ActorOptions, Partial<CharacterLook> {
  /** `false` = silent when talking. */
  voice?: Partial<CharacterVoice> | false;
  /**
   * Detailed face (shaped jaw, irises, eyebrows, nose, lips, layered hair and beard).
   * Leave out for the simple round cartoon face.
   */
  face?: Partial<FaceFeatures>;
  /** Starting expression (detailed face only). Change it on a timeline with `emote()`. */
  expression?: Expression;
}

const DEFAULT_LOOK: CharacterLook = {
  skin: '#ffd7b5',
  hair: '#4a2c1a',
  shirt: '#3a86ff',
  pants: '#2b2d42',
  shoes: '#1b1b1b',
  hairStyle: 'short',
  beard: null,
  sleeves: 'long',
  legWear: 'pants',
  socks: '#ffffff',
  headScale: 1,
};

/**
 * A rigged cartoon person. Origin (0, 0) is between the feet, so `y` is the ground line.
 * Faces right by default; set a negative scaleX to face left.
 *
 * Rig (every part is an Actor that can be tweened on its own):
 *   Character
 *   ├─ leftLeg, rightLeg      pivot: hip
 *   └─ torso                  pivot: hip
 *      ├─ torsoDetail         layer for subclasses (stripes, numbers, logos…)
 *      ├─ leftArm, rightArm   pivot: shoulder
 *      └─ head                pivot: neck
 *         ├─ eyes             scaleY → blink
 *         ├─ brows            y → raise in surprise (detailed face only)
 *         └─ mouth            scaleY → talk
 *   Detailed faces hold one layer per expression in eyes, brows, mouth and head (see `emote()`).
 */
export class Character extends Actor {
  /** Resting arm angle (left arm +, right arm −). */
  static readonly ARM_REST = 12;
  static readonly TORSO_Y = -70;
  static readonly MOUTH_REST = 0.3;

  readonly look: CharacterLook;
  readonly face: FaceFeatures | null;
  readonly voice: CharacterVoice | null;
  readonly brows: Actor;
  /** Top of the hair in head space (negative), measured while drawing. */
  private headTop = -86;
  /** Layers of each expression (detailed face only), shown by `emote()`. */
  readonly expressions: ExpressionLayers | null = null;
  /** Mouth scaleY at rest and fully open; set by `emote()`, used by `talk()`. */
  mouthRest = Character.MOUTH_REST;
  mouthOpen = 1;
  readonly torso: Actor;
  /** Drawn on top of the shirt but under the arms and head. */
  readonly torsoDetail: Actor;
  readonly head: Actor;
  readonly eyes: Actor;
  readonly mouth: Actor;
  readonly leftArm: Actor;
  readonly rightArm: Actor;
  readonly leftLeg: Actor;
  readonly rightLeg: Actor;

  constructor(options: CharacterOptions = {}) {
    const {
      skin, hair, shirt, pants, shoes, hairStyle, beard, sleeves, legWear, socks, headScale, voice, face, expression,
      ...actorOptions
    } = options;
    super({ name: 'Character', ...actorOptions });
    this.face = face ? { ...DEFAULT_FACE, ...face } : null;
    this.voice = voice === false ? null : { pitch: voice?.pitch ?? 1, wave: voice?.wave ?? 'triangle' };
    const look: CharacterLook = (this.look = {
      skin: skin ?? DEFAULT_LOOK.skin,
      hair: hair ?? DEFAULT_LOOK.hair,
      shirt: shirt ?? DEFAULT_LOOK.shirt,
      pants: pants ?? DEFAULT_LOOK.pants,
      shoes: shoes ?? DEFAULT_LOOK.shoes,
      hairStyle: hairStyle ?? DEFAULT_LOOK.hairStyle,
      beard: beard ?? DEFAULT_LOOK.beard,
      sleeves: sleeves ?? DEFAULT_LOOK.sleeves,
      legWear: legWear ?? DEFAULT_LOOK.legWear,
      socks: socks ?? DEFAULT_LOOK.socks,
      headScale: headScale ?? DEFAULT_LOOK.headScale,
    });

    const shorts = look.legWear === 'shorts';
    const legCovers = shorts ? [{ from: 0.45, color: look.socks }] : [];
    const legBase = shorts ? look.skin : look.pants;
    this.leftLeg = limb('leftLeg', -14, Character.TORSO_Y, 62, 20, legBase, look.shoes, 'foot', 0, legCovers);
    this.rightLeg = limb('rightLeg', 14, Character.TORSO_Y, 62, 20, legBase, look.shoes, 'foot', 0, legCovers);

    this.torso = new Actor({ name: 'torso', y: Character.TORSO_Y });
    if (shorts) this.torso.draw('rect', { x: -33, y: -12, width: 66, height: 36, rx: 10, fill: look.pants });
    this.torso.draw('rect', { x: -32, y: -95, width: 64, height: 100, rx: 26, fill: look.shirt });
    this.torsoDetail = new Actor({ name: 'torsoDetail' });

    const arm = Character.ARM_REST;
    const armBase = look.sleeves === 'short' ? look.skin : look.shirt;
    const sleeve = look.sleeves === 'short' ? [{ from: 0, to: 0.4, color: look.shirt }] : [];
    this.leftArm = limb('leftArm', -30, -78, 64, 16, armBase, look.skin, 'hand', arm, sleeve);
    this.rightArm = limb('rightArm', 30, -78, 64, 16, armBase, look.skin, 'hand', -arm, sleeve);

    this.head = new Actor({ name: 'head', y: -92, scale: look.headScale });
    this.eyes = new Actor({ name: 'eyes', y: -44 });
    this.brows = new Actor({ name: 'brows' });
    this.mouth = new Actor({ name: 'mouth', y: -22, scaleY: Character.MOUTH_REST });
    if (this.face) {
      const detailed = drawDetailedHead({ head: this.head, eyes: this.eyes, brows: this.brows, mouth: this.mouth }, look, this.face);
      this.headTop = detailed.top;
      this.expressions = detailed.expressions;
      if (expression) this.setExpression(expression);
    } else {
      this.drawHead(look);
    }

    this.torso.add(this.torsoDetail, this.leftArm, this.rightArm, this.head);
    this.add(this.leftLeg, this.rightLeg, this.torso);
  }

  /**
   * Switch expression immediately (e.g. while building a scene). On a timeline use
   * `emote(char, 'angry')` instead, so seeking back restores the previous face.
   */
  setExpression(name: Expression): void {
    if (!this.expressions) return;
    for (const [key, layers] of Object.entries(this.expressions)) {
      for (const layer of layers) layer.opacity = key === name ? 1 : 0;
    }
    [this.mouthRest, this.mouthOpen] = MOUTH_RANGE[name];
    this.mouth.scaleY = this.mouthRest;
  }

  /** Height from the feet to the top of the head (unscaled), e.g. for placing speech bubbles. */
  get height(): number {
    return -Character.TORSO_Y + 92 - this.headTop * this.look.headScale;
  }

  private drawHead(look: CharacterLook): void {
    const r = 44;
    const cy = -42; // face center relative to the neck
    const head = this.head;

    if (look.hairStyle === 'long') {
      // Behind the face; ends above the chin so it frames the face instead of covering it.
      head.draw('rect', { x: -r - 9, y: cy - r - 4, width: 2 * r + 18, height: 1.6 * r + 4, rx: 28, fill: look.hair });
    }
    head.draw('rect', { x: -9, y: -12, width: 18, height: 16, fill: look.skin }); // neck
    head.draw('circle', { cx: -r, cy: cy + 2, r: 9, fill: look.skin }); // ears
    head.draw('circle', { cx: r, cy: cy + 2, r: 9, fill: look.skin });
    head.draw('circle', { cx: 0, cy, r, fill: look.skin });
    this.headTop = cy - r - (look.hairStyle === 'quiff' ? 22 : look.hairStyle === 'bald' ? 0 : 3);
    if (look.hairStyle === 'quiff') {
      head.draw('ellipse', { cx: 6, cy: cy - r + 4, rx: r * 0.85, ry: r * 0.42, fill: look.hair, transform: `rotate(-8 6 ${cy - r + 4})` });
    }
    if (look.hairStyle !== 'bald') {
      head.draw('path', {
        d: `M ${-r - 2} ${cy - 4} A ${r + 2} ${r + 2} 0 0 1 ${r + 2} ${cy - 4}
            Q 20 ${cy - 20} -5 ${cy - 16} Q -30 ${cy - 22} ${-r - 2} ${cy - 4} Z`,
        fill: look.hair,
      });
    }

    for (const side of [-1, 1]) {
      this.eyes.draw('ellipse', { cx: side * 15, cy: 0, rx: 6, ry: 8, fill: '#222' });
      this.eyes.draw('circle', { cx: side * 15 + 2, cy: -3, r: 2, fill: '#fff' });
      if (!look.beard) head.draw('circle', { cx: side * 26, cy: cy + 14, r: 7, fill: '#ff8fa3', opacity: 0.5 }); // cheeks
    }
    head.draw('ellipse', { cx: 0, cy: cy + 8, rx: 4, ry: 3, fill: 'rgba(0,0,0,0.15)' }); // nose

    if (look.beard) {
      // Ring around the jaw that leaves the mouth area free, plus a moustache.
      head.draw('path', {
        d: `M ${-r} ${cy} Q ${-r} ${cy + r * 1.1} 0 ${cy + r + 8} Q ${r} ${cy + r * 1.1} ${r} ${cy}
            L ${r * 0.78} ${cy + 6} Q ${r * 0.62} ${cy + r * 0.78} 0 ${cy + r * 0.8}
            Q ${-r * 0.62} ${cy + r * 0.78} ${-r * 0.78} ${cy + 6} Z`,
        fill: look.beard,
      });
      head.draw('path', {
        d: `M -17 ${cy + 17} Q 0 ${cy + 9} 17 ${cy + 17} Q 0 ${cy + 14} -17 ${cy + 17} Z`,
        fill: look.beard, stroke: look.beard, 'stroke-width': 4, 'stroke-linejoin': 'round',
      });
    }
    this.mouth.draw('ellipse', { cx: 0, cy: 0, rx: 11, ry: 9, fill: '#7a2e2e' });

    head.add(this.eyes, this.mouth);
  }
}

interface LimbCover {
  /** Start and end along the limb, 0 = pivot, 1 = tip. */
  from: number;
  to?: number;
  color: string;
}

/** A limb drawn from its pivot (0, 0) straight down, with a hand or foot at the end. */
function limb(
  name: string, x: number, y: number, length: number, width: number,
  color: string, endColor: string, end: 'hand' | 'foot', rotation = 0, covers: LimbCover[] = [],
): Actor {
  const actor = new Actor({ name, x, y, rotation });
  const segment = (from: number, to: number, stroke: string, extra = 0) =>
    actor.draw('line', {
      x1: 0, y1: from * length, x2: 0, y2: to * length,
      stroke, 'stroke-width': width + extra, 'stroke-linecap': 'round',
    });
  segment(0, 1, color);
  for (const cover of covers) segment(cover.from, cover.to ?? 1, cover.color, 1);
  if (end === 'hand') actor.draw('circle', { cx: 0, cy: length, r: width * 0.7, fill: endColor });
  else actor.draw('ellipse', { cx: 8, cy: length, rx: width, ry: width * 0.5, fill: endColor });
  return actor;
}
