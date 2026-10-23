/**
 * The vibes table: Madrid climb past Barça, who slide down… and off the screen, to a sad trombone.
 * Mbappé thanks his old club ("Merci, mes amis"), the squad cracks up, and the Clásico is coming.
 */
import { blinkRandomly, emote, jump, melody, popIn, say, sfx, walk } from '@/animations';
import { synth } from '@/audio';
import { SpeechBubble, TextLabel, type Footballer } from '@/components';
import { Actor, Scene, type Timeline } from '@/engine';
import { createParodyNotice } from '../../football/overlay';
import { GROUND_Y } from '../../football/stadium';
import { shake } from '../../psg-barca/acting';
import {
  BARCA_BLUE, BARCA_GARNET, createTableScreen, PSG_NAVY, PSG_RED, TABLE_ROW_Y, tableRow,
} from '../../psg-barca/cast';
import { laugh } from '../acting';
import { groove, laughTrack, rimshot, roomTone } from '../sound';
import {
  createBellingham, createDressingRoom, createGuler, createMbappe, createRudiger, createValverde, createVinicius, haha,
  MADRID_GOLD, MADRID_WHITE,
} from '../cast';

const TITLE_FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const SCREEN = { x: 540, y: 600, width: 900 };
const ROW_X = SCREEN.x - SCREEN.width / 2 + 120;

export class TableScene extends Scene {
  readonly title = 'Merci, mes amis';

  private screen!: Actor;
  private header!: TextLabel;
  private psgRow!: Actor;
  private madridRow!: Actor;
  private barcaRow!: Actor;
  private otherRow!: Actor;
  private mbappe!: Footballer;
  private squad!: Footballer[];
  private laughs!: Actor[];
  private merci!: SpeechBubble;
  private titleCard!: TextLabel;

  build(): void {
    const { width, height } = this.stage;
    const room = createDressingRoom(width, height);

    this.screen = createTableScreen({ x: SCREEN.x, y: SCREEN.y, width: SCREEN.width, scale: 0, opacity: 0 });
    this.header = new TextLabel({
      text: 'THE VIBES TABLE 😏', x: SCREEN.x, y: SCREEN.y - 310, scale: 0, opacity: 0,
      fontSize: 52, font: TITLE_FONT, weight: 400, color: '#15192b', background: '#edbb00',
    });
    const row = (i: number, name: string, colors: [string, string]) =>
      tableRow({ name, colors, width: SCREEN.width - 160, x: ROW_X, y: SCREEN.y + TABLE_ROW_Y[i], opacity: 0 });
    this.psgRow = row(0, 'PSG', [PSG_NAVY, PSG_RED]);
    this.barcaRow = row(1, 'BARÇA', [BARCA_BLUE, BARCA_GARNET]);
    this.madridRow = row(2, 'REAL MADRID', [MADRID_WHITE, MADRID_GOLD]);
    this.otherRow = row(3, '· · ·', ['#9aa4b2', '#c9d0da']);

    const rudiger = createRudiger({ x: 110 });
    const guler = createGuler({ x: 300 });
    this.mbappe = createMbappe({ x: 1250 });
    const bellingham = createBellingham({ x: 700 });
    const valverde = createValverde({ x: 860 });
    const vinicius = createVinicius({ x: 1010 });
    this.squad = [rudiger, guler, bellingham, valverde, vinicius];
    for (const p of [bellingham, valverde, vinicius]) p.scaleX = -Math.abs(p.scaleX);

    this.laughs = this.squad.map((p, i) => haha({ x: p.x, y: 1080 + (i % 2) * 60, rotation: i % 2 ? 8 : -8, size: 54 }));
    this.merci = new SpeechBubble({ text: 'Merci, mes amis. 😏', fontSize: 46 });
    this.titleCard = new TextLabel({
      text: 'CLÁSICO SOON… 👀', x: width / 2, y: 260, scale: 0, opacity: 0,
      fontSize: 100, font: TITLE_FONT, weight: 400, color: MADRID_GOLD, background: 'rgba(27,42,89,0.95)',
    });

    this.add(
      room, this.screen, this.header, this.otherRow, this.barcaRow, this.madridRow, this.psgRow,
      ...this.squad, this.mbappe, ...this.laughs, this.merci,
    );
    this.overlay.add(this.titleCard, createParodyNotice(width, height));
  }

