/**
 * Rüdiger video-calls Barça "by accident". On the other end: ice packs and dizzy stars for Balde
 * and Martín, Joan García still reaching for Vitinha's volley, Cancelo with the empty tea cup, and
 * Yamal reminding everyone about his goal. "We know, Lamine. We know." Then Vinícius's grin fills
 * the screen, and Barça hang up.
 */
import { blinkRandomly, clip, emote, melody, popIn, say, sfx, talk, walk } from '@/animations';
import { synth } from '@/audio';
import { SpeechBubble, TextLabel, type Footballer } from '@/components';
import { Actor, Scene, type Timeline } from '@/engine';
import { createParodyNotice } from '../../football/overlay';
import { GROUND_Y } from '../../football/stadium';
import {
  BARCA_GARNET, createBalde, createCancelo, createJoanGarcia, createMartin, createYamal, dizzyStars, teaCup,
} from '../../psg-barca/cast';
import { laugh } from '../acting';
import { groove, laughTrack, rimshot, roomTone } from '../sound';
import {
  createBellingham, createDressingRoom, createGuler, createRudiger, createValverde, createVinicius, icePack, VideoCall,
} from '../cast';

const TITLE_FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const CALL = { x: 90, y: 230 };

export class VideoCallScene extends Scene {
  readonly title = 'Video Call';

  private call!: VideoCall;
  private balde!: Footballer;
  private martin!: Footballer;
  private garcia!: Footballer;
  private cancelo!: Footballer;
  private yamal!: Footballer;
  private stars!: Actor[];
  private madrid!: Footballer[];
  private bellingham!: Footballer;
  private vinicius!: Footballer;
  private calling!: TextLabel;
  private bubbles!: Record<'almost' | 'tea' | 'banger' | 'weKnow', SpeechBubble>;

  build(): void {
    const { width, height } = this.stage;
    const room = createDressingRoom(width, height);

    // The Barça end of the call, drawn at full size inside the shrunk call window.
    this.call = new VideoCall({ ...CALL, opacity: 0 });
    const barcaRoom = createDressingRoom(width, height, { tint: '#c8cfe0', lockers: BARCA_GARNET });
    this.balde = createBalde({ x: 180 });
    this.martin = createMartin({ x: 345 });
    this.garcia = createJoanGarcia({ x: 525 });
    this.cancelo = createCancelo({ x: 710 });
    this.yamal = createYamal({ x: 880 });
    for (const p of [this.cancelo, this.yamal]) p.scaleX = -Math.abs(p.scaleX);
    this.stars = [this.balde, this.martin].map((p) => {
      p.head.add(icePack({ y: -92 }));
      const ring = dizzyStars({ y: -112 });
      p.head.add(ring);
      return ring;
    });
    const cup = teaCup();
    // Holding it out in front: "this one!"
    cup.rotation = 55;
    this.cancelo.rightArm.add(cup);
    this.cancelo.rightArm.rotation = -55;

    this.bubbles = {
      almost: new SpeechBubble({ text: 'I almost had it…', fontSize: 50 }),
      tea: new SpeechBubble({ text: 'Who brings TEA\nto a football match?!', fontSize: 46 }),
      banger: new SpeechBubble({ text: 'I scored a banger,\nyou know. ✨', fontSize: 48 }),
      weKnow: new SpeechBubble({ text: 'We know, Lamine.\nWe know. 😇', fontSize: 44 }),
    };
    this.call.content.add(
      barcaRoom, this.balde, this.martin, this.garcia, this.cancelo, this.yamal,
      this.bubbles.almost, this.bubbles.tea, this.bubbles.banger,
    );

    // The Madrid end, in front of the screen.
    const rudiger = createRudiger({ x: 150 });
    const guler = createGuler({ x: 335 });
    this.bellingham = createBellingham({ x: 530 });
    const valverde = createValverde({ x: 730 });
    this.vinicius = createVinicius({ x: 930 });
    this.madrid = [rudiger, guler, this.bellingham, valverde, this.vinicius];
    for (const p of [valverde, this.vinicius]) p.scaleX = -Math.abs(p.scaleX);

    this.calling = new TextLabel({
      text: '📞 Calling Barça…', x: width / 2, y: 640, scale: 0, opacity: 0,
      fontSize: 56, font: TITLE_FONT, weight: 400, color: '#ffffff', background: 'rgba(21,25,43,0.9)',
    });

    this.add(room, this.call, ...this.madrid, this.bubbles.weKnow, this.calling);
    this.overlay.add(createParodyNotice(width, height));
  }

