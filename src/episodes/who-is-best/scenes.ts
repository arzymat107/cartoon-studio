/**
 * "Who Is The Best?" – in the style of the football-cartoon Shorts where a big star chooses between
 * two tiny players and the loser goes poof. Each of our players judges the other two, and each
 * round goes wrong in his own way:
 *   Kane     – the trophy curse: whoever he picks is the one who vanishes.
 *   Yamal    – picks Kane, whose prize vanishes, while the wind takes Yamal's shorts.
 *   Mbappé   – the dictator doesn't choose: both go poof, and the winner is… him (1 vote).
 * No dialogue, like the originals: music, poofs and gibberish. Hard cuts between the rounds.
 *
 * Sounds: the recordings in SOUNDS when they exist in src/assets/sounds/, else synthesized ones.
 */
import { clip, figureActions as act, melody, popIn, sfx, sound, soundDuration } from '@/animations';
import { synth } from '@/audio';
import { KaneFigure, MbappeFigure, Trophy, YamalFigure, type PortraitFigure } from '@/components';
import { gsap } from 'gsap';
import { Actor, Scene, svg, type SceneClass, type Timeline } from '@/engine';
import { createParodyNotice } from '../football/overlay';
import { groove, laughTrack, rimshot } from '../madrid-laughs/sound';
import {
  blowWind, CANDIDATE_SCALE, CANDIDATE_X, CANDIDATE_Y, createPalace, createTrophyRoom, createWindyPitch, Dust, JUDGE, poof,
} from './set';

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const BPM = 132;
/** Rounds end on a beat so the groove runs on across the cuts. */
const BEAT = 60 / BPM;

/** Recordings this Short uses (src/assets/sounds/<name>.mp3 etc.); each has a synthesized stand-in. */
const SOUNDS = {
  /** Bouncy comedy loop under the whole Short; it runs on across the cuts. */
  music: 'music/comedy-loop',
  poof: 'sfx/poof',
  pop: 'sfx/pop',
  whoosh: 'sfx/whoosh',
  think: 'sfx/think',
  fail: 'sfx/sad-trombone',
  win: 'sfx/fanfare',
  wind: 'sfx/wind',
  rimshot: 'sfx/rimshot',
} as const;

/** Where each round starts in the music, so the loop continues across the cuts. */
const roundLengths: number[] = [];

/** The music under one round: the recorded loop picked up where the last round left it, or the groove. */
function music(index: number, duration: number): Timeline {
  const file = soundDuration(SOUNDS.music);
  if (!file) return groove(duration, { bpm: BPM, volume: 0.06 });
  const offset = roundLengths.slice(0, index).reduce((a, b) => a + b, 0) % file;
  return gsap.timeline().add(clip(SOUNDS.music, { volume: 0.6, offset, loop: true, duration }), 0);
}

/** Big caption with a dark outline, centered on its origin. */
function caption(text: string, { y = 170, size = 92, color = '#ffffff', scale = 1 } = {}): Actor {
  const label = new Actor({ name: 'caption', x: 540, y, scale });
  const lines = text.split('\n');
  const t = label.draw('text', {
    'text-anchor': 'middle', 'font-family': FONT, 'font-size': size, fill: color,
    stroke: '#14101f', 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round',
  });
  lines.forEach((line, i) => {
    const span = t.appendChild(svg('tspan', { x: 0, y: (i - (lines.length - 1) / 2) * size * 1.05 + size * 0.35 }));
    span.textContent = line;
  });
  return label;
}

/** The small players' stance: hands on hips, chin up, smug – straight away, no tween. */
function standSmug(m: PortraitFigure): void {
  const pose = { leftArm: 38, leftForearm: -95, rightArm: -38, rightForearm: 95, leftLeg: 7, rightLeg: -7, rightShin: 0, chest: -4 };
  for (const [part, rotation] of Object.entries(pose)) m[part as keyof typeof pose].rotation = rotation;
  m.setExpression('smug');
}

interface Round {
  judge: PortraitFigure;
  /** The two small players, screen left and right. */
  left: PortraitFigure;
  right: PortraitFigure;
  dust: [Dust, Dust];
  question: Actor;
}

