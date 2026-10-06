/**
 * Detailed face style: shaped face and jaw, almond eyes with irises, eyebrows, nose,
 * lips, ears, layered hair and beards. Used by Character when `face` options are given.
 * All coordinates are in the head's space: origin at the neck, y up is negative.
 */
import { Actor, svg, uid } from '@/engine';

export interface FaceFeatures {
  /** Half-width and half-height of the face. */
  width: number;
  height: number;
  /** Half-width of the jaw corners and of the chin – larger = stronger jaw. */
  jaw: number;
  chin: number;
  eyeColor: string;
  browColor: string;
  /** Eyebrow thickness. */
  browWeight: number;
  /** Positive lifts the outer ends (confident), negative lowers them (kind, worried). */
  browTilt: number;
  nose: 'small' | 'straight' | 'broad';
  lips: string;
  /** Faint highlight on the cheekbones. */
  cheekbones: boolean;
  /** Five-o'clock shadow color, or null. */
  stubble: string | null;
}

export const DEFAULT_FACE: FaceFeatures = {
  width: 40,
  height: 48,
  jaw: 27,
  chin: 13,
  eyeColor: '#5b3a1e',
  browColor: '#3a2416',
  browWeight: 4.5,
  browTilt: 0,
  nose: 'straight',
  lips: '#b46a5c',
  cheekbones: false,
  stubble: null,
};

type Point = [number, number];

