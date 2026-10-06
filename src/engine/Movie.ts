import { gsap } from 'gsap';
import type { Scene } from './Scene';
import type { Stage } from './Stage';
import type { Timeline } from './types';

export type SceneClass = new (stage: Stage) => Scene;

export interface Episode {
  title: string;
  scenes: SceneClass[];
}

export interface Chapter {
  title: string;
  time: number;
}

export interface MovieOptions {
  /** Fade duration between scenes, in seconds. */
  transition?: number;
}

/** Builds every scene of an episode and joins their timelines into one master timeline. */
export class Movie {
  readonly timeline: Timeline;
  readonly scenes: Scene[] = [];
  readonly chapters: Chapter[] = [];

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
  }
}
