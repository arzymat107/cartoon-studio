/**
 * "The Hot Seat" – a wordless Short (no text, no speech: music, sound effects and voice noises).
 *
 *   0–4.6     Carrick sits on the manager's seat; the thermometer creeps up, the seat smokes.
 *             He starts to sweat (gulp), then it burns (ow!) and catches fire.
 *   6.6–10    Bruno charges in and blasts the seat with the extinguisher – fire out, the needle
 *             drops, Carrick sighs with relief, Bruno poses proudly (the Roma win).
 *   11.8      …it bursts back into flames, bigger. The thermometer pops. Carrick panics; Bruno flees.
 *   13–17.2   Sneaky music: Ole tiptoes in behind with his folding chair – "shhh" – and rubs his hands.
 *   17.6      The seat fires Carrick up through the dugout roof and off into the night sky (twinkle).
 *   20.5      Poof: the burnt seat is gone, Ole sits back in his camping chair. Aaah.
 */
import { clip, sfx } from '@/animations';
import { synth } from '@/audio';
import { Actor, Scene, seededRandom, type SceneClass, type Timeline } from '@/engine';
import { campingChair, debris, dugout, flame, FLOOR_Y, foamBlob, HotSeat, puff, Roof, ROOF, stadium, Thermometer, twinkle } from './props';
import { BRUNO_NOZZLE, BrunoRig, CarrickRig, OleRig, OleSeated } from './rigs';

const SCALE = 0.5;
/** Where Carrick sits (world), = the underside of his thighs on the cushion. */
const SEAT = { x: 690, y: 1230 };
const BRUNO = { x: 205, y: 1640 };
const OLE = { x: 905, y: FLOOR_Y };
const END = 24.2;
/**
 * The whole set sits 130 px higher than the world coordinates say, so faces, fire and the
 * thermometer stay clear of the phone's overlays (title and channel at the bottom, buttons on
 * the right from the middle down). The camera's resting view is this offset instead of 0.
 */
const HOME = { x: 0, y: -130, scale: 1 };
/** The thermometer hangs top right, above the like/share buttons. */
const THERMO = { x: 990, y: 1030 };

interface FlameSlot {
  holder: Actor;
  size: number;
}

class HotSeatScene extends Scene {
  readonly title = 'The Hot Seat';
  private carrick!: CarrickRig;
  private seat!: HotSeat;
  private thermo!: Thermometer;
  private bruno!: BrunoRig;
  private ole!: OleRig;
  private oleSeated!: OleSeated;
  private chair!: Actor;
  private roof!: Roof;
  private backFlames: FlameSlot[] = [];
  private frontFlames: FlameSlot[] = [];
  /** Layers for effects, so they draw in the right order. */
  private backFx!: Actor;
  private frontFx!: Actor;
  private skyFx!: Actor;
  private readonly rnd = seededRandom(7);

  build(): void {
    const { width, height } = this.stage;
    this.roof = new Roof(width, SEAT.x);
    this.skyFx = new Actor({ name: 'sky fx' });
    this.backFx = new Actor({ name: 'back fx' });
    this.frontFx = new Actor({ name: 'front fx' });

    const back = new Actor({ name: 'back flames' });
    for (const [x, y, size] of [[790, 1290, 1.7], [900, 1300, 1.5], [620, 1270, 1.3], [500, 1280, 1.1], [980, 1330, 1.1], [700, 1260, 1.5]] as const) {
      this.backFlames.push(this.flameSlot(back, x, y, size));
    }
    const front = new Actor({ name: 'front flames' });
    for (const [x, y, size] of [[560, 1575, 0.9], [680, 1580, 1.1], [800, 1575, 0.95], [880, 1590, 0.7]] as const) {
      this.frontFlames.push(this.flameSlot(front, x, y, size));
    }

    this.ole = new OleRig({ x: 1450, y: OLE.y, scale: SCALE });
    this.ole.scaleX = -SCALE;
    this.seat = new HotSeat({ x: SEAT.x, y: SEAT.y + 45 });
    this.chair = campingChair({ x: SEAT.x, y: SEAT.y + 25, scale: 0.92, opacity: 0 });
    this.oleSeated = new OleSeated({ x: SEAT.x, y: SEAT.y + 50, scale: SCALE, opacity: 0 });
    this.carrick = new CarrickRig({ x: SEAT.x, y: SEAT.y, scale: SCALE });
    this.bruno = new BrunoRig({ x: -380, y: BRUNO.y, scale: SCALE });
    this.thermo = new Thermometer({ x: THERMO.x, y: THERMO.y, scale: 0.65 });

    this.add(
      stadium(width), this.skyFx, dugout(width, height), back, this.backFx, this.thermo, this.ole,
      this.seat, this.chair, this.oleSeated, this.carrick, front, this.roof,
      this.bruno, this.frontFx,
    );
  }

