/**
 * News parody: at the national team's training camp the coach tells the press that Ronaldo
 * won't start the next match – and Ronaldo packs his bag and leaves camp.
 */
import { gsap } from 'gsap';
import {
  birdsong, blinkRandomly, bounce, emote, face, jump, juggle, popIn, popOut, say, sfx, walk,
} from '@/animations';
import { synth } from '@/audio';
import { Ball, Character, Cloud, Goal, Pitch, Sky, SpeechBubble, TextLabel, Tree, type Footballer } from '@/components';
import { Actor, Scene, type Timeline } from '@/engine';
import { createRonaldo } from '../../football/cast';
import { createParodyNotice } from '../../football/overlay';
import { GROUND_Y } from '../../football/stadium';
import { createCoach, createKitBag, createPress, NewsTicker } from '../cast';

const TITLE_FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const RONALDO_X = 330;
const COACH_X = 700;

export class BenchedScene extends Scene {
  readonly title = 'Benched?!';

  private background!: Actor[];
  private clouds!: Cloud[];
  private ronaldo!: Footballer;
  private coach!: Character;
  private ball!: Ball;
  private press!: Actor;
  private groundBag!: Actor;
  private handBag!: Actor;
  private location!: TextLabel;
  private titleCard!: TextLabel;
  private ticker!: NewsTicker;
  private bubbles!: Record<'notStart' | 'notMe' | 'goingHome' | 'somethingSaid', SpeechBubble>;

  build(): void {
    const { width, height } = this.stage;
    this.clouds = [new Cloud({ x: 200, y: 260 }), new Cloud({ x: 760, y: 170, scale: 0.75 }), new Cloud({ x: 980, y: 420, scale: 0.6 })];
    const trees = [90, 260, 450, 640, 820, 1000].map((x, i) =>
      new Tree({ x, y: 1250, height: 260 + (i % 3) * 40, leaves: i % 2 ? '#3fa34d' : '#358f43' }));
    const cones = [160, 470, 560, 980].map((x) => cone(x, 1500 + (x % 3) * 20));
    this.background = [
      new Sky({ width, height }),
      ...this.clouds,
      ...trees,
      new Pitch({ width, top: 1244, height: height - 1244, light: '#5cbf60', dark: '#52b356' }),
      new Goal({ x: 480, y: 1420, height: 170, depth: 90 }),
      ...cones,
    ];

    this.ronaldo = createRonaldo({ x: RONALDO_X });
    this.coach = createCoach({ x: COACH_X });
    this.ball = new Ball({ x: RONALDO_X + 85, y: GROUND_Y, radius: 26 });
    this.press = createPress({ x: 1600, y: 1315, scale: 1.7 });
    this.groundBag = createKitBag({ x: 120, y: GROUND_Y - 64 });
    this.handBag = createKitBag({ y: 64, opacity: 0 });
    this.ronaldo.rightArm.add(this.handBag);

    this.bubbles = {
      notStart: new SpeechBubble({ text: 'Cristiano will not start\nthe next match.', fontSize: 38 }),
      notMe: new SpeechBubble({ text: 'Not start? ME?!', fontSize: 46 }),
      goingHome: new SpeechBubble({ text: "Fine. I'm going home.", fontSize: 40 }),
      somethingSaid: new SpeechBubble({ text: 'Was it something I said?', fontSize: 38 }),
    };

    this.location = new TextLabel({
      text: '📍 TRAINING CAMP · DENMARK', x: width / 2, y: 170, scale: 0, opacity: 0,
      fontSize: 40, font: TITLE_FONT, weight: 400, color: '#fff', background: 'rgba(0,0,0,0.55)',
    });
    this.titleCard = new TextLabel({
      text: 'BENCHED?!', x: width / 2, y: 380, scale: 0, opacity: 0,
      fontSize: 140, font: TITLE_FONT, weight: 400, color: '#ffd60a', background: 'rgba(200,16,46,0.9)',
    });
    const headline = 'PORTUGAL CAPTAIN LEAVES TRAINING CAMP AFTER COACH SAYS HE WILL NOT START  ●  ';
    this.ticker = new NewsTicker({ width, y: height - 170, text: headline.repeat(2) });

    this.add(...this.background, this.groundBag, this.coach, this.ronaldo, this.ball, this.press, ...Object.values(this.bubbles));
    this.overlay.add(this.location, this.titleCard, this.ticker, createParodyNotice(width, height));
  }