interface RoundSpec {
  title: string;
  question: string;
  judge: (options: { x: number; y: number; scale: number }) => PortraitFigure;
  left: (options: { x: number; y: number; scale: number }) => PortraitFigure;
  right: (options: { x: number; y: number; scale: number }) => PortraitFigure;
  /** The backdrop, behind everyone (it may put props in the overlay). */
  backdrop: (scene: Scene) => Actor;
  /**
   * The round's acting. May return when to cut (`end`, default: when everything has played) and
   * when the music stops (`music`, default: at the cut).
   */
  act: (r: Round, tl: Timeline, scene: Scene) => { end?: number; music?: number } | void;
}

function round(index: number, spec: RoundSpec): SceneClass {
  return class extends Scene {
    readonly title = spec.title;
    private r!: Round;

    build(): void {
      const { width, height } = this.stage;
      const judge = spec.judge({ ...JUDGE });
      const left = spec.left({ x: CANDIDATE_X[0], y: CANDIDATE_Y, scale: CANDIDATE_SCALE });
      const right = spec.right({ x: CANDIDATE_X[1], y: CANDIDATE_Y, scale: CANDIDATE_SCALE });
      right.scaleX = -CANDIDATE_SCALE;
      standSmug(left);
      standSmug(right);
      const dust: [Dust, Dust] = [new Dust(110), new Dust(110)];
      const question = caption(spec.question);
      this.add(spec.backdrop(this), judge, left, right, ...dust);
      this.overlay.add(question, createParodyNotice(width, height));
      this.r = { judge, left, right, dust, question };
    }

    animate(tl: Timeline): void {
      const { judge, left, right, question } = this.r;
      tl.from(question, { scale: 0.6, opacity: 0, duration: 0.25, ease: 'back.out(2.5)' }, 0)
        .add(sound(SOUNDS.pop, () => sfx(synth.pop)), 0);
      const { end, music: musicStop } = spec.act(this.r, tl, this) ?? {};
      // Cut on a beat, a moment after the last thing happens (a sound may ring on over the cut).
      const length = Math.ceil((end ?? tl.duration() + 0.15) / BEAT) * BEAT;
      roundLengths[index] = length;
      this.cut = length;
      tl.set({}, {}, length)
        .add(music(index, musicStop ?? length), 0);
      for (const m of [judge, left, right]) tl.add(act.blinkRandomly(m, length), 0);
    }
  };
}

/** "Hmm…" – two low notes while a judge thinks. */
const hmm = () => sound(SOUNDS.think, () => melody('E4:2 C4:3', { bpm: 300, wave: 'sine', volume: 0.08 }));
/** "Wah-wah" – it went wrong. */
const fail = (notes: string) => sound(SOUNDS.fail, () => melody(notes, { bpm: 330, wave: 'triangle', volume: 0.07 }), { volume: 0.7 });
/** Ta-da! */
const win = () => sound(SOUNDS.win, () => melody('C5 E5 G5 C6:3', { bpm: 420, wave: 'square', volume: 0.07 }));

// ── 1. Kane: whoever he picks, vanishes ────────────────────────────────

const KaneRound = round(0, {
  title: 'Kane chooses',
  question: 'MBAPPÉ OR YAMAL?',
  judge: (o) => new KaneFigure(o),
  left: (o) => new MbappeFigure(o),
  right: (o) => new YamalFigure(o),
  backdrop: (scene) => createTrophyRoom(scene.stage.width, scene.stage.height),
  act: ({ judge: kane, left: mbappe, right: yamal, dust }, tl) => {
    tl.add(act.think(kane, { hold: 1.1 }), 0.15)
      .add(hmm(), 0.4)
      .add(act.flutter(yamal, 1.6, { amount: 5, period: 0.45 }), 0.2)
      // Kane points at Mbappé, beaming: "Him!"
      .add(act.face(kane, -1), 1.6)
      .add(act.point(kane, { arm: 'right', hold: 0.5 }), 1.6)
      .add(act.emote(kane, 'happy'), 1.65)
      // …and the curse takes the one he picked.
      .add(poof(mbappe, dust[0]), 1.9)
      .add(act.handsOnHead(kane, { hold: 1.2 }), 2.35)
      .add(fail('G4 F#4 F4 E4:3'), 2.4)
      // Yamal realises he's next – and runs.
      .add(act.surprised(yamal, { duration: 0.5 }), 2.4)
      .add(act.run(yamal, { to: 1320, duration: 0.7 }), 3.0)
      .add(sound(SOUNDS.whoosh, () => sfx(synth.whoosh)), 3.05);
    return { end: 3.9 };
  },
});

// ── 2. Yamal: picks Kane – the prize doesn't last ──────────────────────

