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

/** State while the soundtrack is rendered offline for video export. */
interface OfflineRender {
  ctx: OfflineAudioContext;
  output: GainNode;
  /** Timeline position being rendered; synthesized sounds are scheduled at this time. */
  time: number;
}

/**
 * Owns all sound for the movie.
 *
 * - Synthesized one-shot sounds play only while the movie is playing (never while scrubbing);
 *   they check `audio.live`.
 * - Sound-file clips are re-synced to the timeline on every frame, pause, seek and speed change,
 *   so scrubbing and changing speed keep picture and sound together.
 * - `renderOffline()` renders the complete soundtrack to an AudioBuffer for video export.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private movie: Movie | null = null;
  private readonly clips: ClipInstance[] = [];
  private _muted = false;
  private offline: OfflineRender | null = null;
  /** Synthesized sounds still playing, so they can be cut off on pause or seek. */
  private readonly playing = new Set<AudioScheduledSourceNode>();

  /** Web Audio context, created on first use (the offline context while exporting). */
  get context(): BaseAudioContext {
    if (this.offline) return this.offline.ctx;
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
    if (this.offline) return this.offline.output;
    return this.context && this.masterGain!;
  }

  /** The time at which a sound triggered now should start, in context time. */
  now(): number {
    return this.offline ? this.offline.time : this.context.currentTime;
  }

  /** Browsers block sound until the user interacts: call this from a click or key handler. */
  unlock(): void {
    void (this.context as AudioContext).resume();
  }

  get muted(): boolean {
    return this._muted;
  }

  set muted(value: boolean) {
    this._muted = value;
    if (this.masterGain) this.masterGain.gain.value = value ? 0 : 1;
    this.sync();
  }

  /** True while sounds should be produced. One-shot sounds only fire when this is true. */
  get live(): boolean {
    if (this.offline) return true;
    return !this._muted && !!this.movie?.playing && this.ctx?.state === 'running';
  }

  attach(movie: Movie): void {
    this.movie = movie;
    movie.onChange(() => this.sync());
  }

  addClip(clip: ClipInstance): void {
    this.clips.push(clip);
  }

  /** Register a synthesized sound so it stops when playback pauses. */
  track(node: AudioScheduledSourceNode): void {
    if (this.offline) return;
    this.playing.add(node);
    node.addEventListener('ended', () => this.playing.delete(node));
  }

  /**
   * Render the whole soundtrack (synthesized sounds and files) without playing it.
   * Walks the timeline in small steps so every sound starts at its exact moment.
   */
  async renderOffline(sampleRate = 48000): Promise<AudioBuffer> {
    const movie = this.movie;
    if (!movie) throw new Error('audio.attach(movie) must be called first');
    movie.pause();

    const duration = movie.duration;
    const ctx = new OfflineAudioContext(2, Math.ceil((duration + 0.5) * sampleRate), sampleRate);
    const output = ctx.createGain();
    output.connect(ctx.destination);

    const buffers = new Map<string, AudioBuffer>();
    for (const clip of this.clips) {
      const url = clip.element.src;
      if (!buffers.has(url)) buffers.set(url, await ctx.decodeAudioData(await (await fetch(url)).arrayBuffer()));
    }

    this.offline = { ctx, output, time: 0 };
    const started = new Set<ClipInstance>();
    const step = 1 / 250;
    try {
      movie.timeline.time(0, true);
      for (let t = 0; t <= duration + step; t += step) {
        this.offline.time = Math.min(t, duration);
        // Not suppressing events makes the sfx() callbacks fire as the playhead passes them.
        movie.timeline.time(this.offline.time, false);

        for (const clip of this.clips) {
          if (started.has(clip) || clip.marker.progress() <= 0) continue;
          started.add(clip);
          const source = ctx.createBufferSource();
          source.buffer = buffers.get(clip.element.src)!;
          source.loop = clip.element.loop;
          const gain = ctx.createGain();
          gain.gain.value = clip.volume;
          source.connect(gain).connect(output);
          const start = this.offline.time - clip.marker.time();
          source.start(Math.max(0, start), clip.offset);
          source.stop(start + clip.marker.duration());
        }
      }
    } finally {
      this.offline = null;
      movie.seek(0);
    }
    return ctx.startRendering();
  }

  private sync(): void {
    const playing = !!this.movie?.playing;
    const speed = this.movie?.speed ?? 1;

    if (!playing && this.playing.size) {
      for (const node of this.playing) {
        try { node.stop(); } catch { /* already stopped */ }
      }
      this.playing.clear();
    }

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

/** Encode an AudioBuffer as a 16-bit PCM WAV file. */
export function encodeWav(buffer: AudioBuffer): Uint8Array {
  const channels = buffer.numberOfChannels;
  const frames = buffer.length;
  const bytes = new Uint8Array(44 + frames * channels * 2);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => [...value].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));

  text(0, 'RIFF');
  view.setUint32(4, 36 + frames * channels * 2, true);
  text(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, frames * channels * 2, true);

  const data = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels; c++) {
      view.setInt16(offset, Math.max(-1, Math.min(1, data[c][i])) * 0x7fff, true);
      offset += 2;
    }
  }
  return bytes;
}
