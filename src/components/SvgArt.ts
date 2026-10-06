import { Actor, SVG_NS, type ActorOptions } from '@/engine';

export interface SvgArtOptions extends ActorOptions {
  /** Raw SVG markup, e.g. `import markup from './hat.svg?raw'`. Trusted repo files only. */
  markup: string;
  /** Shift the drawing so this point of the original artwork becomes the pivot. */
  originX?: number;
  originY?: number;
}

/**
 * Wraps artwork drawn in Inkscape / Figma / Illustrator as an Actor,
 * so hand-drawn props and characters can be animated like any built-in component.
 */
export class SvgArt extends Actor {
  constructor({ markup, originX = 0, originY = 0, ...options }: SvgArtOptions) {
    super({ name: 'SvgArt', ...options });
    const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
    const inner = this.draw('g', { transform: `translate(${-originX} ${-originY})` });
    for (const node of [...doc.documentElement.childNodes]) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as Element).namespaceURI === SVG_NS) {
        inner.appendChild(document.importNode(node, true));
      }
    }
  }
}
