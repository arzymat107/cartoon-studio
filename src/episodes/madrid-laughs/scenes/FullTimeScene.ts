/**
 * Full time at the Bernabéu, 4–1. Vinícius sambas, Bellingham stands arms wide, Mbappé strolls
 * past with the match ball, a Leipzig defender is still spinning – and Courtois, who had one shot
 * to deal with all night, yawns.
 */
import { gsap } from 'gsap';
import {
  blinkRandomly, crowdCheer, emote, popIn, popOut, say, sfx, walk,
} from '@/animations';
import { synth } from '@/audio';
import { Ball, SpeechBubble, TextLabel, type Footballer, type Scoreboard } from '@/components';
import { Actor, Scene, type Timeline } from '@/engine';
import { createParodyNotice } from '../../football/overlay';
import { animateStadium, createStadium, GROUND_Y, type Stadium } from '../../football/stadium';
import { dizzyStars } from '../../psg-barca/cast';
import { sitDown } from '../../psg-barca/acting';
import { armsWide, samba, yawn } from '../acting';
import { groove, rimshot } from '../sound';
import {
  createBellingham, createCourtois, createLeipzigDefender, createMadridScoreboard, createMbappe, createVinicius, MADRID_FANS,
} from '../cast';

const TITLE_FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const GOAL_X = 860;

export class FullTimeScene extends Scene {
  readonly title = 'Full Time: 4–1';

  private stadium!: Stadium;
  private scoreboard!: Scoreboard;
  private courtois!: Footballer;
  private vinicius!: Footballer;
  private bellingham!: Footballer;
  private mbappe!: Footballer;
  private defender!: Footballer;
  private stars!: Actor;
  private ball!: Ball;
  private confetti!: Actor[];
  private fullTime!: TextLabel;
  private oneShot!: SpeechBubble;

  build(): void {
    const { width, height } = this.stage;
    this.stadium = createStadium(width, height, { shirts: MADRID_FANS });
    this.stadium.goal.x = GOAL_X;
    this.scoreboard = createMadridScoreboard(width);

    this.courtois = createCourtois({ x: GOAL_X + 30 });
    this.courtois.scaleX = -Math.abs(this.courtois.scaleX);
    this.defender = createLeipzigDefender({ x: 560 });
    this.stars = dizzyStars({ y: -105 });
    this.defender.head.add(this.stars);
    this.vinicius = createVinicius({ x: 150 });
    this.bellingham = createBellingham({ x: 360 });
    this.mbappe = createMbappe({ x: -200 });
    this.ball = new Ball({ x: -120, y: GROUND_Y, radius: 22 });

    const colors = ['#ffffff', '#c9a227', '#7b4fa0', '#ffd60a'];
    this.confetti = Array.from({ length: 28 }, (_, i) => {
      const c = new Actor({ name: 'confetti', x: (i * 397) % width, y: -40 - ((i * 131) % 500), rotation: (i * 47) % 360 });
      c.draw('rect', { x: -9, y: -5, width: 18, height: 10, rx: 2, fill: colors[i % colors.length] });
      return c;
    });

    this.fullTime = new TextLabel({
      text: 'FULL TIME · HT 1–0', x: width / 2, y: 260, scale: 0, opacity: 0,
      fontSize: 64, font: TITLE_FONT, weight: 400, color: '#ffffff', background: 'rgba(27,42,89,0.92)',
    });
    this.oneShot = new SpeechBubble({ text: 'One shot.\nI had ONE shot.', fontSize: 44 });

    this.add(
      ...this.stadium.background, this.courtois, this.stadium.goal, this.defender, this.bellingham, this.vinicius,
      this.mbappe, this.ball, ...this.confetti, this.oneShot,
    );
    this.overlay.add(this.scoreboard, this.fullTime, createParodyNotice(width, height));
  }

