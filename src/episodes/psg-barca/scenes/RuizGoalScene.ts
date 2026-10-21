/**
 * 4–2: Hakimi shimmies until Balde and Martín bonk heads, then rolls it across. Joan García leaps
 * for a high ball that never comes, and Fabián Ruiz – who tiptoed in behind Cancelo with a cup of
 * tea – taps it into the empty net.
 */
import { gsap } from 'gsap';
import {
  blinkRandomly, crowdCheer, emote, face, jump, melody, roll, say, sfx, shakeNet, walk,
} from '@/animations';
import { synth } from '@/audio';
import { Ball, Character, SpeechBubble, type Footballer, type Scoreboard } from '@/components';
import { Actor, Scene, type Timeline } from '@/engine';
import { createParodyNotice } from '../../football/overlay';
import { animateStadium, createStadium, GROUND_Y, type Stadium } from '../../football/stadium';
import { sitDown, tiptoe } from '../acting';
import {
  createBalde, createCancelo, createHakimi, createJoanGarcia, createMartin, createMatchScoreboard, createRuiz, dizzyStars,
  FAN_SHIRTS, teaCup,
} from '../cast';

const GOAL_X = 860;
const BALDE_X = 440;
const MARTIN_X = 545;
const CANCELO_X = 680;
const RUIZ_X = 790;

export class RuizGoalScene extends Scene {
  readonly title = 'Ruiz 4–2';

  private stadium!: Stadium;
  private scoreboard!: Scoreboard;
  private hakimi!: Footballer;
  private balde!: Footballer;
  private martin!: Footballer;
  private cancelo!: Footballer;
  private keeper!: Footballer;
  private ruiz!: Footballer;
  private cup!: Actor;
  private ball!: Ball;
  private stars!: Actor[];
  private bubbles!: Record<'huh' | 'easy', SpeechBubble>;

  build(): void {
    const { width, height } = this.stage;
    this.stadium = createStadium(width, height, { shirts: FAN_SHIRTS });
    this.stadium.goal.x = GOAL_X;
    this.scoreboard = createMatchScoreboard(width);

    this.hakimi = createHakimi({ x: 90 });
    this.balde = createBalde({ x: BALDE_X });
    this.martin = createMartin({ x: MARTIN_X });
    this.cancelo = createCancelo({ x: CANCELO_X });
    this.keeper = createJoanGarcia({ x: GOAL_X - 20 });
    this.ruiz = createRuiz({ x: 1200 });
    for (const p of [this.balde, this.martin, this.cancelo, this.keeper, this.ruiz]) p.scaleX = -Math.abs(p.scaleX);
    this.cup = teaCup();
    this.cup.rotation = Character.ARM_REST;
    this.ruiz.rightArm.add(this.cup);
    this.stars = [this.balde, this.martin].map((p) => {
      const ring = dizzyStars({ y: -105 });
      p.head.add(ring);
      return ring;
    });
    this.ball = new Ball({ x: 160, y: GROUND_Y, radius: 22 });
    this.bubbles = {
      huh: new SpeechBubble({ text: 'Huh?!', fontSize: 56 }),
      easy: new SpeechBubble({ text: 'Easy. ☕', fontSize: 52 }),
    };

    this.add(
      ...this.stadium.background, this.keeper, this.cancelo, this.martin, this.balde, this.hakimi, this.ruiz, this.ball,
      this.stadium.goal, ...Object.values(this.bubbles),
    );
    this.overlay.add(this.scoreboard, createParodyNotice(width, height));
  }