  private flameSlot(layer: Actor, x: number, y: number, size: number): FlameSlot {
    const holder = new Actor({ name: 'flame slot', x, y, scale: 0 });
    holder.add(flame(0, 0, 1));
    layer.add(holder);
    return { holder, size };
  }

  // ── Effects ──────────────────────────────────────────────────────────

  /** Fire strength 0 … 1.6 for every flame (behind and in front), reached over `duration`. */
  private fire(tl: Timeline, at: number, strength: number, duration = 0.4, ease = 'power2.out', front = strength): void {
    for (const f of this.backFlames) tl.to(f.holder, { scale: f.size * strength * this.rnd.range(0.85, 1.1), duration, ease }, at);
    for (const f of this.frontFlames) tl.to(f.holder, { scale: f.size * front * this.rnd.range(0.85, 1.1), duration, ease }, at);
  }

  /** Flames licking: each one stretches, squeezes and leans on its own rhythm the whole time. */
  private flicker(tl: Timeline): void {
    for (const f of [...this.backFlames, ...this.frontFlames]) {
      const tongue = f.holder.children[0];
      const beat = this.rnd.range(0.09, 0.15);
      const n = Math.floor(END / beat / 2) * 2;
      tl.to(tongue, { scaleY: this.rnd.range(1.15, 1.3), scaleX: 0.88, duration: beat, ease: 'sine.inOut', yoyo: true, repeat: n - 1 }, this.rnd.range(0, 0.1));
      tl.fromTo(tongue, { rotation: -5 }, { rotation: 5, duration: beat * 2.3, ease: 'sine.inOut', yoyo: true, repeat: Math.floor(n / 2.3) - 1 }, 0);
    }
  }

  /** One cloud puff rising, growing and fading. */
  private puff(tl: Timeline, at: number, x: number, y: number, { size = 1, rise = 260, drift = 0, life = 1.6, color = '#b9b4b0', outline = '#6b625d', layer = this.frontFx } = {}): void {
    const p = puff(color, outline);
    p.x = x;
    p.y = y;
    layer.add(p);
    tl.set(p, { opacity: 0.95, scale: size * 0.3, rotation: this.rnd.range(-30, 30) }, at)
      .to(p, { scale: size, duration: life * 0.4, ease: 'power2.out' }, at)
      .to(p, { y: y - rise, x: x + drift, rotation: `+=${this.rnd.range(-40, 40)}`, duration: life, ease: 'power1.out' }, at)
      .to(p, { opacity: 0, scale: size * 1.3, duration: life * 0.5, ease: 'power1.in' }, at + life * 0.5);
  }

  /** Smoke rising off the seat every `every` seconds. */
  private smoke(tl: Timeline, from: number, to: number, every: number, { size = 0.8, rise = 380 } = {}): void {
    for (let t = from; t < to; t += every * this.rnd.range(0.7, 1.3)) {
      this.puff(tl, t, SEAT.x + this.rnd.range(-180, 170), SEAT.y + this.rnd.range(-30, 40), { size: size * this.rnd.range(0.7, 1.2), rise, drift: this.rnd.range(-80, 80), layer: this.backFx });
    }
  }

  /** Jittering in place around the current spot. */
  private shake(tl: Timeline, actor: Actor, from: number, to: number, amount: number, seed: number, x0 = actor.x): void {
    const rnd = seededRandom(seed);
    for (let t = from; t < to; t += 0.05) tl.to(actor, { x: x0 + rnd.range(-amount, amount), duration: 0.05, ease: 'none' }, t);
    tl.to(actor, { x: x0, duration: 0.06 }, to);
  }

