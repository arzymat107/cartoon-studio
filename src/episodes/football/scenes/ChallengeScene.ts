import { blinkRandomly, face, popIn, popOut, say, sfx, walk } from '@/animations';
import { synth } from '@/audio';
import { Ball, SpeechBubble, TextLabel, type Footballer } from '@/components';
import { Scene, type Timeline } from '@/engine';
import { createMessi, createRonaldo } from '../cast';
import { createParodyNotice, createScoreboard } from '../overlay';
import { animateStadium, BALL_SPOT, createStadium, GROUND_Y, KICK_SPOT, type Stadium } from '../stadium';

export class ChallengeScene extends Scene {
  readonly title = 'The Challenge';

  private stadium!: Stadium;
  private messi!: Footballer;
  private ronaldo!: Footballer;
  private titleCard!: TextLabel;
  private challenge!: SpeechBubble;
  private okay!: SpeechBubble;

  build(): void {
    const { width, height } = this.stage;
    this.stadium = createStadium(width, height);
    this.messi = createMessi({ x: -200 });
    this.ronaldo = createRonaldo({ x: KICK_SPOT, scaleX: -1.72 });
    const ball = new Ball({ x: BALL_SPOT, y: GROUND_Y, radius: 26 });
    this.challenge = new SpeechBubble({ text: 'Free kick contest.\nLoser buys dinner!', fontSize: 40 });
    this.okay = new SpeechBubble({ text: 'Okay.', fontSize: 40 });
    this.titleCard = new TextLabel({
      text: 'FREE KICK BATTLE', x: width / 2, y: 330, scale: 0, opacity: 0,
      fontSize: 84, font: 'Impact, "Arial Black", system-ui, sans-serif', weight: 400,
      color: '#ffd60a', background: 'rgba(0,0,0,0.55)',
    });

    this.add(...this.stadium.background, this.messi, ball, this.ronaldo, this.stadium.goal, this.challenge, this.okay);
    this.overlay.add(createScoreboard(width), this.titleCard, createParodyNotice(width, height));
  }

  animate(tl: Timeline): void {
    const { messi, ronaldo } = this;

    tl.add(sfx(() => synth.whistle(1, 0.5)), 0.2)
      .add(popIn(this.titleCard), 0.3)
      .add(popOut(this.titleCard), 2.3)
      .add(walk(messi, { to: 200, duration: 2.2 }), 0.4)
      .add(face(ronaldo, -1), 0)
      .add(say(ronaldo, this.challenge, { voice: 'voices/ronaldo-challenge', hold: 0.8 }), 2.8)
      .add(say(messi, this.okay, { voice: 'voices/messi-okay', hold: 0.8 }), '>-0.4');

    const length = tl.duration() + 0.4;
    tl.add(animateStadium(this.stadium, length), 0)
      .add(blinkRandomly(messi, length), 0)
      .add(blinkRandomly(ronaldo, length), 0);
  }
}
