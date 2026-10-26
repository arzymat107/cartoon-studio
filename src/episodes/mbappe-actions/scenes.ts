/**
 * Showcase of every MbappeFigure action, one chapter each, so they can be picked from the player.
 * Not a Short – a reference sheet for building episodes.
 */
import { gsap } from 'gsap';
import { mbappeActions as act } from '@/animations';
import { Ball, MBAPPE_EXPRESSIONS, MbappeFigure, SpeechBubble, TextLabel, type MBAPPE_BUILDS } from '@/components';
import { Scene, type SceneClass, type Timeline } from '@/engine';
import { animateStadium, createStadium, GROUND_Y, type Stadium } from '../football/stadium';

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const SCALE = 1.6;
const CENTER = 540;

interface Props {
  m: MbappeFigure;
  /** Every figure in the chapter (more than one for the build comparison). */
  all: MbappeFigure[];
  ball: Ball;
  bubble: SpeechBubble;
}

interface Action {
  title: string;
  /** The call to copy into a scene. */
  code: string;
  play: (props: Props) => Timeline;
  /** Ball start, relative to Mbappé (omit to hide the ball). */
  ball?: number;
  /** Mbappé's start x. */
  x?: number;
  bubble?: string;
  /** Show these builds side by side instead of one athletic figure. */
  builds?: (keyof typeof MBAPPE_BUILDS)[];
}

const ACTIONS: Action[] = [
  {
    title: 'Expressions', code: "emote(m, 'happy')",
    play: ({ m }) => act.expressions(m, [...MBAPPE_EXPRESSIONS.filter((e) => e !== 'neutral'), 'neutral'], { each: 1.1 }),
  },
  {
    title: 'Body builds', code: "new MbappeFigure({ build: 'lanky' })", builds: ['athletic', 'lanky', 'stocky'],
    play: ({ all }) => {
      const tl = gsap.timeline();
      all.forEach((f) => tl.add(act.idle(f, 1.6), 0).add(act.dance(f, { beats: 6 }), 1.6).add(act.crossArms(f, { hold: 1 }), 3.4));
      return tl;
    },
  },
  { title: 'Idle', code: 'idle(m, 3)', play: ({ m }) => act.idle(m, 3) },
  { title: 'Blink', code: 'blink(m, { times: 2 })', play: ({ m }) => gsap.timeline().add(act.blink(m)).add(act.blink(m, { times: 2 }), 1).set({}, {}, 2) },
  { title: 'Talk', code: 'talk(m, { duration: 1.5 })', play: ({ m }) => act.talk(m, { duration: 1.5 }) },
  { title: 'Say', code: 'say(m, bubble)', bubble: 'Bonjour\nMadrid!', play: ({ m, bubble }) => act.say(m, bubble, { duration: 1.4 }) },
  { title: 'Walk', code: 'walk(m, { to: 820 })', x: 220, play: ({ m }) => gsap.timeline().add(act.walk(m, { to: 820, duration: 2 })).add(act.walk(m, { to: 540, duration: 1.2 })) },
  { title: 'Run', code: 'run(m, { to: 900 })', x: 150, play: ({ m }) => gsap.timeline().add(act.run(m, { to: 900, duration: 1.2 })).add(act.run(m, { to: 540, duration: 0.8 })) },
  { title: 'Hop', code: 'hop(m, { times: 2 })', play: ({ m }) => act.hop(m, { times: 2 }) },
  { title: 'Wave', code: 'wave(m)', play: ({ m }) => act.wave(m) },
  { title: 'Cheer', code: 'cheer(m, { duration: 1.2 })', play: ({ m }) => act.cheer(m, { duration: 1.2 }) },
  { title: 'Celebrate', code: 'celebrate(m)', play: ({ m }) => act.celebrate(m) },
  { title: 'Crossed arms', code: 'crossArms(m)', play: ({ m }) => act.crossArms(m) },
  { title: 'Hands on hips', code: 'handsOnHips(m)', play: ({ m }) => act.handsOnHips(m) },
  { title: 'Hands on head', code: 'handsOnHead(m)', play: ({ m }) => act.handsOnHead(m) },
  { title: 'Shrug', code: 'shrug(m)', play: ({ m }) => act.shrug(m) },
  { title: 'Point', code: 'point(m)', play: ({ m }) => gsap.timeline().add(act.point(m, { hold: 0.8 })).add(act.point(m, { arm: 'left', up: true, hold: 0.8 })) },
  { title: 'Think', code: 'think(m)', play: ({ m }) => act.think(m) },
  { title: 'Clap', code: 'clap(m)', play: ({ m }) => act.clap(m) },
  { title: 'Dance', code: 'dance(m)', play: ({ m }) => act.dance(m) },
  { title: 'Laugh', code: 'laugh(m)', play: ({ m }) => act.laugh(m) },
  { title: 'Surprised', code: 'surprised(m)', play: ({ m }) => act.surprised(m) },
  { title: 'Sulk', code: 'sulk(m)', play: ({ m }) => act.sulk(m) },
  { title: 'Rage', code: 'rage(m)', play: ({ m }) => act.rage(m) },
  { title: 'Nod & shake head', code: 'nod(m) · shakeHead(m)', play: ({ m }) => gsap.timeline().add(act.nod(m)).add(act.shakeHead(m), '+=0.4') },
  {
    title: 'Kick', code: 'kick(m, ball, { toX: 1200, peak: 300 })', ball: 70, x: 400,
    play: ({ m, ball }) => act.kick(m, ball, { toX: 1250, peak: 320, duration: 0.8, power: 1.2 }),
  },
  { title: 'Juggle', code: 'juggle(m, ball)', ball: 110 * SCALE, x: 440, play: ({ m, ball }) => act.juggle(m, ball) },
  { title: 'Flop & get up', code: 'flop(m) · getUp(m)', play: ({ m }) => gsap.timeline().add(act.flop(m)).add(act.getUp(m), '+=0.6') },
];

