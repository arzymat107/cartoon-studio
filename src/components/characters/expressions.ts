/**
 * Facial expressions for the detailed face. Every expression is drawn up front as its own layer
 * in the eyes, brows and mouth actors (so blinking and talking keep working) plus an "extras"
 * layer on the head (lips, blush, anger mark, sweat drop…). Switching = toggling layer opacity,
 * which GSAP can do on a timeline and undo when seeking back (see `emote()`).
 */
import { Actor, svg, uid } from '@/engine';
import type { FaceFeatures } from './face';

export const EXPRESSIONS = ['neutral', 'angry', 'happy', 'cheeky', 'smug', 'shocked'] as const;
export type Expression = (typeof EXPRESSIONS)[number];

/** Mouth scaleY at rest and fully open while talking, per expression. */
export const MOUTH_RANGE: Record<Expression, [rest: number, open: number]> = {
  neutral: [0.3, 1],
  angry: [0.85, 1.2],
  happy: [1, 1.18],
  cheeky: [1, 1.12],
  smug: [1, 1.4],
  shocked: [1, 1.25],
};

export interface ExpressionDims {
  /** Face half-width / half-height and center y (head space). */
  rx: number;
  ry: number;
  cy: number;
  skin: string;
  skinShadow: string;
}

export interface ExpressionParts {
  head: Actor;
  eyes: Actor;
  brows: Actor;
  mouth: Actor;
}

/** One expression = the layers that show it. */
export type ExpressionLayers = Record<Expression, Actor[]>;

const LINE = '#2a1a12';
const DARK_MOUTH = '#4a1414';
const TONGUE = '#e0606a';
const BLUSH = '#ff7a8a';

type Side = -1 | 1;

export function drawExpressions(
  { head, eyes, brows, mouth }: ExpressionParts, d: ExpressionDims, face: FaceFeatures,
): ExpressionLayers {
  const { rx, cy } = d;
  const eyeX = rx * 0.4;
  const layers = {} as ExpressionLayers;

  eyes.y = cy - 2;
  brows.y = cy - 15;
  mouth.y = cy + 28;

  for (const name of EXPRESSIONS) {
    const make = (parent: Actor, part: string) => {
      const actor = new Actor({ name: `${part}:${name}`, opacity: name === 'neutral' ? 1 : 0 });
      parent.add(actor);
      return actor;
    };
    const extras = make(head, 'extras');
    const eyeLayer = make(eyes, 'eyes');
    const browLayer = make(brows, 'brows');
    const mouthLayer = make(mouth, 'mouth');
    layers[name] = [extras, eyeLayer, browLayer, mouthLayer];

    for (const side of [-1, 1] as const) {
      drawEye(eyeLayer, name, side, side * eyeX, d, face);
      drawBrow(browLayer, name, side, eyeX, face);
    }
    drawMouth(mouthLayer, name);
    drawExtras(extras, name, d, face);
  }
  return layers;
}

// ── Eyes ──────────────────────────────────────────────────────────────────

function eyeWhite(layer: Actor, shape: string, irisX: number, irisY: number, face: FaceFeatures, irisR = 5.2): void {
  const clipId = uid('eye');
  const clip = layer.draw('clipPath', { id: clipId });
  clip.appendChild(svg('path', { d: shape }));
  layer.draw('path', { d: shape, fill: '#fdfaf6' });
  const iris = layer.draw('g', { 'clip-path': `url(#${clipId})` });
  iris.append(
    svg('circle', { cx: irisX, cy: irisY, r: irisR, fill: face.eyeColor }),
    svg('circle', { cx: irisX, cy: irisY, r: irisR * 0.48, fill: '#111' }),
    svg('circle', { cx: irisX + 1.5, cy: irisY - 1.7, r: 1.2, fill: '#fff' }),
  );
}

function line(layer: Actor, d: string, stroke: string, width: number, opacity = 1): void {
  layer.draw('path', { d, stroke, 'stroke-width': width, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity });
}

