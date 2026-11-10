/**
 * The six candidate house styles. Each one draws a style-free Head (heads.ts) its own way and
 * returns a 600 × 700 SVG; `id` keeps clip/filter/pattern ids unique per drawing.
 *
 *   A Block   – thick black outline, chunky shapes, big eye whites under heavy lids
 *   B Paper   – no outlines: flat colour blocks with one hard-edged shadow side, dot eyes
 *   C Riso    – wobbly ink line, colour fill printed slightly off the line, halftone shadow
 *   D Cutout  – paper collage: flat tilted pieces with small drop shadows, no lines
 *   E Vinyl   – toy figure: outlines in a darker shade of each colour, gloss, shiny eyes, blush
 *   F Pop     – comic print: black ink, red halftone shadows, yellow/black hair, halftone beard
 */
import { mirror, type Circle, type Head } from './heads';

export type Style = (h: Head, id: string) => string;

const NECK = 'M 240 590 L 236 700 L 364 700 L 360 590 Z';
const SHIRT = 'M 30 700 C 60 650 150 628 232 636 Q 300 676 368 636 C 450 628 540 650 570 700 Z';
const COLLAR = 'M 232 636 Q 300 676 368 636 L 352 630 Q 300 660 248 630 Z';
const SHADOW_SIDE = 'M 330 100 C 390 220 410 360 396 470 C 386 560 360 620 330 690 L 540 690 L 540 100 Z';
const BEARD_SHADOW = 'M 396 470 C 386 560 360 620 330 690 L 540 690 L 540 420 Z';
const HAIR_SHADOW = 'M 330 30 C 400 120 440 220 436 400 L 540 400 L 540 30 Z';

const svgOpen = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700">';
const both = (d: string, attrs: string) => `<path d="${d}" ${attrs}/><path d="${mirror(d)}" ${attrs}/>`;
const dots = ([x, y, r]: Circle, attrs: string) => `<circle cx="${x}" cy="${y}" r="${r}" ${attrs}/><circle cx="${600 - x}" cy="${y}" r="${r}" ${attrs}/>`;

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
const luma = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
};
const dark = (hex: string) => luma(hex) < 50;
/** Pick one of a limited palette's three hair inks: dark, mid-brown or blond. */
const hairInk = (hex: string, inks: [string, string, string]) => (luma(hex) < 50 ? inks[0] : luma(hex) < 110 ? inks[1] : inks[2]);

/** Mouth in a style's line, with a dark inside and teeth for a grin. */
function mouth(h: Head, line: string, inside = '#3a1a12', teeth = '#ffffff'): string {
  const { kind, y, w, h: mh } = h.mouth;
  const L = 300 - w / 2, R = 300 + w / 2;
  if (kind === 'line') return `<path d="M ${L} ${y} Q 300 ${y + 8} ${R} ${y}" fill="none" ${line}/>`;
  if (kind === 'full') {
    return `<path d="M ${L} ${y} Q 300 ${y - 14} ${R} ${y} Q 300 ${y + mh} ${L} ${y} Z" fill="${h.lip}"/>
      <path d="M ${L} ${y} Q 300 ${y + 6} ${R} ${y}" fill="none" ${line}/>`;
  }
  const d = `M ${L} ${y} Q 300 ${y + 12} ${R} ${y} Q ${R - 12} ${y + mh} 300 ${y + mh + 4} Q ${L + 12} ${y + mh} ${L} ${y} Z`;
  return `<path d="${d}" fill="${inside}"/>
    <path d="M ${L + 8} ${y + 5} Q 300 ${y + 16} ${R - 8} ${y + 5} L ${R - 18} ${y + mh * 0.5} Q 300 ${y + mh * 0.62} ${L + 18} ${y + mh * 0.5} Z" fill="${teeth}"/>
    <path d="${d}" fill="none" ${line}/>`;
}

/** Curly hair: outlined circles with a smaller fill on top (so curl edges show), then light tips. */
function curls(h: Head, fill: string, line: string | null, tips: string | null): string {
  if (!h.curls) return '';
  const c = h.curls;
  let out = line ? c.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${line}/>`).join('') : '';
  out += c.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${(r * (line ? 0.78 : 1)).toFixed(1)}" fill="${fill}"/>`).join('');
  if (tips) {
    out += c.map(([x, y, r]) => `<path d="M ${(x - r * 0.5).toFixed(1)} ${(y - r * 0.1).toFixed(1)} A ${(r * 0.55).toFixed(1)} ${(r * 0.55).toFixed(1)} 0 0 1 ${(x + r * 0.4).toFixed(1)} ${(y - r * 0.4).toFixed(1)}" fill="none" stroke="${tips}" stroke-width="${(r * 0.24).toFixed(1)}" stroke-linecap="round"/>`).join('');
  }
  return out;
}

