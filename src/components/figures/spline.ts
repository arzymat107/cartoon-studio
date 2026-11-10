/** Smooth shapes from a few points – for portraits drawn in code. */
export type Pt = [number, number];

const r1 = (v: number) => Math.round(v * 10) / 10;
const p = ([x, y]: Pt) => `${r1(x)} ${r1(y)}`;

/** Catmull-Rom spline through the points, as SVG path data (closed by default). */
export function spline(pts: Pt[], closed = true): string {
  const n = pts.length;
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M ${p(pts[0])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [a, b, c, e] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d += ` C ${p([b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6])} ${p([c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6])} ${p(c)}`;
  }
  return closed ? `${d} Z` : d;
}

/** Symmetric outline from its right half (bottom centre round to top centre), in a frame `width` wide. */
export function symmetric(half: Pt[], width: number): Pt[] {
  return [...half, ...half.slice(1, -1).reverse().map(([x, y]) => [width - x, y] as Pt)];
}

/** Mirror path data across the frame's vertical centre line. */
export function mirrorPath(d: string, width: number): string {
  return d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${r1(width - Number(x))} ${y}`);
}
