/**
 * Showcase of every portrait-figure action, costume, build and expression, one chapter each,
 * so they can be picked from the player. Not a Short – a reference sheet for building episodes.
 * Register one per player in src/episodes/index.ts, with his signature chapters first:
 *   scenes: figureShowcase(MBAPPE, { signature: DICTATOR_CHAPTERS })
 */
import { gsap } from 'gsap';
import { figureActions as act } from '@/animations';
import {
  Ball, FIGURE_EXPRESSIONS, PortraitFigure, SpeechBubble, TextLabel, Trophy, type CostumeName, type FigureBuildName, type FigureSpec,
  type ShortsStyle,
} from '@/components';
import { Scene, type SceneClass, type Timeline } from '@/engine';
import { animateStadium, createStadium, GROUND_Y, type Stadium } from '../football/stadium';

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const SCALE = 1.6;
const CENTER = 540;

interface Props {
  m: PortraitFigure;
  /** Every figure in the chapter (more than one for the build comparison). */
  all: PortraitFigure[];
  ball: Ball;
  bubble: SpeechBubble;
  trophy: Trophy;
}

interface Action {
  title: string;
  /** The call to copy into a scene (`act.` is added unless it is figure options). */
  code: string;
  play: (props: Props) => Timeline;
  /** Ball start, relative to the figure (omit to hide the ball). */
  ball?: number;
  /** Trophy start, relative to the figure, and the height of its stand (omit to hide it). */
  trophy?: { x: number; stand: number };
  /** The figure's start x. */
  x?: number;
  bubble?: string;
  /** Show these builds side by side instead of one athletic figure. */
  builds?: FigureBuildName[];
  /** Show these shorts styles side by side. */
  shortsStyles?: ShortsStyle[];
  costume?: CostumeName | 'kit';
}

/** The "Kylian the dictator" routine, for either costume. */
const dictator = ({ m, bubble }: Props) => gsap.timeline()
  .add(act.handInCoat(m, { hold: 1.2 }))
  .add(act.salute(m, { hold: 0.9 }), '+=0.2')
  .add(act.command(m, { duration: 1.4 }), '+=0.2')
  .add(act.say(m, bubble, { duration: 1.2 }), '<0.2')
  .add(act.crossArms(m, { hold: 1.2 }), '+=0.3');

/** Mbappé's signature: the dictator. */
export const DICTATOR_CHAPTERS: Action[] = [
  { title: 'Dictator: Generalissimo', code: "{ costume: 'generalissimo' }", costume: 'generalissimo', bubble: 'I decide\nwho plays!', play: dictator },
  { title: 'Dictator: Emperor', code: "{ costume: 'emperor' }", costume: 'emperor', bubble: 'I decide\nwho plays!', play: dictator },
  { title: 'Salute', code: 'salute(m)', costume: 'generalissimo', play: ({ m }) => act.salute(m) },
  { title: 'Hand in coat', code: 'handInCoat(m)', costume: 'emperor', play: ({ m }) => act.handInCoat(m) },
  { title: 'Command', code: 'command(m)', costume: 'generalissimo', play: ({ m }) => act.command(m) },
];

/** Yamal's signature: shorts pulled down, hitched up, sliding down again. */
export const SHORTS_CHAPTERS: Action[] = [
  {
    title: 'Pulled-down shorts', code: 'hitchShorts(m)', bubble: 'They fit\nperfectly.', x: 300,
    play: ({ m, bubble }) => gsap.timeline()
      .add(act.idle(m, 1.2))
      .add(act.hitchShorts(m, { hold: 0.2 }))
      .add(act.walk(m, { to: 760, duration: 1.6 }), '-=0.9')
      .add(act.say(m, bubble, { duration: 1.2 }), '+=0.1')
      .add(act.hitchShorts(m, { hold: 0.6 }), '+=0.2')
      .add(act.shrug(m), '+=0.2'),
  },
  { title: 'Gust of wind', code: 'flapShorts(m)', play: ({ m }) => act.flapShorts(m) },
  {
    title: 'Shorts styles', code: "{ shorts: 'normal' | 'low' | 'baggy' }", shortsStyles: ['normal', 'low', 'baggy'],
    play: ({ all }) => {
      const tl = gsap.timeline();
      all.forEach((f) => tl.add(act.idle(f, 1.4), 0).add(act.dance(f, { beats: 6 }), 1.4).add(act.hitchShorts(f, { hold: 0.3 }), 3.2));
      return tl;
    },
  },
];

