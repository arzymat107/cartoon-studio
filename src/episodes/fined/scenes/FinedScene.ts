/**
 * News parody: Ronaldo begs the disciplinary council to punish him, hands in a 2,000-word
 * statement, gets a 30-day ban and a £215 fine – and earns it back in 39 seconds while he waits.
 */
import { gsap } from 'gsap';
import { blinkRandomly, emote, face, jump, melody, popIn, popOut, say, sfx, walk } from '@/animations';
import { synth } from '@/audio';
import { Character, SpeechBubble, StatCounter, TextLabel, type Footballer } from '@/components';
import { Actor, Scene, type Timeline } from '@/engine';
import { createRonaldo } from '../../football/cast';
import { createParodyNotice } from '../../football/overlay';
import { GROUND_Y } from '../../football/stadium';
import { BENCH_TOP, coin, createBench, createCourtroom, createJudge, createStatement, type Clock } from '../cast';

const TITLE_FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const JUDGE_X = 290;
const RONALDO_X = 790;
/** Where Ronaldo stands to hand the statement to the judge. */
const HANDOVER_X = 600;
const PILE_X = 600;
const COINS = 15;
/** Real seconds the 39 seconds take on screen (fast-forward). */
const FAST_FORWARD = 3.9;

export class FinedScene extends Scene {
  readonly title = 'Paid in 39 Seconds';

  private ronaldo!: Footballer;
  private judge!: Character;
  private clock!: Clock;
  /** The statement in Ronaldo's hand, and the same statement once it is on the bench. */
  private handStatement!: Actor;
  private benchStatement!: Actor;
  private pile!: Actor;
  private coins!: Actor[];
  private bang!: TextLabel;
  private location!: TextLabel;
  private fastForward!: TextLabel;
  private salary!: TextLabel;
  private stopwatch!: StatCounter;
  private earned!: StatCounter;
  private titleCard!: TextLabel;
  private bubbles!: Record<'punish' | 'statement' | 'fine' | 'seconds' | 'change' | 'tip', SpeechBubble>;

