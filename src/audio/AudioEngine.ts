import type { Movie, Tween } from '@/engine';

/** One playing copy of a sound file, kept in sync with a marker tween on the timeline. */
export interface ClipInstance {
  element: HTMLAudioElement;
  /** Empty tween whose length is the clip's length; its playhead is the audio position. */
  marker: Tween;
  offset: number;
  volume: number;
  fileDuration: number;
}

/**
 * Owns all sound for the movie.
 *
 * - Synthesized one-shot sounds play only while the movie is playing (never while scrubbing);
 *   they check `audio.live`.
 * - Sound-file clips are re-synced to the timeline on every frame, pause, seek and speed change,
 *   so scrubbing and changing speed keep picture and sound together.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private movie: Movie | null = null;
  private readonly clips: ClipInstance[] = [];
  private _muted = false;

  /** Web Audio context, created on first use. */
  get context(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._muted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  /** Synthesized sounds connect here. */
  get output(): AudioNode {
    return this.context && this.masterGain!;
  }

  /** Browsers block sound until the user interacts: call this from a click or key handler. */
  unlock(): void {
    void this.context.resume();
  }

  get muted(): boolean {
    return this._muted;
  }

  set muted(value: boolean) {
    this._muted = value;
    if (this.masterGain) this.masterGain.gain.value = value ? 0 : 1;
    this.sync();
  }

  /** True while the movie plays with sound allowed. One-shot sounds only fire when this is true. */
  get live(): boolean {
    return !this._muted && !!this.movie?.playing && this.ctx?.state === 'running';
  }

  attach(movie: Movie): void {
    this.movie = movie;
    movie.onChange(() => this.sync());
  }

  addClip(clip: ClipInstance): void {
    this.clips.push(clip);
  }

  private sync(): void {
    const playing = !!this.movie?.playing;
    const speed = this.movie?.speed ?? 1;

    for (const clip of this.clips) {
      const { element, marker } = clip;
      const progress = marker.progress();

      if (playing && progress > 0 && progress < 1) {
        let position = marker.time() + clip.offset;
        if (element.loop && clip.fileDuration > 0) position %= clip.fileDuration;
        element.muted = this._muted;
        element.volume = clip.volume;
        element.playbackRate = speed;
        if (element.paused) {
          element.currentTime = position;
          element.play().catch(() => { /* blocked until the user interacts */ });
        } else if (Math.abs(element.currentTime - position) > 0.25) {
          element.currentTime = position;
        }
      } else if (!element.paused) {
        element.pause();
      }
    }
  }
}

export const audio = new AudioEngine();
