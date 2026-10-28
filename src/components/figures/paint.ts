/** Shared drawing helpers for portrait figures: shaded shapes in the style of the traced portraits. */
import { svg, uid, SVG_NS } from '@/engine';

export type Point = [number, number];

/** Outline color and width of the body shapes. */
export const LINE = '#2b1a12';
export const STROKE = 1.3;

export interface SkinPalette {
  base: string;
  /** Soft shadow side. */
  shade: string;
  /** Creases and deep shadow. */
  deep: string;
}

/**
 * How a figure's body is rendered: 'painted' (soft shadow, fine outline – matches the traced
 * portraits) or 'cartoon' (hard cel-shaded shadow, bold outline – matches drawn caricature heads).
 */
export interface Look {
  /** Blur filter for the soft shadow edge; without one the shadow has a hard edge. */
  soft?: string;
  /** Outline width. */
  stroke: number;
}

/** A filled shape shaded like the portraits (shadow on the right edge), redrawable with `set()`. */
export class Shape {
  private readonly paths: SVGPathElement[];

  constructor(parent: Element, color: string, shadow: string, depth: number, look: Look) {
    const clipId = uid('figure-form');
    const clip = parent.appendChild(svg('clipPath', { id: clipId })).appendChild(svg('path'));
    const base = parent.appendChild(svg('path', { fill: shadow }));
    const light = parent.appendChild(svg('g', { 'clip-path': `url(#${clipId})` })).appendChild(svg('path', {
      fill: color, transform: `translate(${-depth} ${-depth * 0.3})`, ...(look.soft ? { filter: `url(#${look.soft})` } : {}),
    }));
    const line = parent.appendChild(svg('path', { fill: 'none', stroke: LINE, 'stroke-width': look.stroke, 'stroke-linejoin': 'round' }));
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
