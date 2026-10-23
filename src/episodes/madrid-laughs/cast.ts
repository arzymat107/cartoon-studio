/**
 * Cast, set and props for the "Same Night, Different Vibes" Short: Real Madrid beat Leipzig 4–1,
 * then watch PSG beat Barça 4–2. Caricatures recognizable by kit colors, numbers, hair and build –
 * no crests, logos or sponsors, generic voices. The Barça cast comes from the psg-barca episode.
 */
import { Footballer, Scoreboard, type FootballerOptions } from '@/components';
import { Actor, svg, uid, type ActorOptions } from '@/engine';
import { GROUND_Y } from '../football/stadium';

type CastOptions = Partial<Omit<FootballerOptions, 'kit'>>;
type PlayerOptions = CastOptions & { number?: number };

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';
export const MADRID_WHITE = '#f7f7f2';
export const MADRID_GOLD = '#c9a227';
export const MADRID_NAVY = '#1b2a59';
export const LEIPZIG_RED = '#dd0741';
/** Fan shirt colors at the Bernabéu. */
export const MADRID_FANS = [MADRID_WHITE, MADRID_WHITE, MADRID_GOLD, MADRID_NAVY, '#7b4fa0'];

/** TV score bug, Madrid at home. */
export function createMadridScoreboard(width: number): Scoreboard {
  return new Scoreboard({
    x: width / 2, y: 60,
    home: { name: 'Real', color: MADRID_WHITE, accent: MADRID_GOLD },
    away: { name: 'Leipzig', color: '#ffffff', accent: LEIPZIG_RED },
  });
}

// ── Real Madrid ───────────────────────────────────────────────────────

/** Madrid outfield player: all white with gold trim, navy number. */
export const createMadridPlayer = ({ number, ...options }: PlayerOptions = {}) =>
  new Footballer({
    name: 'Madrid', y: GROUND_Y, scale: 1.4, skin: '#e8b98f', hair: '#2b1d14',
    face: { width: 40, height: 48, jaw: 28, chin: 14, nose: 'straight' },
    kit: { shirt: MADRID_WHITE, trim: MADRID_GOLD, number, numberColor: MADRID_NAVY, shorts: MADRID_WHITE, socks: MADRID_WHITE },
    voice: { pitch: 0.95 },
    ...options,
  });

/** Mbappé: fast and powerful, very short black hair, big grin, number 10. */
export const createMbappe = (options: CastOptions = {}) =>
  createMadridPlayer({
    name: 'Mbappe', number: 10, scale: 1.5, headScale: 1.06, skin: '#7a4a30', hair: '#141010',
    face: {
      width: 41, height: 48, jaw: 29, chin: 14, eyeColor: '#2b1a10', browColor: '#141010', browWeight: 5,
      browTilt: 0, nose: 'broad', lips: '#6a3a2c', cheekbones: true,
    },
    voice: { pitch: 0.95 },
    ...options,
  });

/** Vinícius: slim winger and dancer, dark skin, black hair, number 7. */
export const createVinicius = (options: CastOptions = {}) =>
  createMadridPlayer({
    name: 'Vinicius', number: 7, scale: 1.38, headScale: 1.08, skin: '#5a3824', hair: '#0e0b09', hairStyle: 'quiff',
    face: {
      width: 38, height: 47, jaw: 25, chin: 13, eyeColor: '#1e130c', browColor: '#0e0b09', browWeight: 4.5,
      browTilt: 1, nose: 'broad', lips: '#4a2a20',
    },
    voice: { pitch: 1.15 },
    ...options,
  });

/** Bellingham: tall midfielder, short black hair, clean-shaven, number 5. */
export const createBellingham = (options: CastOptions = {}) =>
  createMadridPlayer({
    name: 'Bellingham', number: 5, scale: 1.52, skin: '#8a5a3c', hair: '#141010',
    face: {
      width: 40, height: 50, jaw: 29, chin: 15, eyeColor: '#2b1a10', browColor: '#141010', browWeight: 5.5,
      browTilt: -0.5, nose: 'straight', lips: '#6a3a2c',
    },
    voice: { pitch: 0.9 },
    ...options,
  });

/** Valverde: the engine, brown hair and a full beard, number 8. */
export const createValverde = (options: CastOptions = {}) =>
  createMadridPlayer({
    name: 'Valverde', number: 8, scale: 1.45, skin: '#e6b993', hair: '#3a2616', beard: '#3a2616',
    face: {
      width: 41, height: 49, jaw: 29, chin: 14, eyeColor: '#3b2414', browColor: '#3a2616', browWeight: 5.5,
      browTilt: -1, nose: 'straight', lips: '#b46a5c',
    },
    ...options,
  });

/** Arda Güler: young and small, big head, dark wavy hair, number 15. */
export const createGuler = (options: CastOptions = {}) =>
  createMadridPlayer({
    name: 'Guler', number: 15, scale: 1.24, headScale: 1.16, skin: '#efc39b', hair: '#2a1c12', hairStyle: 'quiff',
    face: {
      width: 39, height: 46, jaw: 25, chin: 12, eyeColor: '#3b2414', browColor: '#2a1c12', browWeight: 5,
      browTilt: 0.5, nose: 'small', lips: '#b46a5c',
    },
    voice: { pitch: 1.2 },
    ...options,
  });

