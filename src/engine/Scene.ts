import { Actor } from './Actor';
import { Camera } from './Camera';
import type { Stage } from './Stage';
import type { Timeline } from './types';

/**
 * One scene of a movie. Subclasses:
 *   1. build()   – create actors and add them with this.add(...)
 *   2. animate() – put tweens on the scene's timeline
 *
 * Keep the timeline finite (no `repeat: -1`): the player needs a known length to scrub.
 */
export abstract class Scene {
  /** Shown in the player's chapter list. */
  abstract readonly title: string;

  readonly stage: Stage;
  /** Whole scene; the movie fades it in and out. */
  readonly root: Actor;
  /** World container – everything added with add() is affected by camera moves. */
  readonly camera: Camera;
  /** Screen-space layer (titles, subtitles) – not affected by the camera. */
  readonly overlay: Actor;

  constructor(stage: Stage) {
    this.stage = stage;
    this.root = new Actor({ name: 'Scene', opacity: 0 });
    this.camera = new Camera(stage.width, stage.height);
    this.overlay = new Actor({ name: 'Overlay' });
    this.root.add(this.camera, this.overlay);
  }

  /** Add actors to the world (drawn in order: first = furthest back). */
  protected add(...actors: Actor[]): void {
    this.camera.add(...actors);
  }

  abstract build(): void;

  abstract animate(tl: Timeline): void;
}
