/**
 * Harry Kane – flat 2D cartoon: thin dark outline, flat fills, head in three-quarter profile facing
 * screen right (long face, big nose, dot eye), long thin body. England kit.
 *
 * Origin (0, 0) is on the ground between the feet; the figure is 372 units tall.
 * Parts rotate around their joints (tween `rotation`, degrees):
 *   KaneFigure
 *   └─ body                  (bob it with `y`)
 *      ├─ leftLeg, rightLeg  hip → leftShin, rightShin  knee
 *      ├─ shorts             hip (tilts with PELVIS × the torso)
 *      └─ torso              hip (shirt, neck)
 *         ├─ head            neck
 *         └─ leftArm, rightArm  shoulder → leftForearm, rightForearm  elbow → leftHand, rightHand  wrist
 *
 *   new KaneFigure({ x: 540, y: 1700, scale: 4 })
 */
import { Actor, SVG_NS, uid, type ActorOptions } from '@/engine';

type P = [number, number];

const LINE = '#1b1512';
const W = 1.6;
const SKIN = '#f1c6a4';
const SKIN_SHADE = '#dda886';
const HAIR = '#d6a465';
const HAIR_SHADE = '#b5844a';
const BEARD = '#b98a62';
const SHIRT = '#f6f5f1';
const SHIRT_SHADE = '#dedcd6';
const NAVY = '#1d2650';

const ink = (w = W) => `stroke="${LINE}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const fill = (color: string, w = W) => `fill="${color}" ${ink(w)}`;
const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${-Number(x)} ${y}`);

/** Parse trusted markup into SVG nodes. */
function nodes(markup: string): Node[] {
  const doc = new DOMParser().parseFromString(`<svg xmlns="${SVG_NS}">${markup}</svg>`, 'image/svg+xml');
  return [...doc.documentElement.childNodes].map((n) => document.importNode(n, true));
}

/** A part drawn in figure coordinates, pivoting at `pivot`; `parent` is the parent's pivot. */
/** A rig part that tells listeners whenever it moves (so a hanging item can stay plumb). */
export class Joint extends Actor {
  readonly listeners: (() => void)[] = [];
  protected override render(): void {
    super.render();
    // Undefined while Actor's constructor runs the first render.
    this.listeners?.forEach((listener) => listener());
  }
}

function part(name: string, pivot: P, parent: P, markup: string, rotation = 0): Joint {
  const actor = new Joint({ name, x: pivot[0] - parent[0], y: pivot[1] - parent[1], rotation });
  actor.draw('g', { transform: `translate(${-pivot[0]} ${-pivot[1]})` }).append(...nodes(markup));
  return actor;
}

// ── joints (figure coordinates) ──────────────────────────────────────────────

const HIP: P = [0, -150];
const NECK: P = [2, -282];
const SHOULDER_L: P = [-29, -244];
const SHOULDER_R: P = [31, -244];

// ── legs ─────────────────────────────────────────────────────────────────────

/** Knee height: the thigh runs hip → knee, the shin knee → ground. */
export const KNEE_Y = -94;
export const THIGH = KNEE_Y - -150;
export const SHIN = -KNEE_Y;

/** Limb thickness: 1 = the first thin version. Boots grow a little less. */
const LIMB = 1.45;
const BOOT = 1.2;

/*
 * Seamless joints: the limb pieces are filled without an outline and only their sides are inked.
 * A round joint cap with an outline sits under both pieces: its inner half is hidden by their
 * fills, the outer half shows as the rounded knee or elbow when the limb bends.
 */

/** Thigh: the knee cap, then the thigh (only the bit below the shorts shows). */
function thigh(cx: number): string {
  const x = (dx: number) => cx + dx * LIMB;
  return `
    <circle cx="${cx}" cy="${KNEE_Y}" r="${6 * LIMB}" ${fill(SKIN)}/>
    <path d="M ${x(-6.5)} -150 L ${x(6.5)} -150 L ${x(6)} ${KNEE_Y + 2} C ${x(3)} ${KNEE_Y + 6} ${x(-3)} ${KNEE_Y + 6} ${x(-6)} ${KNEE_Y + 2} Z" fill="${SKIN}"/>
    <path d="M ${x(-6.5)} -150 L ${x(-6)} ${KNEE_Y} M ${x(6.5)} -150 L ${x(6)} ${KNEE_Y}" fill="none" ${ink()}/>
    ${shortsLeg(cx)}`;
}

