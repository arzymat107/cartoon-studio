/**
 * Background sound for the "Same Night, Different Vibes" Short: a synthesized comedy groove,
 * distant-crowd room tone, gag effects and a laugh track (CC0 recordings in sounds/laughs/).
 * Each returns a timeline.
 */
import { gsap } from 'gsap';
import { clip, crowdMurmur, sfx } from '@/animations';
import { noteFrequency, synth } from '@/audio';
import type { Timeline } from '@/engine';

/** One bar per chord: root, fifth – an oom-pah bass line. */
const CHORDS: Record<string, [string, string]> = {
  C: ['C3', 'G2'], F: ['F2', 'C3'], G: ['G2', 'D3'], Am: ['A2', 'E3'],
};

/**
 * Cheeky oom-pah groove for `duration` seconds: bass on every beat, shaker off-beats, a kick on
 * 1 and 3, and a plucky chord stab on 2 and 4. `progression` = one chord per bar.
 */
export function groove(
  duration: number,
  { bpm = 132, volume = 0.07, progression = ['C', 'Am', 'F', 'G'], kick = true } = {},
): Timeline {
  const tl = gsap.timeline();
  const beat = 60 / bpm;
  for (let i = 0; i * beat < duration; i++) {
    const t = i * beat;
    const chord = progression[Math.floor(i / 4) % progression.length];
    const [root, fifth] = CHORDS[chord];
    const bass = noteFrequency(i % 2 ? fifth : root);
    tl.add(sfx(() => synth.note(bass, beat * 0.55, 'triangle', volume * 1.6)), t)
      .add(sfx(() => synth.step()), t + beat / 2);
    if (kick && i % 2 === 0) tl.add(sfx(() => synth.kick(0.18)), t);
    if (i % 2 === 1) {
      const stab = noteFrequency(root.replace(/\d/, (o) => String(Number(o) + 2)));
      tl.add(sfx(() => synth.note(stab, beat * 0.2, 'square', volume * 0.35)), t);
      tl.add(sfx(() => synth.note(stab * 1.26, beat * 0.2, 'square', volume * 0.25)), t);
    }
  }
  return tl.set({}, {}, duration);
}

/** Dressing room: the stadium crowd murmuring through the walls. */
export function roomTone(duration: number): Timeline {
  return crowdMurmur(duration);
}

/** Phone on vibrate: three short low buzzes. */
export function phoneBuzz(): Timeline {
  const tl = gsap.timeline();
  for (let i = 0; i < 3; i++) tl.add(sfx(() => synth.note(110, 0.14, 'sawtooth', 0.07)), i * 0.2);
  return tl;
}

const AUDIENCE = ['laughs/audience-1', 'laughs/audience-2', 'laughs/audience-3', 'laughs/audience-4'];
let nextAudience = 0;

/**
 * Sitcom laugh track: a recorded audience laugh (a different one each call, so repeats don't
 * sound canned), cut to `duration`.
 */
export function laughTrack(duration = 1.6): Timeline {
  const name = AUDIENCE[nextAudience++ % AUDIENCE.length];
  return gsap.timeline().add(clip(name, { volume: 0.55, duration: duration + 0.5 }), 0);
}

/** Ba-dum-tss. */
export function rimshot(): Timeline {
  return gsap.timeline()
    .add(sfx(() => synth.kick(0.6)), 0)
    .add(sfx(() => synth.kick(0.8)), 0.14)
    .add(sfx(synth.swish), 0.32);
}
