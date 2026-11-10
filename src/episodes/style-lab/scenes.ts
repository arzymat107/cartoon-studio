/**
 * Style lab: one player (Kane) drawn in three candidate house styles, to pick the channel's own look.
 * Heads only, 600 × 700 frame, chin at (300, 640). Likeness from Kane's traits: light-brown hair swept
 * back from a receding hairline, long heavy bearded jaw, long straight nose, small eyes.
 *
 *   npm run frames -- --episode style-lab 0.5
 *
 *   A "Block"   – chunky geometric shapes, thick black outline, big round eyes, saturated colours
 *   B "Paper"   – no outlines at all: flat colour blocks with one hard-edged shadow side, dot eyes
 *   C "Riso"    – wobbly ink line, colour fill printed slightly off the line, 4-colour palette
 */
import { SvgArt, TextLabel } from '@/components';
import { Actor, Scene, type SceneClass, type Timeline } from '@/engine';

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const label = (text: string, x: number, y: number, fontSize = 44, color = '#1d120d') =>
  new TextLabel({ text, x, y, fontSize, font: FONT, weight: 400, color });

// ── A · Block ────────────────────────────────────────────────────────────────

const aLine = (w = 13) => `stroke="#141414" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const A_LINE = aLine();
const A_FACE = 'M 172 262 C 172 176 228 150 300 150 C 372 150 428 176 428 262 L 444 520 C 446 606 380 640 300 640 C 220 640 154 606 156 520 Z';
const BLOCK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700">
<defs><clipPath id="a-face"><path d="${A_FACE}"/></clipPath></defs>
<path d="M 236 600 L 232 700 L 368 700 L 364 600 Z" fill="#e39a6c" ${A_LINE}/>
<path d="M 60 700 C 80 650 160 630 236 640 Q 300 676 364 640 C 440 630 520 650 540 700 Z" fill="#e8173c" ${A_LINE}/>
<path d="M 172 360 C 120 350 116 450 166 456 Z" fill="#f4b184" ${A_LINE}/>
<path d="M 428 360 C 480 350 484 450 434 456 Z" fill="#f4b184" ${A_LINE}/>
<path d="${A_FACE}" fill="#f4b184"/>
<g clip-path="url(#a-face)">
  <path d="M 120 470 C 170 530 220 548 262 540 L 338 540 C 380 548 430 530 480 470 L 480 700 L 120 700 Z" fill="#b5793f"/>
</g>
<path d="${A_FACE}" fill="none" ${A_LINE}/>
<path d="M 166 330 C 150 200 196 104 300 98 C 404 104 450 200 434 330 C 424 270 410 236 388 224 C 360 236 330 246 300 252 C 270 246 240 236 212 224 C 190 236 176 270 166 330 Z" fill="#dca55a" ${A_LINE}/>
<path d="M 250 230 C 250 180 270 140 310 118 M 330 238 C 340 190 360 156 396 138" fill="none" stroke="#141414" stroke-width="9" stroke-linecap="round"/>
<path d="M 208 298 L 278 292" ${aLine(16)}/>
<path d="M 322 292 L 392 298" ${aLine(16)}/>
<circle cx="246" cy="350" r="30" fill="#fff" ${A_LINE}/>
<circle cx="354" cy="350" r="30" fill="#fff" ${A_LINE}/>
<circle cx="256" cy="354" r="12" fill="#141414"/>
<circle cx="364" cy="354" r="12" fill="#141414"/>
<path d="M 300 360 L 300 470 Q 300 494 326 492" fill="none" ${A_LINE}/>
<path d="M 254 566 Q 300 586 346 566" fill="none" ${A_LINE}/>
</svg>`;

// ── B · Paper ────────────────────────────────────────────────────────────────

const B_FACE = 'M 300 640 C 374 640 426 608 444 548 C 460 492 458 380 446 300 C 432 206 380 168 300 168 C 220 168 168 206 154 300 C 142 380 140 492 156 548 C 174 608 226 640 300 640 Z';
const PAPER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700">
<defs><clipPath id="b-face"><path d="${B_FACE}"/></clipPath></defs>
<path d="M 244 590 L 240 700 L 360 700 L 356 590 Z" fill="#c98463"/>
<path d="M 40 700 C 70 646 160 626 240 636 L 300 664 L 360 636 C 440 626 530 646 560 700 Z" fill="#1f4e9c"/>
<path d="M 300 664 L 240 636 L 270 700 L 330 700 L 360 636 Z" fill="#163a78"/>
<ellipse cx="152" cy="410" rx="30" ry="46" fill="#e2a581"/>
<ellipse cx="448" cy="410" rx="30" ry="46" fill="#c98463"/>
<path d="${B_FACE}" fill="#eab08c"/>
<g clip-path="url(#b-face)">
  <path d="M 330 150 C 400 260 420 420 380 700 L 520 700 L 520 150 Z" fill="#d39370"/>
  <path d="M 120 470 C 170 548 230 566 270 560 C 290 556 310 556 330 560 C 370 566 430 548 480 470 L 480 700 L 120 700 Z" fill="#a97446"/>
  <path d="M 404 480 C 414 570 402 650 384 700 L 520 700 L 520 440 Z" fill="#8f6038"/>