  build(): void {
    const { width, height } = this.stage;
    const room = createCourtroom(width, height);
    this.clock = room.clock;

    this.judge = createJudge({ x: JUDGE_X });
    this.ronaldo = createRonaldo({ x: 1350 });
    // Ronaldo faces left the whole time, so the paper is mirrored back to keep its text readable.
    this.handStatement = createStatement({ y: 64, scaleX: -0.55, scaleY: 0.55, rotation: Character.ARM_REST, opacity: 0 });
    this.ronaldo.rightArm.add(this.handStatement);
    this.benchStatement = createStatement({ x: JUDGE_X + 125, y: BENCH_TOP - 14, scale: 0.65, rotation: -4, opacity: 0 });
    this.pile = new Actor({ name: 'pile', x: PILE_X, y: GROUND_Y });
    this.coins = Array.from({ length: COINS }, (_, i) => coin(((i * 7) % 5) - 2, -i * 11));
    this.pile.add(...this.coins);
    this.bang = new TextLabel({
      text: 'BANG!', x: JUDGE_X + 150, y: BENCH_TOP - 120, scale: 0, opacity: 0, rotation: -10,
      fontSize: 64, font: TITLE_FONT, weight: 400, color: '#d62828', background: '#ffd60a',
    });

    this.bubbles = {
      punish: new SpeechBubble({ text: 'Punish me!\nNo leniency!', fontSize: 44 }),
      statement: new SpeechBubble({ text: 'My statement.\n2,000 words.', fontSize: 40 }),
      fine: new SpeechBubble({ text: '30-day ban and\na £215 FINE!', fontSize: 42 }),
      seconds: new SpeechBubble({ text: '£215? Give me\n39 seconds.', fontSize: 44 }),
      change: new SpeechBubble({ text: 'Done. Keep\nthe change.', fontSize: 44 }),
      tip: new SpeechBubble({ text: 'Was that a punishment…\nor a tip?', fontSize: 38 }),
    };

    this.location = new TextLabel({
      text: '⚖️ PORTUGUESE FA · DISCIPLINARY HEARING', x: width / 2, y: 420, scale: 0, opacity: 0,
      fontSize: 36, font: TITLE_FONT, weight: 400, color: '#fff', background: 'rgba(0,0,0,0.6)',
    });
    this.fastForward = new TextLabel({
      text: '▶▶ FAST FORWARD', x: width / 2, y: 410, scale: 0, opacity: 0,
      fontSize: 54, font: TITLE_FONT, weight: 400, color: '#fff', background: 'rgba(214,40,40,0.92)',
    });
    this.salary = new TextLabel({
      text: 'SALARY: £488,000 A DAY', x: width / 2, y: 520, scale: 0, opacity: 0,
      fontSize: 40, font: TITLE_FONT, weight: 400, color: '#ffd60a', background: 'rgba(10,14,30,0.82)',
    });
    this.stopwatch = new StatCounter({ value: 39, label: 'SECONDS', x: 290, y: 760, scale: 0, opacity: 0, width: 380 });
    this.earned = new StatCounter({ value: 215, label: '£ EARNED', x: 790, y: 760, scale: 0, opacity: 0, width: 380, color: '#7ee081' });
    this.titleCard = new TextLabel({
      text: 'PAID IN 39 SECONDS', x: width / 2, y: 480, scale: 0, opacity: 0,
      fontSize: 96, font: TITLE_FONT, weight: 400, color: '#ffd60a', background: 'rgba(200,16,46,0.92)',
    });

    this.add(
      ...room.layers, this.judge, createBench({ x: JUDGE_X }), this.benchStatement, this.bang,
      this.pile, this.ronaldo, ...Object.values(this.bubbles),
    );
    this.overlay.add(
      this.location, this.fastForward, this.salary, this.stopwatch, this.earned, this.titleCard,
      createParodyNotice(width, height),
    );
  }

