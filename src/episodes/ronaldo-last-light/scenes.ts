/**
 * "Ronaldo – The Last Light" – a wordless, dramatic Short (no text, no speech: music, sound
 * effects and voice noises) about Ronaldo's reported farewell to the Portugal team.
 *
 *   0–3       Night, rain, an empty stadium. One spotlight on Ronaldo in the centre circle,
 *             captain's armband on. A lone piano.
 *   3.2–6.4   A memory: the stands fill with a ghostly crowd, camera flashes, a roar – he
 *             smiles. Then it's gone. Silence, one heartbeat; his face falls.
 *   7.4–11    Close on the armband. It slides down his arm and drops onto the grass by the ball.
 *             A sigh.
 *   12.2–15.2 He turns and walks out of the light. A boy in an oversized number 7 shirt runs in.
 *   15.3–16.4 The boy picks up the armband and lifts it – it catches the light.
 *   16.4–17.2 Ronaldo looks back, smiles, nods.
 *   17.4      The boy jumps – siuu! The floodlights blaze on, the crowd is real, the rain stops.
 *   18.6–20.6 Ronaldo jumps with him – lips out in a long "uuuu" tube; both hang in the air
 *             (slow motion). Snapshot flash.
 *   21.6–23.4 Fade to black. Last piano notes, a distant whistle.
 */
import { clip, sfx } from '@/animations';
import { synth } from '@/audio';
import { Actor, Scene, seededRandom, type SceneClass, type Timeline } from '@/engine';
import { KidRig, point, RonaldoRig } from '@/characters';
import { armband, ball, crowd, flashBursts, Floodlights, GROUND_Y, nightTint, raindrop, screenFill, sparkle, splash, spotlight, stadium } from './props';

const SCALE = 0.42;
const KID_SCALE = 0.26;
const END = 24.3;
/** Ronaldo's spot in the centre circle, and where he stops after walking off. */
const START_X = 600;
const STOP_X = 340;
const KID_X = 640;
const BALL = { x: 470, y: GROUND_Y - 50 };
/** Where the armband lands, next to the ball. */
const BAND_REST = { x: 545, y: GROUND_Y + 45 };
/** The armband on Ronaldo's arm, relative to his feet (world px). */
const [BAND_DX, BAND_DY] = point('ronaldo_standing', 'band').map((v) => v * SCALE);
/** The boy's hand (the one nearer Ronaldo), relative to his feet. */
const [HAND_DX, HAND_DY] = point('kid_standing', 'handL').map((v) => v * KID_SCALE);
/** When the lights come on and the rain stops. */
const LIGHTS = 17.4;

class LastLightScene extends Scene {
  readonly title = 'The Last Light';
  private ronaldo!: RonaldoRig;
  private kid!: KidRig;
  private band!: Actor;
  private crowd!: Actor;
  private lights!: Floodlights;
  private tint!: Actor;
  private flashes: Actor[] = [];
  private drops: Actor[] = [];
  private splashes: Actor[] = [];
  private glint!: Actor;
  private white!: Actor;
  private black!: Actor;
  private readonly rnd = seededRandom(23);

  build(): void {
    const { width, height } = this.stage;
    this.crowd = crowd(width);
    this.flashes = flashBursts(width, 26, 5);
    this.lights = new Floodlights(width);
    this.tint = nightTint(width, height);
    const spot = spotlight();
    spot.x = 560;
    spot.y = GROUND_Y;
    const theBall = ball();
    theBall.x = BALL.x;
    theBall.y = BALL.y;
    this.ronaldo = new RonaldoRig({ x: START_X, y: GROUND_Y, scale: SCALE });
    this.kid = new KidRig({ x: 1350, y: GROUND_Y + 10, scale: KID_SCALE });
    this.band = armband();
    this.band.scale = SCALE;
    this.band.opacity = 0;
    this.glint = sparkle();
    const rain = new Actor({ name: 'rain' });
    for (let i = 0; i < 90; i++) {
      const d = raindrop();
      this.drops.push(d);
      rain.add(d);
    }
    for (let i = 0; i < 14; i++) {
      const s = splash();
      this.splashes.push(s);
      rain.add(s);
    }

    this.add(
      stadium(width, height), this.crowd, ...this.flashes, this.lights, this.tint, spot, theBall,
      this.ronaldo, this.kid, this.band, this.glint, rain,
    );
    this.white = screenFill(width, height, '#ffffff');
    this.black = screenFill(width, height, '#000000');
    this.overlay.add(this.white, this.black);
  }

