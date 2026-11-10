/**
 * Style lab: one player (Kane) drawn in three candidate house styles, to pick the channel's own look.
 * Heads only, 600 × 700 frame, chin at (300, 652).
 *
 * Likeness from the photos in data-for-cartoons/references/Kane (not from memory):
 *   - long, narrow face tapering to a pointed chin; short trimmed beard following the jaw (V shape)
 *   - high forehead with deep temple recessions and two forehead creases
 *   - short sides, the top pushed up and back in a small quiff
 *   - deep-set, hooded eyes with drooping outer corners (the sleepy look); straight, low brows
 *   - long, straight, narrow nose with the tip pointing down; small mouth, thin lips
 *   - ears sticking out a little, long neck
 *
 *   npm run frames -- --episode style-lab 0.5
 *
 *   A "Block"   – thick black outline, chunky shapes, big eye whites under heavy lids
 *   B "Paper"   – no outlines: flat colour blocks with one hard-edged shadow side, dot eyes
 *   C "Riso"    – wobbly ink line, colour fill printed slightly off the line, halftone shadow
 */
import { SvgArt, TextLabel } from '@/components';
import { Actor, Scene, type SceneClass, type Timeline } from '@/engine';

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const label = (text: string, x: number, y: number, fontSize = 44, color = '#1d120d') =>
  new TextLabel({ text, x, y, fontSize, font: FONT, weight: 400, color });

// ── shared Kane geometry (every style draws these shapes its own way) ───────

