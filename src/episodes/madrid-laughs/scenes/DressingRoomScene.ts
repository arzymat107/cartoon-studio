/**
 * Back in the dressing room Rüdiger's phone buzzes: "FT: PSG 4–2 Barça". A beat of silence – then
 * Vinícius is on the floor, Bellingham wipes away a (fake) tear, Valverde sips his tea Fabián
 * Ruiz-style and Güler holds up a sign.
 */
import { blinkRandomly, emote, jump, melody, popIn, popOut, say, sfx } from '@/animations';
import { synth } from '@/audio';
import { Character, SpeechBubble, type Footballer } from '@/components';
import { Actor, Scene, type Timeline } from '@/engine';
import { createParodyNotice } from '../../football/overlay';
import { sip } from '../../psg-barca/acting';
import { teaCup } from '../../psg-barca/cast';
import { laugh, rollOnFloor, wipeTear } from '../acting';
import { groove, laughTrack, phoneBuzz, rimshot, roomTone } from '../sound';
import {
  createBellingham, createDressingRoom, createGuler, createNotification, createRudiger, createValverde, createVinicius,
  haha, phone, sign, tear,
} from '../cast';

/** Arm angles for holding the phone up in front, and the sign up high. */
const PHONE_ARM = -100;
const SIGN_ARM = -165;

export class DressingRoomScene extends Scene {
  readonly title = 'The Notification';

  private room!: Actor;
  private guler!: Footballer;
  private valverde!: Footballer;
  private rudiger!: Footballer;
  private bellingham!: Footballer;
  private vinicius!: Footballer;
  private phone!: Actor;
  private cup!: Actor;
  private sign!: Actor;
  private tear!: Actor;
  private laughs!: Actor[];
  private notification!: Actor;
  private elevenWins!: SpeechBubble;

  build(): void {
    const { width, height } = this.stage;
    this.room = createDressingRoom(width, height);

    this.guler = createGuler({ x: 200 });
    this.valverde = createValverde({ x: 375 });
    this.rudiger = createRudiger({ x: 570 });
    this.bellingham = createBellingham({ x: 790 });
    this.vinicius = createVinicius({ x: 970 });
    for (const p of [this.bellingham, this.vinicius]) p.scaleX = -Math.abs(p.scaleX);

    this.phone = phone();
    this.phone.rotation = Character.ARM_REST;
    this.rudiger.rightArm.add(this.phone);
    this.cup = teaCup();
    this.cup.rotation = Character.ARM_REST;
    this.valverde.rightArm.add(this.cup);
    this.sign = sign('PARIS 4\nBARÇA 2 🍵');
    this.sign.rotation = Character.ARM_REST;
    this.sign.opacity = 0;
    this.guler.rightArm.add(this.sign);
    this.tear = tear({ x: -15, y: -40 });
    this.bellingham.head.add(this.tear);

    this.laughs = [this.guler, this.valverde, this.rudiger, this.bellingham, this.vinicius].map((p, i) =>
      haha({ x: p.x + (i % 2 ? 30 : -30), y: 1020 + (i % 2) * 70, rotation: i % 2 ? 8 : -8, size: 58 }));
    this.notification = createNotification({ score: 'PSG 4–2 BARÇA', x: width / 2, y: 560 });
    this.elevenWins = new SpeechBubble({ text: 'Eleven wins…\ngone. 😢', fontSize: 46 });

    this.add(
      this.room, this.guler, this.valverde, this.rudiger, this.bellingham, this.vinicius, ...this.laughs, this.elevenWins,
    );
    this.overlay.add(this.notification, createParodyNotice(width, height));
  }