  animate(tl: Timeline): void {
    const { mbappe, squad, camera } = this;
    const all = [...squad, mbappe];

    // The table goes up.
    squad.forEach((p) => tl.add(emote(p, 'smug'), 0));
    tl.add(popIn(this.screen), 0.1)
      .add(popIn(this.header), 0.2)
      .add(sfx(synth.pop), 0.1);
    [this.psgRow, this.barcaRow, this.madridRow, this.otherRow].forEach((r, i) => tl.to(r, { opacity: 1, duration: 0.2 }, 0.25 + i * 0.08));

    // Madrid climb past Barça…
    tl.addLabel('climb', 0.8)
      .add(sfx(synth.whoosh), 'climb')
      .to(this.madridRow, { x: ROW_X - 30, duration: 0.15 }, 'climb')
      .to(this.madridRow, { y: SCREEN.y + TABLE_ROW_Y[1], duration: 0.4, ease: 'back.out(1.6)' }, 'climb+=0.1')
      .to(this.barcaRow, { y: SCREEN.y + TABLE_ROW_Y[2], duration: 0.4, ease: 'power2.inOut' }, 'climb+=0.1')
      .to(this.madridRow, { x: ROW_X, duration: 0.15 }, 'climb+=0.5')
      .add(melody('C6 E6 G6:2', { bpm: 520, volume: 0.08 }), 'climb+=0.45')

      // …and Barça keep sliding. Down, down… and off the screen. Wah-wah-waaah.
      .addLabel('slide', 'climb+=0.9')
      .to(this.barcaRow, { y: SCREEN.y + TABLE_ROW_Y[3], duration: 0.4, ease: 'power2.inOut' }, 'slide')
      .to(this.otherRow, { y: SCREEN.y + TABLE_ROW_Y[2], duration: 0.4, ease: 'power2.inOut' }, 'slide')
      .to(this.barcaRow, { rotation: 18, duration: 0.25, ease: 'power2.in' }, 'slide+=0.5')
      .to(this.barcaRow, { y: GROUND_Y - 30, rotation: 75, duration: 0.6, ease: 'bounce.out' }, 'slide+=0.75')
      .add(sfx(() => synth.kick(1.2)), 'slide+=1.1')
      .add(shake(camera, { amount: 8, times: 2 }), 'slide+=1.1')
      .add(melody('G4 F#4 F4 E4:3', { bpm: 200, wave: 'sawtooth', volume: 0.06 }), 'slide+=0.3')
      .to(this.barcaRow, { opacity: 0, duration: 0.3 }, 'slide+=2');
    squad.forEach((p, i) => {
      tl.add(emote(p, 'shocked'), 'slide+=1')
        .add(emote(p, 'happy'), 'slide+=1.4')
        .add(laugh(p, { duration: 1, voice: i % 2 === 0 }), `slide+=${1.4 + i * 0.05}`);
    });
    tl.add(laughTrack(1.1), 'slide+=1.4')

      // Mbappé walks in with a word for his old club.
      .addLabel('merci', 'slide+=2.2')
      .add(emote(mbappe, 'smug'), 'merci')
      .add(walk(mbappe, { to: 530, duration: 0.9, stepDuration: 0.18 }), 'merci')
      .to(camera, { ...camera.focus(530, 1200, 1.4), duration: 0.5, ease: 'power2.inOut' }, 'merci+=0.6')
      .add(say(mbappe, this.merci, { voice: 'voices/mbappe-merci', hold: 0.4 }), 'merci+=0.9')
      .to(mbappe.head, { rotation: -10, duration: 0.2, yoyo: true, repeat: 1, repeatDelay: 0.3 }, 'merci+=1.3')
      .add(rimshot(), 'merci+=2.6')
      .to(camera, { ...camera.reset(), duration: 0.4, ease: 'power2.inOut' }, 'merci+=2.8')

      // Freeze on the whole squad laughing.
      .addLabel('end', 'merci+=3');
    all.forEach((p, i) => {
      tl.add(emote(p, 'happy'), 'end')
        .add(laugh(p, { duration: 1.8, voice: i % 2 === 1 }), `end+=${i * 0.05}`)
        .add(jump(p, { height: 40, duration: 0.35, sound: i === 0 }), `end+=${0.2 + i * 0.08}`);
    });
    this.laughs.forEach((h, i) => tl.add(popIn(h, { duration: 0.2 }), `end+=${0.15 + i * 0.08}`));
    tl.add(laughTrack(1.8), 'end')
      .add(sfx(synth.pop), 'end+=0.5')
      .add(popIn(this.titleCard), 'end+=0.5')
      .add(melody('C5 E5 G5 C6:3', { bpm: 400, wave: 'square', volume: 0.06 }), 'end+=0.5')
      .set({}, {}, 'end+=2.3');

    const length = tl.duration() + 0.2;
    tl.add(roomTone(length), 0)
      .add(groove(length - 2, { volume: 0.06 }), 0);
    for (const char of all) tl.add(blinkRandomly(char, length), 0);
  }
}