const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${600 - Number(x)} ${y}`);

const FACE = 'M 300 652 C 340 652 372 630 396 590 C 420 550 432 490 434 420 C 436 340 432 260 418 214 C 400 160 356 140 300 140 C 244 140 200 160 182 214 C 168 260 164 340 166 420 C 168 490 180 550 204 590 C 228 630 260 652 300 652 Z';
const EAR = 'M 170 350 C 136 334 120 362 128 400 C 136 438 156 452 172 440 Z';
const EAR_IN = 'M 158 372 C 144 368 140 384 144 404 C 148 420 156 428 164 424';
const NECK = 'M 240 590 L 236 700 L 364 700 L 360 590 Z';
const SHIRT = 'M 30 700 C 60 650 150 628 232 636 Q 300 676 368 636 C 450 628 540 650 570 700 Z';
const COLLAR = 'M 232 636 Q 300 676 368 636 L 352 630 Q 300 660 248 630 Z';
const HAIR = 'M 176 300 C 168 250 170 200 186 168 C 206 110 252 78 312 74 C 380 70 424 110 428 170 C 432 210 430 260 424 300 C 418 270 412 248 404 232 C 396 214 384 202 370 196 C 350 210 326 218 300 220 C 276 218 256 206 238 196 C 222 204 210 218 202 234 C 192 252 184 276 176 300 Z';
const HAIR_STRANDS = 'M 262 198 C 254 160 270 120 310 94 M 322 214 C 328 170 350 132 392 112';
const HAIR_LIGHT = 'M 222 156 C 250 112 310 88 372 96 C 336 104 300 122 272 154 C 260 166 248 178 238 190 Z';
const CREASES = 'M 258 254 Q 300 246 342 254 M 268 276 Q 300 270 332 276';
const BEARD = 'M 150 420 C 180 470 208 522 238 552 C 252 532 274 522 300 524 C 326 522 348 532 362 552 C 392 522 420 470 450 420 L 470 700 L 130 700 Z';
const BEARD_EDGE = 'M 150 420 C 180 470 208 522 238 552 C 252 532 274 522 300 524 C 326 522 348 532 362 552 C 392 522 420 470 450 420';
const LIPS = 'M 262 562 Q 300 550 338 562 Q 330 588 300 590 Q 270 588 262 562 Z';
const MOUTH = 'M 270 566 Q 300 574 330 566';
const NOSE_SIDE = 'M 290 350 C 288 400 282 440 276 466 C 270 490 288 500 302 496 C 316 500 330 490 324 470';
const NOSE_SHADOW = 'M 312 352 C 316 400 324 440 326 466 C 330 486 318 496 304 496 C 316 486 316 470 312 452 C 308 420 308 384 312 352 Z';
/** Eye white between outer and inner corner; the outer corner sits lower (the droop). */
const EYE_WHITE_L = 'M 222 370 C 236 352 262 346 276 362 C 264 374 238 380 222 370 Z';
/** Heavy upper lid: a skin fold that hides the top of the eye and droops at the outer corner. */
const LID_L = 'M 212 372 C 222 340 262 332 284 356 L 280 362 C 262 352 240 352 226 362 C 220 366 216 370 212 376 Z';
const LID_LINE_L = 'M 216 370 C 232 352 258 348 280 360';
const BROW_L = 'M 210 334 C 230 324 262 322 284 328 L 282 340 C 262 336 234 338 214 346 Z';
const SHADOW_SIDE = 'M 330 130 C 390 220 410 360 396 470 C 386 560 360 620 330 680 L 520 680 L 520 130 Z';

// ── A · Block ────────────────────────────────────────────────────────────────

const aLine = (w = 12) => `stroke="#141414" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const A_SKIN = '#f3b28c';
const BLOCK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700">
<defs><clipPath id="a-face"><path d="${FACE}"/></clipPath></defs>
<path d="${NECK}" fill="#e29a72" ${aLine()}/>
<path d="${SHIRT}" fill="#f7f7f2" ${aLine()}/>
<path d="${COLLAR}" fill="#1c2a5a" ${aLine(6)}/>
<path d="${EAR}" fill="${A_SKIN}" ${aLine()}/><path d="${mirror(EAR)}" fill="${A_SKIN}" ${aLine()}/>
<path d="${EAR_IN}" fill="none" ${aLine(7)}/><path d="${mirror(EAR_IN)}" fill="none" ${aLine(7)}/>
<path d="${FACE}" fill="${A_SKIN}"/>
<g clip-path="url(#a-face)"><path d="${BEARD}" fill="#b07a48"/></g>
<path d="${LIPS}" fill="${A_SKIN}"/>
<path d="${FACE}" fill="none" ${aLine()}/>
<path d="${HAIR}" fill="#c99a5c" ${aLine()}/>
<path d="${HAIR_STRANDS}" fill="none" ${aLine(8)}/>
<path d="${CREASES}" fill="none" ${aLine(5)}/>
<path d="${BROW_L}" fill="#141414"/><path d="${mirror(BROW_L)}" fill="#141414"/>
<path d="${EYE_WHITE_L}" fill="#fff" ${aLine(7)}/><path d="${mirror(EYE_WHITE_L)}" fill="#fff" ${aLine(7)}/>
<circle cx="252" cy="366" r="10" fill="#141414"/><circle cx="348" cy="366" r="10" fill="#141414"/>
<path d="${LID_L}" fill="${A_SKIN}"/><path d="${mirror(LID_L)}" fill="${A_SKIN}"/>
<path d="${LID_LINE_L}" fill="none" ${aLine(9)}/><path d="${mirror(LID_LINE_L)}" fill="none" ${aLine(9)}/>
<path d="${NOSE_SIDE}" fill="none" ${aLine(9)}/>
<path d="${MOUTH}" fill="none" ${aLine(8)}/>
</svg>`;

// ── B · Paper ────────────────────────────────────────────────────────────────

const B_SKIN = '#ebb08f', B_SHADE = '#d08f6d', B_DEEP = '#b9765a';
const PAPER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700">
<defs><clipPath id="b-face"><path d="${FACE}"/></clipPath><clipPath id="b-hair"><path d="${HAIR}"/></clipPath></defs>
<path d="${NECK}" fill="${B_SHADE}"/>
<path d="M 240 610 L 360 610 L 360 640 Q 300 660 240 640 Z" fill="${B_DEEP}"/>
<path d="${SHIRT}" fill="#f4f2ec"/>
<path d="M 368 636 C 450 628 540 650 570 700 L 420 700 Z" fill="#dcd8cf"/>
<path d="${COLLAR}" fill="#1c2a5a"/>
<path d="${EAR}" fill="${B_SKIN}"/><path d="${mirror(EAR)}" fill="${B_SHADE}"/>
<path d="${EAR_IN}" fill="none" stroke="${B_SHADE}" stroke-width="8" stroke-linecap="round"/>
<path d="${FACE}" fill="${B_SKIN}"/>
<g clip-path="url(#b-face)">
  <path d="${SHADOW_SIDE}" fill="${B_SHADE}"/>
  <path d="${BEARD}" fill="#a87650"/>
  <path d="M 396 470 C 386 560 360 620 330 680 L 520 680 L 520 420 Z" fill="#8e6141"/>
  <path d="${LIPS}" fill="${B_SHADE}"/>
  <path d="${CREASES}" fill="none" stroke="${B_SHADE}" stroke-width="6" stroke-linecap="round"/>
</g>
<path d="${HAIR}" fill="#c79858"/>
<g clip-path="url(#b-hair)"><path d="M 330 40 C 400 120 440 220 430 380 L 520 380 L 520 40 Z" fill="#a97c42"/><path d="${HAIR_LIGHT}" fill="#ddb576"/></g>
<path d="${BROW_L}" fill="#7a5532"/><path d="${mirror(BROW_L)}" fill="#7a5532"/>
<ellipse cx="252" cy="370" rx="9" ry="8" fill="#1b120d"/><ellipse cx="348" cy="370" rx="9" ry="8" fill="#1b120d"/>
<path d="${LID_L}" fill="${B_SHADE}"/><path d="${mirror(LID_L)}" fill="${B_DEEP}"/>
<path d="${NOSE_SHADOW}" fill="${B_DEEP}"/>
<path d="M 278 486 C 284 500 300 502 310 496 C 300 494 290 492 278 486 Z" fill="${B_DEEP}"/>
<path d="M 268 566 Q 300 576 332 566 L 330 572 Q 300 584 270 572 Z" fill="#3a1f12"/>
</svg>`;