  private cameraShake(tl: Timeline, from: number, to: number, amount: number, seed: number): void {
    const rnd = seededRandom(seed);
    for (let t = from; t < to; t += 0.06) {
      tl.to(this.camera, { x: `+=${rnd.range(-amount, amount)}`, y: `+=${rnd.range(-amount, amount)}`, duration: 0.03, yoyo: true, repeat: 1, ease: 'none' }, t);
    }
  }

  /** A hop off the seat: squash, up, down, squash. */
  private hop(tl: Timeline, at: number, height: number, duration = 0.32): void {
    const { carrick } = this;
    tl.to(carrick, { scaleY: SCALE * 0.94, scaleX: SCALE * 1.04, duration: 0.06 }, at)
      .to(carrick, { y: SEAT.y - height, scaleY: SCALE * 1.06, scaleX: SCALE * 0.96, duration: duration / 2, ease: 'power2.out' }, at + 0.06)
      .to(carrick, { y: SEAT.y, scaleY: SCALE, scaleX: SCALE, duration: duration / 2, ease: 'power2.in' }, at + 0.06 + duration / 2)
      .to(carrick, { scaleY: SCALE * 0.95, scaleX: SCALE * 1.03, duration: 0.05, yoyo: true, repeat: 1 }, at + 0.06 + duration);
  }

  /** The extinguisher blast: a stream of foam from the nozzle, piling up on the seat. */
  private spray(tl: Timeline, from: number, to: number): void {
    const nozzle = { x: BRUNO.x + BRUNO_NOZZLE[0] * SCALE, y: BRUNO.y + BRUNO_NOZZLE[1] * SCALE };
    for (let t = from; t < to; t += 0.035) {
      const b = foamBlob();
      b.x = nozzle.x;
      b.y = nozzle.y;
      this.frontFx.add(b);
      const tx = SEAT.x + this.rnd.range(-220, 160);
      const ty = SEAT.y + this.rnd.range(-160, 90);
      const s = this.rnd.range(0.5, 1.0);
      tl.set(b, { opacity: 1, scale: 0.25, rotation: this.rnd.range(0, 360) }, t)
        .to(b, { x: tx, duration: 0.3, ease: 'none' }, t)
        .to(b, { y: ty - 60, duration: 0.15, ease: 'power1.out' }, t)
        .to(b, { y: ty, duration: 0.15, ease: 'power1.in' }, t + 0.15)
        .to(b, { scale: s, duration: 0.3, ease: 'power1.out' }, t)
        .to(b, { opacity: 0, scale: s * 1.4, duration: 0.25 }, t + 0.3);
    }
    // Foam piling up on the cushion and his lap, melting away later.
    for (let i = 0; i < 16; i++) {
      const b = foamBlob();
      b.x = SEAT.x + this.rnd.range(-230, 180);
      b.y = SEAT.y + this.rnd.range(-110, 70);
      this.frontFx.add(b);
      const at = from + 0.3 + (i / 16) * (to - from - 0.3);
      const s = this.rnd.range(0.9, 1.6);
      tl.to(b, { opacity: 1, scale: s, duration: 0.25, ease: 'back.out(2)' }, at)
        .to(b, { y: b.y + 60, scaleY: s * 0.6, opacity: 0, duration: 1.2, ease: 'power1.in' }, 10.2 + i * 0.04);
    }
  }

  // ── The story ────────────────────────────────────────────────────────

