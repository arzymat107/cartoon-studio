/**
 * Pose sheet: the cut-out body in place through one walk cycle, 12 (or 24) poses a second, each drawn
 * at the size and spot of the source meta.ai picture (same canvas, grey background), as
 * references for meta.ai to redraw cleanly. The canvas is wider than the picture (a long step
 * doesn't fit in it); the figure stays centred, at the picture's height and scale.
 *
 *   npm run frames -- --episode body-poses 0.04 0.12 0.21 0.29 0.37 0.46 0.54 0.62 0.71 0.79 0.87 0.96
 *   npm run frames -- --episode body-poses-24 <(i + 0.5) / 24 for i = 0…23>
 *
 * Pose 1 = the near leg's heel strike (like the first frame of the meta.ai walk prompts).
 */
import { gsap } from 'gsap';
import { Actor, Scene, type SceneClass, type Timeline } from '@/engine';
import { CutoutFigure } from '@/figures/cutout';
import { walkPose } from '@/figures/gait';

function poseSheet(POSES: number): SceneClass {
  return class PoseSheetScene extends Scene {
    readonly title = `Normal body – ${POSES} walk poses`;
    private man!: CutoutFigure;

    build(): void {
      const { width, height } = this.stage;
      const bg = new Actor({ name: 'bg' });
      bg.draw('rect', { x: 0, y: 0, width, height, fill: 'rgb(227,227,227)' });
      this.man = new CutoutFigure('normal');
      const { origin, size, pxPerUnit } = this.man.picture;
      Object.assign(this.man, { x: origin[0] + (width - size[0]) / 2, y: origin[1], scale: pxPerUnit });
      this.add(bg, this.man);
    }

    animate(tl: Timeline): void {
      const { man } = this;
      let pose = -1;
      const clock = {
        get t() { return pose; },
        set t(value: number) {
          pose = Math.min(POSES - 1, Math.max(0, Math.floor(value * POSES)));
          walkPose(man, 0.5 + pose / POSES);
        },
      };
      tl.add(gsap.fromTo(clock, { t: 0 }, { t: 1, duration: 1, ease: 'none', immediateRender: false }), 0);
    }
  };
}

export const BODY_POSE_SCENES: SceneClass[] = [poseSheet(12)];
export const BODY_POSE_24_SCENES: SceneClass[] = [poseSheet(24)];