/** The leg of the shorts on a thigh: outer edge flared, inner edge meeting the other leg in the middle. */
function shortsLeg(cx: number): string {
  const s = Math.sign(cx);
  const X = (dx: number) => s * dx;
  return `
    <path d="M ${X(28)} -158 L ${X(-2)} -158 L ${X(0)} -106 C ${X(9)} -103 ${X(20)} -102 ${X(30)} -106 Z" ${fill(NAVY)}/>
    ${s > 0 ? `<text data-number="1" x="19" y="-113" font-family="Arial, sans-serif" font-size="10" fill="#f6f5f1" text-anchor="middle">9</text>` : ''}`;
}

/** Shin from the knee: a bit of skin, the sock, the boot. */
function shin(cx: number): string {
  const x = (dx: number) => cx + dx * LIMB;
  const b = (dx: number) => cx + dx * BOOT;
  return `
    <path d="M ${x(-6)} ${KNEE_Y - 4} L ${x(6)} ${KNEE_Y - 4} L ${x(5.5)} -84 L ${x(-5.5)} -84 Z" fill="${SKIN}"/>
    <path d="M ${x(-6)} ${KNEE_Y} L ${x(-5.5)} -86 M ${x(6)} ${KNEE_Y} L ${x(5.5)} -86" fill="none" ${ink()}/>
    <path d="M ${x(-6.5)} -90 C ${x(-7.5)} -64 ${x(-6.5)} -42 ${x(-5.5)} -22 L ${x(5.5)} -22 C ${x(6.5)} -42 ${x(7.5)} -64 ${x(6.5)} -90 Z" ${fill(SHIRT)}/>
    <path d="M ${x(1.5)} -86 C ${x(2.5)} -64 ${x(2)} -42 ${x(1.5)} -24 L ${x(5.5)} -24 C ${x(6.5)} -42 ${x(7)} -64 ${x(6)} -86 Z" fill="${SHIRT_SHADE}"/>
    <path d="M ${x(-6.6)} -84 L ${x(6.6)} -84" stroke="${NAVY}" stroke-width="2.2"/>
    <path d="M ${x(-5.5)} -26 C ${b(-8)} -16 ${b(-9)} -6 ${b(-7)} 0 L ${b(14)} 0 C ${b(16)} -5 ${b(11)} -9 ${b(6)} -13 L ${x(5.5)} -26 Z" ${fill('#202124')}/>
    <path d="M ${b(-7)} -1 L ${b(14)} -1" stroke="#f2f2f2" stroke-width="1.4"/>`;
}

// ── torso: neck, shorts, shirt ───────────────────────────────────────────────

/**
 * Shorts in three pieces so they move like real ones: a leg on each thigh (in thigh(), turning with
 * the leg) and the seat on the hips, which tilts only a little when he bends at the waist (PELVIS).
 * The seat covers the tops of the legs; the shirt covers the seat's waistband.
 */
const SHORTS = `
  <path d="M -25 -160 L 32 -160 C 34 -150 34 -142 30 -136 C 18 -130 -18 -130 -30 -136 C -34 -142 -34.6 -151 -31.5 -156.5 C -30 -159 -28 -160 -25 -160 Z" fill="${NAVY}"/>
  <path d="M -34 -146 C -34.6 -151 -33 -157 -25 -160 L 32 -160 L 33.6 -146" fill="none" ${ink()}/>`;
/**
 * The small of the back: shirt cloth under the shorts' seat, turning with the torso. Standing it is
 * hidden behind the seat and the shirt; when he bends forward it fills the gap between the shirt's
 * lifted back hem and the seat, carrying on the line of his back.
 */
