/**
 * Procedural cartoon sound effects made with the Web Audio API – no files needed.
 * Each function plays immediately; use the `sfx()` animation helper to place them on a timeline.
 */
import { audio } from './AudioEngine';

interface ToneOptions {
  type?: OscillatorType;
  /** Start frequency in Hz. */
  from: number;
  /** End frequency in Hz (glide). */
  to?: number;
  duration: number;
  volume?: number;
  attack?: number;
  delay?: number;
  /** Vibrato: depth in Hz and speed in Hz. */
  vibrato?: { depth: number; rate: number };
}

function tone({ type = 'sine', from, to = from, duration, volume = 0.2, attack = 0.005, delay = 0, vibrato }: ToneOptions): void {
  const ctx = audio.context;
  const t = audio.now() + delay;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + duration);

  if (vibrato) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = vibrato.rate;
    depth.gain.value = vibrato.depth;
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + duration + 0.05);
    audio.track(lfo);
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(gain).connect(audio.output);
  osc.start(t);
  osc.stop(t + duration + 0.05);
  audio.track(osc);
}

let noiseBuffer: AudioBuffer | null = null;

interface NoiseOptions {
  duration: number;
  volume?: number;
  filter?: BiquadFilterType;
  /** Filter frequency at the start / end, in Hz. */
  from: number;
  to?: number;
  q?: number;
  /** Fade-in time; longer = swelling sound (crowds). */
  attack?: number;
}

function noise({ duration, volume = 0.15, filter = 'lowpass', from, to = from, q = 1, attack = 0 }: NoiseOptions): void {
  const ctx = audio.context;
  if (!noiseBuffer) {
    const length = ctx.sampleRate * 2;
    noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t = audio.now();
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const biquad = ctx.createBiquadFilter();
  biquad.type = filter;
  biquad.Q.value = q;
  biquad.frequency.setValueAtTime(from, t);
  if (to !== from) biquad.frequency.exponentialRampToValueAtTime(to, t + duration);

  const gain = ctx.createGain();
  if (attack > 0) {
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + attack);
  } else {
    gain.gain.setValueAtTime(volume, t);
  }
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  source.connect(biquad).connect(gain).connect(audio.output);
  source.start(t, Math.random());
  source.stop(t + duration + 0.05);
  audio.track(source);
}

const random = (min: number, max: number) => min + Math.random() * (max - min);

export const synth = {
  /** Bubble / pop-in. */
  pop: () => tone({ from: 450, to: 1400, duration: 0.09, volume: 0.25 }),

  /** Cartoon spring – jumps. */
  boing: () => tone({ type: 'triangle', from: 150, to: 620, duration: 0.32, volume: 0.22 }),

  /** Soft footstep. */
  step: () => noise({ duration: 0.07, volume: 0.18, from: random(350, 550) }),

  /** Air swish – fast moves, camera zooms. */
  whoosh: () => noise({ duration: 0.55, volume: 0.12, filter: 'bandpass', from: 300, to: 2600, q: 1.2 }),

  /** Cartoon dust-cloud "poof" – someone vanishes. */
  poof: () => {
    noise({ duration: 0.45, volume: 0.32, filter: 'lowpass', from: 2400, to: 220, attack: 0.01 });
    tone({ from: 220, to: 70, duration: 0.2, volume: 0.22 });
  },

  /** A little bird. */
  chirp: () => {
    const base = random(2600, 3600);
    const count = Math.random() < 0.5 ? 2 : 3;
    for (let i = 0; i < count; i++) {
      tone({ from: base, to: base * 1.35, duration: 0.06, volume: 0.05, delay: i * 0.09 });
    }
  },

  /** One syllable of gibberish voice. `pitch` 1 = medium, 0.8 = deeper, 1.5 = higher. */
  blip: (pitch = 1, wave: OscillatorType = 'triangle') => {
    const freq = 230 * pitch * random(0.85, 1.3);
    tone({ type: wave, from: freq, to: freq * random(0.8, 1.15), duration: 0.08, volume: 0.1 });
  },

  /** A musical note (see `melody()` for writing tunes). */
  note: (frequency: number, duration: number, wave: OscillatorType = 'triangle', volume = 0.12) =>
    tone({ type: wave, from: frequency, duration: Math.max(duration, 0.05), volume, attack: 0.01 }),

  // ── Sports ───────────────────────────────────────────────────────────

  /** Foot hits ball: low thump plus a leather slap. */
  kick: (power = 1) => {
    tone({ from: 160, to: 45, duration: 0.18, volume: 0.35 * power });
    noise({ duration: 0.05, volume: 0.25 * power, filter: 'bandpass', from: 1800, q: 0.8 });
  },

  /** Ball hits the metal post or crossbar. */
  clang: () => {
    for (const [freq, vol] of [[720, 0.16], [1130, 0.1], [1790, 0.06]] as const) {
      tone({ type: 'triangle', from: freq, to: freq * 0.98, duration: 1.1, volume: vol });
    }
    noise({ duration: 0.04, volume: 0.2, filter: 'highpass', from: 2500 });
  },

  /** Ball into the net. */
  swish: () => noise({ duration: 0.4, volume: 0.14, filter: 'highpass', from: 1500, to: 4000 }),

  /** Referee whistle: `blasts` short blows. */
  whistle: (blasts = 1, length = 0.35) => {
    for (let i = 0; i < blasts; i++) {
      tone({
        type: 'sine', from: 2900, duration: length, volume: 0.09, attack: 0.02,
        delay: i * (length + 0.12), vibrato: { depth: 90, rate: 32 },
      });
    }
  },

  /** Stadium erupts. */
  cheer: (duration = 2.5) => {
    noise({ duration, volume: 0.22, filter: 'bandpass', from: 700, to: 1100, q: 0.6, attack: 0.25 });
    noise({ duration: duration * 0.9, volume: 0.12, filter: 'bandpass', from: 2200, to: 2600, q: 0.8, attack: 0.2 });
  },

  /** Crowd groans "ohhh" after a miss. */
  groan: (duration = 1.6) =>
    noise({ duration, volume: 0.2, filter: 'bandpass', from: 650, to: 280, q: 1.4, attack: 0.15 }),

  /** Background crowd murmur – play repeatedly (see `crowdMurmur()`). */
  murmur: (duration = 2.2) =>
    noise({ duration, volume: 0.05, filter: 'bandpass', from: 450, q: 0.5, attack: 0.4 }),
};

const SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "A4" → 440, "C#5" → 554.37, "Bb3" → 233.08 */
export function noteFrequency(note: string): number {
  const match = /^([A-G])(#|b)?(\d)$/.exec(note);
  if (!match) throw new Error(`Invalid note "${note}" – use e.g. C4, F#5, Bb3`);
  const [, letter, accidental, octave] = match;
  const midi = (Number(octave) + 1) * 12 + SEMITONES[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}