  animate(tl: Timeline): void {
    const { balde, martin, garcia, cancelo, yamal, bellingham, vinicius, madrid, bubbles, camera } = this;
    const others = madrid.filter((p) => p !== bellingham);

    // Ringing…
    madrid.forEach((p) => tl.add(emote(p, 'smug'), 0));
    tl.add(popIn(this.calling), 0.1)
      .add(melody('A5 F5 - A5 F5', { bpm: 480, wave: 'sine', volume: 0.08 }), 0.1)
      .to(this.calling, { opacity: 0, scale: 0, duration: 0.2 }, 0.7)
      .to(this.call, { opacity: 1, duration: 0.25 }, 0.7)
      .add(sfx(synth.pop), 0.7);

    // …and Barça pick up. Gloomy in there.
    for (const p of [balde, martin, garcia, cancelo]) tl.add(emote(p, 'shocked'), 0);
    tl.add(emote(yamal, 'angry'), 0)
      .to(this.stars, { opacity: 1, duration: 0.2 }, 0)
      .to(this.stars, { rotation: 360 * 6, duration: 10, ease: 'none' }, 0)
      .to(garcia.leftArm, { rotation: 165, duration: 0.3 }, 0)
      .to(garcia.torso, { rotation: -14, duration: 0.3 }, 0)
      .to(garcia.leftArm, { rotation: 150, duration: 0.4, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0.3)
      .add(emote(garcia, 'neutral'), 0.8)
      .add(say(garcia, bubbles.almost, { voice: 'voices/garcia-almost', hold: 0.3, offsetX: 40 }), 0.8)

      // Cancelo, still holding the cup from the fourth goal.
      .addLabel('tea', 2.3)
      .add(emote(cancelo, 'angry'), 'tea')
      .to(cancelo.rightArm, { rotation: -75, duration: 0.25, yoyo: true, repeat: 3 }, 'tea+=0.2')
      .add(say(cancelo, bubbles.tea, { voice: 'voices/cancelo-tea', hold: 0.3, offsetX: -60 }), 'tea')
      .to(others.map((p) => p.torso), { rotation: 8, duration: 0.15, yoyo: true, repeat: 5 }, 'tea+=1.2')
      .add(laughTrack(0.9), 'tea+=1.2')

      // Yamal leans right into the camera.
      .addLabel('banger', 'tea+=2.1')
      .add(emote(yamal, 'smug'), 'banger')
      .to(yamal, { x: 640, y: GROUND_Y + 330, scaleX: -2.1, scaleY: 2.1, duration: 0.4, ease: 'back.out(1.4)' }, 'banger')
      .add(sfx(synth.whoosh), 'banger')
      .add(say(yamal, bubbles.banger, { voice: 'voices/yamal-banger', hold: 0.3, offsetX: -80 }), 'banger+=0.4')

      // Madrid, all together, sweetly.
      .addLabel('weKnow', 'banger+=2');
    madrid.forEach((p) => tl.add(emote(p, 'happy'), 'weKnow'));
    tl.add(say(bellingham, bubbles.weKnow, { voice: 'voices/madrid-we-know', hold: 0.4 }), 'weKnow');
    others.forEach((p) => tl.add(talk(p, { duration: 1.2, voice: false }), 'weKnow+=0.1'));
    tl.to(madrid.map((p) => p.head), { rotation: 10, duration: 0.3, yoyo: true, repeat: 1 }, 'weKnow+=0.3')
      .add(emote(yamal, 'angry'), 'weKnow+=0.6')
      .addLabel('laugh', 'weKnow+=1.5');
    madrid.forEach((p, i) => tl.add(laugh(p, { duration: 1.2, voice: i % 2 === 0 }), `laugh+=${i * 0.05}`));
    tl.add(laughTrack(1.3), 'laugh');

    // Vinícius pushes to the front: his grin fills the screen.
    const faceY = GROUND_Y - vinicius.height * Math.abs(vinicius.scaleY) * 0.82;
    tl.addLabel('grin', 'laugh+=0.6')
      .add(walk(vinicius, { to: 560, duration: 0.4, stepDuration: 0.1 }), 'grin')
      .add(emote(vinicius, 'cheeky'), 'grin+=0.4')
      .to(camera, { ...camera.focus(560, faceY, 3.6), duration: 0.35, ease: 'power3.in' }, 'grin+=0.4')
      .add(sfx(synth.whoosh), 'grin+=0.4')
      .add(sfx(synth.boing), 'grin+=0.75')
      .add(clip('laughs/vinicius-taunt', { volume: 0.8 }), 'grin+=0.8')
      .to(vinicius.head, { rotation: 8, duration: 0.12, yoyo: true, repeat: 5 }, 'grin+=0.75')

      // Click. Barça hung up.
      .addLabel('hangUp', 'grin+=1.6')
      .to(camera, { ...camera.reset(), duration: 0.35, ease: 'power2.out' }, 'hangUp')
      .add(melody('E5 C5:2', { bpm: 300, wave: 'square', volume: 0.06 }), 'hangUp+=0.3')
      .to(this.call.content, { opacity: 0, duration: 0.2 }, 'hangUp+=0.3')
      .add(popIn(this.call.ended), 'hangUp+=0.4')
      .add(emote(vinicius, 'happy'), 'hangUp+=0.4')
      .add(laugh(vinicius, { duration: 1 }), 'hangUp+=0.5')
      .add(rimshot(), 'hangUp+=0.5')
      .set({}, {}, 'hangUp+=1.5');

    const length = tl.duration() + 0.2;
    tl.add(roomTone(length), 0)
      .add(groove(length, { volume: 0.05, progression: ['Am', 'F', 'C', 'G'] }), 0);
    for (const char of [...madrid, balde, martin, garcia, cancelo, yamal]) tl.add(blinkRandomly(char, length), 0);
  }
}