  animate(tl: Timeline): void {
    const { ronaldo, judge, camera, bubbles, handStatement, benchStatement } = this;

    // Ronaldo marches in and demands a punishment.
    tl.add(popIn(this.location), 0.3)
      .add(popOut(this.location), 3.2)
      .add(walk(ronaldo, { to: RONALDO_X, duration: 1.6, stepDuration: 0.2 }), 0.3)
      .addLabel('punish', 2.1)
      .add(emote(ronaldo, 'angry'), 'punish')
      .add(say(ronaldo, bubbles.punish, { voice: 'voices/ronaldo-punish-me', hold: 0.5, offsetX: -40 }), 'punish')
      .add(jump(ronaldo, { height: 40, duration: 0.35 }), 'punish+=0.5')

      // …and hands the council a very, very thick statement.
      .addLabel('statement', 'punish+=2.3')
      .add(emote(ronaldo, 'smug'), 'statement')
      .set(handStatement, { opacity: 1, immediateRender: false }, 'statement')
      .add(sfx(synth.pop), 'statement')
      .add(walk(ronaldo, { to: HANDOVER_X, duration: 0.8, stepDuration: 0.2 }), 'statement+=0.2')
      .add(say(ronaldo, bubbles.statement, { voice: 'voices/ronaldo-statement', hold: 0.3, offsetX: -40 }), 'statement+=1')
      .to(ronaldo.rightArm, { rotation: -80, duration: 0.3, ease: 'back.out(1.6)' }, 'statement+=1.6')
      .to(handStatement, { rotation: 80, duration: 0.3, ease: 'back.out(1.6)' }, 'statement+=1.6')
      .set(handStatement, { opacity: 0, immediateRender: false }, 'statement+=1.95')
      .fromTo(benchStatement, { y: BENCH_TOP - 90, opacity: 1 }, {
        y: BENCH_TOP - 14, opacity: 1, duration: 0.15, ease: 'power2.in', immediateRender: false,
      }, 'statement+=1.95')
      .add(sfx(() => synth.kick(0.8)), 'statement+=2.1')
      .add(emote(judge, 'shocked'), 'statement+=2.1')
      .to(judge.head, { rotation: -10, duration: 0.15, yoyo: true, repeat: 1, repeatDelay: 0.6 }, 'statement+=2.1')
      .to(ronaldo.rightArm, { rotation: -Character.ARM_REST, duration: 0.25 }, 'statement+=2.4')
      .add(walk(ronaldo, { to: RONALDO_X, duration: 0.8, stepDuration: 0.2 }), 'statement+=3.6')
      .add(face(ronaldo, -1), 'statement+=4.5')

      // The verdict.
      .addLabel('fine', 'statement+=4.6')
      .add(emote(judge, 'angry'), 'fine')
      .add(gavel(judge, this.bang), 'fine')
      .add(say(judge, bubbles.fine, { voice: 'voices/judge-fine', hold: 0.5, offsetX: 60 }), 'fine+=0.7')
      .add(emote(ronaldo, 'shocked'), 'fine+=2.6')

      // £215? Pocket money.
      .addLabel('seconds', 'fine+=4.9')
      .add(emote(ronaldo, 'smug'), 'seconds')
      .add(say(ronaldo, bubbles.seconds, { voice: 'voices/ronaldo-39-seconds', hold: 0.4, offsetX: -40 }), 'seconds')
      .add(emote(judge, 'neutral'), 'seconds')

      // Fast-forward through the 39 seconds while the money piles up.
      .addLabel('ff', 'seconds+=3.2')
      .add(sfx(synth.whoosh), 'ff')
      .add(popIn(this.fastForward), 'ff')
      .add(popIn(this.salary), 'ff+=0.15')
      .add(popIn(this.stopwatch), 'ff+=0.2')
      .add(popIn(this.earned), 'ff+=0.3')
      .add(this.stopwatch.countUp({ duration: FAST_FORWARD, ease: 'none' }), 'ff+=0.5')
      .add(this.earned.countUp({ duration: FAST_FORWARD, ease: 'none' }), 'ff+=0.5')
      .to(this.clock.secondHand, { rotation: 39 * 6, duration: FAST_FORWARD, ease: 'none' }, 'ff+=0.5')
      .add(waitImpatiently(ronaldo), 'ff+=0.5')
      .add(emote(judge, 'shocked'), `ff+=${FAST_FORWARD - 0.5}`);
    for (let i = 0; i < Math.round(FAST_FORWARD / 0.25); i++) {
      tl.add(sfx(() => synth.note(2200, 0.03, 'square', 0.04)), `ff+=${0.5 + i * 0.25}`);
    }
    this.coins.forEach((c, i) => {
      const t = 0.5 + ((i + 1) / COINS) * FAST_FORWARD - 0.2;
      tl.fromTo(c, { y: c.y - 700, opacity: 1 }, { y: c.y, opacity: 1, duration: 0.2, ease: 'power2.in', immediateRender: false }, `ff+=${t}`)
        .add(sfx(() => synth.note(1300 + i * 45, 0.08, 'sine', 0.1)), `ff+=${t + 0.2}`);
    });

    // Ding! Slide the cash over and leave.
    tl.addLabel('done', `ff+=${FAST_FORWARD + 0.6}`)
      .add(melody('E6 G6 C7:2', { bpm: 600, volume: 0.1 }), 'done')
      .to([this.stopwatch, this.earned], { scale: 1.15, duration: 0.12, yoyo: true, repeat: 1 }, 'done')
      .add(popOut(this.fastForward), 'done+=0.9')
      .add(popOut(this.salary), 'done+=0.9')
      .add(popOut(this.stopwatch), 'done+=1')
      .add(popOut(this.earned), 'done+=1')
      .add(emote(ronaldo, 'happy'), 'done')
      .to(ronaldo.rightArm, { rotation: -80, duration: 0.2, yoyo: true, repeat: 1, repeatDelay: 0.3 }, 'done+=0.2')
      .add(sfx(synth.whoosh), 'done+=0.3')
      .to(this.pile, { x: JUDGE_X + 200, duration: 0.5, ease: 'power2.out' }, 'done+=0.3')
      .to(this.pile, { y: BENCH_TOP - 14, duration: 0.5, ease: 'back.out(1.6)' }, 'done+=0.3')
      .add(say(ronaldo, bubbles.change, { voice: 'voices/ronaldo-keep-change', hold: 0.5, offsetX: -40 }), 'done+=0.5')
      .add(walk(ronaldo, { to: 1400, duration: 1.4, stepDuration: 0.18 }), 'done+=2.2')

      // The judge, alone with a pile of coins.
      .addLabel('tip', 'done+=2.4')
      .to(camera, { ...camera.focus(JUDGE_X + 120, 1200, 1.35), duration: 0.6, ease: 'power2.out' }, 'tip')
      .add(say(judge, bubbles.tip, { voice: 'voices/judge-tip', hold: 0.6, offsetX: 90 }), 'tip+=0.5')
      .to(camera, { ...camera.reset(), duration: 0.7, ease: 'power2.inOut' }, '>')

      // Punchline card.
      .addLabel('end', '>')
      .add(sfx(synth.pop), 'end')
      .add(popIn(this.titleCard), 'end')
      .set({}, {}, 'end+=2.5');

    const length = tl.duration() + 0.2;
    tl.add(blinkRandomly(ronaldo, length), 0)
      .add(blinkRandomly(judge, length), 0);
  }
}