const LOWER_BACK = `
  <path d="M -31 -192 L -31.5 -150 C -31 -141 -24 -135 -12 -133 L 12 -133 L 12 -192 Z" fill="${SHIRT}"/>
  <path d="M -31 -192 L -31.5 -150 C -31 -141 -24 -135 -12 -133" fill="none" ${ink()}/>`;

/** How much of the torso's lean the hips (shorts) follow. */
const PELVIS = 0.3;

const TORSO = `
  <path d="M -6 -292 L 10 -292 L 11 -244 L -7 -244 Z" ${fill(SKIN)}/>
  <path d="M 3 -276 L 10 -276 L 11 -250 L 4 -250 Z" fill="${SKIN_SHADE}"/>
  <path d="M -9 -250 C -16 -251 -26 -249 -32 -244 C -33 -230 -32 -215 -31 -205 L -31 -156 C -10 -152 10 -152 31 -156 L 31 -205 C 32 -215 33 -230 32 -244 C 27 -249 17 -251 11 -250 C 7 -244 -5 -244 -9 -250 Z" ${fill(SHIRT)}/>
  <path d="M 18 -244 C 22 -220 24 -190 22 -156 L 30.5 -157 L 30.5 -205 C 31.5 -215 32.5 -230 31.5 -243 Z" fill="${SHIRT_SHADE}"/>
  <path d="M -9 -250 C -5 -243 7 -243 11 -250" fill="none" stroke="${NAVY}" stroke-width="3" stroke-linecap="round"/>
  <path d="M 10 -238 L 18 -238 L 18 -231 C 18 -228 16 -226 14 -225 C 12 -226 10 -228 10 -231 Z" fill="#ffffff" ${ink(0.9)}/>
  <path d="M 12 -234 L 16 -234 M 12 -231 L 16 -231" stroke="${NAVY}" stroke-width=".9"/>
  <path d="M -22 -200 C -18 -190 -18 -178 -21 -168" fill="none" stroke="${SHIRT_SHADE}" stroke-width="1.4" stroke-linecap="round"/>`;

// ── arms ─────────────────────────────────────────────────────────────────────

// Arm shapes are the thin originals widened ×1.45 about their centre lines (LIMB) and made 22% longer.
const UPPER_ARM = 'M -35.6 -232 C -37.5 -217.4 -38.2 -205.2 -38.4 -189.3 C -35 -184.4 -30 -184.4 -26.6 -189.3 C -26.2 -205.2 -25.6 -217.4 -25.4 -232 Z';
const FOREARM = 'M -38.5 -196.6 C -39.1 -180.7 -39 -166.1 -38.8 -151.4 L -27.2 -151.4 C -27.2 -166.1 -26.9 -180.7 -26.7 -196.6 Z';
// Hand (left; the right one is mirrored): a palm, four fingers that hang down open and curl up
// into a fist, and a thumb that sticks out to the front and folds over the fingers (Hand.curl).
const PALM = 'M -38.6 -154 C -40.8 -150 -41.2 -146 -40.7 -141 L -40.5 -137 L -27.2 -137 L -27.2 -149 C -27.3 -151 -27.5 -152.5 -27.8 -154 Z';
/** Each finger: left and right edge, and how far down its tip hangs when open. */
const FINGERS: [number, number, number][] = [[-40.5, -37.2, -127], [-37.2, -33.8, -124.5], [-33.8, -30.4, -124], [-30.4, -27.2, -126.5]];
/** Where the fingers leave the palm (hidden under it). */
const KNUCKLE_Y = -140;
/** How short a finger gets when fully curled (seen end-on it is mostly the knuckle). */
const CURLED = 0.36;
/** Where a held item's handle sits: behind the curled fingers, so they wrap round it. */
const GRIP: P = [-33.8, -137.5];
const WRIST_L: P = [-33, -151.4];
const WRIST_R: P = [35, -151.4];
const SLEEVE = 'M -31 -248 C -40 -245 -44 -236 -45 -218 L -24.5 -216 C -25 -230 -25 -240 -23 -247 Z';
const SLEEVE_SHADE = 'M -36 -246 C -40 -240 -42 -230 -43 -219 L -36 -218 C -36 -230 -36 -240 -33 -247 Z';
const CUFF = 'M -44.6 -220 L -24.6 -218';
/** The right arm is the left one mirrored and nudged 2 to the right (the torso is a bit off-centre). */
const right = (d: string) => `d="${mirror(d)}" transform="translate(2 0)"`;