function actionScene(action: Action, index: number): SceneClass {
  return class extends Scene {
    readonly title = `${index + 1}. ${action.title}`;
    private stadium!: Stadium;
    private props!: Props;

    build(): void {
      const { width, height } = this.stage;
      this.stadium = createStadium(width, height, { shirts: ['#f7f7f2', '#f7f7f2', '#c9a227', '#1b2a59'] });
      const x = action.x ?? CENTER;
      const all = action.builds
        ? action.builds.map((build, i) => new MbappeFigure({ build, x: 190 + i * 350, y: GROUND_Y, scale: 1.15 }))
        : [new MbappeFigure({ x, y: GROUND_Y, scale: SCALE })];
      const m = all[0];
      const ball = new Ball({ x: x + (action.ball ?? 0), y: GROUND_Y, radius: 24, opacity: action.ball === undefined ? 0 : 1 });
      const bubble = new SpeechBubble({ text: action.bubble ?? '', fontSize: 46 });
      this.props = { m, all, ball, bubble };

      const label = new TextLabel({
        text: `${index + 1}/${ACTIONS.length} · ${action.title.toUpperCase()}`, x: width / 2, y: 250,
        fontSize: 64, font: FONT, weight: 400, color: '#ffffff', background: 'rgba(27,42,89,0.92)',
      });
      const code = new TextLabel({
        text: `act.${action.code}`, x: width / 2, y: 360, fontSize: 34,
        font: 'ui-monospace, Menlo, Consolas, monospace', color: '#ffd60a', background: 'rgba(0,0,0,0.6)',
      });
      this.add(...this.stadium.background, ball, ...all, bubble);
      this.overlay.add(label, code);
    }

    animate(tl: Timeline): void {
      tl.add(action.play(this.props), 0.4).set({}, {}, '+=0.6');
      const length = tl.duration();
      for (const f of this.props.all) tl.add(act.blinkRandomly(f, length), 0);
      tl.add(animateStadium(this.stadium, length), 0);
    }
  };
}

export const MBAPPE_ACTION_SCENES = ACTIONS.map(actionScene);
