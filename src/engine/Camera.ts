import { Actor } from './Actor';

/**
 * A container that pans and zooms everything inside it.
 *
 *   tl.to(scene.camera, { ...scene.camera.focus(960, 600, 1.5), duration: 2 })
 */
export class Camera extends Actor {
  private readonly viewWidth: number;
  private readonly viewHeight: number;

  constructor(viewWidth: number, viewHeight: number) {
    super({ name: 'Camera' });
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
  }

  /** Tween values that center the view on world point (x, y) at the given zoom. */
  focus(x: number, y: number, zoom = 1) {
    return { x: this.viewWidth / 2 - x * zoom, y: this.viewHeight / 2 - y * zoom, scale: zoom };
  }

  /** Tween values for the default full-frame view. */
  reset() {
    return { x: 0, y: 0, scale: 1 };
  }
}