  animate(tl: Timeline): void {
    const { ronaldo, coach, ball, press, camera, bubbles } = this;

    // Training as usual… while the coach talks to the press.
    tl.add(popIn(this.location), 0.3)
      .add(popOut(this.location), 2.8)
      .add(juggle(ronaldo, ball, { touches: 7, step: 0.52 }), 0.3)
      .to(press, { x: COACH_X + 110, duration: 0.6, ease: 'power2.out' }, 0.5)
      .add(say(coach, bubbles.notStart, { voice: 'voices/coach-not-start', hold: 0.6 }), 1.3)

      // He heard that.
      .addLabel('heard', 4.0)
      .add(emote(ronaldo, 'shocked'), 'heard')
      .add(bounce(ball, { dx: 260, height: 60, times: 3, duration: 0.6 }), 'heard+=0.15')
      .add(emote(ronaldo, 'angry'), 'heard+=0.8')
      .add(say(ronaldo, bubbles.notMe, { voice: 'voices/ronaldo-not-start', hold: 0.7 }), 'heard+=0.9')
      .add(jump(ronaldo, { height: 45, duration: 0.35 }), 'heard+=1.2')
      .add(shrug(coach), 'heard+=2.4')
      .add(say(ronaldo, bubbles.goingHome, { voice: 'voices/ronaldo-going-home', hold: 0.6 }), 'heard+=3.4')

      // Grab the bag and leave camp.
      .addLabel('leave', 'heard+=5')
      .add(walk(ronaldo, { to: 175, duration: 0.7, stepDuration: 0.17 }), 'leave')
      .to(ronaldo.torso, { rotation: -18, duration: 0.15, yoyo: true, repeat: 1 }, 'leave+=0.75')
      .set(this.groundBag, { opacity: 0, immediateRender: false }, 'leave+=0.9')
      .set(this.handBag, { opacity: 1, immediateRender: false }, 'leave+=0.9')
      .add(sfx(synth.whoosh), 'leave+=1.1')
      .add(walk(ronaldo, { to: -350, duration: 1.4, stepDuration: 0.15 }), 'leave+=1.1')

      // The coach, alone with the microphones.
      .addLabel('alone', 'leave+=2.6')
      .add(emote(coach, 'shocked'), 'alone')
      .to(camera, { ...camera.focus(COACH_X - 60, 1360, 1.35), duration: 0.6, ease: 'power2.out' }, 'alone')
      .add(face(coach, -1), 'alone+=0.3')
      .add(say(coach, bubbles.somethingSaid, { voice: 'voices/coach-something-said', hold: 0.7 }), 'alone+=0.6')
      .to(camera, { ...camera.reset(), duration: 0.7, ease: 'power2.inOut' }, '>')

      // The news breaks.
      .addLabel('news', '>')
      .add(sfx(synth.pop), 'news')
      .add(popIn(this.titleCard), 'news')
      .to(this.ticker, { x: 0, duration: 0.5, ease: 'power2.out' }, 'news+=0.3')
      .to(this.ticker.headline, { x: -1500, duration: 6.5, ease: 'none' }, 'news+=0.6');

    const length = tl.duration() + 0.2;
    tl.add(birdsong(length), 0)
      .add(blinkRandomly(ronaldo, length), 0)
      .add(blinkRandomly(coach, length), 0);
    this.clouds.forEach((cloud, i) => tl.to(cloud, { x: `+=${60 + i * 25}`, duration: length, ease: 'none' }, 0));
  }
}

/** Arms out, palms up: "What can I do?" */
function shrug(char: Character): Timeline {
  return gsap.timeline()
    .to(char.leftArm, { rotation: 55, duration: 0.25, ease: 'back.out(2)' }, 0)
    .to(char.rightArm, { rotation: -55, duration: 0.25, ease: 'back.out(2)' }, 0)
    .to(char.head, { rotation: -8, duration: 0.25 }, 0)
    .to(char.leftArm, { rotation: Character.ARM_REST, duration: 0.3 }, 1)
    .to(char.rightArm, { rotation: -Character.ARM_REST, duration: 0.3 }, 1)
    .to(char.head, { rotation: 0, duration: 0.3 }, 1);
}

/** Orange training cone. */
function cone(x: number, y: number): Actor {
  const c = new Actor({ name: 'cone', x, y });
  c.draw('path', { d: 'M -16 0 L -5 -38 L 5 -38 L 16 0 Z', fill: '#ff7b00' });
  c.draw('rect', { x: -22, y: -4, width: 44, height: 7, rx: 3, fill: '#e06600' });
  c.draw('rect', { x: -9, y: -24, width: 18, height: 6, fill: '#ffd3a8' });
  return c;
}