function yamalRound(): SceneClass {
  let wind: Actor[] = [];
  let trophy!: Trophy;
  return round(1, {
    title: 'Yamal chooses',
    question: 'KANE OR MBAPPÉ?',
    judge: (o) => new YamalFigure(o),
    left: (o) => new KaneFigure(o),
    right: (o) => new MbappeFigure(o),
    backdrop: (scene) => {
      const { set, wind: streaks } = createWindyPitch(scene.stage.width, scene.stage.height);
      wind = streaks;
      trophy = new Trophy({ size: 120, stand: 0, opacity: 0 });
      scene.overlay.add(trophy);
      return set;
    },
    act: ({ judge: yamal, left: kane, right: mbappe, dust }, tl, scene) => {
      tl.add(blowWind(wind, scene.stage.width, 5.5), 0)
        .add(sound(SOUNDS.wind, undefined, { volume: 0.4, duration: 5 }), 0)
        .add(act.think(yamal, { hold: 1.1 }), 0.15)
        .add(act.flutter(yamal, 1.5, { amount: 10, period: 0.3 }), 0.15)
        .add(hmm(), 0.4)
        // Points at Kane: Mbappé is out.
        .add(act.face(yamal, -1), 1.6)
        .add(act.point(yamal, { arm: 'right', hold: 0.4 }), 1.6)
        .add(poof(mbappe, dust[1]), 1.85)
        // Kane finally wins something… for a second.
        .add(act.trophyVanishes(kane, trophy, { hold: 0.8 }), 2.2)
        .add(sound(SOUNDS.pop, () => melody('C5 E5 G5', { bpm: 600, wave: 'square', volume: 0.05 })), 2.2)
        // Meanwhile the wind gets into Yamal's shorts.
        .add(act.flapShorts(yamal, { duration: 1.4 }), 2.6)
        .add(fail('E4 Eb4 D4 Db4:3'), 3.55)
        // …and laughs at Kane anyway.
        .add(act.face(yamal, -1), 4.0)
        .add(act.laugh(yamal, { duration: 1.1 }), 4.0);
      return { end: 5.1 };
    },
  });
}

// ── 3. Mbappé: the dictator decides ────────────────────────────────────

function mbappeRound(): SceneClass {
  let winner!: Actor;
  let votes!: Actor;
  return round(2, {
    title: 'Mbappé chooses',
    question: 'KANE OR YAMAL?',
    judge: (o) => new MbappeFigure(o),
    left: (o) => new KaneFigure(o),
    right: (o) => new YamalFigure(o),
    backdrop: (scene) => {
      winner = caption('THE BEST:\nMBAPPÉ', { y: 190, size: 120, color: '#ffd23f', scale: 0 });
      votes = caption('(1 VOTE)', { y: 375, size: 64, color: '#ffffff', scale: 0 });
      votes.rotation = -8;
      scene.overlay.add(winner, votes);
      return createPalace(scene.stage.width, scene.stage.height);
    },
    act: ({ judge: mbappe, left: kane, right: yamal, dust, question }, tl) => {
      tl.add(act.handInCoat(mbappe, { hold: 0.7 }), 0.15)
        // No thinking. Kane: out.
        .add(act.face(mbappe, -1), 1.2)
        .add(act.command(mbappe, { duration: 0.9 }), 1.2)
        .add(poof(kane, dust[0]), 1.7)
        .add(act.emote(yamal, 'shocked'), 1.85)
        .add(act.hitchShorts(yamal, { hold: 0.2 }), 2.0)
        // Yamal: out too.
        .add(act.face(mbappe, 1), 2.35)
        .add(act.point(mbappe, { arm: 'right', hold: 0.35 }), 2.35)
        .add(poof(yamal, dust[1]), 2.55)
        // The music stops. Silence. And the winner is…
        .to(question, { opacity: 0, duration: 0.2 }, 2.7)
        .add(act.salute(mbappe, { hold: 2.2 }), 3.3)
        .add(popIn(winner), 3.3)
        .add(sfx(synth.clang), 3.3)
        .add(win(), 3.3)
        .add(popIn(votes), 4.1)
        .add(sound(SOUNDS.rimshot, rimshot), 4.1)
        .add(laughTrack(1.6), 4.4)
        .set({}, {}, 5.8);
      return { music: 2.6, end: 6.2 };
    },
  });
}

export const WHO_IS_BEST_SCENES: SceneClass[] = [KaneRound, yamalRound(), mbappeRound()];