// ── C · Riso ─────────────────────────────────────────────────────────────────

const C_INK = '#22305c';
const cLine = (w = 7) => `stroke="${C_INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" fill="none" filter="url(#c-wobble)"`;
const shift = (markup: string, dx: number, dy: number) => `<g transform="translate(${dx} ${dy})">${markup}</g>`;
const RISO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700">
<defs>
  <filter id="c-wobble" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4"/>
    <feDisplacementMap in="SourceGraphic" scale="6"/>
  </filter>
  <pattern id="c-dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2.2" fill="#e8607a" opacity=".6"/></pattern>
  <clipPath id="c-face"><path d="${FACE}"/></clipPath>
</defs>
${shift(`
<path d="${SHIRT}" fill="#ffffff"/>
<path d="${COLLAR}" fill="#3a6ea5"/>
<path d="${NECK}" fill="#f7c4a0"/>
<path d="${EAR}" fill="#f7c4a0"/><path d="${mirror(EAR)}" fill="#f7c4a0"/>
<path d="${FACE}" fill="#f7c4a0"/>
<g clip-path="url(#c-face)">
  <path d="${SHADOW_SIDE}" fill="url(#c-dots)"/>
  <path d="${BEARD}" fill="#d6a064"/>
  <path d="${LIPS}" fill="#f7c4a0"/>
</g>
<path d="${HAIR}" fill="#f2b84b"/>
`, 9, 7)}
<path d="${SHIRT}" ${cLine()}/>
<path d="M 232 636 Q 300 676 368 636" ${cLine()}/>
<path d="M 240 590 L 236 646 M 360 590 L 364 646" ${cLine()}/>
<path d="${EAR}" ${cLine()}/><path d="${mirror(EAR)}" ${cLine()}/>
<path d="${FACE}" ${cLine()}/>
<path d="${BEARD_EDGE}" ${cLine(5)}/>
<path d="${HAIR}" ${cLine()}/>
<path d="${HAIR_STRANDS}" ${cLine()}/>
<path d="${CREASES}" ${cLine(4)}/>
<path d="M 212 340 C 232 328 262 326 284 332 M 388 340 C 368 328 338 326 316 332" ${cLine(9)}/>
<path d="${LID_LINE_L}" ${cLine(7)}/><path d="${mirror(LID_LINE_L)}" ${cLine(7)}/>
<circle cx="252" cy="372" r="8" fill="${C_INK}"/><circle cx="348" cy="372" r="8" fill="${C_INK}"/>
<path d="${NOSE_SIDE}" ${cLine()}/>
<path d="${MOUTH}" ${cLine(6)}/>
</svg>`;

// ── the scene ────────────────────────────────────────────────────────────────

const head = (markup: string, x: number, y: number, scale: number) => new SvgArt({ markup, x, y, scale, originX: 300, originY: 652 });

class LabScene extends Scene {
  readonly title = 'Style lab – three house styles';

  build(): void {
    const { width, height } = this.stage;
    const bg = new Actor({ name: 'bg' });
    bg.draw('rect', { x: 0, y: 0, width, height, fill: '#f3ede2' });
    this.add(bg, label('KANE · THREE STYLES', width / 2, 300, 60));
    this.add(head(BLOCK, 280, 940, 0.78), label('A · BLOCK', 280, 1060));
    this.add(head(PAPER, 800, 940, 0.78), label('B · PAPER', 800, 1060));
    this.add(head(RISO, 540, 1580, 0.78), label('C · RISO', 540, 1700));
  }

  animate(tl: Timeline): void {
    tl.set({}, {}, 1);
  }
}

export const STYLE_LAB_SCENES: SceneClass[] = [LabScene];