  animate(tl: Timeline): void {
    const { hakimi, balde, martin, cancelo, keeper, ruiz, ball, bubbles, camera } = this;

    // 3–2. Hakimi brings it forward; Ruiz starts tiptoeing in behind Cancelo.
    tl.add(this.scoreboard.setScore('home', 3), 0)
      .add(this.scoreboard.setScore('away', 2), 0)
      .add(emote(hakimi, 'smug'), 0)
      .add(emote(ruiz, 'smug'), 0)
      .add(walk(hakimi, { to: 290, duration: 1, stepDuration: 0.16 }), 0.2)
      .add(roll(ball, { dx: 210, duration: 1 }), 0.2)
      .add(tiptoe(ruiz, { to: RUIZ_X, duration: 3, steps: 8 }), 0.4)
      .add(melody('C4 - Eb4 - G4 - Eb4 - C4 - Eb4 - G4 - Eb4', { bpm: 330, wave: 'sine', volume: 0.08 }), 0.4)

      // Shimmy, shimmy… Balde and Martín follow every move and bonk heads.
      .addLabel('shimmy', 1.3)
      .to(hakimi.torso, { rotation: 14, duration: 0.15, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 'shimmy')
      .to(balde, { x: BALDE_X - 25, duration: 0.15, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 'shimmy')
      .to(martin, { x: MARTIN_X + 25, duration: 0.15, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 'shimmy')
      .addLabel('bonk', 'shimmy+=0.9')
      .add(emote(balde, 'angry'), 'bonk')
      .add(emote(martin, 'angry'), 'bonk')
      .to(balde, { x: 485, duration: 0.18, ease: 'power2.in' }, 'bonk')
      .to(martin, { x: 505, duration: 0.18, ease: 'power2.in' }, 'bonk')
      .add(sfx(() => synth.kick(1.2)), 'bonk+=0.18')
      .add(sfx(synth.boing), 'bonk+=0.2')
      .add(emote(balde, 'shocked'), 'bonk+=0.2')
      .add(emote(martin, 'shocked'), 'bonk+=0.2')
      .to(balde, { x: 455, duration: 0.25, ease: 'power2.out' }, 'bonk+=0.2')
      .to(martin, { x: 540, duration: 0.25, ease: 'power2.out' }, 'bonk+=0.2')
      .add(sitDown(balde), 'bonk+=0.3')
      .add(sitDown(martin), 'bonk+=0.3')
      .to(this.stars, { opacity: 1, duration: 0.15 }, 'bonk+=0.3')
      .to(this.stars, { rotation: 360 * 3, duration: 3, ease: 'none' }, 'bonk+=0.3')

      // Low cross. García leaps for a high ball that never comes; Ruiz turns, and taps it in.
      .addLabel('cross', 'bonk+=0.9')
      .to(camera, { ...camera.focus(760, 1300, 1.35), duration: 0.7, ease: 'power2.inOut' }, 'cross+=0.2')
      .to(hakimi.rightLeg, { rotation: -45, duration: 0.12, yoyo: true, repeat: 1 }, 'cross')
      .add(sfx(() => synth.kick(0.7)), 'cross+=0.1')
      .add(roll(ball, { dx: 850 - 370, duration: 0.9 }), 'cross+=0.1')
      .add(face(ruiz, 1), 'cross+=0.1')
      .add(emote(keeper, 'happy'), 'cross+=0.15')
      .to(keeper.leftArm, { rotation: 160, duration: 0.2 }, 'cross+=0.2')
      .to(keeper.rightArm, { rotation: -160, duration: 0.2 }, 'cross+=0.2')
      .add(jump(keeper, { height: 300, duration: 1.3 }), 'cross+=0.2')
      .to(ruiz.leftLeg, { rotation: -30, duration: 0.12, yoyo: true, repeat: 1 }, 'cross+=0.95')
      .add(sfx(() => synth.kick(0.3)), 'cross+=1')
      .add(roll(ball, { dx: 110, duration: 0.7 }), 'cross+=1')
      .addLabel('goal', 'cross+=1.6')
      .add(shakeNet(this.stadium.goal), 'goal')
      .add(this.scoreboard.setScore('home', 4), 'goal+=0.2')
      .add(crowdCheer(this.stadium.stands, { duration: 2.5 }), 'goal')
      .add(emote(keeper, 'shocked'), 'goal')
      .to(keeper.leftArm, { rotation: Character.ARM_REST, duration: 0.3 }, 'goal')
      .to(keeper.rightArm, { rotation: -Character.ARM_REST, duration: 0.3 }, 'goal')

      // Cancelo turns round: huh?! Ruiz sips his tea.
      .add(face(cancelo, 1), 'goal+=0.3')
      .add(emote(cancelo, 'shocked'), 'goal+=0.3')
      .add(say(cancelo, bubbles.huh, { voice: 'voices/cancelo-huh', hold: 0.6, offsetX: -60 }), 'goal+=0.4')
      .add(sip(ruiz, this.cup), 'goal+=1.5')
      .add(say(ruiz, bubbles.easy, { voice: 'voices/ruiz-easy', hold: 0.8, offsetX: 40 }), 'goal+=2.4')
      .to(camera, { ...camera.reset(), duration: 0.6, ease: 'power2.inOut' }, 'goal+=3.4')
      .set({}, {}, 'goal+=4.2');

    const length = tl.duration() + 0.2;
    tl.add(animateStadium(this.stadium, length), 0);
    for (const char of [hakimi, balde, martin, cancelo, keeper, ruiz]) tl.add(blinkRandomly(char, length), 0);
  }
}

/** Raise the cup to the mouth and back, keeping it upright. */
function sip(char: Character, cup: Actor): Timeline {
  return gsap.timeline()
    .to(char.rightArm, { rotation: -150, duration: 0.3 }, 0)
    .to(cup, { rotation: 150, duration: 0.3 }, 0)
    .to(char.head, { rotation: -10, duration: 0.3 }, 0.2)
    .to(char.rightArm, { rotation: -Character.ARM_REST, duration: 0.3 }, 0.9)
    .to(cup, { rotation: Character.ARM_REST, duration: 0.3 }, 0.9)
    .to(char.head, { rotation: 0, duration: 0.3 }, 0.9);
}