/** Raise the gavel twice and slam it on the bench. */
function gavel(judge: Character, bang: Actor): Timeline {
  const tl = gsap.timeline();
  for (const t of [0, 0.4]) {
    tl.to(judge.rightArm, { rotation: -160, duration: 0.15, ease: 'power2.out' }, t)
      .to(judge.rightArm, { rotation: -62, duration: 0.12, ease: 'power3.in' }, t + 0.15)
      .add(sfx(() => synth.kick(1.2)), t + 0.27);
  }
  return tl
    .add(popIn(bang), 0.27)
    .to(bang, { scale: 1.2, duration: 0.1, yoyo: true, repeat: 1 }, 0.67)
    .add(popOut(bang), 1.2)
    .to(judge.rightArm, { rotation: -Character.ARM_REST, duration: 0.3 }, 1.1);
}

/** Check the watch, tap a foot, yawn. Lasts about FAST_FORWARD seconds. */
function waitImpatiently(char: Character): Timeline {
  return gsap.timeline()
    .to(char.leftArm, { rotation: 125, duration: 0.25, ease: 'back.out(2)' }, 0)
    .to(char.head, { rotation: 14, duration: 0.25 }, 0)
    .to(char.leftArm, { rotation: Character.ARM_REST, duration: 0.25 }, 1.1)
    .to(char.head, { rotation: 0, duration: 0.25 }, 1.1)
    .to(char.rightLeg, { rotation: -14, duration: 0.12, yoyo: true, repeat: 7, ease: 'sine.inOut' }, 0.3)
    .add(emote(char, 'shocked'), 1.6)
    .to(char.rightArm, { rotation: -150, duration: 0.25 }, 1.6)
    .to(char.torso, { rotation: -6, duration: 0.4, yoyo: true, repeat: 1 }, 1.6)
    .to(char.rightArm, { rotation: -Character.ARM_REST, duration: 0.25 }, 2.5)
    .add(emote(char, 'smug'), 2.5)
    .to(char.leftArm, { rotation: 125, duration: 0.25, ease: 'back.out(2)' }, 2.9)
    .to(char.head, { rotation: 14, duration: 0.25 }, 2.9)
    .to(char.leftArm, { rotation: Character.ARM_REST, duration: 0.25 }, 3.7)
    .to(char.head, { rotation: 0, duration: 0.25 }, 3.7);
}