/** Inked sides of the upper arm and forearm (their fills have no outline). */
const UPPER_SIDES = 'M -35.6 -232 C -37.5 -217.4 -38.2 -205.2 -38.4 -189.3 M -26.6 -189.3 C -26.2 -205.2 -25.6 -217.4 -25.4 -232';
const FORE_SIDES = 'M -38.5 -191.7 C -39 -180.7 -39 -166.1 -38.8 -151.4 M -27.2 -151.4 C -27.2 -166.1 -26.9 -180.7 -26.6 -191.7';

const UPPER_L = `
  <path d="${UPPER_ARM}" fill="${SKIN}"/>
  <path d="${UPPER_SIDES}" fill="none" ${ink()}/>
  <path d="${SLEEVE}" ${fill(SHIRT)}/>
  <path d="${CUFF}" stroke="${NAVY}" stroke-width="2.4"/>`;
const FORE_L = `
  <circle cx="-32.5" cy="-191.7" r="5.6" ${fill(SKIN)}/>
  <path d="${FOREARM}" fill="${SKIN}"/>
  <path d="${FORE_SIDES}" fill="none" ${ink()}/>`;
const UPPER_R = `
  <path ${right(UPPER_ARM)} fill="${SKIN}"/>
  <path ${right(UPPER_SIDES)} fill="none" ${ink()}/>
  <path ${right(SLEEVE)} ${fill(SHIRT)}/>
  <path ${right(SLEEVE_SHADE)} fill="${SHIRT_SHADE}"/>
  <path ${right(CUFF)} stroke="${NAVY}" stroke-width="2.4"/>`;
const FORE_R = `
  <circle cx="34.5" cy="-191.7" r="5.6" ${fill(SKIN)}/>
  <path ${right(FOREARM)} fill="${SKIN}"/>
  <path ${right(FORE_SIDES)} fill="none" ${ink()}/>`;
const ELBOW_L: P = [-32.5, -191.7];
const ELBOW_R: P = [34.5, -191.7];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** The thumb: sticks out to the front when open, folds down over the fingers in a fist. */
function thumbPaths(curl: number): { fill: string; ink: string } {
  const tx = lerp(-22.2, -27.8, curl), ty = lerp(-144.5, -137.6, curl);
  const out = `M -27.4 -149.4 C -25.2 -149 ${(tx + 0.6).toFixed(2)} ${(ty - 2.8).toFixed(2)} ${tx.toFixed(2)} ${ty.toFixed(2)} C ${(tx - 0.4).toFixed(2)} ${(ty + 2.2).toFixed(2)} ${lerp(-25, -27, curl).toFixed(2)} ${lerp(-140.8, -139.4, curl).toFixed(2)} -27.4 ${lerp(-140.4, -141.4, curl).toFixed(2)}`;
  return { fill: `${out} L -29 -145 Z`, ink: out };
}

/** The fingers for a curl from 0 (open) to 1 (fist): filled shapes, and their inked sides and tips. */
function fingerPaths(curl: number): { fill: string; ink: string } {
  const k = 1 - (1 - CURLED) * curl;
  let fillD = '', inkD = '';
  FINGERS.forEach(([l, r, tipOpen], i) => {
    const tip = KNUCKLE_Y + (tipOpen - KNUCKLE_Y) * k;
    const round = Math.min(2.6, (tip - KNUCKLE_Y) * 0.5);
    const bottom = `L ${l} ${(tip - round).toFixed(2)} C ${l} ${(tip + round * 0.35).toFixed(2)} ${r} ${(tip + round * 0.35).toFixed(2)} ${r} ${(tip - round).toFixed(2)}`;
    fillD += `M ${l} ${KNUCKLE_Y - 1} ${bottom} L ${r} ${KNUCKLE_Y - 1} Z `;
    // Gaps between fingers are inked from the knuckles down; the hand's outer edges join the palm's.
    const top = (outer: boolean) => (outer ? KNUCKLE_Y - 1.5 : KNUCKLE_Y + 2);
    inkD += `M ${l} ${top(i === 0)} ${bottom} L ${r} ${top(i === FINGERS.length - 1)} `;
  });
  return { fill: fillD, ink: inkD };
}