/** Kane's signature: the trophy curse – it always gets away. */
export const TROPHY_CHAPTERS: Action[] = [
  {
    title: 'Trophy curse: so close', code: 'reachForTrophy(m, trophy)', x: 200, trophy: { x: 320, stand: 330 },
    play: ({ m, trophy }) => act.reachForTrophy(m, trophy),
  },
  { title: 'Trophy curse: poof', code: 'trophyVanishes(m, trophy)', play: ({ m, trophy }) => act.trophyVanishes(m, trophy) },
  {
    title: 'This year, for sure', code: 'say(m, bubble) · reachForTrophy(m, trophy)', bubble: 'This year\nfor sure!', x: 200, trophy: { x: 320, stand: 330 },
    play: ({ m, bubble, trophy }) => gsap.timeline()
      .add(act.emote(m, 'determined'))
      .add(act.say(m, bubble, { duration: 1.2 }))
      .add(act.reachForTrophy(m, trophy, { tries: 2 }), '+=0.2'),
  },
];

const ACTIONS: Action[] = [
  { title: 'In the kit', code: "{ costume: 'kit' }", costume: 'kit', play: ({ m }) => gsap.timeline().add(act.idle(m, 1.4)).add(act.wave(m)) },
  {
    title: 'Expressions', code: "emote(m, 'happy')",
    play: ({ m }) => act.expressions(m, [...FIGURE_EXPRESSIONS.filter((e) => e !== 'neutral'), 'neutral'], { each: 1.1 }),
  },
  {
    title: 'Body builds', code: "{ build: 'lanky' }", builds: ['athletic', 'lanky', 'stocky'],
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
  { title: 'Juggle', code: 'juggle(m, ball)', ball: 0, x: 440, play: ({ m, ball }) => act.juggle(m, ball) },
  { title: 'Flop & get up', code: 'flop(m) · getUp(m)', play: ({ m }) => gsap.timeline().add(act.flop(m)).add(act.getUp(m), '+=0.6') },
];

function actionScene(spec: FigureSpec, action: Action, index: number, total: number): SceneClass {
  const { kit } = spec;
  return class extends Scene {
    readonly title = `${index + 1}. ${action.title}`;
    private stadium!: Stadium;
    private props!: Props;

    build(): void {
      const { width, height } = this.stage;
      this.stadium = createStadium(width, height, { shirts: [kit.shirt, kit.shirt, kit.trim ?? kit.shorts, kit.numberColor ?? kit.socks] });
      const x = action.x ?? CENTER;
      const all = action.builds
        ? action.builds.map((build, i) => new PortraitFigure(spec, { build, x: 190 + i * 350, y: GROUND_Y, scale: 1.15 }))
        : action.shortsStyles
        ? action.shortsStyles.map((shorts, i) => new PortraitFigure(spec, { shorts, x: 190 + i * 350, y: GROUND_Y, scale: 1.15 }))
        : [new PortraitFigure(spec, { x, y: GROUND_Y, scale: SCALE, costume: action.costume })];
      const m = all[0];
      const trophy = new Trophy({
        x: x + (action.trophy?.x ?? 0), y: GROUND_Y, stand: action.trophy?.stand ?? 0, opacity: action.trophy ? 1 : 0,
      });
      const ball = new Ball({ x: x + (action.ball ?? 0), y: GROUND_Y, radius: 24, opacity: action.ball === undefined ? 0 : 1 });
      const bubble = new SpeechBubble({ text: action.bubble ?? '', fontSize: 46 });
      this.props = { m, all, ball, bubble, trophy };

      const label = new TextLabel({
        text: `${index + 1}/${total} · ${action.title.toUpperCase()}`, x: width / 2, y: 250,
        fontSize: 64, font: FONT, weight: 400, color: '#ffffff', background: 'rgba(27,42,89,0.92)',
      });
      const code = new TextLabel({
        text: action.code.startsWith('{') ? action.code : `act.${action.code}`, x: width / 2, y: 360, fontSize: 34,
        font: 'ui-monospace, Menlo, Consolas, monospace', color: '#ffd60a', background: 'rgba(0,0,0,0.6)',
      });
      this.add(...this.stadium.background, ball, ...all, trophy, bubble);
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

/**
 * One chapter per action for this player: his `signature` chapters first, then every generic one.
 * `greeting` is what he says in the "Say" chapter.
 */
export function figureShowcase(spec: FigureSpec, { greeting = 'Bonjour\nMadrid!', signature = [] as Action[] } = {}): SceneClass[] {
  const chapters = [...signature, ...ACTIONS].map((action) => (action.title === 'Say' ? { ...action, bubble: greeting } : action));
  return chapters.map((action, i) => actionScene(spec, action, i, chapters.length));
}