  animate(tl: Timeline): void {
    const { guler, valverde, rudiger, bellingham, vinicius, camera } = this;
    const squad = [guler, valverde, rudiger, bellingham, vinicius];

    // Buzz buzz. Rüdiger checks his phone; everyone leans in.
    tl.to(rudiger.rightArm, { rotation: PHONE_ARM, duration: 0.25, ease: 'back.out(1.6)' }, 0.1)
      .to(this.phone, { rotation: -PHONE_ARM, duration: 0.25, ease: 'back.out(1.6)' }, 0.1)
      .to(this.phone, { x: '+=3', duration: 0.04, yoyo: true, repeat: 11, ease: 'none' }, 0.3)
      .add(phoneBuzz(), 0.3)
      .to([guler, valverde, bellingham, vinicius].map((p) => p.torso), { rotation: 12, duration: 0.25 }, 0.4)
      .addLabel('ding', 0.8)
      .add(melody('E6 C6', { bpm: 600, wave: 'square', volume: 0.05 }), 'ding')
      .add(popIn(this.notification, { duration: 0.35 }), 'ding')
      .to(camera, { ...camera.focus(540, 1080, 1.15), duration: 0.4, ease: 'power2.out' }, 'ding');

    // Silence… then they lose it, and the groove kicks in.
    squad.forEach((p) => tl.add(emote(p, 'shocked'), 'ding+=0.2'));
    tl.to(squad.map((p) => p.torso), { rotation: 0, duration: 0.2 }, 'ding+=0.2')
      .addLabel('laugh', 'ding+=0.9');
    squad.forEach((p, i) => {
      tl.add(emote(p, 'happy'), 'laugh')
        .add(laugh(p, { duration: 1.6, voice: i % 2 === 0 }), `laugh+=${i * 0.05}`);
    });
    this.laughs.forEach((h, i) => {
      tl.add(popIn(h, { duration: 0.2 }), `laugh+=${0.05 + i * 0.08}`)
        .to(h, { y: '-=40', duration: 1.3, ease: 'none' }, `laugh+=${0.05 + i * 0.08}`)
        .add(popOut(h), `laugh+=${1.4 + i * 0.04}`);
    });
    tl.add(laughTrack(1.6), 'laugh')
      .to(camera, { ...camera.reset(), duration: 0.4, ease: 'power2.inOut' }, 'laugh+=0.3')
      .add(popOut(this.notification), 'laugh+=1.4')
      .to(rudiger.rightArm, { rotation: -Character.ARM_REST, duration: 0.3 }, 'laugh+=1.4')
      .to(this.phone, { rotation: Character.ARM_REST, duration: 0.3 }, 'laugh+=1.4')
      .add(rollOnFloor(vinicius, { kicks: 10 }), 'laugh+=0.3')
      .add(emote(vinicius, 'cheeky'), 'laugh+=0.5')

      // Bellingham, deeply moved – while Valverde does the Fabián Ruiz tea sip.
      .addLabel('tear', 'laugh+=1.5')
      .add(emote(bellingham, 'smug'), 'tear')
      .add(wipeTear(bellingham, this.tear, { duration: 1.6 }), 'tear')
      .add(say(bellingham, this.elevenWins, { voice: 'voices/bellingham-eleven-wins', hold: 0.3, offsetX: 30 }), 'tear+=0.2')
      .add(emote(valverde, 'smug'), 'tear+=0.9')
      .add(sip(valverde, this.cup), 'tear+=0.9')
      .add(sfx(() => synth.note(880, 0.12, 'sine', 0.08)), 'tear+=1.4')
      .add(rollOnFloor(vinicius, { undo: true }), 'tear+=1.6')

      // Güler's sign. Ba-dum-tss.
      .addLabel('sign', 'tear+=2')
      .set(this.sign, { opacity: 1, immediateRender: false }, 'sign')
      .add(emote(guler, 'cheeky'), 'sign')
      .to(guler.rightArm, { rotation: SIGN_ARM, duration: 0.3, ease: 'back.out(1.6)' }, 'sign')
      .to(this.sign, { rotation: -SIGN_ARM, duration: 0.3, ease: 'back.out(1.6)' }, 'sign')
      .add(rimshot(), 'sign+=0.2')
      .add(jump(guler, { height: 40, duration: 0.3, times: 2, sound: false }), 'sign+=0.3')
      .addLabel('again', 'sign+=0.6');
    squad.forEach((p, i) => {
      tl.add(emote(p, 'happy'), 'again')
        .add(laugh(p, { duration: 1.2, voice: i % 2 === 1 }), `again+=${i * 0.05}`);
    });
    tl.add(laughTrack(1.3), 'again')
      .add(jump(vinicius, { height: 60, duration: 0.4, times: 2 }), 'again+=0.1')
      .set({}, {}, 'again+=1.5');

    const length = tl.duration() + 0.2;
    tl.add(roomTone(length), 0)
      .add(groove(length - 1.7, { volume: 0.06 }), 'laugh');
    for (const char of squad) tl.add(blinkRandomly(char, length), 0);
  }
}