/**
 * A hand at the wrist. Its fingers curl (0 = open, 1 = fist) and it can hold an item: the item sits
 * between the palm (behind) and the fingers (in front), so curled fingers wrap its handle.
 *
 *   tl.to(kane.rightHand, { curl: 1, duration: 0.15 })  // close the hand (seek-safe)
 *   kane.rightHand.hold(bag, { hang: true })            // bag's (0, 0) = its handle
 */
export class Hand extends Joint {
  /** Held items go here (or use hold()). */
  readonly slot: Actor;
  private readonly fingerFill: SVGPathElement;
  private readonly fingerInk: SVGPathElement;
  private readonly thumbFill: SVGPathElement;
  private readonly thumbInk: SVGPathElement;
  private _curl = 0;
  private chain: Joint[] = [];
  private hanging = false;

  constructor(name: string, wrist: P, parent: P, mirrored: boolean) {
    super({ name, x: wrist[0] - parent[0], y: wrist[1] - parent[1] });
    // Drawn in left-hand figure coordinates; the right hand is mirrored (thumb towards the body).
    const toHand = mirrored ? `translate(${-wrist[0]} ${-wrist[1]}) translate(2 0) scale(-1 1)` : `translate(${-wrist[0]} ${-wrist[1]})`;
    this.draw('g', { transform: toHand }).append(...nodes(`<path d="${PALM}" ${fill(SKIN)}/>`));
    const gx = mirrored ? 2 - GRIP[0] : GRIP[0];
    this.slot = new Actor({ name: 'slot', x: gx - wrist[0], y: GRIP[1] - wrist[1] });
    this.add(this.slot);
    const front = this.draw('g', { transform: toHand });
    this.fingerFill = front.appendChild(document.createElementNS(SVG_NS, 'path'));
    this.fingerFill.setAttribute('fill', SKIN);
    this.fingerInk = front.appendChild(document.createElementNS(SVG_NS, 'path'));
    this.thumbFill = front.appendChild(document.createElementNS(SVG_NS, 'path'));
    this.thumbFill.setAttribute('fill', SKIN);
    this.thumbInk = front.appendChild(document.createElementNS(SVG_NS, 'path'));
    for (const ink of [this.fingerInk, this.thumbInk]) {
      for (const [k, v] of [['fill', 'none'], ['stroke', LINE], ['stroke-width', String(W)], ['stroke-linecap', 'round'], ['stroke-linejoin', 'round']]) ink.setAttribute(k, v);
    }
    this.curl = 0;
  }

  /** 0 = fingers open and hanging, 1 = a fist. Tween it. */
  get curl(): number {
    return this._curl;
  }

  set curl(value: number) {
    this._curl = Math.max(0, Math.min(1, value));
    const { fill: f, ink: i } = fingerPaths(this._curl);
    this.fingerFill?.setAttribute('d', f);
    this.fingerInk?.setAttribute('d', i);
    const thumb = thumbPaths(this._curl);
    this.thumbFill?.setAttribute('d', thumb.fill);
    this.thumbInk?.setAttribute('d', thumb.ink);
  }

  /** Called by the figure: the joints above this hand, torso first. */
  attach(chain: Joint[]): void {
    this.chain = [...chain, this];
    for (const joint of this.chain) joint.listeners.push(() => this.level());
  }

