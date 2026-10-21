/**
 * 2–2: Zaïre-Emery heads the ball down – straight to Yamal, who leaves him spinning in the dust
 * and fires into the near top corner while Safonov guards the grass.
 */
import {
  blinkRandomly, celebrate, crowdCheer, emote, flight, jump, popIn, popOut, roll, say, sfx, shakeNet, shoot, SHOT_CONTACT, walk,
} from '@/animations';
import { synth } from '@/audio';
import { Ball, SpeechBubble, type Footballer, type Scoreboard } from '@/components';
import { Actor, Scene, type Timeline } from '@/engine';
import { createParodyNotice } from '../../football/overlay';
import { animateStadium, createStadium, GROUND_Y, type Stadium } from '../../football/stadium';
import { crouch, lookAround, sitDown } from '../acting';
import {
  cornerTarget, createBallAura, createMatchScoreboard, createSafonov, createYamal, createZaireEmery, FAN_SHIRTS, puff,
} from '../cast';

const GOAL_X = 860;
const HEADER_X = 470;

export class YamalGoalScene extends Scene {
  readonly title = 'Yamal 2–2';

  private stadium!: Stadium;
  private scoreboard!: Scoreboard;
  private yamal!: Footballer;
  private zaireEmery!: Footballer;
  private safonov!: Footballer;
  private ball!: Ball;
  private aura!: Actor;
  private dust!: Actor;
  private target!: Actor;
  private bubbles!: Record<'thanks' | 'oops', SpeechBubble>;

  build(): void {
    const { width, height } = this.stage;
    this.stadium = createStadium(width, height, { shirts: FAN_SHIRTS });
    this.stadium.goal.x = GOAL_X;
    this.scoreboard = createMatchScoreboard(width);

    this.yamal = createYamal({ x: 230 });
    this.zaireEmery = createZaireEmery({ x: HEADER_X + 30 });
    this.safonov = createSafonov({ x: GOAL_X + 40 });
    for (const p of [this.zaireEmery, this.safonov]) p.scaleX = -Math.abs(p.scaleX);
    this.ball = new Ball({ x: HEADER_X, y: GROUND_Y, radius: 22 });
    this.ball.body.y = -this.ball.radius - 1700;
    this.aura = createBallAura(this.ball.radius);
    this.ball.body.add(this.aura);
    this.dust = puff({ x: HEADER_X + 30, y: GROUND_Y - 120 });
    this.target = cornerTarget({ x: GOAL_X + 26, y: GROUND_Y - 380 });
    this.bubbles = {
      thanks: new SpeechBubble({ text: 'Thanks!', fontSize: 52 }),
      oops: new SpeechBubble({ text: 'Oops.', fontSize: 56 }),
    };

    this.add(
      ...this.stadium.background, this.safonov, this.zaireEmery, this.yamal, this.ball, this.stadium.goal,
      this.dust, this.target, ...Object.values(this.bubbles),
    );
    this.overlay.add(this.scoreboard, createParodyNotice(width, height));
  }

  animate(tl: Timeline): void {
    const { yamal, zaireEmery: ze, safonov, ball, camera, bubbles } = this;
    const headHeight = 340;

    // 2–1 PSG. A long ball drops; Zaïre-Emery heads it down… to Yamal.
    tl.add(this.scoreboard.setScore('home', 2), 0)
      .add(this.scoreboard.setScore('away', 1), 0)
      .add(sfx(synth.whoosh), 0.3)
      .add(flight(ball, { dx: 0, from: 1700, peak: 1700, land: headHeight, duration: 0.9, spin: 1 }), 0.3)
      .add(emote(ze, 'smug'), 0.3)
      .add(jump(ze, { height: 40, duration: 0.3, sound: false }), 1.0)
      .to(ze.head, { rotation: 20, duration: 0.08, yoyo: true, repeat: 1 }, 1.15)
      .add(sfx(() => synth.kick(0.5)), 1.2)
      .add(flight(ball, { toX: 300, from: headHeight, peak: headHeight + 60, land: 0, duration: 0.6, spin: -1 }), 1.2)
      .add(emote(ze, 'shocked'), 1.6)
      .add(emote(yamal, 'cheeky'), 1.8)
      .add(say(yamal, bubbles.thanks, { voice: 'voices/yamal-thanks', hold: 0.5, offsetX: 70 }), 1.9)

      // He leaves Zaïre-Emery spinning in a cloud of dust.
      .addLabel('run', 3.1)
      .to(this.aura, { opacity: 1, duration: 0.2 }, 'run')
      .add(emote(yamal, 'smug'), 'run')
      .add(walk(yamal, { to: 690, duration: 0.7, stepDuration: 0.1 }), 'run')
      .add(roll(ball, { dx: 460, duration: 0.7 }), 'run')
      .add(sfx(synth.whoosh), 'run+=0.2')
      .add(popIn(this.dust, { scale: 1.3 }), 'run+=0.3')
      .to(this.dust, { opacity: 0, y: '-=40', duration: 0.8 }, 'run+=0.6')
      .add(lookAround(ze, { times: 3, interval: 0.12 }), 'run+=0.3')
      .add(sitDown(ze), 'run+=1.1')
      .add(emote(safonov, 'smug'), 'run')
      .add(crouch(safonov), 'run+=0.3')

      // The near top corner is wide open.
      .addLabel('aim', 'run+=0.9')
      .to(camera, { ...camera.focus(760, 1330, 1.35), duration: 0.4, ease: 'power2.out' }, 'aim')
      .add(popIn(this.target), 'aim+=0.2')
      .add(sfx(() => synth.note(1760, 0.12, 'sine', 0.1)), 'aim+=0.2')
      .to(this.target, { scale: 1.15, duration: 0.15, yoyo: true, repeat: 3 }, 'aim+=0.5')
      .addLabel('shot', 'aim+=0.5')
      .add(shoot(yamal, ball, { toX: GOAL_X + 30, land: 380, straight: true, duration: 0.22, power: 1.3, spin: 1 }), 'shot')
      .addLabel('goal', `shot+=${SHOT_CONTACT + 0.22}`)
      .add(shakeNet(this.stadium.goal), 'goal')
      .add(popOut(this.target), 'goal')
      .add(this.scoreboard.setScore('away', 2), 'goal+=0.2')
      .add(crowdCheer(this.stadium.stands, { duration: 2.5 }), 'goal')
      .to(this.aura, { opacity: 0, duration: 0.4 }, 'goal+=0.4')
      .to(camera, { ...camera.reset(), duration: 0.6, ease: 'power2.inOut' }, 'goal+=0.3')
      .add(emote(yamal, 'happy'), 'goal')
      .add(celebrate(yamal, { jumps: 2, height: 90 }), 'goal+=0.2')

      // Safonov looks up, far too late.
      .add(emote(safonov, 'shocked'), 'goal+=0.3')
      .to(safonov.head, { rotation: -25, duration: 0.2 }, 'goal+=0.3')
      .add(crouch(safonov, { undo: true }), 'goal+=0.9')
      .to(safonov.head, { rotation: 0, duration: 0.2 }, 'goal+=0.9')
      .add(say(safonov, bubbles.oops, { voice: 'voices/safonov-oops', hold: 0.7, offsetX: -40 }), 'goal+=1')
      .set({}, {}, 'goal+=2.6');

    const length = tl.duration() + 0.2;
    tl.add(animateStadium(this.stadium, length), 0);
    for (const char of [yamal, ze, safonov]) tl.add(blinkRandomly(char, length), 0);
  }
}