/** Smooth closed (or open) curve through the points (Catmull-Rom → cubic Bézier). */
export function smoothPath(points: Point[], closed = true): string {
  const n = points.length;
  const at = (i: number): Point => (closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))]);
  let d = `M ${at(0)[0].toFixed(1)} ${at(0)[1].toFixed(1)}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return closed ? `${d} Z` : d;
}

/** Right half (top center → bottom center) mirrored into a full symmetric outline. */
function mirrored(rightHalf: Point[]): Point[] {
  const left = rightHalf.slice(1, -1).reverse().map(([x, y]): Point => [-x, y]);
  return [...rightHalf, ...left];
}

/** Darken a #rrggbb color by `amount` (0–1). */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(c * (1 - amount));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

export interface HeadParts {
  head: Actor;
  eyes: Actor;
  brows: Actor;
  mouth: Actor;
}

export interface HeadLook {
  skin: string;
  hair: string;
  hairStyle: 'short' | 'long' | 'quiff' | 'bald';
  beard: string | null;
}

/** Draw the detailed head. Returns the y of the top of the hair (for speech-bubble placement). */
export function drawDetailedHead({ head, eyes, brows, mouth }: HeadParts, look: HeadLook, face: FaceFeatures): number {
  const { width: rx, height: ry, jaw, chin } = face;
  const cy = -4 - ry; // face center: the chin sits on top of the neck
  const skinShadow = shade(look.skin, 0.18);
  const line = shade(look.skin, 0.45);

  // ── Back hair, neck, ears ─────────────────────────────────────────────
  if (look.hairStyle === 'long') {
    head.draw('path', {
      d: smoothPath(mirrored([[0, cy - ry - 8], [rx + 10, cy - ry * 0.5], [rx + 12, cy + ry * 0.6], [rx * 0.6, cy + ry + 10], [0, cy + ry + 6]])),
      fill: shade(look.hair, 0.1),
    });
  }
  head.draw('rect', { x: -13, y: cy + ry * 0.55, width: 26, height: -(cy + ry * 0.55) + 6, fill: look.skin });
  head.draw('ellipse', { cx: 0, cy: cy + ry - 1, rx: 16, ry: 6, fill: 'rgba(0,0,0,0.18)' });
  for (const side of [-1, 1]) {
    head.draw('ellipse', { cx: side * (rx - 1), cy: cy + 3, rx: 7.5, ry: 12, fill: look.skin });
    head.draw('path', {
      d: `M ${side * (rx + 2)} ${cy - 5} Q ${side * (rx + 5)} ${cy + 3} ${side * (rx + 1)} ${cy + 10}`,
      stroke: skinShadow, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round',
    });
  }

  // ── Face ──────────────────────────────────────────────────────────────
  const outline = mirrored([
    [0, cy - ry], [rx * 0.72, cy - ry * 0.88], [rx, cy - ry * 0.32], [rx * 0.97, cy + ry * 0.2],
    [jaw, cy + ry * 0.72], [chin, cy + ry * 0.97], [0, cy + ry],
  ]);
  head.draw('path', { d: smoothPath(outline), fill: look.skin });
  // Soft shading down one side of the face and under the cheekbone.
  head.draw('path', {
    d: smoothPath([[rx * 0.98, cy - ry * 0.1], [rx * 0.9, cy + ry * 0.4], [jaw - 2, cy + ry * 0.75], [chin, cy + ry * 0.95],
      [chin * 0.6, cy + ry * 0.82], [jaw * 0.75, cy + ry * 0.55], [rx * 0.78, cy + ry * 0.1]]),
    fill: 'rgba(0,0,0,0.07)',
  });
  if (face.cheekbones) {
    for (const side of [-1, 1]) {
      head.draw('ellipse', { cx: side * rx * 0.55, cy: cy + ry * 0.12, rx: 9, ry: 4, fill: 'rgba(255,255,255,0.16)', transform: `rotate(${side * -15} ${side * rx * 0.55} ${cy + ry * 0.12})` });
    }
  }
  if (face.stubble) {
    head.draw('path', {
      d: smoothPath([[rx * 0.95, cy + ry * 0.15], [jaw + 1, cy + ry * 0.72], [chin, cy + ry * 0.97], [-chin, cy + ry * 0.97],
        [-jaw - 1, cy + ry * 0.72], [-rx * 0.95, cy + ry * 0.15], [-rx * 0.5, cy + ry * 0.45], [0, cy + ry * 0.38], [rx * 0.5, cy + ry * 0.45]]),
      fill: face.stubble, opacity: 0.22,
    });
  }

  // ── Beard (under the nose and mouth, over the face) ───────────────────
  if (look.beard) {
    // Outer edge along the jaw (right sideburn → chin → left sideburn), then an inner edge
    // back across that leaves the cheeks and the area around the lips free.
    const outer: Point[] = [
      [rx - 0.5, cy + 2], [rx + 1.5, cy + ry * 0.38], [jaw + 6, cy + ry * 0.78], [chin + 6, cy + ry + 8], [0, cy + ry + 12],
      [-chin - 6, cy + ry + 8], [-jaw - 6, cy + ry * 0.78], [-rx - 1.5, cy + ry * 0.38], [-rx + 0.5, cy + 2],
    ];
    const inner: Point[] = [
      [-(rx - 5), cy + 10], [-rx * 0.66, cy + ry * 0.36], [-rx * 0.42, cy + ry * 0.58], [0, cy + ry * 0.7],
      [rx * 0.42, cy + ry * 0.58], [rx * 0.66, cy + ry * 0.36], [rx - 5, cy + 10],
    ];
    head.draw('path', { d: smoothPath([...outer, ...inner]), fill: look.beard });
    // Moustache.
    head.draw('path', {
      d: smoothPath([[-15, cy + 27], [-9, cy + 20], [0, cy + 20.5], [9, cy + 20], [15, cy + 27], [8, cy + 24], [0, cy + 23.5], [-8, cy + 24]]),
      fill: look.beard,
    });
    // Texture strokes.
    const dark = shade(look.beard, 0.3);
    for (const [x, y, len] of [[-24, cy + 30, 8], [-12, cy + 40, 9], [4, cy + 44, 8], [18, cy + 36, 9], [28, cy + 22, 7], [-30, cy + 16, 7]] as const) {
      head.draw('line', { x1: x, y1: y, x2: x + 2, y2: y + len, stroke: dark, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.5 });
    }
  }

  // ── Nose ──────────────────────────────────────────────────────────────
  const noseWidth = face.nose === 'broad' ? 9 : face.nose === 'small' ? 5 : 7;
  const noseTop = face.nose === 'small' ? cy + 4 : cy - 4;
  head.draw('path', {
    d: `M -2 ${noseTop} Q -3 ${cy + 8} ${-noseWidth} ${cy + 13} Q 0 ${cy + 18} ${noseWidth} ${cy + 13}`,
    stroke: line, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.75,
  });
  for (const side of [-1, 1]) {
    head.draw('ellipse', { cx: side * (noseWidth * 0.45), cy: cy + 13.5, rx: 2, ry: 1.3, fill: line, opacity: 0.6 });
  }

  // ── Mouth and lips ────────────────────────────────────────────────────
  mouth.y = cy + 28;
  mouth.draw('ellipse', { cx: 0, cy: 0, rx: 12, ry: 8, fill: '#4a1414' });
  mouth.draw('ellipse', { cx: 0, cy: 4.5, rx: 7, ry: 3, fill: '#c0504d' }); // tongue
  head.draw('path', {
    d: `M -10 ${cy + 33} Q 0 ${cy + 37} 10 ${cy + 33}`,
    stroke: face.lips, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', opacity: 0.8,
  });

  // ── Eyes ──────────────────────────────────────────────────────────────
  eyes.y = cy - 2;
  const eyeX = rx * 0.4;
  for (const side of [-1, 1]) {
    const ex = side * eyeX;
    const almond = `M ${ex - 10} 0 Q ${ex} -8 ${ex + 10} 0 Q ${ex} 6.5 ${ex - 10} 0 Z`;
    const clipId = uid('eye');
    const clip = eyes.draw('clipPath', { id: clipId });
    clip.appendChild(svg('path', { d: almond }));
    eyes.draw('path', { d: almond, fill: '#fdfaf6' });
    const iris = eyes.draw('g', { 'clip-path': `url(#${clipId})` });
    // Irises shifted slightly forward: the character looks where it faces.
    iris.append(
      svg('circle', { cx: ex + 1.5, cy: -0.5, r: 5.2, fill: face.eyeColor }),
      svg('circle', { cx: ex + 1.5, cy: -0.5, r: 2.5, fill: '#111' }),
      svg('circle', { cx: ex + 3, cy: -2.2, r: 1.2, fill: '#fff' }),
    );
    eyes.draw('path', { d: `M ${ex - 10.5} 0.5 Q ${ex} -8.5 ${ex + 10.5} 0.5`, stroke: '#2a1a12', 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' });
    eyes.draw('path', { d: `M ${ex - 7} 4.5 Q ${ex} 7 ${ex + 7} 4.5`, stroke: skinShadow, 'stroke-width': 1.2, fill: 'none', opacity: 0.8 });
  }

  // ── Eyebrows (own actor so they can be raised for surprise) ───────────
  brows.y = cy - 15;
  for (const side of [-1, 1]) {
    const inner = side * 6;
    const outer = side * (eyeX + 12);
    brows.draw('path', {
      d: `M ${inner} 2 Q ${side * (eyeX + 1)} ${-5 - face.browTilt * 0.5} ${outer} ${1 - face.browTilt}`,
      stroke: face.browColor, 'stroke-width': face.browWeight, fill: 'none', 'stroke-linecap': 'round',
    });
  }

  // ── Front hair ────────────────────────────────────────────────────────
  let top = cy - ry;
  const highlight = 'rgba(255,255,255,0.18)';
  if (look.hairStyle === 'quiff') {
    // Short faded sides…
    head.draw('path', {
      d: smoothPath(mirrored([[0, cy - ry - 2], [rx * 0.8, cy - ry * 0.85], [rx + 2, cy - ry * 0.35], [rx + 1, cy - 2],
        [rx - 4, cy - ry * 0.2], [rx * 0.6, cy - ry * 0.65], [0, cy - ry * 0.72]])),
      fill: look.hair, opacity: 0.55,
    });
    // …and a tall, swept-up top that leans forward.
    top = cy - ry - 26;
    head.draw('path', {
      d: smoothPath([[-rx + 1, cy - ry * 0.45], [-rx * 0.75, cy - ry - 8], [-rx * 0.1, cy - ry - 22], [rx * 0.5, top],
        [rx + 4, cy - ry - 13], [rx + 1, cy - ry * 0.58], [rx * 0.5, cy - ry * 0.66], [0, cy - ry * 0.68], [-rx * 0.6, cy - ry * 0.6]]),
      fill: look.hair,
    });
    for (const [x1, y1, x2, y2] of [[-20, -16, 14, -24], [-12, -8, 22, -16], [-24, -4, 4, -12]] as const) {
      head.draw('path', { d: `M ${x1} ${cy - ry + y1} Q ${(x1 + x2) / 2} ${cy - ry + Math.min(y1, y2) - 8} ${x2} ${cy - ry + y2}`, stroke: highlight, 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' });
    }
  } else if (look.hairStyle !== 'bald') {
    // Side part with a fringe swept across the forehead, sideburns down to the ears.
    top = cy - ry - 8;
    head.draw('path', {
      d: smoothPath([[-rx + 1, cy + 2], [-rx - 3, cy - ry * 0.35], [-rx * 0.8, cy - ry - 2], [-rx * 0.15, top], [rx * 0.5, cy - ry - 6],
        [rx + 3, cy - ry * 0.55], [rx + 3, cy - ry * 0.1], [rx - 1, cy + 2], [rx - 6, cy - ry * 0.25], [rx * 0.75, cy - ry * 0.48],
        [rx * 0.3, cy - ry * 0.62], [-rx * 0.2, cy - ry * 0.5], [-rx * 0.7, cy - ry * 0.56], [-rx + 6, cy - ry * 0.25]]),
      fill: look.hair,
    });
    head.draw('path', { d: `M ${-rx * 0.35} ${cy - ry - 4} Q ${-rx * 0.25} ${cy - ry * 0.75} ${-rx * 0.05} ${cy - ry * 0.55}`, stroke: shade(look.hair, 0.35), 'stroke-width': 2, fill: 'none' });
    for (const [x1, y1, x2, y2] of [[-4, -2, 26, -10], [4, 6, 30, 0], [-26, 2, -10, -6]] as const) {
      head.draw('path', { d: `M ${x1} ${cy - ry + y1} Q ${(x1 + x2) / 2} ${cy - ry + Math.min(y1, y2) - 5} ${x2} ${cy - ry + y2}`, stroke: highlight, 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' });
    }
  }

  head.add(eyes, brows, mouth);
  return top;
}