  /** Hang mode: turn the slot against the arm so held items hang plumb. */
  set hang(value: boolean) {
    this.hanging = value;
    this.level();
  }

  private level(): void {
    if (this.slot) this.slot.rotation = this.hanging ? -this.chain.reduce((sum, joint) => sum + joint.rotation, 0) : 0;
  }

  /** Put `item` in the hand (its origin at the grip). `hang: true` keeps it hanging straight down. */
  hold(item: Actor, { hang = false } = {}): void {
    this.slot.add(item);
    this.hang = hang;
  }

  /** Take every held item out of the hand and return them. */
  release(): Actor[] {
    const items = [...this.slot.children];
    for (const item of items) item.remove();
    this.hang = false;
    return items;
  }
}

// ── head: three-quarter profile facing right ─────────────────────────────────

const FACE = 'M -22 -336 C -27 -318 -25 -296 -14 -285 C -4 -276 12 -273 19 -278 C 22 -281 22 -287 21 -291 C 23 -292 23 -295 21 -297 L 22 -298 C 27 -297 33 -298 34 -301 C 35 -304 31 -307 27 -311 C 22 -316 19 -321 18 -326 C 19 -333 17 -340 13 -345 C 0 -350 -16 -348 -22 -336 Z';
const HAIR_SHAPE = 'M -24 -330 C -30 -340 -28 -356 -16 -364 C -6 -370 8 -372 18 -368 C 25 -365 26 -359 22 -355 C 19 -351 16 -348 13 -345 C 4 -347 -6 -345 -9 -340 C -6 -334 -4 -327 -3 -320 C -12 -320 -20 -324 -24 -330 Z';

const head = (clip: string) => `
  <defs><clipPath id="${clip}"><path d="${FACE}"/></clipPath></defs>
  <path d="${FACE}" fill="${SKIN}"/>
  <g clip-path="url(#${clip})">
    <path d="M -30 -340 C -24 -320 -22 -300 -14 -284 L -40 -270 L -40 -340 Z" fill="${SKIN_SHADE}"/>
    <path d="M -18 -304 C -8 -298 8 -297 22 -298 L 40 -298 L 40 -260 L -30 -260 Z" fill="${BEARD}" opacity=".55"/>
    <path d="M 12 -293 C 16 -295 20 -296 23 -296 L 23 -292 C 19 -292 15 -291 12 -290 Z" fill="${BEARD}" opacity=".6"/>
  </g>
  <path d="${FACE}" fill="none" ${ink()}/>
  <path d="${HAIR_SHAPE}" ${fill(HAIR)}/>
  <path d="M -11 -362 C -2 -361 8 -363 16 -366 M -19 -352 C -9 -352 1 -355 10 -359 M -22 -340 C -16 -344 -8 -346 0 -348" fill="none" stroke="${HAIR_SHADE}" stroke-width="1.3" stroke-linecap="round"/>
  <g transform="translate(9 0)"><path d="M -12 -318 C -18 -322 -22 -314 -20 -305 C -19 -299 -14 -297 -11 -300 Z" ${fill(SKIN)}/>
  <path d="M -15 -313 C -17 -309 -16 -304 -13.5 -302" fill="none" ${ink(1.1)}/></g>
  <path d="M 5 -327 C 9 -329 14 -329 18 -326.5" fill="none" stroke="#8d6337" stroke-width="2" stroke-linecap="round"/>
  <path d="M 7 -320 C 10 -322.5 13 -322.5 15.5 -320.5" fill="none" ${ink(1.1)}/>
  <ellipse cx="11.5" cy="-318.2" rx="1.6" ry="2" fill="${LINE}"/>
  <path d="M 14 -313 C 17 -312 19 -310 20 -307" fill="none" stroke="${SKIN_SHADE}" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M 24.5 -299.5 C 26.5 -301.5 29 -301 29.5 -299.5" fill="none" ${ink(1.1)}/>
  <path d="M 9 -289 C 13 -288 17 -288.6 20.5 -290" fill="none" ${ink(1.3)}/>
  <path d="M 13 -283 C 15 -282.5 17 -283 18 -284" fill="none" stroke="${SKIN_SHADE}" stroke-width="1" stroke-linecap="round"/>`;