  // ── Effects ──────────────────────────────────────────────────────────

  /** Rain streaks falling on a loop until `to`, and little splashes on the grass. */
  private rain(tl: Timeline, to: number): void {
    for (const d of this.drops) {
      const x = this.rnd.range(-200, 1300);
      const fall = this.rnd.range(0.55, 0.8);
      const start = this.rnd.range(0, fall);
      const repeat = Math.max(0, Math.floor((to - start) / fall) - 1);
      tl.set(d, { opacity: 1 }, start)
        .fromTo(d, { x, y: this.rnd.range(-300, 200) }, { x: x - 130, y: 2000, duration: fall, ease: 'none', repeat, immediateRender: false }, start)
        .set(d, { opacity: 0 }, to);
    }
    for (const s of this.splashes) {
      for (let t = this.rnd.range(0, 0.6); t < to - 0.3; t += this.rnd.range(0.5, 0.9)) {
        tl.set(s, { x: this.rnd.range(0, 1080), y: this.rnd.range(GROUND_Y - 300, GROUND_Y + 300), scale: 0.4, opacity: 0.8 }, t)
          .to(s, { scale: 1.3, opacity: 0, duration: 0.3, ease: 'power1.out' }, t);
      }
    }
  }

  /** Camera flashes popping all over the stands between `from` and `to`. */
  private popFlashes(tl: Timeline, from: number, to: number, every: number): void {
    let i = 0;
    for (let t = from; t < to; t += every * this.rnd.range(0.5, 1.5)) {
      const f = this.flashes[i++ % this.flashes.length];
      tl.set(f, { opacity: 1, rotation: this.rnd.range(0, 45) }, t).to(f, { opacity: 0, duration: 0.25, ease: 'power2.in' }, t + 0.05);
    }
  }

  /** Walking: a step forward with a little bob, `steps` times. */
  private walk(tl: Timeline, actor: Actor, from: number, toX: number, steps: number, stepTime: number, { lift = 14, sway = 2, sound = true } = {}): void {
    const x0 = actor === this.ronaldo ? START_X : 1350;
    const y0 = actor.y;
    for (let i = 0; i < steps; i++) {
      const at = from + i * stepTime;
      const x = x0 + ((i + 1) / steps) * (toX - x0);
      tl.to(actor, { x, duration: stepTime, ease: 'none' }, at)
        .to(actor, { y: y0 - lift, rotation: i % 2 ? sway : -sway, duration: stepTime / 2, ease: 'sine.out' }, at)
        .to(actor, { y: y0, rotation: 0, duration: stepTime / 2, ease: 'sine.in' }, at + stepTime / 2);
      if (sound) tl.add(sfx(synth.step), at + stepTime * 0.9);
    }
  }

  // ── The story ────────────────────────────────────────────────────────

