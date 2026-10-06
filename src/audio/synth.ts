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
}

function tone({ type = 'sine', from, to = from, duration, volume = 0.2, attack = 0.005, delay = 0 }: ToneOptions): void {
  const ctx = audio.context;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(gain).connect(audio.output);
  osc.start(t);
  osc.stop(t + duration + 0.05);
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
}

function noise({ duration, volume = 0.15, filter = 'lowpass', from, to = from, q = 1 }: NoiseOptions): void {
  const ctx = audio.context;
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;

  const biquad = ctx.createBiquadFilter();
  biquad.type = filter;
  biquad.Q.value = q;
  biquad.frequency.setValueAtTime(from, t);
  if (to !== from) biquad.frequency.exponentialRampToValueAtTime(to, t + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  source.connect(biquad).connect(gain).connect(audio.output);
  source.start(t);
  source.stop(t + duration + 0.05);
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