/** Rüdiger: the giant centre-back, shaved head, black beard, number 22. */
export const createRudiger = (options: CastOptions = {}) =>
  createMadridPlayer({
    name: 'Rudiger', number: 22, scale: 1.66, skin: '#4e3020', hair: '#0e0b09', hairStyle: 'bald', beard: '#0e0b09',
    face: {
      width: 43, height: 50, jaw: 32, chin: 16, eyeColor: '#1e130c', browColor: '#0e0b09', browWeight: 6,
      browTilt: -1, nose: 'broad', lips: '#4a2a20',
    },
    voice: { pitch: 0.75 },
    ...options,
  });

/** Courtois: the tallest man in the building, keeper green, light-brown hair, stubble, number 1. */
export const createCourtois = (options: CastOptions = {}) =>
  new Footballer({
    name: 'Courtois', y: GROUND_Y, scale: 1.8, skin: '#f0c8a0', hair: '#6a4a2e',
    face: {
      width: 39, height: 53, jaw: 27, chin: 15, eyeColor: '#4a6a8a', browColor: '#5a3e26', browWeight: 4.5,
      browTilt: 0, nose: 'straight', lips: '#c07a6a', stubble: '#6a4a2e',
    },
    kit: { shirt: '#2a9d4b', number: 1, numberColor: '#ffffff', shorts: '#1b1b1b', socks: '#2a9d4b' },
    voice: { pitch: 0.85 },
    ...options,
  });

/** A generic Leipzig defender (no name, no number): red shirt, white shorts. */
export const createLeipzigDefender = (options: CastOptions = {}) =>
  new Footballer({
    name: 'Leipzig', y: GROUND_Y, scale: 1.45, skin: '#eac39c', hair: '#c9a46a',
    face: { width: 40, height: 49, jaw: 29, chin: 14, nose: 'straight', browColor: '#a08050' },
    kit: { shirt: LEIPZIG_RED, trim: '#ffffff', shorts: '#ffffff', socks: LEIPZIG_RED },
    voice: { pitch: 1 },
    ...options,
  });

// ── Sets ──────────────────────────────────────────────────────────────

/** Dressing room: tiled wall, a row of white lockers with gold numbers, wooden bench. */
export function createDressingRoom(width: number, height: number, { tint = '#e9e4d8', lockers = '#ffffff' } = {}): Actor {
  const room = new Actor({ name: 'dressingRoom' });
  room.draw('rect', { x: 0, y: 0, width, height, fill: tint });
  for (let y = 0; y < GROUND_Y - 40; y += 80) room.draw('line', { x1: 0, y1: y, x2: width, y2: y, stroke: 'rgba(0,0,0,0.05)', 'stroke-width': 3 });
  const top = 1060;
  const w = 150;
  for (let i = 0; i < 7; i++) {
    const x = 15 + i * (w + 3);
    room.draw('rect', { x, y: top, width: w, height: GROUND_Y - 40 - top, rx: 6, fill: lockers, stroke: '#cfc8b8', 'stroke-width': 3 });
    for (const vy of [top + 30, top + 48, top + 66]) {
      room.draw('rect', { x: x + 40, y: vy, width: w - 80, height: 7, rx: 3, fill: '#d6cfbf' });
    }
    room.draw('rect', { x: x + w - 26, y: top + 220, width: 8, height: 46, rx: 4, fill: MADRID_GOLD });
  }
  room.draw('rect', { x: 0, y: GROUND_Y - 40, width, height: height - GROUND_Y + 40, fill: '#9c8a73' });
  room.draw('rect', { x: 0, y: GROUND_Y - 40, width, height: 10, fill: '#7d6c57' });
  return room;
}

// ── Props ─────────────────────────────────────────────────────────────

/** Phone notification card: app icon, "FULL TIME" header and a score line. Starts hidden. */
export function createNotification({ score, ...options }: ActorOptions & { score: string }): Actor {
  const card = new Actor({ name: 'notification', scale: 0, opacity: 0, ...options });
  card.draw('rect', { x: -420, y: -110, width: 840, height: 220, rx: 44, fill: 'rgba(250,250,250,0.97)', stroke: '#15192b', 'stroke-width': 5 });
  card.draw('rect', { x: -384, y: -74, width: 110, height: 110, rx: 26, fill: '#2a9d4b' });
  const icon = card.draw('text', { x: -329, y: 10, 'text-anchor': 'middle', 'font-size': 64 });
  icon.textContent = '⚽';
  const header = card.draw('text', { x: -240, y: -36, 'font-family': 'system-ui, sans-serif', 'font-size': 34, 'font-weight': 700, fill: '#6b7280' });
  header.textContent = 'FULL TIME · now';
  const line = card.draw('text', { x: -240, y: 42, 'font-family': FONT, 'font-size': 70, fill: '#15192b' });
  line.textContent = score;
  return card;
}

