/**
 * Tribute Short: Messi's last night with the national team.
 * 21 years, the most caps of all time (208) and the record goal tally (126).
 */
import { gsap } from 'gsap';
import {
  blinkRandomly, cheer, crowdCheer, emote, flight, popIn, popOut, say, sfx, shoot, SHOT_CONTACT, walk, wave,
} from '@/animations';
import { synth } from '@/audio';
import { Ball, SpeechBubble, StatCounter, TextLabel, type Footballer, type Character } from '@/components';
import { Actor, Scene, seededRandom, type Timeline } from '@/engine';
import { createMessi } from '../../football/cast';
import { createParodyNotice } from '../../football/overlay';
import { animateStadium, createStadium, GROUND_Y, type Stadium } from '../../football/stadium';

const TITLE_FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const GOLD = '#ffd60a';
const SKY_BLUE = '#75c3ea';

export class FarewellScene extends Scene {
  readonly title = 'The Last Dance';

  private stadium!: Stadium;
  private messi!: Footballer;
  private ball!: Ball;
  private titleCard!: TextLabel;
  private years!: StatCounter;
  private caps!: StatCounter;
  private goals!: StatCounter;
  private records!: TextLabel;
  private thanks!: SpeechBubble;
  private gracias!: TextLabel;
  private summary!: TextLabel;
  private confetti!: Actor;

  build(): void {
    const { width, height } = this.stage;
    this.stadium = createStadium(width, height);
    this.messi = createMessi({ x: -150 });
    this.ball = new Ball({ x: 560, y: GROUND_Y, radius: 26 });
    this.thanks = new SpeechBubble({ text: 'Thank you, Argentina.\nIt was a dream.', fontSize: 40 });
    this.confetti = createConfetti(width);

    const hidden = { scale: 0, opacity: 0 };
    this.titleCard = new TextLabel({
      text: 'THE LAST DANCE', x: width / 2, y: 330, ...hidden,
      fontSize: 90, font: TITLE_FONT, weight: 400, color: GOLD, background: 'rgba(0,0,0,0.55)',
    });
    this.years = new StatCounter({ value: 21, label: 'YEARS', x: width / 2, y: 330, ...hidden });
    this.caps = new StatCounter({ value: 208, label: 'CAPS', x: 290, y: 620, width: 400, color: SKY_BLUE, ...hidden });
    this.goals = new StatCounter({ value: 126, label: 'GOALS', x: width - 290, y: 620, width: 400, ...hidden });
    this.records = new TextLabel({
      text: 'MOST CAPPED EVER · ALL-TIME TOP SCORER', x: width / 2, y: 830, ...hidden,
      fontSize: 38, font: TITLE_FONT, weight: 400, color: '#fff', background: 'rgba(20,60,110,0.85)',
    });
    this.gracias = new TextLabel({
      text: 'GRACIAS, LEO', x: width / 2, y: 400, ...hidden,
      fontSize: 120, font: TITLE_FONT, weight: 400, color: GOLD, background: 'rgba(0,0,0,0.55)',
    });
    this.summary = new TextLabel({
      text: '21 YEARS · 208 CAPS · 126 GOALS', x: width / 2, y: 560, ...hidden,
      fontSize: 44, font: TITLE_FONT, weight: 400, color: '#fff', background: 'rgba(20,60,110,0.85)',
    });

    this.add(...this.stadium.background, this.messi, this.ball, this.stadium.goal, this.thanks, this.confetti);
    this.overlay.add(
      this.titleCard, this.years, this.caps, this.goals, this.records, this.gracias, this.summary,
      createParodyNotice(width, height),
    );
  }

