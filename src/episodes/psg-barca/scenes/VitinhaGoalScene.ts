/**
 * 3–2: a cross from the right is headed out by a Barça defender – straight to the smallest man on
 * the pitch, whose first-time volley is a fireball. Joan García gets a fingertip to it. Ouch.
 */
import {
  blinkRandomly, celebrate, crowdCheer, emote, flight, flop, jump, popIn, say, sfx, shakeNet, shoot, SHOT_CONTACT,
} from '@/animations';
import { synth } from '@/audio';
import { Ball, SpeechBubble, type Footballer, type Scoreboard } from '@/components';
import { Actor, Scene, type Timeline } from '@/engine';
import { createParodyNotice } from '../../football/overlay';
import { animateStadium, createStadium, GROUND_Y, type Stadium } from '../../football/stadium';
import { shake } from '../acting';
import {
  createBallAura, createBarcaPlayer, createJoanGarcia, createMatchScoreboard, createVitinha, FAN_SHIRTS, puff,
} from '../cast';

const GOAL_X = 230;
const DEFENDER_X = 470;
const VOLLEY_X = 790;
/** Timeline seconds: cross lands on the defender's head, then the clearance lands for the volley. */
const HEADER = 1.3;
const VOLLEY = HEADER + 0.9;

export class VitinhaGoalScene extends Scene {
  readonly title = 'Vitinha 3–2';

  private stadium!: Stadium;
  private scoreboard!: Scoreboard;
  private vitinha!: Footballer;
  private defender!: Footballer;
  private keeper!: Footballer;
  private ball!: Ball;
  private fire!: Actor;
  private smoke!: Actor;
  private ouch!: SpeechBubble;

  build(): void {
    const { width, height } = this.stage;
    this.stadium = createStadium(width, height, { shirts: FAN_SHIRTS });
    // Barça's goal, on the left.
    this.stadium.goal.x = GOAL_X;
    this.stadium.goal.scaleX = -1;
    this.scoreboard = createMatchScoreboard(width);

    this.keeper = createJoanGarcia({ x: GOAL_X + 90 });
    this.defender = createBarcaPlayer({ x: DEFENDER_X, hair: '#2a1c12' });
    this.vitinha = createVitinha({ x: VOLLEY_X + 55 });
    this.vitinha.scaleX = -Math.abs(this.vitinha.scaleX);
    this.ball = new Ball({ x: 1180, y: GROUND_Y, radius: 22 });
    this.ball.body.y = -this.ball.radius - 250;
    this.fire = createBallAura(this.ball.radius, '#ff7b00');
    this.ball.body.add(this.fire);
    this.smoke = puff({ x: GOAL_X + 20, y: GROUND_Y - 120, scale: 0 }, '#9aa4b2');
    this.ouch = new SpeechBubble({ text: 'Ouch!', fontSize: 56 });

    this.add(
      ...this.stadium.background, this.keeper, this.defender, this.vitinha, this.ball, this.stadium.goal, this.smoke, this.ouch,
    );
    this.overlay.add(this.scoreboard, createParodyNotice(width, height));
  }

  animate(tl: Timeline): void {
    const { vitinha, defender, keeper, ball, camera } = this;

    // 2–2. Cross from the right, headed out to the middle.
    tl.add(this.scoreboard.setScore('home', 2), 0)
      .add(this.scoreboard.setScore('away', 2), 0)
      .add(emote(vitinha, 'smug'), 0)
      .add(sfx(() => synth.kick(0.8)), 0.3)
      .add(flight(ball, { toX: DEFENDER_X + 10, from: 250, peak: 650, land: 330, duration: HEADER - 0.3, spin: -1.5 }), 0.3)
      .add(jump(defender, { height: 40, duration: 0.3, sound: false }), HEADER - 0.15)
      .to(defender.head, { rotation: -15, duration: 0.08, yoyo: true, repeat: 1 }, HEADER - 0.05)
      .add(sfx(() => synth.kick(0.5)), HEADER)
      .add(flight(ball, { toX: VOLLEY_X, from: 330, peak: 470, land: 90, duration: VOLLEY - HEADER, spin: 1 }), HEADER)
      .add(emote(vitinha, 'angry'), HEADER + 0.3)
      .add(emote(defender, 'shocked'), VOLLEY)

      // First-time volley: a fireball.
      .add(shoot(vitinha, ball, { toX: GOAL_X - 120, from: 90, land: 70, straight: true, duration: 0.42, power: 2, spin: -3 }), VOLLEY - SHOT_CONTACT)
      .to(this.fire, { opacity: 1, duration: 0.05 }, VOLLEY)
      .add(shake(camera, { amount: 10, times: 3 }), VOLLEY)
      .add(sfx(synth.whoosh), VOLLEY)

      // García dives and gets a fingertip to it – it goes in anyway.
      .add(emote(keeper, 'shocked'), VOLLEY + 0.05)
      .add(flop(keeper, { direction: -1, kicks: 1 }), VOLLEY + 0.05)
      .add(sfx(() => synth.note(1500, 0.05, 'square', 0.08)), VOLLEY + 0.33)
      .add(popIn(this.smoke, { scale: 0.8 }), VOLLEY + 0.33)
      .to(this.smoke, { opacity: 0, y: '-=60', duration: 1.2 }, VOLLEY + 0.6)
      .addLabel('goal', VOLLEY + 0.42)
      .add(shakeNet(this.stadium.goal), 'goal')
      .to(this.fire, { opacity: 0, duration: 0.5 }, 'goal+=0.3')
      .add(this.scoreboard.setScore('home', 3), 'goal+=0.2')
      .add(crowdCheer(this.stadium.stands, { duration: 2.5 }), 'goal')
      .add(emote(vitinha, 'happy'), 'goal')
      .add(celebrate(vitinha, { jumps: 3, height: 150 }), 'goal+=0.2')

      // Ouch.
      .to(camera, { ...camera.focus(380, 1330, 1.4), duration: 0.5, ease: 'power2.out' }, 'goal+=0.8')
      .add(emote(keeper, 'angry'), 'goal+=1')
      .to(keeper.rightArm, { rotation: -110, duration: 0.12, yoyo: true, repeat: 5 }, 'goal+=1.1')
      .add(say(keeper, this.ouch, { voice: 'voices/garcia-ouch', hold: 0.8, offsetX: 100, offsetY: 120 }), 'goal+=1.1')
      .to(camera, { ...camera.reset(), duration: 0.5, ease: 'power2.inOut' }, 'goal+=2.6')
      .set({}, {}, 'goal+=3.2');

    const length = tl.duration() + 0.2;
    tl.add(animateStadium(this.stadium, length), 0);
    for (const char of [vitinha, defender, keeper]) tl.add(blinkRandomly(char, length), 0);
  }
}