/** Smartphone for a right hand, screen facing out. Origin = the hand end of a 64-long arm. */
export function phone(): Actor {
  const p = new Actor({ name: 'phone', y: 64 });
  p.draw('rect', { x: -18, y: -32, width: 36, height: 64, rx: 7, fill: '#15192b' });
  p.draw('rect', { x: -14, y: -26, width: 28, height: 52, rx: 4, fill: '#7fd3ff' });
  return p;
}

/** Hand-drawn cardboard sign for a right hand (rotate it against the arm to keep it upright). */
export function sign(text: string): Actor {
  const s = new Actor({ name: 'sign', y: 64 });
  s.draw('rect', { x: -5, y: -110, width: 10, height: 110, fill: '#8b5a2b' });
  s.draw('rect', { x: -170, y: -230, width: 340, height: 130, rx: 10, fill: '#f2e3c2', stroke: '#8b5a2b', 'stroke-width': 6 });
  text.split('\n').forEach((line, i) => {
    const label = s.draw('text', { x: 0, y: -178 + i * 52, 'text-anchor': 'middle', 'font-family': FONT, 'font-size': 44, fill: '#c8102e' });
    label.textContent = line;
  });
  return s;
}

/** Blue ice pack for the top of a head. */
export function icePack(options: ActorOptions = {}): Actor {
  const pack = new Actor({ name: 'icePack', rotation: -12, ...options });
  pack.draw('rect', { x: -34, y: -18, width: 68, height: 36, rx: 16, fill: '#5ab8f0', stroke: '#2b7cb8', 'stroke-width': 4 });
  pack.draw('rect', { x: -18, y: -10, width: 16, height: 8, rx: 4, fill: 'rgba(255,255,255,0.7)' });
  return pack;
}

/** Falling tear drop by an eye. Starts hidden. */
export function tear(options: ActorOptions = {}): Actor {
  const t = new Actor({ name: 'tear', opacity: 0, ...options });
  t.draw('path', { d: 'M 0 -10 Q 8 2 0 8 Q -8 2 0 -10 Z', fill: '#7fd3ff', stroke: '#2b7cb8', 'stroke-width': 1.5 });
  return t;
}

/** "HA HA" laugh lettering. Starts hidden. */
export function haha(options: ActorOptions & { color?: string; size?: number } = {}): Actor {
  const { color = '#ffd60a', size = 64, ...rest } = options;
  const h = new Actor({ name: 'haha', scale: 0, opacity: 0, ...rest });
  const label = h.draw('text', {
    'text-anchor': 'middle', 'font-family': FONT, 'font-size': size, fill: color,
    stroke: '#15192b', 'stroke-width': 6, 'paint-order': 'stroke',
  });
  label.textContent = 'HA HA!';
  return h;
}

/**
 * Video-call window on the dressing-room wall. `content` is a container in "full-size world"
 * coordinates (players at GROUND_Y), shrunk into the window. Origin = window top left.
 */
export class VideoCall extends Actor {
  static readonly WIDTH = 900;
  static readonly HEIGHT = 820;
  /** Container scale (1 = the window shows world x 90…990, y 820…1640). */
  static readonly ZOOM = 1;

  readonly content: Actor;
  /** Blue "sad" wash over the content. */
  readonly gloom: Actor;
  /** Big red "call ended" banner. Starts hidden. */
  readonly ended: Actor;

  constructor(options: ActorOptions = {}) {
    super({ name: 'VideoCall', ...options });
    const { WIDTH: w, HEIGHT: h, ZOOM: z } = VideoCall;
    this.draw('rect', { x: -18, y: -70, width: w + 36, height: h + 88, rx: 34, fill: '#15192b' });
    const title = this.draw('text', { x: 24, y: -24, 'font-family': FONT, 'font-size': 36, fill: '#ffffff' });
    title.textContent = '📹  VIDEO CALL · BARÇA';
    this.draw('circle', { cx: w - 24, cy: -36, r: 12, fill: '#d62828' });
    const clipId = uid('call');
    this.draw('clipPath', { id: clipId }).appendChild(svg('rect', { x: 0, y: 0, width: w, height: h, rx: 18 }));
    const lane = this.draw('g', { 'clip-path': `url(#${clipId})` });

    // Fit the world (centered on x = 540, floor at GROUND_Y) into the window.
    this.content = new Actor({ name: 'callContent', x: w / 2 - 540 * z, y: h - 40 - GROUND_Y * z, scale: z });
    this.gloom = new Actor({ name: 'gloom' });
    this.gloom.draw('rect', { x: 0, y: 0, width: w, height: h, fill: 'rgba(30,70,190,0.22)' });
    lane.append(this.content.el, this.gloom.el);

    this.ended = new Actor({ name: 'ended', x: w / 2, y: h / 2, scale: 0, opacity: 0 });
    this.ended.draw('rect', { x: -330, y: -70, width: 660, height: 140, rx: 70, fill: '#d62828' });
    const text = this.ended.draw('text', { x: 0, y: 24, 'text-anchor': 'middle', 'font-family': FONT, 'font-size': 66, fill: '#ffffff' });
    text.textContent = '📵 CALL ENDED';
    this.add(this.ended);
  }
}