function drawEye(layer: Actor, name: Expression, side: Side, ex: number, d: ExpressionDims, face: FaceFeatures): void {
  const { skin, skinShadow } = d;
  const inner = ex - side * 10; // corner toward the nose
  const outer = ex + side * 10;
  const almond = `M ${ex - 10} 0 Q ${ex} -8 ${ex + 10} 0 Q ${ex} 6.5 ${ex - 10} 0 Z`;
  const lowerLid = () => line(layer, `M ${ex - 7} 4.5 Q ${ex} 7 ${ex + 7} 4.5`, skinShadow, 1.2, 0.8);
  const neutral = () => {
    // Irises shifted slightly forward: the character looks where it faces.
    eyeWhite(layer, almond, ex + 1.5, -0.5, face);
    line(layer, `M ${ex - 10.5} 0.5 Q ${ex} -8.5 ${ex + 10.5} 0.5`, LINE, 2.2);
    lowerLid();
  };
  const closedHappy = () => {
    line(layer, `M ${ex - 9} 3 Q ${ex} -7 ${ex + 9} 3`, LINE, 2.6);
    line(layer, `M ${ex - 6.5} 6.5 Q ${ex} 9 ${ex + 6.5} 6.5`, skinShadow, 1.2, 0.8);
  };

  switch (name) {
    case 'neutral':
      neutral();
      break;
    case 'angry':
      // Narrowed, lid slanting down toward the nose.
      eyeWhite(layer, `M ${inner} 1 L ${outer} -5 Q ${ex + side * 3} 7 ${inner} 1 Z`, ex + 1.5, 0.5, face, 4.6);
      line(layer, `M ${inner - side} 1.5 L ${outer + side} -5.5`, LINE, 3);
      lowerLid();
      break;
    case 'happy':
      closedHappy();
      break;
    case 'cheeky':
      // Wink: the character's left eye closed, the other open.
      if (side < 0) closedHappy();
      else neutral();
      break;
    case 'smug':
      // Half-closed lids, looking sideways.
      eyeWhite(layer, almond, ex + 4, 1, face);
      layer.draw('path', { d: `M ${ex - 11} -10 L ${ex + 11} -10 L ${ex + 11} -0.5 Q ${ex} 1.5 ${ex - 11} -0.5 Z`, fill: skin });
      line(layer, `M ${ex - 10.5} -0.5 Q ${ex} 1.5 ${ex + 10.5} -0.5`, LINE, 2.6);
      lowerLid();
      break;
    case 'shocked':
      // Wide open, small pupils.
      layer.draw('circle', { cx: ex, cy: -1, r: 9, fill: '#fdfaf6' });
      layer.draw('circle', { cx: ex + 1, cy: -1, r: 4, fill: face.eyeColor });
      layer.draw('circle', { cx: ex + 1, cy: -1, r: 2, fill: '#111' });
      layer.draw('circle', { cx: ex + 2.2, cy: -2.4, r: 0.9, fill: '#fff' });
      line(layer, `M ${ex - 9.5} -1 Q ${ex - 9} -10.5 ${ex} -10.5 Q ${ex + 9} -10.5 ${ex + 9.5} -1`, LINE, 2.2);
      break;
  }
}

// ── Brows ─────────────────────────────────────────────────────────────────

function drawBrow(layer: Actor, name: Expression, side: Side, eyeX: number, face: FaceFeatures): void {
  const inner = side * 6;
  const mid = side * (eyeX + 1);
  const outer = side * (eyeX + 12);
  const brow = (innerY: number, midY: number, outerY: number, extra = 0) =>
    line(layer, `M ${inner} ${innerY} Q ${mid} ${midY} ${outer} ${outerY}`, face.browColor, face.browWeight + extra);
  const tilt = face.browTilt;
  const raised = () => brow(-3, -12, -3);
  const lowered = () => brow(4, -1, 3);

  switch (name) {
    case 'neutral': brow(2, -5 - tilt * 0.5, 1 - tilt); break;
    case 'angry': brow(7, -1, -8, 1.5); break;
    case 'happy': brow(-1, -10, -1); break;
    case 'cheeky': (side < 0 ? lowered : raised)(); break;
    case 'smug': (side < 0 ? raised : lowered)(); break;
    case 'shocked': brow(-6, -16, -6); break;
  }
}

// ── Mouths (centered on the mouth actor, which talk() scales) ────────────

function clipped(layer: Actor, shape: string): SVGGElement {
  const clipId = uid('mouth');
  const clip = layer.draw('clipPath', { id: clipId });
  clip.appendChild(svg('path', { d: shape }));
  return layer.draw('g', { 'clip-path': `url(#${clipId})` });
}

