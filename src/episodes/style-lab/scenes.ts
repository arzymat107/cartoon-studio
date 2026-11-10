/**
 * Style lab: every candidate house style (columns, styles.ts) × every player (rows, heads.ts) on one
 * sheet, to pick the channel's own look at a glance. Heads only.
 *
 *   npm run frames -- --episode style-lab 0.5
 */
import { createKanePortrait, createMbappePortrait, createYamalPortrait, SvgArt, TextLabel } from '@/components';
import { Actor, Scene, type SceneClass, type Timeline } from '@/engine';
import { HEADS } from './heads';
import { STYLES } from './styles';

export const LAB_WIDTH = 1800;
export const LAB_HEIGHT = 2300;

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const label = (text: string, x: number, y: number, fontSize = 40) =>
  new TextLabel({ text, x, y, fontSize, font: FONT, weight: 400, color: '#1d120d' });

const COL0 = 150, COL_W = 275, ROW0 = 170, ROW_H = 350, SCALE = 0.44;

class GridScene extends Scene {
  readonly title = 'Style lab – all styles × all players';

  build(): void {
    const { width, height } = this.stage;
    const bg = new Actor({ name: 'bg' });
    bg.draw('rect', { x: 0, y: 0, width, height, fill: '#f3ede2' });
    HEADS.forEach((_, r) => {
      if (r % 2) bg.draw('rect', { x: 0, y: ROW0 + r * ROW_H, width, height: ROW_H, fill: '#ebe3d4' });
    });
    this.add(bg);

    STYLES.forEach(([name], c) => this.add(label(name, COL0 + COL_W * c + COL_W / 2, 110)));
    HEADS.forEach((head, r) => {
      const chin = ROW0 + r * ROW_H + 318;
      this.add(label(head.name, 76, chin - 150, 29));
      STYLES.forEach(([, style], c) => {
        const markup = style(head, `s${r}${c}`);
        this.add(new SvgArt({ markup, x: COL0 + COL_W * c + COL_W / 2, y: chin, scale: SCALE, originX: 300, originY: 652 }));
      });
    });
  }

  animate(tl: Timeline): void {
    tl.set({}, {}, 1);
  }
}

/** For comparison: the detailed traced portraits (K1, M1, Y1) – the most detailed drawings we have. */
class PortraitScene extends Scene {
  readonly title = 'Style lab – traced portraits for comparison';

  build(): void {
    const { width, height } = this.stage;
    const bg = new Actor({ name: 'bg' });
    bg.draw('rect', { x: 0, y: 0, width, height, fill: '#f3ede2' });
    this.add(bg, label('TRACED PORTRAITS (K1 · Y1 · M1)', width / 2, 200, 60));
    this.add(createKanePortrait({ x: 330, y: 1100, scale: 0.75 }), createYamalPortrait({ x: 900, y: 1100, scale: 0.75 }), createMbappePortrait({ x: 1470, y: 1100, scale: 0.75 }));
  }

  animate(tl: Timeline): void {
    tl.set({}, {}, 1);
  }
}

export const STYLE_LAB_SCENES: SceneClass[] = [GridScene, PortraitScene];
