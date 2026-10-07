import {
  blinkRandomly, bounce, crowdGroan, emote, face, flight, handsOnHead, say, sfx, shoot, SHOT_CONTACT, walk,
} from '@/animations';
import { synth } from '@/audio';
import { Ball, SpeechBubble, type Footballer } from '@/components';
import { Scene, type Timeline } from '@/engine';
import { createMessi, createRonaldo } from '../cast';
import { createParodyNotice, createScoreboard } from '../overlay';
import { animateStadium, BALL_SPOT, createStadium, GROUND_Y, KICK_SPOT, type Stadium } from '../stadium';

export class PowerShotScene extends Scene {
  readonly title = 'Power Shot';

  private stadium!: Stadium;
  private messi!: Footballer;
  private ronaldo!: Footballer;
  private ball!: Ball;
  private complaint!: SpeechBubble;

  build(): void {
    const { width, height } = this.stage;
    this.stadium = createStadium(width, height);
    this.messi = createMessi({ x: 150 });
    this.ronaldo = createRonaldo({ x: KICK_SPOT });
    this.ball = new Ball({ x: BALL_SPOT, y: GROUND_Y, radius: 26 });
    this.complaint = new SpeechBubble({ text: 'Who moved\nthe crossbar?!', fontSize: 40 });

    this.add(...this.stadium.background, this.messi, this.ronaldo, this.ball, this.stadium.goal, this.complaint);
    this.overlay.add(createScoreboard(width), createParodyNotice(width, height));
  }

  animate(tl: Timeline): void {
    const { messi, ronaldo, ball, camera } = this;
    const goal = this.stadium.goal;
    const hitHeight = goal.height - ball.radius;

    // Dramatic run-up: walk back, turn, pause… then charge.
    tl.add(walk(ronaldo, { to: 250, duration: 1.2 }), 0.3)
      .add(face(ronaldo, 1), '+=0.3')
      .to(ronaldo.torso, { y: -78, duration: 0.25, yoyo: true, repeat: 1 }, '+=0.3')
      .add(emote(ronaldo, 'angry'), '<')
      .addLabel('runup', '+=0.4')
      .add(walk(ronaldo, { to: KICK_SPOT, duration: 0.55, stepDuration: 0.14 }), 'runup')
      .addLabel('shot')
      .to(camera, { ...camera.focus(640, 1350, 1.25), duration: 0.5, ease: 'power2.out' }, 'shot')
      .add(shoot(ronaldo, ball, { toX: goal.x - 4, peak: hitHeight + 20, land: hitHeight, duration: 0.42, spin: 2, power: 1.5 }), 'shot')
      // Off the crossbar, back out, bouncing away.
      .addLabel('crossbar', `shot+=${SHOT_CONTACT + 0.42}`)
      .add(sfx(synth.clang), 'crossbar')
      .add(flight(ball, { dx: -330, from: hitHeight, peak: hitHeight + 90, duration: 1, spin: -2 }), 'crossbar')
      .add(bounce(ball, { dx: -140, height: 90, times: 3, duration: 0.5 }))
      .add(crowdGroan(this.stadium.stands), 'crossbar+=0.3')
      .to(camera, { ...camera.reset(), duration: 0.8, ease: 'power2.inOut' }, 'crossbar+=0.6')
      .add(emote(ronaldo, 'shocked'), 'crossbar+=0.3')
      .add(handsOnHead(ronaldo, { duration: 1.6 }), 'crossbar+=0.3')
      .add(emote(messi, 'cheeky'), 'crossbar+=0.8')
      .add(emote(ronaldo, 'angry'), 'crossbar+=1.9')
      .add(say(ronaldo, this.complaint, { voice: 'voices/ronaldo-crossbar', hold: 0.9 }), 'crossbar+=1.9');

    const length = tl.duration() + 0.3;
    tl.add(animateStadium(this.stadium, length), 0)
      .add(blinkRandomly(messi, length), 0)
      .add(blinkRandomly(ronaldo, length), 0);
  }
}