  animate(tl: Timeline): void {
    const { carrick, seat, thermo, bruno, ole, camera } = this;
    const heat = (at: number, value: number, duration: number, ease = 'sine.inOut') => {
      tl.to(thermo.tube, { ...Thermometer.level(value), duration, ease }, at)
        .to(seat.glow, { opacity: Math.max(0, (value - 0.25) / 0.75), duration, ease }, at);
    };
    tl.set(camera, HOME, 0);
    this.flicker(tl);

    // Music and the crowd.
    tl.add(clip('music/comedy-loop', { volume: 0.22, duration: 11.8 }), 0);
    for (let t = 0.2; t < 11; t += 2) tl.add(sfx(() => synth.murmur(2.4)), t);

    // 1. Comfortable (0–2.4): breathing, a smile, the needle starts to creep.
    tl.set(thermo.tube, Thermometer.level(0.12), 0);
    heat(0.3, 0.35, 2.1);
    tl.to(carrick, { scaleY: SCALE * 1.01, duration: 0.6, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0);
    this.puff(tl, 1.5, SEAT.x - 120, SEAT.y + 10, { size: 0.4, rise: 200, life: 1.4, layer: this.backFx });
    this.puff(tl, 2.0, SEAT.x + 60, SEAT.y, { size: 0.45, rise: 220, life: 1.4, layer: this.backFx });

    // 2. Getting hot (2.4–4.6): sweat, gulp, fidgeting hops, sizzle.
    carrick.show(tl, 'sweat', 2.4);
    tl.add(clip('vocals/gulp', { volume: 0.9 }), 2.45)
      .to(carrick, { scaleY: SCALE * 0.97, duration: 0.12, yoyo: true, repeat: 1 }, 2.45);
    heat(2.5, 0.62, 2.1);
    this.smoke(tl, 2.6, 4.6, 0.35, { size: 0.6, rise: 300 });
    this.hop(tl, 3.3, 22);
    this.hop(tl, 3.85, 30);
    tl.add(clip('sfx/sizzle', { volume: 0.5, duration: 1.4 }), 3.3);
    this.shake(tl, carrick, 4.2, 4.6, 4, 1);

    // 3. Ouch – it catches fire (4.6–6.6).
    carrick.show(tl, 'pain', 4.6);
    tl.add(clip('vocals/ow', { volume: 1 }), 4.62);
    this.hop(tl, 4.6, 95, 0.4);
    for (let i = 0; i < 4; i++) this.puff(tl, 4.7 + i * 0.05, SEAT.x - 160 + i * 100, SEAT.y + 10, { size: 0.7, rise: 260, life: 1.1, color: '#eeeeee', outline: '#9a9a9a' });
    heat(4.6, 0.8, 1.4);
    tl.to(camera, { ...camera.focus(640, 900, 1.12), duration: 0.6, ease: 'power2.out' }, 4.6);
    tl.add(clip('sfx/fire-ignite', { volume: 0.8 }), 5.0)
      .add(clip('sfx/fire-crackle', { volume: 0.5, duration: 3.7 }), 5.0);
    this.fire(tl, 5.0, 0.45, 0.4, 'back.out(2)');
    this.fire(tl, 5.6, 0.7, 0.8, 'sine.inOut');
    this.smoke(tl, 5.0, 7.4, 0.25, { size: 0.9, rise: 480 });
    this.shake(tl, carrick, 5.2, 7.3, 6, 2);
    this.hop(tl, 5.7, 40);
    this.hop(tl, 6.25, 55);

    // 4. Bruno to the rescue (6.6–10.5).
    tl.to(camera, { ...HOME, duration: 0.5, ease: 'power2.inOut' }, 6.6)
      .add(clip('sfx/whoosh', { volume: 0.9 }), 6.6)
      .to(bruno, { x: BRUNO.x + 30, duration: 0.5, ease: 'power2.out' }, 6.6)
      .to(bruno, { x: BRUNO.x, duration: 0.25, ease: 'sine.inOut' }, 7.1);
    for (let i = 0; i < 4; i++) {
      tl.to(bruno, { y: BRUNO.y - 40, duration: 0.07, ease: 'power1.out', yoyo: true, repeat: 1 }, 6.6 + i * 0.14)
        .add(sfx(synth.step), 6.74 + i * 0.14);
    }
    // Skid: lean back, then settle into the spraying stance.
    tl.to(bruno, { rotation: -8, duration: 0.15, ease: 'power2.out' }, 7.05)
      .to(bruno, { rotation: 0, duration: 0.2, ease: 'back.out(3)' }, 7.2)
      .add(clip('sfx/extinguisher', { volume: 0.9, duration: 2.2 }), 7.3);
    this.spray(tl, 7.3, 9.3);
    this.shake(tl, bruno, 7.3, 9.3, 3, 3, BRUNO.x);
    // Carrick leans back from the blast; the fire dies, steam hisses, the needle drops.
    tl.to(carrick, { rotation: 4, duration: 0.3 }, 7.35).to(carrick, { rotation: 0, duration: 0.4 }, 9.3);
    this.fire(tl, 7.5, 0.3, 0.6, 'power1.in');
    this.fire(tl, 8.2, 0, 0.5, 'power2.in');
    tl.add(clip('sfx/sizzle', { volume: 0.8, duration: 2.2 }), 8.1);
    heat(7.6, 0.18, 1.5, 'power2.inOut');
    for (let t = 8.3; t < 10.2; t += 0.2) {
      this.puff(tl, t, SEAT.x + this.rnd.range(-200, 150), SEAT.y + this.rnd.range(-40, 30), { size: this.rnd.range(0.6, 0.9), rise: 420, drift: this.rnd.range(-60, 60), color: '#f4f6f8', outline: '#a9b3bd', layer: this.backFx });
    }
    // Relief – and Bruno strikes a pose (the Roma win): fanfare and cheers.
    carrick.show(tl, 'relief', 9.3);
    tl.add(clip('vocals/phew', { volume: 1 }), 9.32)
      .to(carrick, { scaleY: SCALE * 0.96, scaleX: SCALE * 1.02, duration: 0.5, ease: 'sine.out', yoyo: true, repeat: 1 }, 9.3);
    bruno.show(tl, 'proud', 9.45);
    tl.to(bruno, { scaleY: SCALE * 1.04, duration: 0.2, ease: 'back.out(3)', yoyo: true, repeat: 3 }, 9.45)
      .add(clip('sfx/fanfare', { volume: 0.55 }), 9.45)
      .add(sfx(() => synth.cheer(2.2)), 9.5);
    carrick.show(tl, 'sitting', 10.6);

    // 5. It reignites (11.8): bigger fire, the thermometer pops, Carrick panics, Bruno runs.
    tl.add(sfx(synth.pop), 11.4)
      .to(seat.glow, { opacity: 0.5, duration: 0.08, yoyo: true, repeat: 3 }, 11.4);
    this.puff(tl, 11.45, SEAT.x - 40, SEAT.y + 20, { size: 0.35, rise: 120, life: 0.8, layer: this.backFx });
    tl.add(clip('sfx/fire-ignite', { volume: 1 }), 11.8)
      .add(clip('sfx/fire-crackle', { volume: 0.6, duration: 6.6 }), 11.8)
      .add(clip('vocals/scream', { volume: 0.95 }), 11.9);
    this.fire(tl, 11.8, 1.25, 0.3, 'back.out(2.5)');
    heat(11.8, 1, 0.35, 'power3.out');
    tl.to(thermo.cap, { y: -Thermometer.TUBE - 420, x: -160, rotation: -300, duration: 0.6, ease: 'power2.out' }, 12.15)
      .to(thermo.cap, { y: 200, duration: 0.6, ease: 'power2.in' }, 12.75)
      .set(thermo.crack, { opacity: 1 }, 12.15)
      .add(sfx(synth.pop), 12.15)
      .to(thermo, { rotation: 4, duration: 0.05, yoyo: true, repeat: 7 }, 12.15);
    carrick.show(tl, 'panic', 11.8);
    this.hop(tl, 11.8, 120, 0.42);
    this.cameraShake(tl, 11.8, 12.6, 14, 4);
    this.smoke(tl, 11.8, 17.6, 0.2, { size: 1, rise: 560 });
    this.shake(tl, carrick, 12.3, 17.2, 7, 5);
    this.hop(tl, 13.4, 45);
    this.hop(tl, 14.6, 45);
    this.hop(tl, 15.9, 45);
    // Bruno grabs the extinguisher and legs it.
    bruno.show(tl, 'extinguisher', 12.0);
    tl.to(bruno, { y: BRUNO.y - 80, rotation: -10, duration: 0.15, ease: 'power2.out' }, 12.0)
      .to(bruno, { y: BRUNO.y, duration: 0.15, ease: 'power2.in' }, 12.15)
      .to(bruno, { x: -450, duration: 0.45, ease: 'power2.in' }, 12.25)
      .add(clip('sfx/whoosh', { volume: 0.9 }), 12.3);

    // 6. Ole sneaks in (13–17.2): tiptoe steps on the pizzicato, "shhh", then rubbing his hands.
    tl.add(clip('music/sneaky', { volume: 0.5, duration: END - 13 }), 13.0);
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const at = 13.1 + i * 0.42;
      const x = 1450 - ((i + 1) / steps) * (1450 - OLE.x);
      tl.to(ole, { x, duration: 0.3, ease: 'sine.inOut' }, at)
        .to(ole, { y: OLE.y - 35, rotation: i % 2 ? 3 : -3, duration: 0.15, ease: 'sine.out' }, at)
        .to(ole, { y: OLE.y, rotation: 0, duration: 0.15, ease: 'sine.in' }, at + 0.15)
        .add(sfx(() => synth.step()), at + 0.3);
    }
    tl.to(ole, { rotation: -4, duration: 0.4, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 15.7);
    ole.show(tl, 'eager', 16.0);
    tl.to(camera, { ...camera.focus(780, 900, 1.15), duration: 0.5, ease: 'power2.out' }, 15.9)
      .add(clip('vocals/sneaky-chuckle', { volume: 1 }), 16.05)
      .add(clip('vocals/sneaky-chuckle', { volume: 0.8 }), 16.6);
    for (let i = 0; i < 6; i++) {
      tl.to(ole, { scaleY: SCALE * 0.97, y: OLE.y, duration: 0.09, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 16.05 + i * 0.18);
    }
    tl.to(camera, { ...HOME, duration: 0.4, ease: 'power2.inOut' }, 17.0);

    // 7. Launch (17.2–19.6): anticipation squash, boing, up through the roof, into the sky.
    tl.to(carrick, { scaleY: SCALE * 0.86, scaleX: SCALE * 1.08, duration: 0.35, ease: 'power2.in' }, 17.2)
      .to(seat, { scaleY: 0.94, duration: 0.35, ease: 'power2.in' }, 17.2)
      .to(seat, { scaleY: 1.06, duration: 0.1, ease: 'power2.out' }, 17.55)
      .to(seat, { scaleY: 1, duration: 0.5, ease: 'elastic.out(1.2, 0.3)' }, 17.65)
      .add(sfx(synth.boing), 17.55)
      .add(clip('sfx/launch', { volume: 1 }), 17.55)
      .add(clip('vocals/scream', { volume: 0.8, offset: 0.4 }), 17.6);
    this.fire(tl, 17.55, 1.6, 0.15, 'power2.out');
    carrick.show(tl, 'jump', 17.55);
    tl.set(carrick, { y: SEAT.y - 80, scaleX: SCALE, scaleY: SCALE * 1.1, rotation: 0 }, 17.55)
      .to(carrick, { y: 760, duration: 0.2, ease: 'power1.in' }, 17.55);
    carrick.show(tl, 'launch', 17.75);
    tl.to(carrick, { y: -1500, duration: 1.0, ease: 'power1.out' }, 17.75)
      .to(carrick, { rotation: 900, scale: SCALE * 0.15, duration: 1.0, ease: 'power1.in' }, 17.75)
      .set(carrick, { opacity: 0 }, 18.75);
    // Crash through the roof.
    tl.to(this.roof.hole, { scale: 1, duration: 0.15, ease: 'back.out(2)' }, 17.9)
      .add(clip('sfx/crash', { volume: 1 }), 17.9);
    for (let i = 0; i < 12; i++) {
      const d = debris(100 + i);
      d.x = SEAT.x + this.rnd.range(-80, 80);
      d.y = ROOF.y + 20;
      d.opacity = 0;
      this.skyFx.add(d);
      const dx = this.rnd.range(-520, 520);
      const up = this.rnd.range(300, 900);
      tl.set(d, { opacity: 1 }, 17.9)
        .to(d, { x: d.x + dx, rotation: this.rnd.range(-720, 720), duration: 1.4, ease: 'none' }, 17.9)
        .to(d, { y: ROOF.y - up, duration: 0.55, ease: 'power2.out' }, 17.9)
        .to(d, { y: ROOF.y + 600, duration: 0.85, ease: 'power2.in' }, 18.45);
    }
    // Smoke trail behind him.
    for (let i = 0; i < 12; i++) {
      const t = 17.6 + i * 0.07;
      const y = SEAT.y - 100 - (i / 12) ** 0.8 * 2400;
      this.puff(tl, t, SEAT.x + this.rnd.range(-30, 30), y, { size: 0.9 - i * 0.04, rise: 60, life: 1.4, layer: i < 4 ? this.backFx : this.skyFx });
    }
    tl.to(camera, { ...camera.focus(540, -700, 1), duration: 0.8, ease: 'power2.inOut' }, 17.8);
    const star = twinkle(SEAT.x + 40, -1480);
    this.skyFx.add(star);
    tl.to(star, { scale: 1.3, opacity: 1, rotation: 90, duration: 0.25, ease: 'back.out(3)' }, 18.8)
      .to(star, { scale: 0, opacity: 0, rotation: 180, duration: 0.3, ease: 'power2.in' }, 19.2)
      .add(sfx(() => { synth.note(2093, 0.35, 'sine', 0.14); synth.note(3136, 0.5, 'sine', 0.1); }), 18.8)
      .to(camera, { ...camera.focus(540, -1100, 1), duration: 0.6, ease: 'sine.inOut' }, 18.6);
    // The burnt seat smokes and the fire dies down without him.
    this.fire(tl, 18.0, 0, 0.8, 'power2.in');
    tl.to(seat.glow, { opacity: 0, duration: 1 }, 18.0).to(seat.scorch, { opacity: 1, duration: 0.6 }, 18.0);
    heat(18.4, 0.5, 1.5);
    this.smoke(tl, 18.4, 20.4, 0.28, { size: 0.7, rise: 360 });
    tl.to(camera, { ...HOME, duration: 0.6, ease: 'power2.inOut' }, 19.6)
      .add(clip('sfx/whoosh', { volume: 0.6 }), 19.6);

    // 8. Ole takes the seat (20.3–24.2): poof, the camping chair is up, he leans back. Aaah.
    tl.to(ole, { x: 820, duration: 0.25, ease: 'power2.in' }, 20.3)
      .to(ole, { y: OLE.y - 60, duration: 0.12, ease: 'power1.out', yoyo: true, repeat: 1 }, 20.3)
      .add(clip('sfx/poof', { volume: 1 }), 20.5)
      .add(clip('sfx/chair-unfold', { volume: 0.8 }), 20.6);
    for (let i = 0; i < 9; i++) {
      this.puff(tl, 20.5 + i * 0.03, SEAT.x + this.rnd.range(-260, 260), SEAT.y + this.rnd.range(-300, 280), { size: this.rnd.range(1.4, 2), rise: 120, drift: this.rnd.range(-120, 120), life: 1.1, color: '#e9e1d4', outline: '#9b8f80' });
    }
    tl.set([ole, seat], { opacity: 0 }, 20.65)
      .set([this.chair, this.oleSeated], { opacity: 1 }, 20.65)
      .fromTo(this.oleSeated, { scaleY: SCALE * 0.9 }, { scaleY: SCALE, duration: 0.5, ease: 'elastic.out(1.2, 0.4)', immediateRender: false }, 20.7)
      .add(clip('vocals/ahh', { volume: 1 }), 21.1)
      .to(this.oleSeated, { scaleY: SCALE * 0.97, scaleX: SCALE * 1.02, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 21.1);
    // Ice cold for Ole: the needle drops right to the bottom.
    heat(21.0, 0.02, 0.8, 'power2.in');
    tl.to(thermo.cold, { opacity: 1, duration: 0.4 }, 21.6);
    const sparkle = twinkle(THERMO.x, THERMO.y);
    this.frontFx.add(sparkle);
    tl.to(sparkle, { scale: 0.8, opacity: 1, rotation: 90, duration: 0.2, ease: 'back.out(3)' }, 21.8)
      .to(sparkle, { scale: 0, opacity: 0, duration: 0.25 }, 22.1)
      .add(sfx(() => synth.note(2637, 0.4, 'sine', 0.12)), 21.8);
    tl.to(camera, { ...camera.focus(700, 1020, 1.12), duration: 2.4, ease: 'sine.inOut' }, 21.2)
      .add(clip('sfx/rimshot', { volume: 0.7 }), 22.9)
      .set({}, {}, END);
  }
}

export const HOT_SEAT_SCENES: SceneClass[] = [HotSeatScene];
