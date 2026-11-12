/**
 * Body checks: the same walk several ways, one above the other.
 *
 * `body` (three lanes):
 *   1. cut-out body (PNG parts on the skeleton, smooth)
 *   2. meta.ai frames drawn from words, at 12 fps
 *   3. meta.ai redraws of the cut-out's own 12 poses, at 12 fps
 * `body-full` (two lanes, bigger):
 *   1. cut-out body as cut (far limbs half missing)
 *   6. cut-out body with every part complete (bodies/normal-full, made by normal/complete.py)
 * `body-clean` (two lanes, bigger):
 *   4. the cut-out's own 12 poses, cleaned up (walk/clean.py, no meta.ai), at 12 fps
 *   5. the same with 24 poses, at 24 fps (walk/clean-24)
 *
 *   npm run frames -- --episode body 0.2 0.8 1.05 1.3 3
 *   npm run frames -- --episode body-clean 0.2 0.8 1.05 1.3 3
 */
import { Actor, Scene, type SceneClass, type Timeline } from '@/engine';
import { CutoutFigure } from '@/figures/cutout';
import { FrameFigure, walkFrames } from '@/figures/frames';
import { walk } from '@/figures/gait';

const FROM = 160;
const TO = 860;
const BACK = 300;

interface LaneSpec {
  label: string;
  /** A frame set (walk/…), or undefined for the cut-out body. */
  set?: string;
  /** The body (bodies/<body>), normal by default. */
  body?: string;
}

function lane(ground: number, label: string, width: number): Actor {
  const a = new Actor({ name: `lane-${label}` });
  a.draw('rect', { x: 0, y: ground - 10, width, height: 40, fill: '#5f8a4a' });
  const text = a.draw('text', {
    x: 40, y: ground + 19, fill: '#f1ecdf', 'font-family': 'sans-serif', 'font-size': 24, 'font-weight': 700,
  });
  text.textContent = label;
  return a;
}

/** A scene with one walking man per lane, grounds at `grounds`, figures at `scale`. */
function compare(title: string, specs: LaneSpec[], grounds: number[], scale: number): SceneClass {
  return class CompareScene extends Scene {
    readonly title = title;
    private men: (CutoutFigure | FrameFigure)[] = [];

    build(): void {
      const { width, height } = this.stage;
      const bg = new Actor({ name: 'bg' });
      bg.draw('rect', { x: 0, y: 0, width, height, fill: '#d9d2c3' });
      this.add(bg);
      specs.forEach(({ label, set, body = 'normal' }, i) => {
        const at = { x: FROM, y: grounds[i], scale };
        const man = set ? new FrameFigure(body, { set, ...at }) : new CutoutFigure(body, at);
        this.men.push(man);
        this.add(lane(grounds[i], label, width));
      });
      this.add(...this.men);
    }

    animate(tl: Timeline): void {
      // Each man: stand, walk across, stand, walk back (their walks can differ a little in length).
      for (const man of this.men) {
        const go = (from: number, to: number) =>
          man instanceof FrameFigure ? walkFrames(man, { from, to }) : walk(man, { from, to });
        const there = go(FROM, TO);
        tl.add(there, 0.4).add(go(TO, BACK), 0.4 + there.duration() + 0.5);
      }
      tl.set({}, {}, '+=0.6');
    }
  };
}

export const BODY_SCENES: SceneClass[] = [compare('Normal body – cut-out vs frames', [
  { label: '1 · cut-out parts' },
  { label: '2 · meta.ai frames from words · 12 fps', set: 'walk' },
  { label: '3 · meta.ai redraws of the cut-out poses · 12 fps', set: 'walk/redraw-white' },
], [660, 1270, 1880], 1.4)];

export const BODY_CLEAN_SCENES: SceneClass[] = [compare('Normal body – cleaned-up cut-out frames', [
  { label: '4 · cut-out poses, cleaned up · 12 fps', set: 'walk/clean' },
  { label: '5 · cut-out poses, cleaned up · 24 fps', set: 'walk/clean-24' },
], [900, 1780], 1.9)];

export const BODY_FULL_SCENES: SceneClass[] = [compare('Normal body – parts as cut vs complete', [
  { label: '1 · cut-out parts, as cut' },
  { label: '6 · cut-out parts, every part complete', body: 'normal-full' },
], [900, 1780], 1.9)];