const pupils = (h: Head, attrs: string, k = 1) => dots([h.pupil[0], h.pupil[1], +(h.pupil[2] * k).toFixed(1)], attrs);

// ── A · Block ────────────────────────────────────────────────────────────────

export const block: Style = (h, id) => {
  const L = (w = 12) => `stroke="#141414" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const s = h.skin.base;
  return `${svgOpen}<defs><clipPath id="${id}-f"><path d="${h.face}"/></clipPath></defs>
<path d="${NECK}" fill="${h.skin.shade}" ${L()}/>
<path d="${SHIRT}" fill="${h.kit.shirt}" ${L()}/>
<path d="${COLLAR}" fill="${h.kit.collar}" ${L(6)}/>
${both(h.ear, `fill="${s}" ${L()}`)}${both(h.earIn, `fill="none" ${L(7)}`)}
<path d="${h.face}" fill="${s}"/>
<g clip-path="url(#${id}-f)">${h.beard ? `<path d="${h.beard}" fill="${h.beardColor}"/>` : ''}${h.fade ? both(h.fade, `fill="${h.hairColor.light}" opacity=".5"`) : ''}</g>
${h.lips ? `<path d="${h.lips}" fill="${s}"/>` : ''}
<path d="${h.face}" fill="none" ${L()}/>
<path d="${h.hair}" fill="${h.hairColor.base}" ${L()}/>
${curls(h, h.hairColor.base, L(8), h.curlTips ?? null)}
${h.strands ? `<path d="${h.strands}" fill="none" ${L(8)}/>` : ''}
${h.creases ? `<path d="${h.creases}" fill="none" ${L(5)}/>` : ''}
${h.smileLines ? both(h.smileLines, `fill="none" ${L(6)}`) : ''}
${both(h.browL, 'fill="#141414"')}
${both(h.eye, `fill="#fff" ${L(7)}`)}
${pupils(h, 'fill="#141414"')}
${h.lid ? both(h.lid, `fill="${s}"`) : ''}
${both(h.lidLine, `fill="none" ${L(9)}`)}
<path d="${h.nose}" fill="none" ${L(9)}/>
${h.nostrils ? `<path d="${h.nostrils}" fill="none" ${L(6)}/>` : ''}
${mouth(h, L(8))}
${h.dimple ? `<path d="${h.dimple}" fill="none" ${L(6)}/>` : ''}
${h.stud ? dots([h.stud[0], h.stud[1], 7], `fill="#e8eef5" ${L(4)}`) : ''}
</svg>`;
};

// ── B · Paper ────────────────────────────────────────────────────────────────

export const paper: Style = (h, id) => {
  const { base: s, shade: sh, deep } = h.skin;
  const hairDark = shade(h.hairColor.base, -0.25);
  return `${svgOpen}<defs><clipPath id="${id}-f"><path d="${h.face}"/></clipPath><clipPath id="${id}-h"><path d="${h.hair}"/></clipPath></defs>
<path d="${NECK}" fill="${sh}"/>
<path d="M 240 606 L 360 606 L 360 640 Q 300 660 240 640 Z" fill="${deep}"/>
<path d="${SHIRT}" fill="${h.kit.shirt}"/>
<path d="M 368 636 C 450 628 540 650 570 700 L 420 700 Z" fill="${shade(h.kit.shirt, -0.12)}"/>
<path d="${COLLAR}" fill="${h.kit.collar}"/>
<path d="${h.ear}" fill="${s}"/><path d="${mirror(h.ear)}" fill="${sh}"/>
<path d="${h.earIn}" fill="none" stroke="${sh}" stroke-width="8" stroke-linecap="round"/>
<path d="${h.face}" fill="${s}"/>
<g clip-path="url(#${id}-f)">
  <path d="${SHADOW_SIDE}" fill="${sh}"/>
  ${h.fade ? both(h.fade, `fill="${hairDark}" opacity=".35"`) : ''}
  ${h.beard ? `<path d="${h.beard}" fill="${h.beardColor}"/><path d="${BEARD_SHADOW}" fill="${shade(h.beardColor!, -0.18)}"/>` : ''}
  ${h.lips ? `<path d="${h.lips}" fill="${sh}"/>` : ''}
  ${h.creases ? `<path d="${h.creases}" fill="none" stroke="${sh}" stroke-width="6" stroke-linecap="round"/>` : ''}
  ${h.smileLines ? both(h.smileLines, `fill="none" stroke="${deep}" stroke-width="6" stroke-linecap="round"`) : ''}
</g>
<path d="${h.hair}" fill="${h.hairColor.base}"/>
<g clip-path="url(#${id}-h)"><path d="${HAIR_SHADOW}" fill="${hairDark}"/>${h.hairLight ? `<path d="${h.hairLight}" fill="${h.hairColor.light}"/>` : ''}</g>
${h.curls ? h.curls.map(([x, y, r]) => `<circle cx="${x + 4}" cy="${y + 5}" r="${r}" fill="${hairDark}"/>`).join('') : ''}
${curls(h, h.hairColor.base, null, h.curlTips ?? null)}
${both(h.browL, `fill="${h.brow}"`)}
${pupils(h, 'fill="#1b120d"', 0.8)}
${h.lid ? `<path d="${h.lid}" fill="${sh}"/><path d="${mirror(h.lid)}" fill="${deep}"/>` : ''}
<path d="${h.noseShadow}" fill="${deep}"/>
${h.nostrils ? `<path d="${h.nostrils}" fill="none" stroke="${deep}" stroke-width="6" stroke-linecap="round"/>` : ''}
${mouth(h, `stroke="#3a1f12" stroke-width="7" stroke-linecap="round"`)}
${h.dimple ? `<path d="${h.dimple}" fill="none" stroke="${deep}" stroke-width="5" stroke-linecap="round"/>` : ''}
${h.stud ? dots([h.stud[0], h.stud[1], 7], 'fill="#e8eef5"') : ''}
</svg>`;
};

// ── C · Riso ─────────────────────────────────────────────────────────────────

export const riso: Style = (h, id) => {
  const ink = '#22305c';
  const S = (w = 7) => `stroke="${ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" filter="url(#${id}-w)"`;
  const L = (w = 7) => `fill="none" ${S(w)}`;
  const s = shade(h.skin.base, 0.12);
  const hair = hairInk(h.hairColor.base, ['#3d4a7a', '#b5703f', '#f2b84b']);
  return `${svgOpen}<defs>
  <filter id="${id}-w" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="6"/></filter>
  <pattern id="${id}-d" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2.2" fill="#e8607a" opacity=".6"/></pattern>
  <clipPath id="${id}-f"><path d="${h.face}"/></clipPath>
</defs>
<g transform="translate(9 7)">
  <path d="${SHIRT}" fill="${h.kit.shirt}"/><path d="${COLLAR}" fill="${h.kit.collar}"/>
  <path d="${NECK}" fill="${s}"/>
  ${both(h.ear, `fill="${s}"`)}
  <path d="${h.face}" fill="${s}"/>
  <g clip-path="url(#${id}-f)">
    <path d="${SHADOW_SIDE}" fill="url(#${id}-d)"/>
    ${h.beard ? `<path d="${h.beard}" fill="${shade(h.beardColor!, 0.25)}"/>` : ''}
    ${h.lips ? `<path d="${h.lips}" fill="${s}"/>` : ''}
  </g>
  <path d="${h.hair}" fill="${hair}"/>
  ${curls(h, hair, null, h.curlTips ? '#f2b84b' : null)}
</g>
<path d="${SHIRT}" ${L()}/>
<path d="M 232 636 Q 300 676 368 636" ${L()}/>
${both(h.ear, L())}
<path d="${h.face}" ${L()}/>
${h.beardEdge ? `<path d="${h.beardEdge}" ${L(5)}/>` : ''}
<path d="${h.hair}" ${L()}/>
${h.curls ? h.curls.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" ${L(5)}/>`).join('') : ''}
${h.strands ? `<path d="${h.strands}" ${L()}/>` : ''}
${h.creases ? `<path d="${h.creases}" ${L(4)}/>` : ''}
${h.smileLines ? both(h.smileLines, L(5)) : ''}
${both(h.browL, `fill="${ink}"`)}
${both(h.lidLine, L(7))}
${pupils(h, `fill="${ink}"`, 0.8)}
<path d="${h.nose}" ${L()}/>
${h.nostrils ? `<path d="${h.nostrils}" ${L(5)}/>` : ''}
${mouth(h, S(6), ink, '#fff')}
${h.dimple ? `<path d="${h.dimple}" ${L(5)}/>` : ''}
${h.stud ? dots([h.stud[0], h.stud[1], 6], `fill="#fff" stroke="${ink}" stroke-width="4"`) : ''}
</svg>`;
};

// ── D · Cutout ───────────────────────────────────────────────────────────────

export const cutout: Style = (h, id) => {
  const s = h.skin.base;
  const tilt = (deg: number, m: string) => `<g transform="rotate(${deg} 300 400)">${m}</g>`;
  const drop = `filter="url(#${id}-s)"`;
  return `${svgOpen}<defs>
  <filter id="${id}-s" x="-10%" y="-10%" width="130%" height="130%"><feDropShadow dx="5" dy="7" stdDeviation="2" flood-color="#3b2a1e" flood-opacity=".35"/></filter>
  <clipPath id="${id}-f"><path d="${h.face}"/></clipPath>
</defs>
<g ${drop}>
  <path d="${SHIRT}" fill="${h.kit.shirt}"/><path d="${COLLAR}" fill="${h.kit.collar}"/>
  <path d="${NECK}" fill="${h.skin.shade}"/>
  ${tilt(-3, `<path d="${h.ear}" fill="${s}"/>`)}${tilt(3, `<path d="${mirror(h.ear)}" fill="${s}"/>`)}
  <path d="${h.face}" fill="${s}"/>
</g>
${h.beard ? `<g ${drop}>${tilt(1.5, `<g clip-path="url(#${id}-f)"><path d="${h.beard}" fill="${h.beardColor}"/></g>`)}</g>` : ''}
${h.lips ? `<path d="${h.lips}" fill="${h.lip}" ${drop}/>` : ''}
<g ${drop}>${tilt(-2, `<path d="${h.hair}" fill="${h.hairColor.base}"/>${curls(h, h.hairColor.base, null, h.curlTips ?? null)}${h.hairLight ? `<path d="${h.hairLight}" fill="${h.hairColor.light}"/>` : ''}`)}</g>
<g ${drop}>${both(h.browL, `fill="${h.brow}"`)}${both(h.eye, 'fill="#fffdf6"')}</g>
${pupils(h, 'fill="#22170f"', 0.8)}
${h.lid ? `<g ${drop}>${both(h.lid, `fill="${shade(s, -0.06)}"`)}</g>` : ''}
<path d="${h.noseShadow}" fill="${h.skin.shade}" ${drop}/>
${mouth(h, `stroke="#4a2617" stroke-width="7" stroke-linecap="round"`)}
${h.stud ? dots([h.stud[0], h.stud[1], 7], `fill="#eef3f8" ${drop}`) : ''}
</svg>`;
};

// ── E · Vinyl ────────────────────────────────────────────────────────────────

export const vinyl: Style = (h, id) => {
  const V = (c: string, w = 9) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const s = shade(h.skin.base, 0.06), sl = shade(h.skin.base, -0.3);
  const hl = shade(h.hairColor.base, -0.35);
  return `${svgOpen}<defs><clipPath id="${id}-f"><path d="${h.face}"/></clipPath></defs>
<path d="${NECK}" fill="${h.skin.shade}" ${V(sl)}/>
<path d="${SHIRT}" fill="${h.kit.shirt}" ${V(shade(h.kit.shirt, -0.35))}/>
<path d="${COLLAR}" fill="${h.kit.collar}" ${V(shade(h.kit.collar, -0.35), 5)}/>
${both(h.ear, `fill="${s}" ${V(sl)}`)}
<path d="${h.face}" fill="${s}"/>
<g clip-path="url(#${id}-f)">
  ${h.beard ? `<path d="${h.beard}" fill="${shade(h.beardColor!, 0.08)}"/><path d="${h.beardEdge}" fill="none" ${V(shade(h.beardColor!, -0.3), 6)}/>` : ''}
  <ellipse cx="214" cy="452" rx="26" ry="14" fill="#f39a8a" opacity=".5"/><ellipse cx="386" cy="452" rx="26" ry="14" fill="#f39a8a" opacity=".5"/>
</g>
${h.lips ? `<path d="${h.lips}" fill="${s}"/>` : ''}
<path d="${h.face}" fill="none" ${V(sl)}/>
<path d="${h.hair}" fill="${h.hairColor.base}" ${V(hl)}/>
${curls(h, h.hairColor.base, V(hl, 6), h.curlTips ?? null)}
${h.hairLight ? `<path d="${h.hairLight}" fill="${shade(h.hairColor.light, 0.25)}"/>` : ''}
${h.hairLight ? '<path d="M 404 150 C 414 168 418 190 418 210" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".55"/>' : ''}
${h.creases ? `<path d="${h.creases}" fill="none" ${V(sl, 4)}/>` : ''}
${h.smileLines ? both(h.smileLines, `fill="none" ${V(sl, 5)}`) : ''}
${both(h.browL, `fill="${h.brow}"`)}
${pupils(h, 'fill="#2a1a12"', 1.1)}
${dots([h.pupil[0] + 4, h.pupil[1] - 5, 4], 'fill="#fff"')}
${h.lid ? both(h.lid, `fill="${s}"`) : ''}
${both(h.lidLine, `fill="none" ${V(sl, 7)}`)}
<path d="${h.nose}" fill="none" ${V(sl, 8)}/>
${mouth(h, V(shade(h.lip, -0.4), 7))}
${h.dimple ? `<path d="${h.dimple}" fill="none" ${V(sl, 5)}/>` : ''}
${h.stud ? dots([h.stud[0], h.stud[1], 7], `fill="#f4f8fc" ${V('#9aa6b4', 3)}`) : ''}
</svg>`;
};

// ── F · Pop ──────────────────────────────────────────────────────────────────

export const pop: Style = (h, id) => {
  const ink = '#111111', red = '#e62631', yellow = '#ffd21f';
  const L = (w = 10) => `stroke="${ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const s = h.skin.base;
  const hair = hairInk(h.hairColor.base, [ink, '#8a4a22', yellow]);
  return `${svgOpen}<defs>
  <pattern id="${id}-r" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="6" cy="6" r="3.4" fill="${red}"/></pattern>
  <pattern id="${id}-k" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="4.5" cy="4.5" r="3" fill="${ink}"/></pattern>
  <clipPath id="${id}-f"><path d="${h.face}"/></clipPath>
</defs>
<path d="${NECK}" fill="${s}" ${L()}/>
<path d="M 236 600 L 364 600 L 364 640 L 236 640 Z" fill="url(#${id}-r)"/>
<path d="${SHIRT}" fill="${h.kit.shirt}" ${L()}/>
<path d="${COLLAR}" fill="${h.kit.collar}" ${L(5)}/>
<path d="${h.ear}" fill="${s}" ${L()}/><path d="${mirror(h.ear)}" fill="${s}" ${L()}/>
<path d="${h.face}" fill="${s}"/>
<g clip-path="url(#${id}-f)">
  <path d="${SHADOW_SIDE}" fill="url(#${id}-r)" opacity=".8"/>
  ${h.beard ? `<path d="${h.beard}" fill="${dark(h.beardColor!) ? '#5a3a24' : yellow}"/><path d="${h.beard}" fill="url(#${id}-k)" opacity=".75"/>` : ''}
  ${h.lips ? `<path d="${h.lips}" fill="${s}"/>` : ''}
</g>
<path d="${h.face}" fill="none" ${L()}/>
<path d="${h.hair}" fill="${hair}" ${L()}/>
${curls(h, hair, L(6), h.curlTips ? yellow : null)}
${h.strands ? `<path d="${h.strands}" fill="none" stroke="${hair === ink ? '#555' : ink}" stroke-width="7" stroke-linecap="round"/>` : ''}
${h.creases ? `<path d="${h.creases}" fill="none" ${L(4)}/>` : ''}
${h.smileLines ? both(h.smileLines, `fill="none" ${L(6)}`) : ''}
${both(h.browL, `fill="${ink}"`)}
${both(h.eye, `fill="#fff" ${L(6)}`)}
${pupils(h, `fill="${ink}"`)}
${h.lid ? both(h.lid, `fill="${s}"`) : ''}
${both(h.lidLine, `fill="none" ${L(8)}`)}
<path d="${h.nose}" fill="none" ${L(8)}/>
${h.nostrils ? `<path d="${h.nostrils}" fill="none" ${L(6)}/>` : ''}
${mouth(h, L(7), ink, '#fff')}
${h.dimple ? `<path d="${h.dimple}" fill="none" ${L(6)}/>` : ''}
${h.stud ? dots([h.stud[0], h.stud[1], 7], `fill="#fff" ${L(4)}`) : ''}
</svg>`;
};

export const STYLES: [string, Style][] = [
  ['A · BLOCK', block], ['B · PAPER', paper], ['C · RISO', riso],
  ['D · CUTOUT', cutout], ['E · VINYL', vinyl], ['F · POP', pop],
];
