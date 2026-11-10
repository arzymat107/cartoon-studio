/**
 * Player heads for the style lab, as style-free geometry: every style in styles.ts draws the same
 * shapes its own way. 600 × 700 frame, chin near (300, 652), the player's left on the viewer's left
 * is mirrored to make the right side.
 *
 * Likeness from the photos in data-for-cartoons/references/<Name> – each head lists the traits it
 * pushes. Shapes are smooth splines through a few points, so a head is a short list of numbers.
 */

export type Pt = [number, number];
export type Circle = [number, number, number];

const r1 = (v: number) => Math.round(v * 10) / 10;
const p = ([x, y]: Pt) => `${r1(x)} ${r1(y)}`;

/** Smooth Catmull-Rom spline through the points, as SVG path data. */
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

const flip = ([x, y]: Pt): Pt => [600 - x, y];
/** Symmetric shape from its right half, listed from the bottom centre round to the top centre. */
const sym = (half: Pt[]): Pt[] => [...half, ...half.slice(1, -1).reverse().map(flip)];
/** Symmetric open edge from its left half, listed from the outer end to the centre. */
const symEdge = (left: Pt[]): Pt[] => [...left, ...left.slice(0, -1).reverse().map(flip)];

/** Mirror path data to the other side of the face. */
export const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${r1(600 - Number(x))} ${y}`);

// ── part builders (left side) ───────────────────────────────────────────────

function eyeParts(cx: number, cy: number, w: number, up: number, lo: number, droop: number, lid: number) {
  const o: Pt = [cx - w / 2, cy + droop / 2];
  const i: Pt = [cx + w / 2, cy - droop / 2];
  const white = `M ${p(o)} C ${p([o[0] + w * 0.22, cy - up])} ${p([i[0] - w * 0.2, cy - up])} ${p(i)} C ${p([i[0] - w * 0.25, cy + lo])} ${p([o[0] + w * 0.3, cy + lo])} ${p(o)} Z`;
  const drop = lid * (up + lo) * 0.7;
  const edge = `C ${p([o[0] + w * 0.22, cy - up + drop])} ${p([i[0] - w * 0.2, cy - up + drop])} ${p(i)}`;
  const cover = lid > 0
    ? `M ${p([o[0] - 6, o[1] + 3])} C ${p([o[0] + w * 0.2, cy - up - 16])} ${p([i[0] - w * 0.2, cy - up - 16])} ${p([i[0] + 5, i[1]])} L ${p(i)} C ${p([i[0] - w * 0.2, cy - up + drop])} ${p([o[0] + w * 0.22, cy - up + drop])} ${p(o)} Z`
    : undefined;
  const lidLine = `M ${p(o)} ${edge}`;
  const pupil: Circle = [cx + 2, cy + drop * 0.3 + 1, Math.max(6, (up + lo) * 0.36)];
  return { white, cover, lidLine, pupil };
}

function browPath(cx: number, y: number, w: number, t: number, tilt: number, arch: number): string {
  const o: Pt = [cx - w / 2, y + tilt / 2];
  const i: Pt = [cx + w / 2, y - tilt / 2];
  return `M ${p(o)} C ${p([o[0] + w * 0.3, y - arch])} ${p([i[0] - w * 0.3, y - arch - tilt * 0.3])} ${p(i)} L ${p([i[0], i[1] + t])} C ${p([i[0] - w * 0.3, y - arch + t - tilt * 0.3])} ${p([o[0] + w * 0.3, y - arch + t * 0.8])} ${p([o[0], o[1] + t * 0.55])} Z`;
}

function noseParts(top: number, tip: number, w: number) {
  const l = 300 - w / 2, r = 300 + w / 2, mid = top + (tip - top) * 0.5;
  return {
    line: `M 292 ${top} C 290 ${mid} ${l + 4} ${tip - 30} ${l} ${tip - 8} C ${l - 4} ${tip + 12} 288 ${tip + 14} 300 ${tip + 10} C 312 ${tip + 14} ${r + 4} ${tip + 12} ${r} ${tip - 8}`,
    shadow: `M 310 ${top} C 314 ${mid} ${r - 2} ${tip - 30} ${r} ${tip - 8} C ${r + 4} ${tip + 8} ${r - 10} ${tip + 14} 306 ${tip + 11} C ${r - 8} ${tip + 2} ${r - 10} ${tip - 18} 314 ${tip - 40} C 310 ${tip - 80} 308 ${top + 30} 310 ${top} Z`,
    nostrils: `M ${r1(300 - w * 0.3)} ${tip + 2} q 7 -6 14 1 M ${r1(300 + w * 0.3 - 14)} ${tip + 3} q 7 -7 14 -1`,
  };
}

function earParts(x: number, y: number, h: number, out: number) {
  return {
    ear: `M ${x + 4} ${y - h / 2} C ${x - out} ${y - h / 2 - 12} ${x - out - 8} ${y + h / 2 - 10} ${x + 4} ${y + h / 2} Z`,
    inner: `M ${x - 6} ${y - h / 2 + 16} C ${r1(x - out * 0.7)} ${y - h / 2 + 6} ${r1(x - out * 0.75)} ${y + h / 2 - 20} ${x - 4} ${y + h / 2 - 14}`,
    lobe: [x - out * 0.35, y + h / 2 - 8] as Pt,
  };
}

// ── the head type ───────────────────────────────────────────────────────────

export interface Mouth { kind: 'line' | 'full' | 'grin'; y: number; w: number; h: number }

export interface Head {
  name: string;
  skin: { base: string; shade: string; deep: string };
  hairColor: { base: string; shade: string; light: string };
  brow: string;
  lip: string;
  beardColor?: string;
  kit: { shirt: string; collar: string };
  face: string;
  ear: string;
  earIn: string;
  hair: string;
  curls?: Circle[];
  curlTips?: string;
  hairLight?: string;
  strands?: string;
  /** Left side-fade patch (short sides), mirrored. */
  fade?: string;
  beard?: string;
  beardEdge?: string;
  /** Bare skin round the mouth inside a beard. */
  lips?: string;
  mouth: Mouth;
  nose: string;
  noseShadow: string;
  nostrils?: string;
  eye: string;
  lid?: string;
  lidLine: string;
  pupil: Circle;
  browL: string;
  creases?: string;
  smileLines?: string;
  dimple?: string;
  stud?: Pt;
}

interface HeadSpec {
  name: string;
  skin: Head['skin'];
  hairColor: Head['hairColor'];
  brow: string;
  lip: string;
  beardColor?: string;
  kit: Head['kit'];
  /** Right half of the face outline, chin → top centre. */
  face: Pt[];
  ear: [x: number, y: number, h: number, out: number];
  hair: Pt[];
  curls?: Circle[];
  curlTips?: string;
  hairLight?: Pt[];
  strands?: string;
  fade?: Pt[];
  /** Left half of the beard's top edge, outer cheek → centre under the nose. */
  beard?: Pt[];
  mouth: Mouth;
  nose: [top: number, tip: number, w: number];
  wideNose?: boolean;
  eye: [cx: number, cy: number, w: number, up: number, lo: number, droop: number, lid: number];
  brows: [cx: number, y: number, w: number, t: number, tilt: number, arch: number];
  creases?: string;
  smileLines?: boolean;
  dimple?: boolean;
  stud?: boolean;
}

function makeHead(s: HeadSpec): Head {
  const ear = earParts(...s.ear);
  const eye = eyeParts(...s.eye);
  const nose = noseParts(...s.nose);
  const { y: my, w: mw } = s.mouth;
  const beardEdge = s.beard ? symEdge(s.beard) : undefined;
  return {
    name: s.name, skin: s.skin, hairColor: s.hairColor, brow: s.brow, lip: s.lip, beardColor: s.beardColor, kit: s.kit,
    face: spline(sym(s.face)),
    ear: ear.ear,
    earIn: ear.inner,
    hair: spline(s.hair),
    curls: s.curls,
    curlTips: s.curlTips,
    hairLight: s.hairLight && spline(s.hairLight),
    strands: s.strands,
    fade: s.fade && spline(s.fade),
    beard: beardEdge && `${spline(beardEdge, false)} L 500 700 L 100 700 Z`,
    beardEdge: beardEdge && spline(beardEdge, false),
    lips: s.beard ? `M ${300 - mw / 2 - 6} ${my - 2} Q 300 ${my - 16} ${300 + mw / 2 + 6} ${my - 2} Q ${300 + mw / 2} ${my + 26} 300 ${my + 28} Q ${300 - mw / 2} ${my + 26} ${300 - mw / 2 - 6} ${my - 2} Z` : undefined,
    mouth: s.mouth,
    nose: nose.line,
    noseShadow: nose.shadow,
    nostrils: s.wideNose ? nose.nostrils : undefined,
    eye: eye.white,
    lid: eye.cover,
    lidLine: eye.lidLine,
    pupil: eye.pupil,
    browL: browPath(...s.brows),
    creases: s.creases,
    smileLines: s.smileLines
      ? `M ${300 - s.nose[2] / 2 - 4} ${s.nose[1] - 6} C ${300 - s.nose[2] / 2 - 26} ${s.nose[1] + 24} ${300 - mw / 2 - 12} ${my - 24} ${300 - mw / 2 - 6} ${my + 2}`
      : undefined,
    dimple: s.dimple ? 'M 300 622 L 300 638' : undefined,
    stud: s.stud ? ear.lobe : undefined,
  };
}

// ── the players ─────────────────────────────────────────────────────────────

/** Arc of curls round (cx, cy) from angle a0 to a1 (in units of π). */
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, count: number, r: number): Circle[] {
  return Array.from({ length: count }, (_, k) => {
    const a = Math.PI * (a0 + ((a1 - a0) * k) / (count - 1));
    return [r1(cx + Math.cos(a) * rx), r1(cy + Math.sin(a) * ry), r] as Circle;
  });
}
const row = (y: number, x0: number, x1: number, count: number, r: number, wobble = 8): Circle[] =>
  Array.from({ length: count }, (_, k) => [r1(x0 + ((x1 - x0) * k) / (count - 1)), y + (k % 2 ? wobble : -wobble), r] as Circle);

/** Kane: long narrow face, V-shaped trimmed beard, high forehead with deep recessions and creases,
 *  short sides with a small quiff, hooded eyes drooping outward, long straight nose, small mouth. */
const KANE = makeHead({
  name: 'KANE',
  skin: { base: '#f0b590', shade: '#d39371', deep: '#b6765a' },
  hairColor: { base: '#c99a5c', shade: '#a77a44', light: '#e0bb7e' },
  brow: '#7a5532', lip: '#d98f78', beardColor: '#ad7a4c',
  kit: { shirt: '#f7f6f0', collar: '#1c2a5a' },
  face: [[300, 652], [370, 630], [418, 555], [434, 430], [430, 290], [402, 180], [300, 140]],
  ear: [168, 395, 100, 38],
  hair: [[176, 300], [172, 220], [196, 150], [252, 92], [312, 74], [382, 80], [424, 124], [430, 210], [424, 300], [410, 244], [372, 198], [300, 220], [236, 198], [196, 240]],
  hairLight: [[222, 156], [262, 108], [330, 86], [374, 96], [320, 116], [272, 154], [240, 188]],
  strands: 'M 262 198 C 254 160 270 120 310 94 M 322 214 C 328 170 350 132 392 112',
  beard: [[150, 420], [196, 500], [236, 552], [270, 526], [300, 524]],
  mouth: { kind: 'line', y: 568, w: 58, h: 0 },
  nose: [350, 488, 44],
  eye: [249, 366, 56, 18, 12, 8, 0.45],
  brows: [248, 332, 74, 12, 2, 4],
  creases: 'M 258 254 Q 300 246 342 254 M 268 276 Q 300 270 332 276',
});

/** Yamal: curly mop with bleached tips, fringe low on the forehead, thick straight brows, broad
 *  nose, full lips, young rounded face, no beard. */
const YAMAL = makeHead({
  name: 'YAMAL',
  skin: { base: '#c98d62', shade: '#ad744d', deep: '#8f5c3b' },
  hairColor: { base: '#2a1c14', shade: '#160e0a', light: '#d9b46a' },
  brow: '#1e140e', lip: '#a3604a',
  kit: { shirt: '#c60b1e', collar: '#ffc400' },
  face: [[300, 650], [362, 634], [408, 578], [428, 470], [430, 340], [410, 222], [300, 172]],
  ear: [170, 405, 90, 26],
  hair: [[184, 360], [176, 262], [198, 166], [300, 116], [402, 166], [424, 262], [416, 360], [404, 300], [300, 296], [196, 300]],
  curls: [
    ...arc(300, 250, 138, 128, 1.04, 1.96, 13, 34),
    ...row(206, 228, 372, 4, 40, 4),
    ...row(292, 212, 388, 6, 27),
    [186, 330, 24], [414, 330, 24],
  ],
  curlTips: '#e2bf73',
  fade: [[176, 380], [172, 320], [190, 300], [196, 380]],
  mouth: { kind: 'full', y: 572, w: 76, h: 30 },
  nose: [372, 492, 72],
  wideNose: true,
  eye: [250, 376, 54, 16, 12, 3, 0.35],
  brows: [248, 340, 80, 18, -2, 5],
});

/** Vinícius: tall rounded afro with a sharp line-up and short sides, huge toothy grin, broad nose,
 *  thin brows, high cheekbones. */
const VINI = makeHead({
  name: 'VINI',
  skin: { base: '#714530', shade: '#5a3524', deep: '#45271a' },
  hairColor: { base: '#17100c', shade: '#0b0705', light: '#3a2a20' },
  brow: '#140c08', lip: '#5a2c22',
  kit: { shirt: '#f6f5f0', collar: '#1b1b1b' },
  face: [[300, 652], [356, 636], [404, 580], [424, 470], [426, 340], [410, 236], [300, 196]],
  ear: [172, 412, 96, 34],
  hair: [[186, 330], [180, 236], [194, 140], [250, 82], [300, 74], [350, 82], [406, 140], [420, 236], [414, 330], [404, 262], [384, 240], [300, 240], [216, 240], [196, 262]],
  curls: [...arc(300, 220, 124, 142, 1.0, 2.0, 19, 17)],
  fade: [[178, 360], [176, 260], [196, 250], [200, 360]],
  mouth: { kind: 'grin', y: 552, w: 150, h: 54 },
  nose: [384, 494, 84],
  wideNose: true,
  eye: [250, 384, 50, 14, 10, 2, 0.2],
  brows: [248, 348, 66, 9, 0, 4],
  smileLines: true,
});

/** Mbappé: round head with a very short crop, big forehead, wide cheeks, wide smile, ears out. */
const MBAPPE = makeHead({
  name: 'MBAPPÉ',
  skin: { base: '#9c6343', shade: '#7f4d32', deep: '#643a25' },
  hairColor: { base: '#1d130e', shade: '#100a07', light: '#3b2a20' },
  brow: '#1a110c', lip: '#6e3a2a',
  kit: { shirt: '#1d2c6b', collar: '#f4f4f4' },
  face: [[300, 650], [368, 636], [422, 578], [448, 466], [446, 336], [420, 216], [300, 166]],
  ear: [154, 412, 98, 42],
  hair: [[178, 322], [176, 240], [204, 168], [300, 128], [396, 168], [424, 240], [422, 322], [412, 262], [384, 226], [300, 214], [216, 226], [188, 262]],
  mouth: { kind: 'grin', y: 560, w: 140, h: 40 },
  nose: [386, 494, 80],
  wideNose: true,
  eye: [246, 380, 52, 15, 11, -2, 0.15],
  brows: [246, 342, 70, 11, -2, 8],
  smileLines: true,
});

/** Messi: big ears sticking out, full reddish beard, small slightly droopy eyes, brows raised in the
 *  middle (the worried look), long nose, brown hair swept to the side and back. */
const MESSI = makeHead({
  name: 'MESSI',
  skin: { base: '#ebb596', shade: '#cf9575', deep: '#b37657' },
  hairColor: { base: '#6b4426', shade: '#4f3018', light: '#8e6038' },
  brow: '#5a3820', lip: '#d28c78', beardColor: '#8e5634',
  kit: { shirt: '#74acdf', collar: '#ffffff' },
  face: [[300, 652], [364, 632], [414, 566], [430, 450], [428, 320], [404, 212], [300, 172]],
  ear: [172, 398, 124, 58],
  hair: [[176, 340], [168, 250], [190, 162], [250, 110], [322, 98], [394, 118], [430, 184], [434, 262], [426, 340], [414, 282], [394, 248], [338, 240], [290, 250], [236, 238], [204, 264], [188, 300]],
  hairLight: [[232, 150], [290, 118], [360, 112], [320, 132], [262, 168]],
  strands: 'M 250 236 C 260 190 290 150 340 126 M 330 240 C 350 196 380 166 414 152',
  beard: [[158, 430], [194, 500], [234, 542], [268, 532], [300, 530]],
  mouth: { kind: 'line', y: 578, w: 56, h: 0 },
  nose: [382, 500, 56],
  eye: [252, 384, 46, 13, 10, 6, 0.35],
  brows: [250, 348, 64, 11, 8, 4],
});

/** Ronaldo: square chiselled jaw with a chin dimple, black hair gelled up and back over short sides,
 *  groomed arched brows, deep-set eyes, clean-shaven, ear stud. */
const RONALDO = makeHead({
  name: 'RONALDO',
  skin: { base: '#dda27c', shade: '#c08460', deep: '#a26845' },
  hairColor: { base: '#17110d', shade: '#0a0706', light: '#3a2c24' },
  brow: '#1d1410', lip: '#c27a62',
  kit: { shirt: '#c8102e', collar: '#046a38' },
  face: [[300, 652], [350, 648], [404, 612], [428, 520], [430, 400], [422, 280], [398, 196], [300, 160]],
  ear: [172, 402, 92, 30],
  hair: [[180, 296], [176, 220], [198, 148], [262, 96], [334, 84], [402, 106], [430, 170], [424, 296], [414, 246], [394, 212], [300, 204], [214, 212], [192, 248]],
  hairLight: [[240, 130], [300, 100], [372, 100], [320, 118], [266, 150]],
  strands: 'M 250 200 C 260 160 300 124 360 110 M 310 204 C 330 164 370 140 414 136',
  fade: [[176, 340], [174, 262], [194, 240], [204, 340]],
  mouth: { kind: 'line', y: 566, w: 66, h: 0 },
  nose: [372, 490, 58],
  eye: [250, 372, 52, 15, 10, 2, 0.4],
  brows: [248, 334, 72, 9, 4, 10],
  dimple: true,
  stud: true,
});

export const HEADS: Head[] = [KANE, YAMAL, VINI, MBAPPE, MESSI, RONALDO];