/** Full-body Harry Kane, flat cartoon, England kit. */
export class KaneFigure extends Actor {
  readonly torso: Joint;
  /** The shorts, pivoting at the hip; they follow PELVIS × the torso's rotation by themselves. */
  readonly shorts: Joint;
  /** Turns with the torso by itself (see LOWER_BACK). */
  readonly lowerBack: Joint;
  readonly head: Joint;
  readonly leftArm: Joint;
  readonly rightArm: Joint;
  readonly leftForearm: Joint;
  readonly rightForearm: Joint;
  readonly leftHand: Hand;
  readonly rightHand: Hand;
  readonly leftLeg: Joint;
  readonly rightLeg: Joint;
  readonly leftShin: Joint;
  readonly rightShin: Joint;
  /** Everything above the ground line: tween `y` to bob the whole body (the walk keeps a foot on the ground). */
  readonly body: Actor;

  constructor(options: ActorOptions = {}) {
    super({ name: 'Kane', ...options });
    const origin: P = [0, 0];
    this.leftLeg = part('leftLeg', [-13, -150], origin, thigh(-13));
    this.rightLeg = part('rightLeg', [13, -150], origin, thigh(13));
    this.leftShin = part('leftShin', [-13, KNEE_Y], [-13, -150], shin(-13));
    this.rightShin = part('rightShin', [13, KNEE_Y], [13, -150], shin(13));
    this.leftLeg.add(this.leftShin);
    this.rightLeg.add(this.rightShin);
    this.torso = part('torso', HIP, origin, TORSO);
    this.shorts = part('shorts', HIP, origin, SHORTS);
    this.lowerBack = part('lowerBack', HIP, origin, LOWER_BACK);
    this.torso.listeners.push(() => {
      this.shorts.rotation = this.torso.rotation * PELVIS;
      this.lowerBack.rotation = this.torso.rotation;
    });
    this.head = part('head', NECK, HIP, head(uid('kane-face')));
    this.leftArm = part('leftArm', SHOULDER_L, HIP, UPPER_L);
    this.rightArm = part('rightArm', SHOULDER_R, HIP, UPPER_R);
    // Forearms go under the upper arm (the sleeve covers the elbow joint from above).
    this.leftForearm = part('leftForearm', ELBOW_L, SHOULDER_L, FORE_L);
    this.rightForearm = part('rightForearm', ELBOW_R, SHOULDER_R, FORE_R);
    this.leftArm.add(this.leftForearm).el.prepend(this.leftForearm.el);
    this.rightArm.add(this.rightForearm).el.prepend(this.rightForearm.el);
    // Hands go under the forearm, so the wrist shows no seam.
    this.leftHand = new Hand('leftHand', WRIST_L, ELBOW_L, false);
    this.rightHand = new Hand('rightHand', WRIST_R, ELBOW_R, true);
    this.leftForearm.add(this.leftHand).el.prepend(this.leftHand.el);
    this.rightForearm.add(this.rightHand).el.prepend(this.rightHand.el);
    this.leftHand.attach([this.torso, this.leftArm, this.leftForearm]);
    this.rightHand.attach([this.torso, this.rightArm, this.rightForearm]);
    this.torso.add(this.head, this.leftArm, this.rightArm);
    this.body = new Actor({ name: 'body' });
    // Legs, the small of the back, the shorts over the tops of the thighs, the shirt over the waistband.
    this.body.add(this.leftLeg, this.rightLeg, this.lowerBack, this.shorts, this.torso);
    this.add(this.body);
    this.number = this.rightLeg.el.querySelector('[data-number]') ?? undefined;
    this.render();
  }

  /** The shorts number stays readable when the figure is flipped (scaleX < 0). */
  private number?: Element;
  protected override render(): void {
    super.render();
    this.number?.setAttribute('transform', this.scaleX < 0 ? 'translate(38 0) scale(-1 1)' : '');
  }
}