function drawMouth(layer: Actor, name: Expression): void {
  const outline = { fill: 'none', stroke: '#6b2a22', 'stroke-width': 1.6, 'stroke-linejoin': 'round' } as const;
  switch (name) {
    case 'neutral':
      layer.draw('ellipse', { cx: 0, cy: 0, rx: 12, ry: 8, fill: DARK_MOUTH });
      layer.draw('ellipse', { cx: 0, cy: 4.5, rx: 7, ry: 3, fill: '#c0504d' });
      break;
    case 'angry': {
      // Clenched teeth, corners pulled down.
      const shape = 'M -17 5 Q -15 -5 -11 -6 L 11 -6 Q 15 -5 17 5 Q 0 9 -17 5 Z';
      layer.draw('path', { d: shape, fill: '#fdfaf6' });
      const teeth = clipped(layer, shape);
      teeth.append(svg('rect', { x: -20, y: 0, width: 40, height: 2, fill: DARK_MOUTH }));
      for (const x of [-10, -5, 0, 5, 10]) teeth.append(svg('line', { x1: x, y1: -7, x2: x, y2: 10, stroke: '#b0a49c', 'stroke-width': 1 }));
      layer.draw('path', { d: shape, ...outline });
      break;
    }
    case 'happy': {
      // Big open grin: top teeth and tongue.
      const shape = 'M -16 -4 Q 0 1 16 -4 Q 13 15 0 16 Q -13 15 -16 -4 Z';
      layer.draw('path', { d: shape, fill: DARK_MOUTH });
      clipped(layer, shape).append(
        svg('rect', { x: -20, y: -8, width: 40, height: 9, fill: '#fdfaf6' }),
        svg('ellipse', { cx: 0, cy: 14, rx: 9, ry: 5.5, fill: TONGUE }),
      );
      layer.draw('path', { d: shape, ...outline });
      break;
    }
    case 'cheeky': {
      // Grin with the tongue stuck out.
      const shape = 'M -14 -3 Q 0 2 14 -3 Q 11 9 0 10 Q -11 9 -14 -3 Z';
      layer.draw('path', { d: shape, fill: DARK_MOUTH });
      clipped(layer, shape).append(svg('rect', { x: -20, y: -8, width: 40, height: 7, fill: '#fdfaf6' }));
      layer.draw('path', { d: shape, ...outline });
      layer.draw('path', { d: 'M -8 4 Q -10 22 1 23 Q 11 22 8 4 Z', fill: TONGUE, stroke: '#9c3a44', 'stroke-width': 1.4 });
      line(layer, 'M 0 8 L 0.5 17', '#b8404d', 1.6);
      break;
    }
    case 'smug':
      // Lopsided smirk.
      line(layer, 'M -11 1 Q 2 5 13 -4', '#6b2a22', 3);
      line(layer, 'M 11.5 -8 Q 15 -4.5 13 -1', '#6b2a22', 1.8, 0.7);
      break;
    case 'shocked': {
      const shape = 'M 0 -10 Q 9 -10 9 1 Q 9 12 0 12 Q -9 12 -9 1 Q -9 -10 0 -10 Z';
      layer.draw('path', { d: shape, fill: DARK_MOUTH });
      clipped(layer, shape).append(svg('ellipse', { cx: 0, cy: 10, rx: 6.5, ry: 4.5, fill: TONGUE }));
      layer.draw('path', { d: shape, ...outline });
      break;
    }
  }
}

// ── Extras on the head ────────────────────────────────────────────────────

function drawExtras(layer: Actor, name: Expression, { rx, ry, cy }: ExpressionDims, face: FaceFeatures): void {
  const blush = () => {
    for (const side of [-1, 1]) {
      layer.draw('ellipse', { cx: side * rx * 0.58, cy: cy + ry * 0.28, rx: 8, ry: 4.5, fill: BLUSH, opacity: 0.4 });
    }
  };
  switch (name) {
    case 'neutral':
      line(layer, `M -10 ${cy + 33} Q 0 ${cy + 37} 10 ${cy + 33}`, face.lips, 3, 0.8);
      break;
    case 'angry': {
      // Frown creases between the brows, and a cartoon anger mark on the temple.
      line(layer, `M -4 ${cy - 15} L -2 ${cy - 9}`, LINE, 1.6, 0.6);
      line(layer, `M 4 ${cy - 15} L 2 ${cy - 9}`, LINE, 1.6, 0.6);
      const [x, y] = [rx * 0.62, cy - ry * 0.5];
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        line(layer, `M ${x + sx * 2} ${y + sy * 7} Q ${x + sx * 2} ${y + sy * 2} ${x + sx * 7} ${y + sy * 2}`, '#e63946', 3);
      }
      break;
    }
    case 'happy':
    case 'cheeky':
      blush();
      break;
    case 'smug':
      break;
    case 'shocked': {
      // Sweat drop.
      const [x, y] = [rx + 6, cy - ry * 0.45];
      layer.draw('path', {
        d: `M ${x} ${y - 10} Q ${x + 7} ${y + 1} ${x} ${y + 5} Q ${x - 7} ${y + 1} ${x} ${y - 10} Z`,
        fill: '#8ecae6', stroke: '#4a86a8', 'stroke-width': 1.5,
      });
      break;
    }
  }
}
