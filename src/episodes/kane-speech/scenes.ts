/**
 * "The Longest Speech": Harry Kane finally wins something – the Ballon d'Or – and starts thanking
 * everyone. Three hours later… two days later… And when he finally thanks the trophy itself, the
 * curse strikes: poof.
 */
import { gsap } from 'gsap';
import { clip, figureActions as act, melody, popIn, sfx, soundDuration } from '@/animations';
import { synth } from '@/audio';
import { FIGURE_REST, KaneFigure, SpeechBubble, type FigureExpression, type Trophy } from '@/components';
import { Actor, Scene, seededRandom, svg, type SceneClass, type Timeline } from '@/engine';
import { createParodyNotice } from '../football/overlay';
import { laughTrack, rimshot } from '../madrid-laughs/sound';
import {
  applause, cobweb, createAudience, createAward, createBackdrop, createList, createSpotlight, createTumbleweed, crickets,
  FIGURE_SCALE, Lectern, LECTERN_X, snoreZ, Spectator, STAGE_Y, tumble,
} from './set';

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';

/** Everything on the award-night stage. */
interface Gala {
  kane: KaneFigure;
  lectern: Lectern;
  award: Trophy;
  spotlight: Actor;
  spectators: Spectator[];
  /** Darkens the hall late at night. */
  night: Actor;
}

function buildGala(scene: Scene, add: (...actors: Actor[]) => void, { kaneX = LECTERN_X, list = 0 } = {}): Gala {
  const { width, height } = scene.stage;
  const kane = new KaneFigure({ x: kaneX, y: STAGE_Y, scale: FIGURE_SCALE, costume: 'tuxedo' });
  const lectern = new Lectern();
  const award = createAward();
  const spotlight = createSpotlight(kaneX);
  const { row, spectators } = createAudience(width);
  const night = new Actor({ name: 'night', opacity: 0 });
  night.draw('rect', { width, height, fill: '#05030c' });
  add(createBackdrop(width, height), award, spotlight, kane, lectern, createList(list), night, row);
  scene.overlay.add(createParodyNotice(width, height));
  return { kane, lectern, award, spotlight, spectators, night };
}

/** Big gold caption with a dark outline, centered on its origin. */
function caption(text: string, { y = 560, size = 96, color = '#ffd23f' } = {}): Actor {
  const label = new Actor({ name: 'caption', x: 540, y, scale: 0, opacity: 0 });
  const lines = text.split('\n');
  const t = label.draw('text', {
    'text-anchor': 'middle', 'font-family': FONT, 'font-size': size, fill: color,
    stroke: '#150b26', 'stroke-width': size * 0.14, 'paint-order': 'stroke', 'stroke-linejoin': 'round',
  });
  lines.forEach((line, i) => {
    const span = t.appendChild(svg('tspan', { x: 0, y: (i - (lines.length - 1) / 2) * size * 1.05 + size * 0.35 }));
    span.textContent = line;
  });
  return label;
}

/** Confetti falling from the top for `duration` seconds. */
function confetti(scene: Scene, add: (...actors: Actor[]) => void, count = 70): Timeline {
  const rnd = seededRandom(31);
  const tl = gsap.timeline();
  for (let i = 0; i < count; i++) {
    const piece = new Actor({ name: 'confetti', x: rnd.range(0, scene.stage.width), y: -40, rotation: rnd.range(0, 360) });
    piece.draw('rect', { x: -8, y: -4, width: 16, height: 8, fill: rnd.pick(['#ffd23f', '#ffffff', '#e8b923', '#c8102e', '#7fd1ff']) });
    add(piece);
    const start = rnd.range(0, 1.2);
    tl.to(piece, { y: rnd.range(1300, 1700), rotation: `+=${rnd.range(360, 900)}`, x: `+=${rnd.range(-120, 120)}`, duration: rnd.range(2.2, 3.4), ease: 'none' }, start);
  }
  return tl;
}

/** Drumroll that speeds up, for `duration` seconds. */
function drumroll(duration: number): Timeline {
  const tl = gsap.timeline();
  for (let t = 0, gap = 0.11; t < duration; t += gap, gap = Math.max(0.045, gap * 0.96)) {
    tl.add(sfx(() => synth.kick(0.12 + (t / duration) * 0.2)), t);
  }
  return tl;
}