  animate(tl: Timeline): void {
    const { messi, ball, camera } = this;
    const { stands } = this.stadium;

    // Walk out under the lights.
    tl.add(sfx(() => synth.whistle(1, 0.4)), 0.2)
      .add(popIn(this.titleCard), 0.3)
      .add(popOut(this.titleCard), 2.6)
      .add(walk(messi, { to: 470, duration: 2.2 }), 0.4)

      // A few touches for old times' sake.
      .add(juggle(messi, ball, 4), 2.9)

      // The numbers.
      .addLabel('stats', 5.2)
      .add(sfx(synth.pop), 'stats')
      .add(popIn(this.years), 'stats')
      .add(this.years.countUp({ duration: 0.7 }), 'stats+=0.2')
      .add(sfx(synth.pop), 'stats+=0.8')
      .add(popIn(this.caps), 'stats+=0.8')
      .add(this.caps.countUp({ duration: 1.6 }), 'stats+=1')
      .add(sfx(synth.pop), 'stats+=1.8')
      .add(popIn(this.goals), 'stats+=1.8')
      .add(this.goals.countUp({ duration: 1.6 }), 'stats+=2')
      .add(popIn(this.records), 'stats+=3.7')
      .add(crowdCheer(stands, { duration: 2 }), 'stats+=3.7')
      .add(emote(messi, 'happy'), 'stats+=3.8')
      .add(popOut(this.years), 'stats+=6')
      .add(popOut(this.caps), 'stats+=6')
      .add(popOut(this.goals), 'stats+=6')
      .add(popOut(this.records), 'stats+=6')

      // A few words to the fans.
      .addLabel('speech', 'stats+=6.3')
      .add(emote(messi, 'neutral'), 'speech')
      .to(camera, { ...camera.focus(540, 1420, 1.3), duration: 0.6, ease: 'power2.out' }, 'speech')
      .add(say(messi, this.thanks, { voice: 'voices/messi-farewell', hold: 0.8 }), 'speech+=0.4')
      .add(emote(messi, 'happy'), '>-0.2')
      .add(wave(messi, { times: 3 }), '<')
      .add(crowdCheer(stands, { duration: 2.5 }), '<')
      .to(camera, { ...camera.reset(), duration: 0.8, ease: 'power2.inOut' }, '<+0.3')

      // One last kick – into the crowd.
      .addLabel('kick', '>+0.6')
      .add(shoot(messi, ball, { toX: 760, peak: 1000, land: 880, duration: 1.2, spin: 3, power: 1.2 }), 'kick')
      .to(ball, { scale: 0.35, duration: 1.2, ease: 'power1.in' }, `kick+=${SHOT_CONTACT}`)
      .to(ball, { opacity: 0, duration: 0.2 }, `kick+=${SHOT_CONTACT + 1.1}`)

      // Thank you, Leo.
      .addLabel('finale', `kick+=${SHOT_CONTACT + 1.2}`)
      .add(crowdCheer(stands, { duration: 3.5 }), 'finale')
      .add(cheer(messi, { duration: 3 }), 'finale')
      .add(fallConfetti(this.confetti), 'finale')
      .add(popIn(this.gracias), 'finale+=0.2')
      .add(popIn(this.summary), 'finale+=0.7')
      .add(sfx(() => synth.whistle(3, 0.3)), 'finale+=3.2');

    const length = tl.duration() + 0.8;
    tl.add(animateStadium(this.stadium, length), 0)
      .add(blinkRandomly(messi, length), 0);
  }
}

/** Keepy-uppies: each touch flicks the ball up off the right foot. */
function juggle(player: Character, ball: Ball, touches: number): Timeline {
  const tl = gsap.timeline();
  const step = 0.55;
  for (let i = 0; i < touches; i++) {
    const t = i * step;
    const last = i === touches - 1;
    tl.to(player.rightLeg, { rotation: -40, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' }, t)
      .add(sfx(() => synth.kick(0.3)), t + 0.1)
      .add(flight(ball, { dx: 0, from: i === 0 ? 0 : 30, peak: 230, land: last ? 0 : 30, duration: step - 0.05, spin: 0.6 }), t + 0.1);
  }
  return tl;
}

/** Sky-blue, white and gold paper strips, hidden above the screen until `fallConfetti()`. */
function createConfetti(width: number): Actor {
  const confetti = new Actor({ name: 'confetti', opacity: 0 });
  const random = seededRandom(10);
  for (let i = 0; i < 90; i++) {
    const piece = new Actor({ name: 'piece', x: random.range(0, width), y: random.range(-900, -40), rotation: random.range(0, 360) });
    piece.draw('rect', { x: -7, y: -4, width: 14, height: 8, rx: 2, fill: random.pick([SKY_BLUE, '#ffffff', GOLD]) });
    confetti.add(piece);
  }
  return confetti;
}

function fallConfetti(confetti: Actor, { duration = 4.5 } = {}): Timeline {
  const random = seededRandom(20);
  const tl = gsap.timeline().set(confetti, { opacity: 1, immediateRender: false }, 0);
  for (const piece of confetti.children) {
    tl.to(piece, {
      y: `+=${random.range(2000, 2500)}`, x: `+=${random.range(-120, 120)}`, rotation: `+=${random.range(360, 1080)}`,
      duration: random.range(duration * 0.7, duration), ease: 'none',
    }, random.range(0, 0.8));
  }
  return tl;
}
