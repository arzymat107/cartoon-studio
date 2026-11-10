/** Shared drawing helpers for portrait figures: shaded shapes in the style of the traced portraits. */
import { svg, uid, SVG_NS } from '@/engine';

export type Point = [number, number];

/** Outline color and width of the body shapes. */
export const LINE = '#2b1a12';
export const STROKE = 1.3;
/** Outline width in the flat Toon style: thicker, one weight for every shape. */
export const TOON_STROKE = 2.2;
/** Pass as `softId` to draw flat Toon shapes: one fill, a thick outline, no soft shadow. */
export const FLAT = '';
/** Pass as `softId` to draw Cel shapes: flat fill, one hard-edged shadow tone on the right, a bold near-black outline. */
export const CEL = 'cel';
/** Outline color and width in the Cel style. */
export const CEL_LINE = '#151011';
export const CEL_STROKE = 2.8;

export interface SkinPalette {
  base: string;
  /** Soft shadow side. */
  shade: string;
  /** Creases and deep shadow. */
  deep: string;
}

/**
 * A filled shape shaded like the portraits (soft shadow on the right edge), redrawable with `set()`.
 * With `softId` = FLAT it is drawn in the Toon style instead: flat fill and a thick outline;
 * with CEL, flat fill plus a hard shadow tone and a bold near-black outline.
 */
export class Shape {
  private readonly paths: SVGPathElement[];

  constructor(parent: Element, color: string, shadow: string, depth: number, softId: string) {
    if (softId === FLAT) {
      const fill = parent.appendChild(svg('path', { fill: color }));
      const line = parent.appendChild(svg('path', {
        fill: 'none', stroke: LINE, 'stroke-width': TOON_STROKE, 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      }));
      this.paths = [fill, line];
      return;
    }
    if (softId === CEL) {
      // The same light-shape-over-shadow trick as the traced style, but unblurred: a hard shadow edge.
      const clipId = uid('figure-form');
      const clip = parent.appendChild(svg('clipPath', { id: clipId })).appendChild(svg('path'));
      const base = parent.appendChild(svg('path', { fill: shadow }));
      const light = parent.appendChild(svg('g', { 'clip-path': `url(#${clipId})` })).appendChild(svg('path', {
        fill: color, transform: `translate(${-depth * 0.8} ${-depth * 0.25})`,
      }));
      const line = parent.appendChild(svg('path', {
        fill: 'none', stroke: CEL_LINE, 'stroke-width': CEL_STROKE, 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      }));
      this.paths = [clip, base, light, line];
      return;
    }
    const clipId = uid('figure-form');
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

/** Draws shaded shapes for costumes and props, with the figure's soft-shadow filter. */
export interface Painter {
  shape(parent: Element, d: string, color: string, depth?: number): void;
}

/** Darken a #rrggbb color by `amount` (0–1). */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(v * (1 - amount));
  return `rgb(${c(n >> 16)}, ${c((n >> 8) & 255)}, ${c(n & 255)})`;
}

/** Parse trusted SVG markup into a group. */
export function fragment(markup: string): SVGGElement {
  const doc = new DOMParser().parseFromString(`<svg xmlns="${SVG_NS}"><g>${markup}</g></svg>`, 'image/svg+xml');
  return document.importNode(doc.documentElement.firstElementChild as SVGGElement, true);
}

export const f = (n: number) => n.toFixed(1);
