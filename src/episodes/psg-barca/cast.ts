/**
 * Cast and props for the PSG 4–2 Barça Short (PSG end Barcelona's 11-game winning run).
 * Caricatures recognizable by kit colors, numbers, hair and build – no crests, logos or sponsors,
 * generic voices. Numbers are from the clubs' 2026-27 squad lists.
 */
import { Footballer, Scoreboard, type FootballerOptions, type Kit } from '@/components';
import { Actor, svg, uid, type ActorOptions } from '@/engine';
import { GROUND_Y } from '../football/stadium';

type CastOptions = Partial<Omit<FootballerOptions, 'kit'>>;
type PlayerOptions = CastOptions & { number?: number };

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';
export const PSG_NAVY = '#0b1f4b';
export const PSG_RED = '#da291c';
export const BARCA_BLUE = '#004d98';
export const BARCA_GARNET = '#a50044';
/** Fan shirt colors for both teams. */
export const FAN_SHIRTS = [PSG_NAVY, PSG_RED, '#ffffff', BARCA_BLUE, BARCA_GARNET, '#edbb00'];

/** TV score bug, PSG at home. */
export function createMatchScoreboard(width: number): Scoreboard {
  return new Scoreboard({
    x: width / 2, y: 60,
    home: { name: 'PSG', color: PSG_NAVY, accent: PSG_RED },
    away: { name: 'Barça', color: BARCA_BLUE, accent: BARCA_GARNET },
  });
}

// ── PSG ───────────────────────────────────────────────────────────────

/** PSG outfield player: navy shirt with a red stripe down the middle, white number on top. */
export function createPsgPlayer({ number, ...options }: PlayerOptions = {}): Footballer {
  const kit: Kit = { shirt: PSG_NAVY, number, numberColor: '#ffffff', shorts: PSG_NAVY, socks: PSG_NAVY };
  const player = new Footballer({
    name: 'PSG', y: GROUND_Y, scale: 1.4, skin: '#e8b98f', hair: '#2b1d14',
    face: { width: 42, height: 48, jaw: 31, chin: 15, browWeight: 6, browTilt: -0.5, nose: 'broad', lips: '#a8645a' },
    kit, voice: { pitch: 0.85 },
    ...options,
  });
  // Under the number, which Footballer has already drawn into torsoDetail.
  player.torsoDetail.el.prepend(svg('rect', { x: -8, y: -95, width: 16, height: 100, fill: PSG_RED }));
  return player;
}

/** Marquinhos: the captain, drawn gigantic – armband, short dark hair, clean-shaven, number 5. */
export function createMarquinhos(options: CastOptions = {}): Footballer {
  const captain = createPsgPlayer({
    name: 'Marquinhos', number: 5, scale: 2.4, headScale: 0.85, skin: '#d8a77c', hair: '#1a120c',
    face: {
      width: 42, height: 49, jaw: 33, chin: 16,
      eyeColor: '#3b2414', browColor: '#1a120c', browWeight: 6.5, browTilt: -1.5, nose: 'straight', lips: '#a8645a',
    },
    voice: { pitch: 0.6 },
    ...options,
  });
  captain.leftArm.draw('rect', { x: -10, y: 16, width: 20, height: 9, rx: 2, fill: '#ffd60a' });
  return captain;
}

/** Hakimi: lean right-back, short black hair, clean-shaven, number 2. */
export const createHakimi = (options: CastOptions = {}) =>
  createPsgPlayer({
    name: 'Hakimi', number: 2, scale: 1.42, skin: '#b98258', hair: '#141010',
    face: {
      width: 39, height: 49, jaw: 27, chin: 13, eyeColor: '#2b1a10', browColor: '#141010', browWeight: 5.5,
      browTilt: 0.5, nose: 'straight', lips: '#94584a', cheekbones: true,
    },
    ...options,
  });

/** Vitinha: the smallest man on the pitch, dark crop, light stubble, number 17. */
export const createVitinha = (options: CastOptions = {}) =>
  createPsgPlayer({
    name: 'Vitinha', number: 17, scale: 1.18, headScale: 1.12, skin: '#e6b993', hair: '#2a1c12',
    face: {
      width: 40, height: 46, jaw: 26, chin: 13, eyeColor: '#4a2e1a', browColor: '#2a1c12', browWeight: 5,
      browTilt: -0.5, nose: 'small', lips: '#b46a5c', stubble: '#5a4434',
    },
    ...options,
  });

