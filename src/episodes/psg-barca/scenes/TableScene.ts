/**
 * Full time: Barça's 11-win streak gets a red cross, PSG climb above them into 1st and the
 * captain gets a crown. Yamal sulks… then juggles again: "Next time!"
 */
import {
  blinkRandomly, cheer, crowdCheer, emote, jump, juggle, melody, popIn, popOut, say, sfx,
} from '@/animations';
import { synth } from '@/audio';
import { Ball, SpeechBubble, TextLabel, type Footballer } from '@/components';
import { Actor, Scene, type Timeline } from '@/engine';
import { createParodyNotice } from '../../football/overlay';
import { animateStadium, createStadium, GROUND_Y, type Stadium } from '../../football/stadium';
import { shake } from '../acting';
import {
  BARCA_BLUE, BARCA_GARNET, createBallAura, createMarquinhos, createTableScreen, createYamal, FAN_SHIRTS, PSG_NAVY,
  PSG_RED, StreakBoard, TABLE_ROW_Y, tableRow,
} from '../cast';

const TITLE_FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const WINS = 11;
const SCREEN = { x: 540, y: 640, width: 900 };
const ROW_X = SCREEN.x - SCREEN.width / 2 + 120;

export class TableScene extends Scene {
  readonly title = 'Top of the Table';

  private stadium!: Stadium;
  private yamal!: Footballer;
  private captain!: Footballer;
  private ball!: Ball;
  private aura!: Actor;
  private streak!: StreakBoard;
  private screen!: Actor;
  private psgRow!: Actor;
  private barcaRow!: Actor;
  private otherRows!: Actor[];
  private crown!: TextLabel;
  private nextTime!: SpeechBubble;
  private titleCard!: TextLabel;

  build(): void {
    const { width, height } = this.stage;
    this.stadium = createStadium(width, height, { shirts: FAN_SHIRTS });

    this.streak = new StreakBoard({ wins: WINS, x: width / 2, y: 640 });
    for (const tick of this.streak.ticks) Object.assign(tick, { scale: 1, opacity: 1 });

    this.screen = createTableScreen({ x: SCREEN.x, y: SCREEN.y, width: SCREEN.width, scale: 0, opacity: 0 });
    const row = (i: number, name: string, colors: [string, string]) =>
      tableRow({ name, colors, width: SCREEN.width - 160, x: ROW_X, y: SCREEN.y + TABLE_ROW_Y[i], opacity: 0 });
    this.barcaRow = row(0, 'BARÇA', [BARCA_BLUE, BARCA_GARNET]);
    this.psgRow = row(1, 'PSG', [PSG_NAVY, PSG_RED]);
    this.otherRows = [row(2, '· · ·', ['#9aa4b2', '#c9d0da']), row(3, '· · ·', ['#9aa4b2', '#c9d0da'])];

    this.yamal = createYamal({ x: 250 });
    this.captain = createMarquinhos({ x: 820 });
    this.captain.scaleX = -Math.abs(this.captain.scaleX);
    this.ball = new Ball({ x: 330, y: GROUND_Y, radius: 22 });
    this.aura = createBallAura(this.ball.radius);
    this.ball.body.add(this.aura);
    this.crown = new TextLabel({ text: '👑', x: this.captain.x + 6, y: -200, fontSize: 120 });
    this.nextTime = new SpeechBubble({ text: 'Next time! ✨', fontSize: 50 });
    this.titleCard = new TextLabel({
      text: '1st: PSG 👑', x: width / 2, y: 240, scale: 0, opacity: 0,
      fontSize: 110, font: TITLE_FONT, weight: 400, color: '#ffffff', background: 'rgba(11,31,75,0.95)',
    });

    this.add(
      ...this.stadium.background, this.streak, this.screen, ...this.otherRows, this.barcaRow, this.psgRow,
      this.yamal, this.captain, this.crown, this.ball, this.nextTime,
    );
    this.overlay.add(this.titleCard, createParodyNotice(width, height));
  }

