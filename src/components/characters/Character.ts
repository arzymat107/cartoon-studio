import { Actor, type ActorOptions } from '@/engine';

export interface CharacterLook {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  shoes: string;
  hairStyle: 'short' | 'long' | 'bald';
}

export interface CharacterOptions extends ActorOptions, Partial<CharacterLook> {}

const DEFAULT_LOOK: CharacterLook = {
  skin: '#ffd7b5',
  hair: '#4a2c1a',
  shirt: '#3a86ff',
  pants: '#2b2d42',
  shoes: '#1b1b1b',
  hairStyle: 'short',
};

/**
 * A rigged cartoon person. Origin (0, 0) is between the feet, so `y` is the ground line.
 * Faces right by default; set a negative scaleX to face left.
 *
 * Rig (every part is an Actor that can be tweened on its own):
 *   Character
 *   ├─ leftLeg, rightLeg      pivot: hip
 *   └─ torso                  pivot: hip
 *      ├─ leftArm, rightArm   pivot: shoulder
 *      └─ head                pivot: neck
 *         ├─ eyes             scaleY → blink
 *         └─ mouth            scaleY → talk
 */
export class Character extends Actor {
  /** Resting arm angle (left arm +, right arm −). */
  static readonly ARM_REST = 12;
  static readonly TORSO_Y = -70;
  static readonly MOUTH_REST = 0.3;

  readonly look: CharacterLook;
  readonly torso: Actor;
  readonly head: Actor;
  readonly eyes: Actor;
  readonly mouth: Actor;
  readonly leftArm: Actor;
  readonly rightArm: Actor;
  readonly leftLeg: Actor;
  readonly rightLeg: Actor;

  constructor(options: CharacterOptions = {}) {
    const { skin, hair, shirt, pants, shoes, hairStyle, ...actorOptions } = options;
    super({ name: 'Character', ...actorOptions });
    const look: CharacterLook = (this.look = {
      skin: skin ?? DEFAULT_LOOK.skin,
      hair: hair ?? DEFAULT_LOOK.hair,
      shirt: shirt ?? DEFAULT_LOOK.shirt,
      pants: pants ?? DEFAULT_LOOK.pants,
      shoes: shoes ?? DEFAULT_LOOK.shoes,
      hairStyle: hairStyle ?? DEFAULT_LOOK.hairStyle,
    });

    this.leftLeg = limb('leftLeg', -14, Character.TORSO_Y, 62, 20, look.pants, look.shoes, 'foot');
    this.rightLeg = limb('rightLeg', 14, Character.TORSO_Y, 62, 20, look.pants, look.shoes, 'foot');

    this.torso = new Actor({ name: 'torso', y: Character.TORSO_Y });
    this.torso.draw('rect', { x: -32, y: -95, width: 64, height: 100, rx: 26, fill: look.shirt });

    const arm = Character.ARM_REST;
    this.leftArm = limb('leftArm', -30, -78, 64, 16, look.shirt, look.skin, 'hand', arm);
    this.rightArm = limb('rightArm', 30, -78, 64, 16, look.shirt, look.skin, 'hand', -arm);

    this.head = new Actor({ name: 'head', y: -92 });
    this.eyes = new Actor({ name: 'eyes', y: -44 });
    this.mouth = new Actor({ name: 'mouth', y: -22, scaleY: Character.MOUTH_REST });
    this.drawHead(look);

    this.torso.add(this.leftArm, this.rightArm, this.head);
    this.add(this.leftLeg, this.rightLeg, this.torso);
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
      head.draw('circle', { cx: side * 26, cy: cy + 14, r: 7, fill: '#ff8fa3', opacity: 0.5 }); // cheeks
    }
    head.draw('ellipse', { cx: 0, cy: cy + 8, rx: 4, ry: 3, fill: 'rgba(0,0,0,0.15)' }); // nose
    this.mouth.draw('ellipse', { cx: 0, cy: 0, rx: 11, ry: 9, fill: '#7a2e2e' });

    head.add(this.eyes, this.mouth);
  }
}

/** A limb drawn from its pivot (0, 0) straight down, with a hand or foot at the end. */
function limb(
  name: string, x: number, y: number, length: number, width: number,
  color: string, endColor: string, end: 'hand' | 'foot', rotation = 0,
): Actor {
  const actor = new Actor({ name, x, y, rotation });
  actor.draw('line', {
    x1: 0, y1: 0, x2: 0, y2: length,
    stroke: color, 'stroke-width': width, 'stroke-linecap': 'round',
  });
  if (end === 'hand') actor.draw('circle', { cx: 0, cy: length, r: width * 0.7, fill: endColor });
  else actor.draw('ellipse', { cx: 8, cy: length, rx: width, ry: width * 0.5, fill: endColor });
  return actor;
}