  animate(tl: Timeline): void {
    const { ronaldo, kid, band, camera } = this;
    tl.set(camera, camera.focus(560, 960, 0.96), 0);

    // Sound bed: rain until the lights come on, the piano the whole way.
    tl.add(clip('sfx/rain', { volume: 0.35, duration: LIGHTS }), 0)
      .add(clip('music/sad-piano', { volume: 0.55, duration: END - 0.3 }), 0.3);
    this.rain(tl, LIGHTS);

    // 1. Alone (0–3): breathing, a slow push in.
    tl.to(ronaldo, { scaleY: SCALE * 1.008, duration: 1.4, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0)
      .to(camera, { ...camera.focus(600, 900, 1.1), duration: 7, ease: 'sine.inOut' }, 0);

    // 2. The memory (3.2–6.4): the stands fill, flashes, a roar – a smile. Then silence.
    tl.to(this.crowd, { opacity: 0.4, duration: 1, ease: 'power1.in' }, 3.2)
      .add(clip('sfx/crowd-roar', { volume: 0.45, duration: 3.2 }), 3.2);
    this.popFlashes(tl, 3.6, 6.2, 0.12);
    ronaldo.show(tl, 'smile', 4.1);
    tl.to(ronaldo, { rotation: -1.5, duration: 0.8, ease: 'sine.inOut' }, 4.0)
      .to(this.crowd, { opacity: 0, duration: 0.25 }, 6.4)
      .add(clip('sfx/heartbeat', { volume: 0.9 }), 6.5)
      .to(ronaldo, { rotation: 0, duration: 0.6, ease: 'sine.inOut' }, 6.5);
    ronaldo.show(tl, 'sad', 6.7);

    // 3. The armband (7.4–11): close up; it slides down his arm and falls by the ball.
    const bandAt = { x: START_X + BAND_DX, y: GROUND_Y + BAND_DY };
    tl.to(camera, { ...camera.focus(700, 1010, 1.65), duration: 1, ease: 'power2.inOut' }, 7.4)
      .set(band, { ...bandAt, opacity: 1, rotation: 0 }, 8.4);
    ronaldo.show(tl, 'bareSad', 8.4);
    tl.to(band, { y: bandAt.y + 175, x: bandAt.x + 12, rotation: -6, duration: 1.1, ease: 'power1.inOut' }, 8.5)
      .add(sfx(synth.swish), 8.5)
      .to(band, { y: bandAt.y + 235, x: bandAt.x + 26, rotation: -14, duration: 0.25, ease: 'power1.in' }, 9.6)
      .to(camera, { ...camera.focus(600, 1130, 1.2), duration: 0.9, ease: 'power2.inOut' }, 9.7)
      .to(band, { x: BAND_REST.x, duration: 0.7, ease: 'power1.out' }, 9.85)
      .to(band, { y: BAND_REST.y, duration: 0.7, ease: 'power2.in' }, 9.85)
      .to(band, { rotation: -100, duration: 0.7, ease: 'power1.inOut' }, 9.85)
      .to(band, { rotation: -90, scaleX: SCALE * 0.7, duration: 0.15, ease: 'power2.out' }, 10.55)
      .add(sfx(() => synth.kick(0.25)), 10.55)
      .add(clip('vocals/sigh', { volume: 0.9 }), 10.9)
      .to(ronaldo, { scaleY: SCALE * 0.97, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 10.9)
      .to(camera, { ...camera.focus(560, 960, 1.0), duration: 1.2, ease: 'sine.inOut' }, 11.3);

    // 4. He walks away (12.2–15.2), out of the light, to the left.
    ronaldo.face(tl, true, 12.2, SCALE);
    this.walk(tl, ronaldo, 12.3, STOP_X, 6, 0.48, { lift: 12, sway: 1.5 });

    // 5. The boy (13.6–16.4): runs in, picks up the armband, lifts it into the light.
    this.walk(tl, kid, 13.6, KID_X, 6, 0.2, { lift: 22, sway: 4 });
    tl.to(kid, { rotation: -6, duration: 0.15, ease: 'power2.out' }, 14.8)
      .to(kid, { rotation: 0, duration: 0.25, ease: 'back.out(3)' }, 14.95)
      // Crouch, grab, stand.
      .to(kid, { scaleY: KID_SCALE * 0.82, scaleX: KID_SCALE * 1.05, duration: 0.25, ease: 'power2.in' }, 15.3)
      .to(kid, { scaleY: KID_SCALE, scaleX: KID_SCALE, duration: 0.3, ease: 'power2.out' }, 15.6)
      .to(band, { x: KID_X + HAND_DX, y: GROUND_Y + HAND_DY + 20, rotation: -10, scaleX: SCALE, duration: 0.3, ease: 'power2.out' }, 15.6)
      .to(band, { y: GROUND_Y + HAND_DY - 120, rotation: 0, scale: SCALE * 1.05, duration: 0.5, ease: 'back.out(2)' }, 15.95)
      .to(this.glint, { x: KID_X + HAND_DX + 10, y: GROUND_Y + HAND_DY - 140, duration: 0 }, 16.1)
      .to(this.glint, { scale: 0.9, opacity: 1, rotation: 90, duration: 0.25, ease: 'back.out(3)' }, 16.1)
      .to(this.glint, { scale: 0, opacity: 0, rotation: 180, duration: 0.3 }, 16.45)
      .add(sfx(() => { synth.note(1568, 0.6, 'sine', 0.1); synth.note(2349, 0.8, 'sine', 0.07); }), 16.1);

    // 6. Ronaldo looks back – a smile and a nod.
    ronaldo.face(tl, false, 16.4, SCALE);
    ronaldo.show(tl, 'bareSmile', 16.4);
    tl.to(camera, { ...camera.focus(490, 1000, 1.05), duration: 0.8, ease: 'sine.inOut' }, 16.2)
      .to(ronaldo, { rotation: 3, duration: 0.18, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 16.85);

    // 7. Siuu! The boy jumps; the lights blaze on, the crowd is real, the rain stops.
    tl.set(band, { opacity: 0 }, LIGHTS);
    kid.show(tl, 'siuu', LIGHTS);
    tl.to(kid, { y: GROUND_Y - 150, duration: 0.3, ease: 'power2.out' }, LIGHTS)
      .to(kid, { y: GROUND_Y + 10, duration: 0.3, ease: 'power2.in' }, LIGHTS + 0.3)
      .set(this.white, { opacity: 0.7 }, LIGHTS)
      .to(this.white, { opacity: 0, duration: 0.5, ease: 'power2.out' }, LIGHTS + 0.02)
      .to(this.tint, { opacity: 0.12, duration: 0.4 }, LIGHTS)
      .to(this.lights.glow, { opacity: 1, duration: 0.15 }, LIGHTS)
      .to(this.crowd, { opacity: 1, duration: 0.3 }, LIGHTS)
      .add(sfx(synth.clang), LIGHTS)
      .add(clip('sfx/crowd-roar', { volume: 0.9, duration: 3.4 }), LIGHTS);
    this.popFlashes(tl, LIGHTS + 0.1, 20.6, 0.05);

    // 8. Together (18.4–20.6): Ronaldo jumps too; they hang in the air.
    tl.to(ronaldo, { scaleY: SCALE * 0.9, duration: 0.2, ease: 'power2.in' }, 18.4)
      .set(ronaldo, { scaleY: SCALE }, 18.6);
    ronaldo.show(tl, 'siuu', 18.6);
    // The "uuuu": his lips shoot out into a long tube and stay there.
    tl.fromTo(ronaldo.tube, { scaleX: 0.15 }, { scaleX: 1, duration: 0.45, ease: 'back.out(2.5)', immediateRender: false }, 18.65)
      .to(ronaldo.tube, { scaleX: 1.08, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 19.1);
    kid.show(tl, 'siuu', 18.6);
    for (const [actor, up] of [[ronaldo, 150], [kid, 170]] as const) {
      tl.to(actor, { y: GROUND_Y - up, duration: 0.4, ease: 'power2.out' }, 18.6)
        .to(actor, { y: GROUND_Y - up - 25, duration: 2, ease: 'sine.out' }, 19.0);
    }
    tl.to(camera, { ...camera.focus(500, 960, 1.0), duration: 0.6, ease: 'power2.out' }, 18.5)
      .add(clip('sfx/crowd-roar', { volume: 0.7, offset: 2, duration: 3.6 }), 19.2)
      .to(camera, { ...camera.focus(500, 950, 1.06), duration: 2, ease: 'sine.out' }, 19.0);

    // 9. Snapshot, fade to black, a distant whistle.
    tl.set(this.white, { opacity: 0.85 }, 20.6)
      .to(this.white, { opacity: 0, duration: 0.6, ease: 'power2.out' }, 20.62)
      .add(sfx(() => synth.note(3000, 0.05, 'square', 0.05)), 20.6)
      .to(this.black, { opacity: 1, duration: 1.8, ease: 'power1.in' }, 21.6)
      .add(sfx(() => synth.whistle(1, 0.9)), 22.6)
      .set({}, {}, END);
  }
}

export const LAST_LIGHT_SCENES: SceneClass[] = [LastLightScene];