/** Zaïre-Emery: young midfielder, dark skin, short black hair, clean-shaven, number 33. */
export const createZaireEmery = (options: CastOptions = {}) =>
  createPsgPlayer({
    name: 'ZaireEmery', number: 33, scale: 1.4, headScale: 1.08, skin: '#4e3020', hair: '#0e0b09',
    face: {
      width: 40, height: 47, jaw: 28, chin: 14, eyeColor: '#1e130c', browColor: '#0e0b09', browWeight: 5,
      browTilt: 0, nose: 'broad', lips: '#4a2a20',
    },
    ...options,
  });

/** Fabián Ruiz: tall and unhurried, short hair, clean-shaven. (His 2026-27 number isn't confirmed, so none.) */
export const createRuiz = (options: CastOptions = {}) =>
  createPsgPlayer({
    name: 'Ruiz', scale: 1.5, skin: '#e4b48a', hair: '#24170f', hairStyle: 'short',
    face: {
      width: 40, height: 50, jaw: 29, chin: 14, eyeColor: '#3b2414', browColor: '#24170f', browWeight: 5.5,
      browTilt: -1, nose: 'straight', lips: '#a8645a',
    },
    ...options,
  });

/** Safonov: tall PSG goalkeeper, light-brown hair in a ponytail, clean-shaven, number 39. */
export function createSafonov(options: CastOptions = {}): Footballer {
  const keeper = new Footballer({
    name: 'Safonov', y: GROUND_Y, scale: 1.55, skin: '#f0c8a0', hair: '#7a5a3a',
    face: {
      width: 40, height: 52, jaw: 28, chin: 15, eyeColor: '#4a6a8a', browColor: '#6a4a2e', browWeight: 4.5,
      browTilt: 0, nose: 'straight', lips: '#c07a6a',
    },
    kit: { shirt: '#1fb5a8', number: 39, numberColor: PSG_NAVY, shorts: '#1fb5a8', socks: '#1fb5a8' },
    voice: { pitch: 0.9 },
    ...options,
  });
  // Ponytail at the back of the head (behind it, so the face stays in front), with a hair tie.
  const hair = keeper.look.hair;
  keeper.head.el.prepend(
    svg('path', { d: 'M -34 -92 C -62 -88 -72 -60 -66 -30 C -62 -14 -54 -8 -50 -14 C -56 -36 -50 -64 -30 -78 Z', fill: hair }),
    svg('rect', { x: -44, y: -92, width: 12, height: 16, rx: 4, fill: '#1b1b1b', transform: 'rotate(-30 -38 -84)' }),
  );
  return keeper;
}

// ── Barça ─────────────────────────────────────────────────────────────

/** Barça outfield player: garnet and blue stripes, gold number. */
export const createBarcaPlayer = ({ number, ...options }: PlayerOptions = {}) =>
  new Footballer({
    name: 'Barca', y: GROUND_Y, scale: 1.4, skin: '#eac39c', hair: '#3a2616',
    face: { width: 40, height: 48, jaw: 28, chin: 14, nose: 'straight' },
    kit: { shirt: BARCA_GARNET, stripes: BARCA_BLUE, number, numberColor: '#edbb00', shorts: BARCA_BLUE, socks: BARCA_GARNET },
    voice: { pitch: 1 },
    ...options,
  });

/** Young, slight wizard of the wing: number 10. */
export const createYamal = (options: CastOptions = {}) =>
  createBarcaPlayer({
    name: 'Yamal', number: 10, scale: 1.28, headScale: 1.16, skin: '#8a5a3c', hair: '#16100c',
    face: {
      width: 38, height: 46, jaw: 24, chin: 12, eyeColor: '#2b1a10', browColor: '#16100c', browWeight: 4.5,
      browTilt: 1, nose: 'small', lips: '#7a4436',
    },
    voice: { pitch: 1.2 },
    ...options,
  });

/** Balde: quick left-back, dark skin, short black hair, number 3. */
export const createBalde = (options: CastOptions = {}) =>
  createBarcaPlayer({
    name: 'Balde', number: 3, scale: 1.34, skin: '#4e3020', hair: '#0e0b09',
    face: { width: 39, height: 47, jaw: 26, chin: 13, eyeColor: '#1e130c', browColor: '#0e0b09', nose: 'broad', lips: '#4a2a20' },
    ...options,
  });