  animate(tl: Timeline): void {
    const { yamal, captain, ball, camera, streak } = this;
    const crownY = GROUND_Y - captain.height * Math.abs(captain.scaleY) + 20;

    // The 11-game winning run ends with a red cross; the ticks fall off.
    tl.add(emote(yamal, 'shocked'), 0)
      .add(emote(captain, 'smug'), 0)
      .addLabel('streak', 0.6)
      .add(popIn(streak.cross, { scale: 1.3, duration: 0.25 }), 'streak')
      .to(streak.cross, { rotation: 0, duration: 0.25 }, 'streak')
      .add(sfx(() => synth.kick(1.8)), 'streak+=0.15')
      .add(sfx(synth.clang), 'streak+=0.15')
      .add(shake(streak, { amount: 10, times: 3 }), 'streak+=0.15');
    streak.ticks.forEach((tick, i) => {
      tl.to(tick, {
        y: 1100 + i * 20, rotation: (i % 2 ? 1 : -1) * (90 + i * 15), opacity: 0, duration: 0.9, ease: 'power2.in',
      }, `streak+=${0.5 + (streak.ticks.length - 1 - i) * 0.05}`);
    });
    tl.add(sfx(() => synth.groan(1.4)), 'streak+=0.5')
      .add(popOut(streak), 'streak+=2');

    // The table, Barça on top…
    tl.addLabel('table', 'streak+=2.2')
      .add(popIn(this.screen), 'table')
      .add(sfx(synth.pop), 'table');
    [this.barcaRow, this.psgRow, ...this.otherRows].forEach((r, i) => tl.to(r, { opacity: 1, duration: 0.25 }, `table+=${0.3 + i * 0.12}`));

    // …until PSG climb past them.
    tl.addLabel('climb', 'table+=1.2')
      .add(sfx(synth.whoosh), 'climb')
      .to(this.psgRow, { x: ROW_X - 30, duration: 0.2 }, 'climb')
      .to(this.psgRow, { y: SCREEN.y + TABLE_ROW_Y[0], duration: 0.5, ease: 'back.out(1.6)' }, 'climb+=0.15')
      .to(this.barcaRow, { y: SCREEN.y + TABLE_ROW_Y[1], duration: 0.5, ease: 'power2.inOut' }, 'climb+=0.15')
      .to(this.psgRow, { x: ROW_X, duration: 0.2 }, 'climb+=0.65')

      // The captain celebrates and is crowned.
      .add(emote(captain, 'happy'), 'climb+=0.7')
      .add(cheer(captain, { duration: 1.4 }), 'climb+=0.7')
      .add(jump(captain, { height: 70, duration: 0.5, times: 2 }), 'climb+=0.7')
      .add(shake(camera), 'climb+=1.2')
      .add(shake(camera), 'climb+=1.7')
      .add(crowdCheer(this.stadium.stands, { duration: 2.2 }), 'climb+=0.7')
      .to(this.crown, { y: crownY, duration: 0.45, ease: 'bounce.out' }, 'climb+=2.1')
      .add(melody('C6 E6 G6 C7:2', { bpm: 480, volume: 0.09 }), 'climb+=2.3')
      .add(emote(captain, 'smug'), 'climb+=2.4')

      // Yamal sulks… wah-wah.
      .addLabel('sulk', 'climb+=2.4')
      .add(emote(yamal, 'angry'), 'sulk')
      .to(yamal.head, { rotation: 16, duration: 0.4 }, 'sulk')
      .to(yamal.torso, { rotation: 8, duration: 0.4 }, 'sulk')
      .add(melody('G4 F#4 F4 E4:3', { bpm: 170, wave: 'sawtooth', volume: 0.06 }), 'sulk+=0.1')

      // …then the magic comes back.
      .addLabel('again', 'sulk+=2.2')
      .to(yamal.head, { rotation: 0, duration: 0.3 }, 'again')
      .to(yamal.torso, { rotation: 0, duration: 0.3 }, 'again')
      .add(emote(yamal, 'cheeky'), 'again+=0.2')
      .to(this.aura, { opacity: 1, duration: 0.3 }, 'again+=0.2')
      .add(juggle(yamal, ball, { touches: 3, step: 0.45, height: 200 }), 'again+=0.3')
      .add(emote(yamal, 'smug'), 'again+=1.7')
      .to(yamal.rightArm, { rotation: -95, duration: 0.25, ease: 'back.out(2)' }, 'again+=1.8')
      .add(say(yamal, this.nextTime, { voice: 'voices/yamal-next-time', hold: 0.6, offsetX: 40 }), 'again+=1.8')
      .add(emote(captain, 'shocked'), 'again+=2.2')
      .to(yamal.rightArm, { rotation: -12, duration: 0.25 }, 'again+=3.2')

      // Punchline card.
      .addLabel('end', 'again+=3.3')
      .add(sfx(synth.pop), 'end')
      .add(popIn(this.titleCard), 'end')
      .set({}, {}, 'end+=2.5');

    const length = tl.duration() + 0.2;
    tl.add(animateStadium(this.stadium, length), 0)
      .add(blinkRandomly(yamal, length), 0)
      .add(blinkRandomly(captain, length), 0);
  }
}
