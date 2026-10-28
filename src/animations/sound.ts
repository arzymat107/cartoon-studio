/**
 * Put sound on the timeline.
 *   tl.add(sfx(synth.pop), 2)                       one-shot synthesized effect
 *   tl.add(clip('music/theme', { volume: 0.3 }), 0) sound file, stays in sync when scrubbing
 *   tl.add(melody('C5 E5 G5 C6:2'), 0)              little tune
 */
import { gsap } from 'gsap';
import { audio, noteFrequency, soundInfo, synth } from '@/audio';
import type { Timeline, Tween } from '@/engine';

/** Run `play` when the playhead passes this point during playback (never while scrubbing). */
export function sfx(play: () => void): Timeline {
  return gsap.timeline().call(() => {
    if (audio.live) play();
  });
}

export interface ClipOptions {
  volume?: number;
  /** Start this many seconds into the file. */
  offset?: number;
  /** Override the length (e.g. to cut a file short, or with `loop` to fill a scene). */
  duration?: number;
  loop?: boolean;
}

/** Play a sound file from src/assets/sounds/ (see that folder's README). */
export function clip(name: string, { volume = 1, offset = 0, duration, loop = false }: ClipOptions = {}): Tween {
  const info = soundInfo(name);
  if (!info) {
    console.warn(`Sound "${name}" not found in src/assets/sounds/`);
    return gsap.to({}, { duration: duration ?? 0 });
  }
  const marker = gsap.to({}, { duration: duration ?? Math.max(0, info.duration - offset), ease: 'none' });
  const element = new Audio(info.url);
  element.preload = 'auto';
  element.loop = loop;
  audio.addClip({ element, marker, offset, volume, fileDuration: info.duration });
  return marker;
}

/**
 * A recorded sound if the file exists, otherwise the `fallback` (usually a synthesized one), so a
 * scene works before its recordings are added:
 *   tl.add(sound('sfx/poof', () => sfx(synth.poof)), 2)
 */
export function sound(name: string, fallback?: () => Timeline | Tween, options?: ClipOptions): Timeline {
  const tl = gsap.timeline();
  if (soundInfo(name)) tl.add(clip(name, options), 0);
  else if (fallback) tl.add(fallback(), 0);
  return tl;
}

/** Length of a sound file in seconds, or undefined if it doesn't exist. */
export const soundDuration = (name: string): number | undefined => soundInfo(name)?.duration;

export interface MelodyOptions {
  bpm?: number;
  wave?: OscillatorType;
  volume?: number;
}

/**
 * A tune in simple text notation: notes separated by spaces, `:n` = length in beats, `-` = rest.
 *   melody('C5 E5 G5 - C6:2', { bpm: 180 })
 */
export function melody(notes: string, { bpm = 160, wave = 'triangle', volume = 0.12 }: MelodyOptions = {}): Timeline {
  const tl = gsap.timeline();
  const beat = 60 / bpm;
  let time = 0;
  for (const token of notes.trim().split(/\s+/)) {
    const [note, length = '1'] = token.split(':');
    const beats = Number(length);
    if (note !== '-') {
      const frequency = noteFrequency(note);
      tl.add(sfx(() => synth.note(frequency, beats * beat * 0.9, wave, volume)), time);
    }
    time += beats * beat;
  }
  return tl.set({}, {}, time);
}

/** Birds chirping at random moments over `duration` seconds. */
export function birdsong(duration: number, { min = 1.2, max = 3.5 } = {}): Timeline {
  const tl = gsap.timeline();
  for (let t = gsap.utils.random(0.3, min); t < duration; t += gsap.utils.random(min, max)) {
    tl.add(sfx(synth.chirp), t);
  }
  return tl.set({}, {}, duration);
}