/** Gerard Martín: tall defender, brown hair, number 18. */
export const createMartin = (options: CastOptions = {}) =>
  createBarcaPlayer({
    name: 'Martin', number: 18, scale: 1.48, skin: '#eac39c', hair: '#4a2e1a',
    face: { width: 40, height: 50, jaw: 28, chin: 14, eyeColor: '#4a2e1a', browColor: '#4a2e1a', nose: 'straight', lips: '#b46a5c' },
    ...options,
  });

/** Cancelo: dark hair, short beard, number 2. */
export const createCancelo = (options: CastOptions = {}) =>
  createBarcaPlayer({
    name: 'Cancelo', number: 2, scale: 1.4, skin: '#c99a70', hair: '#1a120c',
    face: {
      width: 40, height: 48, jaw: 29, chin: 14, eyeColor: '#2b1a10', browColor: '#1a120c', browWeight: 5,
      browTilt: 1, nose: 'straight', lips: '#94584a', stubble: '#1a120c',
    },
    ...options,
  });

/** Joan García: Barça goalkeeper in orange, dark hair, stubble, number 1. */
export const createJoanGarcia = (options: CastOptions = {}) =>
  new Footballer({
    name: 'JoanGarcia', y: GROUND_Y, scale: 1.5, skin: '#efc39b', hair: '#2a1c12',
    face: {
      width: 40, height: 50, jaw: 29, chin: 14, eyeColor: '#3b2414', browColor: '#2a1c12', browWeight: 5,
      nose: 'straight', lips: '#b46a5c', stubble: '#3a2a1e',
    },
    kit: { shirt: '#ff8c1a', number: 1, numberColor: '#1b1b1b', shorts: '#1b1b1b', socks: '#ff8c1a' },
    voice: { pitch: 1 },
    ...options,
  });

// ── Props ─────────────────────────────────────────────────────────────

/**
 * Glow and twinkling stars around the ball – gold for magic, orange for a fireball. Add it to
 * `ball.body` so it follows and spins with the ball; starts hidden (opacity 0).
 */
export function createBallAura(radius: number, color = '#ffe066'): Actor {
  const aura = new Actor({ name: 'aura', opacity: 0 });
  const glowId = uid('aura');
  const gradient = aura.draw('radialGradient', { id: glowId });
  gradient.append(
    svg('stop', { offset: 0.45, 'stop-color': color, 'stop-opacity': 0.75 }),
    svg('stop', { offset: 1, 'stop-color': color, 'stop-opacity': 0 }),
  );
  aura.el.prepend(svg('circle', { r: radius * 2.4, fill: `url(#${glowId})` }));
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + 0.4;
    aura.add(star(Math.cos(a) * radius * 1.9, Math.sin(a) * radius * 1.9, i % 2 ? 9 : 13));
  }
  return aura;
}

/** Four-pointed twinkle star. */
export function star(x: number, y: number, size: number, color = '#fff6b0'): Actor {
  const s = new Actor({ name: 'star', x, y });
  const k = size * 0.28;
  s.draw('path', { d: `M 0 ${-size} L ${k} ${-k} L ${size} 0 L ${k} ${k} L 0 ${size} L ${-k} ${k} L ${-size} 0 L ${-k} ${-k} Z`, fill: color });
  return s;
}

/** Ring of yellow stars for a dizzy head; spin it. Starts hidden. */
export function dizzyStars(options: ActorOptions = {}): Actor {
  const ring = new Actor({ name: 'dizzy', opacity: 0, ...options });
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ring.add(star(Math.cos(a) * 46, Math.sin(a) * 14, 12, '#ffd60a'));
  }
  return ring;
}

/** Glowing target with a big 9 – the top corner ("la novena"). Starts hidden. */
export function cornerTarget(options: ActorOptions = {}): Actor {
  const t = new Actor({ name: 'target', scale: 0, opacity: 0, ...options });
  t.draw('circle', { r: 52, fill: 'rgba(255,214,10,0.25)', stroke: '#ffd60a', 'stroke-width': 6 });
  t.draw('circle', { r: 30, fill: 'none', stroke: '#ffd60a', 'stroke-width': 4 });
  const nine = t.draw('text', { x: 0, y: 16, 'text-anchor': 'middle', 'font-family': FONT, 'font-size': 46, fill: '#ffd60a' });
  nine.textContent = '9';
  return t;
}