</g>
<path d="M 150 340 C 132 220 180 112 300 104 C 420 112 468 220 450 340 C 438 280 420 246 396 232 C 364 248 332 258 300 262 C 268 258 236 248 204 232 C 180 246 162 280 150 340 Z" fill="#cf9b5c"/>
<path d="M 300 104 C 420 112 468 220 450 340 C 438 280 420 246 396 232 C 380 180 350 136 300 104 Z" fill="#b07f45"/>
<path d="M 216 318 C 236 306 262 304 282 310 L 280 322 C 262 318 238 320 218 328 Z" fill="#6e4a28"/>
<path d="M 384 318 C 364 306 338 304 318 310 L 320 322 C 338 318 362 320 382 328 Z" fill="#6e4a28"/>
<ellipse cx="250" cy="362" rx="8" ry="11" fill="#1b120d"/>
<ellipse cx="350" cy="362" rx="8" ry="11" fill="#1b120d"/>
<path d="M 300 352 C 304 410 318 452 332 476 C 342 496 322 508 300 506 C 286 506 276 498 280 488 C 292 486 304 480 306 468 C 300 440 296 400 300 352 Z" fill="#c4825f"/>
<path d="M 262 578 Q 300 590 338 578 L 336 586 Q 300 600 264 586 Z" fill="#3a1f12"/>
</svg>`;

// ── C · Riso ─────────────────────────────────────────────────────────────────

const C_INK = '#22305c';
const cLine = (w = 7) => `stroke="${C_INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" fill="none" filter="url(#c-wobble)"`;
const C_LINE = cLine();
const C_FACE = 'M 300 640 C 370 640 424 610 440 548 C 456 486 452 380 440 300 C 428 210 376 172 300 172 C 224 172 172 210 160 300 C 148 380 144 486 160 548 C 176 610 230 640 300 640 Z';
const C_HAIR = 'M 160 330 C 142 214 190 110 300 104 C 410 110 458 214 440 330 C 428 270 412 240 390 228 C 362 242 330 252 300 256 C 270 252 238 242 210 228 C 188 240 172 270 160 330 Z';
const C_BEARD = 'M 160 470 C 200 540 240 562 276 558 L 324 558 C 360 562 400 540 440 470 C 452 520 440 580 420 606 C 390 636 346 644 300 644 C 254 644 210 636 180 606 C 160 580 148 520 160 470 Z';
const shift = (markup: string, dx: number, dy: number) => `<g transform="translate(${dx} ${dy})">${markup}</g>`;
const RISO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700">
<defs>
  <filter id="c-wobble" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4"/>
    <feDisplacementMap in="SourceGraphic" scale="7"/>
  </filter>
  <pattern id="c-dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2.2" fill="#e8607a" opacity=".55"/></pattern>
</defs>
${shift(`
<path d="M 50 700 C 80 650 160 630 240 640 Q 300 670 360 640 C 440 630 520 650 550 700 Z" fill="#e8455f"/>
<path d="${C_FACE}" fill="#f7c4a0"/>
<path d="M 330 180 C 410 280 430 450 400 640 L 450 640 L 450 180 Z" fill="url(#c-dots)"/>
<path d="${C_BEARD}" fill="#d29a5c"/>
<path d="${C_HAIR}" fill="#f2b84b"/>
<ellipse cx="156" cy="410" rx="26" ry="42" fill="#f7c4a0"/>
<ellipse cx="444" cy="410" rx="26" ry="42" fill="#f7c4a0"/>
`, 10, 8)}
<path d="M 240 640 L 240 700 M 360 640 L 360 700" ${C_LINE}/>
<path d="M 50 700 C 80 650 160 630 240 640 Q 300 670 360 640 C 440 630 520 650 550 700" ${C_LINE}/>
<path d="M 160 380 C 126 360 120 450 162 456 M 440 380 C 474 360 480 450 438 456" ${C_LINE}/>
<path d="${C_FACE}" ${C_LINE}/>
<path d="M 160 470 C 200 540 240 562 276 558 L 324 558 C 360 562 400 540 440 470" ${C_LINE}/>
<path d="${C_HAIR}" ${C_LINE}/>
<path d="M 256 246 C 250 196 266 152 300 126 M 340 250 C 346 200 362 164 392 142" ${C_LINE}/>
<path d="M 214 318 Q 246 304 280 314 M 320 314 Q 354 304 386 318" ${cLine(9)}/>
<circle cx="250" cy="362" r="9" fill="${C_INK}"/>
<circle cx="350" cy="362" r="9" fill="${C_INK}"/>
<path d="M 296 352 C 294 410 284 450 274 478 C 268 498 292 508 314 500" ${C_LINE}/>
<path d="M 262 592 Q 300 606 338 590" ${C_LINE}/>
</svg>`;

// ── the scene ────────────────────────────────────────────────────────────────

const head = (markup: string, x: number, y: number, scale: number) => new SvgArt({ markup, x, y, scale, originX: 300, originY: 640 });

class LabScene extends Scene {
  readonly title = 'Style lab – three house styles';

  build(): void {
    const { width, height } = this.stage;
    const bg = new Actor({ name: 'bg' });
    bg.draw('rect', { x: 0, y: 0, width, height, fill: '#f3ede2' });
    this.add(bg, label('KANE · THREE STYLES', width / 2, 330, 60));
    this.add(head(BLOCK, 280, 940, 0.75), label('A · BLOCK', 280, 1050));
    this.add(head(PAPER, 800, 940, 0.75), label('B · PAPER', 800, 1050));
    this.add(head(RISO, 540, 1560, 0.75), label('C · RISO', 540, 1670));
  }

  animate(tl: Timeline): void {
    tl.set({}, {}, 1);
  }
}

export const STYLE_LAB_SCENES: SceneClass[] = [LabScene];