  animate(tl: Timeline): void {
    const { courtois, vinicius, bellingham, mbappe, defender, ball, camera } = this;

    // The final whistle. 4–1.
    tl.add(this.scoreboard.setScore('home', 4), 0)
      .add(this.scoreboard.setScore('away', 1), 0)
      .add(sfx(() => synth.whistle(3, 0.25)), 0)
      .add(popIn(this.fullTime), 0.2)
      .add(sfx(synth.pop), 0.2)
      .add(crowdCheer(this.stadium.stands, { duration: 3 }), 0.2)
      .add(popOut(this.fullTime), 2.2);
    this.confetti.forEach((c, i) => {
      tl.to(c, { y: GROUND_Y - 20 + (i % 5) * 30, rotation: `+=${360 + i * 40}`, duration: 2.6 + (i % 4) * 0.4, ease: 'none' }, 0.2 + (i % 7) * 0.1)
        .to(c, { x: `+=${i % 2 ? 60 : -60}`, duration: 0.8, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0.2);
    });

    // Celebrations: samba, arms wide, and the defender still spinning from the fourth goal.
    tl.add(emote(vinicius, 'cheeky'), 0)
      .add(emote(bellingham, 'smug'), 0)
      .add(emote(defender, 'shocked'), 0)
      .add(emote(courtois, 'neutral'), 0)
      .add(samba(vinicius, { beats: 10 }), 0.3)
      .add(armsWide(bellingham), 0.4)
      .to(bellingham.head, { rotation: -10, duration: 0.3 }, 0.4)
      .to(this.stars, { opacity: 1, duration: 0.2 }, 0)
      .to(this.stars, { rotation: 360 * 5, duration: 5, ease: 'none' }, 0)
      .add(dizzySpin(defender, 5), 0.2)
      .add(sitDown(defender), 1.8)

      // Mbappé strolls through with the match ball.
      .add(emote(mbappe, 'smug'), 0)
      .add(walk(mbappe, { to: 640, duration: 1.6, stepDuration: 0.2 }), 0.4)
      .to(ball, { x: 720, duration: 1.6, ease: 'none' }, 0.4)
      .to(ball.body, { rotation: 600, duration: 1.6, ease: 'none' }, 0.4)
      .add(armsWide(bellingham, { undo: true }), 2.2)

      // Meanwhile, in goal…
      .addLabel('courtois', 2.4)
      .to(camera, { ...camera.focus(GOAL_X - 40, 1250, 1.45), duration: 0.5, ease: 'power2.inOut' }, 'courtois')
      .add(sfx(synth.whoosh), 'courtois')
      .add(emote(courtois, 'shocked'), 'courtois+=0.4')
      .add(yawn(courtois, { duration: 0.8 }), 'courtois+=0.4')
      .add(emote(courtois, 'neutral'), 'courtois+=1.2')
      .add(say(courtois, this.oneShot, { voice: 'voices/courtois-one-shot', hold: 0.3, offsetX: -110 }), 'courtois+=1.3')
      .add(rimshot(), '>-0.3')
      .to(camera, { ...camera.reset(), duration: 0.4, ease: 'power2.inOut' }, '<+0.3')
      .set({}, {}, '>+=0.1');

    const length = tl.duration() + 0.2;
    tl.add(animateStadium(this.stadium, length), 0)
      .add(groove(length, { volume: 0.05 }), 0);
    for (const char of [courtois, vinicius, bellingham, mbappe, defender]) tl.add(blinkRandomly(char, length), 0);
  }
}

/** Spin on the spot, flipping left/right like a top. */
function dizzySpin(char: Footballer, flips: number): Timeline {
  const facing = Math.abs(char.scaleX);
  const tl = gsap.timeline();
  for (let i = 0; i < flips * 2; i++) {
    tl.to(char, { scaleX: i % 2 ? facing : -facing, duration: 0.15, ease: 'sine.inOut' }, i * 0.16);
  }
  return tl.to(char.torso, { rotation: 10, duration: 0.3, yoyo: true, repeat: 3 }, 0);
}
