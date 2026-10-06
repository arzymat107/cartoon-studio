export const SVG_NS = 'http://www.w3.org/2000/svg' as const;

export type Attrs = Record<string, string | number>;

/** Create an SVG element with attributes: svg('circle', { r: 10, fill: 'red' }) */
export function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
  return el;
}

let counter = 0;

/** Unique id for gradients, clip paths, etc. (ids must be unique in the whole document). */
export const uid = (prefix = 'id'): string => `${prefix}-${++counter}`;
