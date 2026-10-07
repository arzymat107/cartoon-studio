import {
  blinkRandomly, celebrate, crowdCheer, emote, face, flight, flop, popIn, say, sfx, shakeNet, shoot, SHOT_CONTACT, showCard, walk,
} from '@/animations';
import { synth } from '@/audio';
import { Ball, SpeechBubble, TextLabel, type Footballer, type Referee, type Scoreboard } from '@/components';
import { Scene, type Timeline } from '@/engine';
import { createMessi, createReferee, createRonaldo } from '../cast';
import { createParodyNotice, createScoreboard } from '../overlay';
import { animateStadium, BALL_SPOT, createStadium, GROUND_Y, KICK_SPOT, type Stadium } from '../stadium';

export class MagicChipScene extends Scene {
  readonly title = 'Top Corner';

  private stadium!: Stadium;
  private messi!: Footballer;
  private ronaldo!: Footballer;
  private referee!: Referee;
  private ball!: Ball;
  private scoreboard!: Scoreboard;
  private cardLine!: SpeechBubble;
  private dinnerLine!: SpeechBubble;
  private ending!: TextLabel;

  build(): void {
    const { width, height } = this.stage;
    this.stadium = createStadium(width, height);
    this.ronaldo = createRonaldo({ x: 50 });
    this.messi = createMessi({ x: 300 });
    this.referee = createReferee({ x: 1350, scaleX: -1.55 });
    this.ball = new Ball({ x: BALL_SPOT, y: GROUND_Y, radius: 26 });
    this.scoreboard = createScoreboard(width);
    this.cardLine = new SpeechBubble({ text: 'Yellow card.\nToo dramatic!', fontSize: 40 });
    this.dinnerLine = new SpeechBubble({ text: 'Dinner is on you.', fontSize: 40 });
    this.ending = new TextLabel({
      text: 'REMATCH? PART 2 SOON', x: width / 2, y: 360, scale: 0, opacity: 0,
      fontSize: 64, font: 'Impact, "Arial Black", system-ui, sans-serif', weight: 400,
      color: '#ffd60a', background: 'rgba(0,0,0,0.55)',
    });

    this.add(
      // Referee first, so Ronaldo lying on the grass is in front of his legs.
      ...this.stadium.background, this.referee, this.ronaldo, this.messi, this.ball, this.stadium.goal,
      this.cardLine, this.dinnerLine,
    );
    this.overlay.add(this.scoreboard, this.ending, createParodyNotice(width, height));
  }

  animate(tl: Timeline): void {
    const { messi, ronaldo, referee, ball, camera } = this;
    const { goal, stands } = this.stadium;
    const flightTime = 0.55;
    // Ball center height at the end: high in the net, its top still below the crossbar.
    const topCorner = goal.height - ball.radius * 2 - 10;

    // A calm, short run-up… then a laser, straight under the crossbar into the top corner.
    tl.add(walk(messi, { to: KICK_SPOT, duration: 0.9, stepDuration: 0.22 }), 0.6)
      .addLabel('shot', '+=0.2')
      .to(camera, { ...camera.focus(700, 1350, 1.3), duration: 0.6, ease: 'power2.out' }, 'shot')
      .add(shoot(messi, ball, { toX: goal.x + 95, land: topCorner, straight: true, duration: flightTime, spin: 2, power: 1.2 }), 'shot')
      .addLabel('goal', `shot+=${SHOT_CONTACT + flightTime}`)
      .add(shakeNet(goal), 'goal')
      // The net stops it and it drops to the grass.
      .add(flight(ball, { dx: 30, from: topCorner, duration: 0.5, spin: 0.3 }), 'goal')
      .add(crowdCheer(stands, { duration: 2.6 }), 'goal')
      .add(this.scoreboard.setScore('home', 1), 'goal+=0.2')
      .to(camera, { ...camera.reset(), duration: 0.9, ease: 'power2.inOut' }, 'goal+=0.8')
      // Messi runs off to celebrate; Ronaldo collapses in disbelief.
      .add(walk(messi, { to: 745, duration: 0.75, stepDuration: 0.14 }), 'goal+=0.1')
      .add(emote(messi, 'happy'), 'goal+=0.1')
      .add(celebrate(messi, { jumps: 2 }), 'goal+=0.85')
      .add(emote(ronaldo, 'shocked'), 'goal+=0.2')
      .add(flop(ronaldo, { direction: 1 }), 'goal+=0.5')
      // The referee has seen enough.
      .addLabel('ref', 'goal+=1.9')
      .add(walk(referee, { to: 570, duration: 1.5, stepDuration: 0.2 }), 'ref')
      .add(face(referee, -1), 'ref')
      .add(emote(messi, 'neutral'), 'ref')
      .add(emote(referee, 'angry'), 'ref+=1.5')
      .add(emote(ronaldo, 'angry'), 'ref+=1.6')
      .add(showCard(referee, 'yellow', { duration: 2.6 }), 'ref+=1.6')
      .add(say(referee, this.cardLine, { voice: 'voices/referee-card', hold: 0.7 }), 'ref+=1.9')
      .add(face(messi, -1), '>')
      .add(emote(messi, 'cheeky'), '<')
      .add(say(messi, this.dinnerLine, { voice: 'voices/messi-dinner', hold: 1 }), '>+0.1')
      .add(sfx(() => synth.whistle(3, 0.3)), '<+0.6')
      .add(popIn(this.ending), '<+0.8');

    const length = tl.duration() + 1.2;
    tl.add(animateStadium(this.stadium, length), 0)
      .add(blinkRandomly(messi, length), 0)
      .add(blinkRandomly(referee, length), 0);
  }
}
