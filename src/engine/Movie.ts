import { gsap } from 'gsap';
import type { Scene } from './Scene';
import type { Stage } from './Stage';
import type { Timeline } from './types';

export type SceneClass = new (stage: Stage) => Scene;

export interface Episode {
  title: string;
  scenes: SceneClass[];
  /** Frame size. Default 1920×1080 (YouTube); use 1080×1920 for Shorts / TikTok / Reels. */
  width?: number;
  height?: number;
}

export interface Chapter {
  title: string;
  time: number;
}

export interface MovieOptions {
  /** Fade duration between scenes, in seconds. */
  transition?: number;
}

/**
 * Builds every scene of an episode and joins their timelines into one master timeline.
 * Control playback through the Movie (not the timeline) so listeners such as the
 * player UI and the audio engine stay in sync.
 */
export class Movie {
  readonly timeline: Timeline;
  readonly scenes: Scene[] = [];
  readonly chapters: Chapter[] = [];
  private readonly listeners = new Set<() => void>();

  constructor(stage: Stage, episode: Episode, { transition = 0.5 }: MovieOptions = {}) {
    this.timeline = gsap.timeline({ paused: true });

    for (const SceneType of episode.scenes) {
      const scene = new SceneType(stage);
      scene.build();
      stage.add(scene.root);

      const sceneTimeline = gsap.timeline();
      scene.animate(sceneTimeline);

      const start = this.timeline.duration();
      const end = start + Math.max(sceneTimeline.duration(), transition);
      this.timeline
        .to(scene.root, { opacity: 1, duration: transition }, start)
        .add(sceneTimeline, start)
        .to(scene.root, { opacity: 0, duration: transition }, end);

      this.scenes.push(scene);
      this.chapters.push({ title: scene.title, time: start });
    }

    this.timeline.eventCallback('onUpdate', () => this.notify());
    this.timeline.eventCallback('onComplete', () => this.notify());
  }

  get playing(): boolean {
    return !this.timeline.paused() && this.timeline.progress() < 1;
  }

  get time(): number {
    return this.timeline.time();
  }

  get duration(): number {
    return this.timeline.duration();
  }

  get speed(): number {
    return this.timeline.timeScale();
  }

  play(): void {
    if (this.timeline.progress() >= 1) this.timeline.restart();
    else this.timeline.play();
    this.notify();
  }

  pause(): void {
    this.timeline.pause();
    this.notify();
  }

  toggle(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  restart(): void {
    this.timeline.restart();
    this.notify();
  }

  seek(time: number): void {
    this.timeline.seek(Math.min(Math.max(time, 0), this.duration));
    this.notify();
  }

  setSpeed(speed: number): void {
    this.timeline.timeScale(speed);
    this.notify();
  }

  /** Called on every frame, play, pause, seek and speed change. Returns an unsubscribe function. */
  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