/** Grey puff of dust or smoke. Starts hidden; pop it and fade it. */
export function puff(options: ActorOptions = {}, color = '#d9d4cc'): Actor {
  const p = new Actor({ name: 'puff', scale: 0, opacity: 0, ...options });
  for (const [cx, cy, r] of [[-26, 4, 24], [0, -10, 30], [28, 2, 22], [8, 14, 20]]) p.draw('circle', { cx, cy, r, fill: color });
  return p;
}

/** Tea cup with steam, for a hand. Origin = the hand end of a 64-long arm. */
export function teaCup(): Actor {
  const cup = new Actor({ name: 'tea', y: 62 });
  cup.draw('path', { d: 'M -12 -6 L 12 -6 L 9 12 L -9 12 Z', fill: '#ffffff', stroke: '#9aa4b2', 'stroke-width': 2 });
  cup.draw('path', { d: 'M 12 -2 q 9 3 0 9', fill: 'none', stroke: '#ffffff', 'stroke-width': 3 });
  for (const x of [-5, 4]) cup.draw('path', { d: `M ${x} -10 q -5 -7 0 -14 q 5 -7 0 -14`, fill: 'none', stroke: 'rgba(255,255,255,0.7)', 'stroke-width': 2.5 });
  return cup;
}

/**
 * Win-streak board: a row of green ticks (`ticks`, hidden until popped in) and an empty slot for
 * the next game with a red cross (`cross`, hidden). Origin = center of the row.
 */
export class StreakBoard extends Actor {
  readonly ticks: Actor[] = [];
  readonly cross: Actor;

  constructor({ wins, ...options }: ActorOptions & { wins: number }) {
    super({ name: 'StreakBoard', ...options });
    const gap = 76;
    const left = -(wins * gap) / 2;
    this.draw('rect', { x: left - 50, y: -58, width: (wins + 1) * gap + 60, height: 116, rx: 30, fill: 'rgba(10,14,30,0.85)' });
    for (let i = 0; i <= wins; i++) this.draw('circle', { cx: left + i * gap, cy: 0, r: 30, fill: 'rgba(255,255,255,0.12)' });
    for (let i = 0; i < wins; i++) {
      const tick = new Actor({ name: 'tick', x: left + i * gap, scale: 0, opacity: 0 });
      tick.draw('circle', { r: 30, fill: '#2a9d4b' });
      tick.draw('path', { d: 'M -14 1 L -4 11 L 15 -11', stroke: '#fff', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      this.ticks.push(tick);
      this.add(tick);
    }
    this.cross = new Actor({ name: 'cross', x: left + wins * gap, scale: 0, opacity: 0, rotation: -20 });
    this.cross.draw('circle', { r: 36, fill: '#d62828' });
    this.cross.draw('path', { d: 'M -15 -15 L 15 15 M 15 -15 L -15 15', stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round' });
    this.add(this.cross);
  }
}

/** One row of the league table: color chip and team name. Origin = left middle. */
export function tableRow({ name, colors, width, ...options }: ActorOptions & { name: string; colors: [string, string]; width: number }): Actor {
  const row = new Actor({ name: `row-${name}`, ...options });
  row.draw('rect', { x: 0, y: -48, width, height: 96, rx: 18, fill: '#f4f4f4' });
  row.draw('rect', { x: 26, y: -30, width: 30, height: 60, rx: 6, fill: colors[0] });
  row.draw('rect', { x: 56, y: -30, width: 30, height: 60, rx: 6, fill: colors[1] });
  const label = row.draw('text', { x: 116, y: 20, 'font-family': FONT, 'font-size': 58, fill: '#15192b' });
  label.textContent = name;
  return row;
}

/** Row centers on the big screen. */
export const TABLE_ROW_Y = [-180, -60, 60, 180];

/** Big screen with rank numbers 1–4; place `tableRow`s on it at `TABLE_ROW_Y[i]`. */
export function createTableScreen({ width, ...options }: ActorOptions & { width: number }): Actor {
  const screen = new Actor({ name: 'table', ...options });
  screen.draw('rect', { x: -width / 2, y: -250, width, height: 500, rx: 30, fill: '#15192b', stroke: '#edbb00', 'stroke-width': 6 });
  TABLE_ROW_Y.forEach((y, i) => {
    const rank = screen.draw('text', {
      x: -width / 2 + 60, y: y + 22, 'text-anchor': 'middle', 'font-family': FONT, 'font-size': 64, fill: i === 0 ? '#edbb00' : '#ffffff',
    });
    rank.textContent = String(i + 1);
  });
  return screen;
}
