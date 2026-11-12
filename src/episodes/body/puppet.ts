/**
 * The hoodie puppet (pieces from the meta.ai rig sheets in data-for-cartoons/bodies/parts):
 * walks in, claps, walks on.
 *
 *   npm run frames -- --episode hoodie 0.2 1 2 2.6 3 3.4 5
 */
import { Actor, Scene, type SceneClass, type Timeline } from '@/engine';
import { walk } from '@/figures/gait';
import { PuppetFigure, clap } from '@/figures/puppet';

const GROUND = 1360;
const SCALE = 1.9;

class WalkClapScene extends Scene {
  readonly title = 'Hoodie puppet – walk and clap';
  private man!: PuppetFigure;

  build(): void {
    const { width, height } = this.stage;
    const bg = new Actor({ name: 'bg' });
    bg.draw('rect', { x: 0, y: 0, width, height, fill: '#efe6d2' });
    bg.draw('rect', { x: 0, y: GROUND - 6, width, height: height - GROUND + 6, fill: '#7fa463' });
    this.man = new PuppetFigure('hoodie', { x: 170, y: GROUND, scale: SCALE });
    this.add(bg, this.man);
  }

  animate(tl: Timeline): void {
    const { man } = this;
    const walkIn = walk(man, { from: 170, to: 540 });
    tl.add(walkIn, 0.4);
    const clapAt = 0.4 + walkIn.duration() + 0.3;
    const claps = clap(man, { claps: 5 });
    tl.add(claps, clapAt);
    tl.add(walk(man, { from: 540, to: 900 }), clapAt + claps.duration() + 0.3);
    tl.set({}, {}, '+=0.6');
  }
}

export const HOODIE_SCENES: SceneClass[] = [WalkClapScene];
