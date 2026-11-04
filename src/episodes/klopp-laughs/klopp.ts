/**
 * Jürgen Klopp as a cut-out puppet made from one drawing (klopp.png, 1040 × 2448).
 *
 * The picture is used twice: a body copy clipped below the collar, and a head copy clipped above it
 * (with the beard reaching down over the collar), so the head can tilt and bob on its own. The two
 * overlap around the neck, so no gap opens when the head turns. A drawn open mouth covers the
 * picture's grin while he laughs.
 *
 *   rig            origin between the feet – squash, stretch and lean around it
 *   └ head         pivot at the neck
 *     ├ mouth      pivot at the upper lip; scaleY opens and closes it
 *     └ tears      tears flying from the eye corners (head space)
 */
import kloppUrl from '@/assets/characters/Klopp/klopp.png';
import { Actor, svg, uid } from '@/engine';

/** Points in the picture's own pixels. */
const FEET = { x: 521, y: 2359 };
const NECK = { x: 518, y: 850 };
const LIP = { x: 515, y: 608 };
/** Outer eye corners, where the tears spring from. */
export const EYE_CORNERS: [number, number][] = [[345 - NECK.x, 470 - NECK.y], [690 - NECK.x, 470 - NECK.y]];

/** Everything above the collar, plus the beard hanging over it. */
const HEAD_CLIP = 'M 0 0 L 1040 0 L 1040 735 L 702 735 Q 670 840 565 895 L 470 895 Q 365 840 335 735 L 0 735 Z';
/** Everything below the top of the collar (overlaps the head by ~20 px). */
const BODY_CLIP = 'M 0 715 L 1040 715 L 1040 2448 L 0 2448 Z';

const OUTLINE = '#3a0a0a';

export class KloppRig extends Actor {
  readonly head: Actor;
  readonly mouth: Actor;
  /** Shaking lines beside the shoulders. */
  readonly shakeLines: Actor;
  /** Image space → rig space (origin between the feet). */
  private readonly picture: Actor;

  constructor(options: { x?: number; y?: number; scale?: number } = {}) {
    super({ name: 'Klopp', ...options });
    this.picture = new Actor({ name: 'picture', x: -FEET.x, y: -FEET.y });
    this.add(this.picture);

    this.picture.el.appendChild(image(BODY_CLIP, 0, 0));

    this.head = new Actor({ name: 'head', x: NECK.x, y: NECK.y });
    this.head.el.appendChild(image(HEAD_CLIP, -NECK.x, -NECK.y));
    this.mouth = new Actor({ name: 'mouth', x: LIP.x - NECK.x, y: LIP.y - NECK.y, opacity: 0 });
    drawLaughingMouth(this.mouth);
    this.head.add(this.mouth);
    this.picture.add(this.head);

    this.shakeLines = new Actor({ name: 'shakeLines', opacity: 0 });
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const x = FEET.x + side * (430 + i * 34);
        const y = 940 + i * 70;
        this.shakeLines.draw('path', {
          d: `M ${x} ${y} Q ${x + side * 22} ${y + 45} ${x} ${y + 90}`,
          stroke: '#fff7d6', 'stroke-width': 12, fill: 'none', 'stroke-linecap': 'round',
        });
      }
    }
    this.picture.add(this.shakeLines);
  }
}

/** The whole picture, clipped to one part. Clip coordinates are the picture's pixels. */
function image(clip: string, x: number, y: number): SVGGElement {
  const id = uid('klopp-clip');
  const g = svg('g', { transform: `translate(${x} ${y})` });
  g.appendChild(svg('clipPath', { id })).appendChild(svg('path', { d: clip }));
  g.appendChild(svg('image', { href: kloppUrl, width: 1040, height: 2448, 'clip-path': `url(#${id})` }));
  return g;
}

/**
 * Wide-open laughing mouth, hanging down from the upper lip (origin). Even at its smallest
 * (scaleY 0.8) it fully covers the picture's grin (±130 wide, ~80 deep).
 */
function drawLaughingMouth(mouth: Actor): void {
  const d = 'M -138 -4 Q 0 -22 138 -4 Q 128 70 70 104 Q 0 128 -70 104 Q -128 70 -138 -4 Z';
  const id = uid('klopp-mouth');
  mouth.draw('clipPath', { id }).appendChild(svg('path', { d }));
  mouth.draw('path', { d, fill: '#4a0b10' });
  const inside = mouth.draw('g', { 'clip-path': `url(#${id})` });
  // Tongue at the bottom, top teeth along the upper lip.
  inside.appendChild(svg('ellipse', { cx: 0, cy: 112, rx: 82, ry: 46, fill: '#e0646a' }));
  inside.appendChild(svg('path', { d: 'M -40 92 Q 0 78 40 92', stroke: '#b8404a', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }));
  inside.appendChild(svg('path', { d: 'M -130 -20 L 130 -20 L 124 18 Q 0 32 -124 18 Z', fill: '#fbfbf6' }));
  for (const x of [-72, -24, 24, 72]) {
    inside.appendChild(svg('path', { d: `M ${x} 0 L ${x} 22`, stroke: '#cfcfc6', 'stroke-width': 3 }));
  }
  mouth.draw('path', { d, fill: 'none', stroke: OUTLINE, 'stroke-width': 13, 'stroke-linejoin': 'round' });
}