// ── 1. And the winner is… ──────────────────────────────────────────────

class AwardScene extends Scene {
  readonly title = 'And the winner is…';
  private gala!: Gala;
  private name!: Actor;
  private confettiTl!: Timeline;

  build(): void {
    this.gala = buildGala(this, (...a) => this.add(...a), { kaneX: 280 });
    this.name = caption('HARRY KANE!', { y: 600, size: 130 });
    this.confettiTl = confetti(this, (...a) => this.add(...a));
    this.overlay.add(this.name);
  }

  animate(tl: Timeline): void {
    const { kane, spotlight, award } = this.gala;
    tl.add(act.emote(kane, 'determined'), 0)
      .set(spotlight, { opacity: 0.6 }, 0)
      // The spotlight searches the stage during the drumroll.
      .to(spotlight, { x: 880, duration: 0.7, ease: 'sine.inOut', yoyo: true, repeat: 2 }, 0)
      .add(drumroll(2.5), 0)
      .add(clip('voices/host-winner'), 0.2)

      // HARRY KANE! – the host says it after a dramatic pause.
      .addLabel('reveal', 2.5)
      .to(spotlight, { x: 280, opacity: 1, duration: 0.15 }, 'reveal')
      .add(sfx(synth.clang), 'reveal')
      .add(popIn(this.name, { scale: 1 }), 'reveal')
      .add(melody('C5 E5 G5 C6:3', { bpm: 420, wave: 'square', volume: 0.07 }), 'reveal')
      .add(act.surprised(kane, { duration: 0.7 }), 'reveal')
      .add(act.celebrate(kane, { jumps: 2, height: 90 }), 'reveal+=0.8')
      .add(this.confettiTl, 'reveal+=0.2')
      .add(applause(3), 'reveal+=0.2')
      .add(sfx(() => synth.cheer(3)), 'reveal+=0.2')
      .to(this.name, { opacity: 0, scale: 0, duration: 0.25 }, 'reveal+=1.8')

      // The trophy curse… will it vanish? It wobbles – and stays! Phew.
      .addLabel('wobble', 'reveal+=2')
      .add(act.emote(kane, 'shocked'), 'wobble')
      .to(award.cup, { rotation: 5, duration: 0.1, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 'wobble+=0.1')
      .add(melody('E4 D#4 E4', { bpm: 360, wave: 'triangle', volume: 0.06 }), 'wobble+=0.1')
      .add(act.emote(kane, 'happy'), 'wobble+=0.8')
      .add(act.walk(kane, { to: LECTERN_X, duration: 0.8 }), 'wobble+=0.9')
      .set({}, {}, '+=0.1');

    const length = tl.duration();
    tl.add(act.blinkRandomly(kane, length), 0);
  }
}

// ── The speech, getting longer ─────────────────────────────────────────

interface Line {
  voice: string;
  text: string;
}

interface SpeechPart {
  title: string;
  /** What he says; in the finale the last line is "And finally… this beautiful trophy!". */
  lines: Line[];
  mood: FigureExpression;
  /** How far the list runs along the floor. */
  list: number;
  audience: 'clap' | 'asleep' | 'empty';
  night?: number;
  /** Cobwebs and a tumbleweed: days have passed. */
  webs?: boolean;
  finale?: boolean;
}

function speechScene(part: SpeechPart): SceneClass {
  return class extends Scene {
    readonly title = part.title;
    private gala!: Gala;
    private bubbles!: SpeechBubble[];
    private notAgain!: SpeechBubble;
    private zs: Actor[] = [];
    private weed?: Actor;
    private puff?: Actor;
    private ending?: Actor;

    build(): void {
      const add = (...a: Actor[]) => this.add(...a);
      this.gala = buildGala(this, add, { list: part.list });
      const { kane, award, spectators, lectern, night } = this.gala;
      night.opacity = part.night ?? 0;
      if (part.audience === 'empty') for (const s of spectators) s.opacity = 0;
      if (part.audience === 'asleep') {
        spectators.forEach((s, i) => { s.head.rotation = i % 2 ? 18 : -14; });
        this.zs = spectators.filter((_, i) => i % 2 === 0).map((s) => snoreZ(s.x + 30, 1660));
        add(...this.zs);
      }
      if (part.webs) {
        lectern.webs.opacity = 1;
        kane.head.add(cobweb({ x: 30, y: -150, size: 46 }));
        award.add(cobweb({ x: 0, y: -330, size: 60, flip: true }));
        this.weed = createTumbleweed();
        this.weed.y = STAGE_Y + 40;
        this.weed.x = -200;
        add(this.weed);
      }
      this.bubbles = part.lines.map(({ text }) => new SpeechBubble({ text, fontSize: 56 }));
      this.notAgain = new SpeechBubble({ text: 'NOOOO!\nNOT AGAIN!', fontSize: 64 });
      add(...this.bubbles, this.notAgain);
      if (part.finale) {
        this.puff = new Actor({ name: 'puff', x: award.x, y: STAGE_Y - 420, scale: 0, opacity: 0 });
        for (const [x, y, r] of [[0, 0, 70], [-60, 20, 50], [60, 16, 54], [-30, -50, 46], [36, -46, 50], [0, 50, 44]]) {
          this.puff.draw('circle', { cx: x, cy: y, r, fill: '#e9e4f2', stroke: '#9d94b3', 'stroke-width': 3 });
        }
        add(this.puff);
        this.ending = caption('THE CURSE\nCONTINUES…', { y: 1500, size: 110 });
        this.overlay.add(this.ending);
      }
    }

    animate(tl: Timeline): void {
      const { kane, spectators, award } = this.gala;
      const heads = spectators.map((s) => s.head);
      tl.add(act.emote(kane, part.mood), 0)
        // A hand gesture while he talks.
        .add(act.pose(kane, { rightArm: -40, rightForearm: -70, chest: -3 }, { duration: 0.3 }), 0.2)
        .to(kane.rightForearm, { rotation: -50, duration: 0.25, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0.5)
        .add(act.pose(kane, { rightArm: FIGURE_REST.rightArm, rightForearm: FIGURE_REST.rightForearm, chest: FIGURE_REST.chest }, { duration: 0.3 }), 1.5);
      // Lines one after another; `after` = when the first one has been said.
      let at = 0.2;
      this.bubbles.forEach((bubble, i) => {
        const line = act.say(kane, bubble, { voice: part.lines[i].voice, hold: 0.35 });
        tl.add(line, at);
        at += line.duration();
      });
      const after = 0.2 + (soundDuration(part.lines[0].voice) ?? 1.2);

      switch (part.audience) {
        case 'clap':
          tl.add(applause(1.2), after).to(heads, { y: '-=8', duration: 0.12, yoyo: true, repeat: 5 }, after);
          // …and he keeps going: the clapping dies down into yawns.
          if (part.lines.length > 1) {
            tl.to(heads[3], { scaleY: 1.12, rotation: -10, duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut' }, after + 1.2)
              .to(heads[1], { rotation: 16, duration: 1, ease: 'sine.inOut' }, after + 1.6);
          }
          break;
        case 'asleep':
          this.zs.forEach((z, i) => {
            const t = 0.1 + i * 0.25;
            tl.fromTo(z, { y: 1660, opacity: 0, scale: 0.6 }, { y: 1480, opacity: 1, scale: 1.1, duration: 1.2, ease: 'sine.out', immediateRender: false }, t)
              .to(z, { opacity: 0, duration: 0.3 }, t + 1.1);
          });
          for (const t of [0.2, 1.4]) tl.add(sfx(() => synth.note(70, 0.7, 'sawtooth', 0.04)), t);
          break;
        case 'empty':
          tl.add(crickets(at), 0);
          break;
      }
      if (this.weed) tl.add(tumble(this.weed, { duration: 2.4 }), 0.2);

      if (part.finale && this.puff && this.ending) {
        // "And finally… this beautiful trophy!" – he points at it, and the curse strikes.
        const finally_ = at - (soundDuration(part.lines[part.lines.length - 1].voice) ?? 1.5) - 0.35;
        tl.add(act.point(kane, { arm: 'right', hold: 0.6 }), finally_ + 1.3)
          .addLabel('poof', at - 0.1)
          .add(sfx(synth.pop), 'poof')
          .to(award, { opacity: 0, duration: 0.05 }, 'poof+=0.1')
          .to(this.puff, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2)' }, 'poof')
          .to(this.puff, { scale: 1.4, opacity: 0, duration: 0.6, ease: 'power1.in' }, 'poof+=0.5')
          .add(act.emote(kane, 'shocked'), 'poof+=0.1')
          .add(act.surprised(kane, { duration: 0.6 }), 'poof+=0.1')
          .add(act.say(kane, this.notAgain, { voice: 'voices/kane-not-again', hold: 0.6 }), 'poof+=0.9')
          .add(act.handsOnHead(kane, { hold: 1.6 }), 'poof+=0.9')
          .to(this.camera, { ...this.camera.focus(LECTERN_X, 900, 1.6), duration: 0.4, ease: 'power2.out' }, 'poof+=0.9')
          .add(popIn(this.ending), 'poof+=2.2')
          .add(rimshot(), 'poof+=2.2')
          .add(laughTrack(1.6), 'poof+=2.5')
          .set({}, {}, 'poof+=3.8');
      } else {
        tl.set({}, {}, '+=0.2');
      }
      const length = tl.duration();
      tl.add(act.blinkRandomly(kane, length), 0);
    }
  };
}

// ── "3 hours later…" ───────────────────────────────────────────────────

function laterCard(title: string, text: string, voice: string): SceneClass {
  return class extends Scene {
    readonly title = title;
    private rays!: Actor;
    private text!: Actor;

    build(): void {
      const { width, height } = this.stage;
      const bg = new Actor({ name: 'card' });
      bg.draw('rect', { width, height, fill: '#24124a' });
      this.rays = new Actor({ name: 'rays', x: width / 2, y: height / 2 });
      for (let i = 0; i < 24; i += 2) {
        const a1 = (i * Math.PI) / 12;
        const a2 = ((i + 1) * Math.PI) / 12;
        const r = 2200;
        this.rays.draw('path', { d: `M 0 0 L ${Math.cos(a1) * r} ${Math.sin(a1) * r} L ${Math.cos(a2) * r} ${Math.sin(a2) * r} Z`, fill: '#3a1f72' });
      }
      // As big as fits: an Impact capital with its outline is about 0.62 em wide.
      const longest = Math.max(...text.split('\n').map((l) => l.length));
      this.text = caption(text, { y: height / 2, size: Math.min(150, (width - 160) / (longest * 0.62)) });
      this.text.rotation = -5;
      this.add(bg, this.rays);
      this.overlay.add(this.text);
    }

    animate(tl: Timeline): void {
      tl.add(sfx(synth.whoosh), 0)
        .to(this.rays, { rotation: 30, duration: 2.6, ease: 'none' }, 0)
        .to(this.text, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)' }, 0.1)
        .add(melody('G5 C6 E6 G6', { bpm: 900, wave: 'sine', volume: 0.08 }), 0.1)
        .add(clip(voice), 0.25)
        .to(this.text, { rotation: -2, duration: 1.6, ease: 'sine.inOut' }, 0.5)
        .set({}, {}, 0.25 + (soundDuration(voice) ?? 1.8) + 0.15);
    }
  };
}

export const SPEECH_SCENES: SceneClass[] = [
  AwardScene,
  speechScene({
    title: 'The speech',
    lines: [
      { voice: 'voices/kane-thanks-mum', text: 'Wow! First, thanks\nto my mum and dad!' },
      { voice: 'voices/kane-thanks-vet', text: 'And my dog!\nAnd my dog’s vet!' },
    ],
    mood: 'happy', list: 0, audience: 'clap',
  }),
  laterCard('Three hours later', '3 HOURS\nLATER…', 'voices/narrator-hours-later'),
  speechScene({
    title: 'The kit man’s nan', lines: [{ voice: 'voices/kane-thanks-kit-man', text: '…the kit man… and, erm…\nthe kit man’s nan…' }],
    mood: 'determined', list: 480, audience: 'asleep', night: 0.35,
  }),
  laterCard('Two days later', '2 DAYS\nLATER…', 'voices/narrator-days-later'),
  speechScene({
    title: 'And finally…',
    lines: [
      { voice: 'voices/kane-thanks-goldfish', text: '…my cousin’s goldfish…\nGary.' },
      { voice: 'voices/kane-thanks-trophy', text: 'And finally…\nthis beautiful trophy!' },
    ],
    mood: 'happy', list: 900, audience: 'empty', night: 0.45, webs: true, finale: true,
  }),
];
