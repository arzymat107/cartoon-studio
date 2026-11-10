/**
 * Ronaldo R2 (Cel) check: the portrait big next to the full figure, a row of expressions, then a
 * motion test.
 *
 *   npm run frames -- --episode ronaldo-r2 0.5 2.5 5 9
 */
import { TextLabel, type FigureExpression } from '@/components';
import { Actor, Scene, type SceneClass, type Timeline } from '@/engine';
import { figureActions as act } from '@/animations';
import { createRonaldoCelPortrait, RonaldoCelFigure } from '@/components/figures/players/ronaldo-cel';

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const label = (text: string, x: number, y: number, fontSize = 40) =>
  new TextLabel({ text, x, y, fontSize, font: FONT, weight: 400, color: '#1d120d' });

class PortraitScene extends Scene {
  readonly title = 'Ronaldo R2 – portrait and expressions';
  private figures: RonaldoCelFigure[] = [];

  build(): void {
    const { width, height } = this.stage;
    const bg = new Actor({ name: 'bg' });
    bg.draw('rect', { x: 0, y: 0, width, height, fill: '#efe6d6' });
    this.add(bg, label('RONALDO · R2 CEL', width / 2, 110, 60));
    this.add(createRonaldoCelPortrait({ x: 340, y: 820, scale: 0.75 }));
    const big = new RonaldoCelFigure({ x: 830, y: 1020, scale: 1.4 });
    this.figures.push(big);
    this.add(big);
    const row: [string, FigureExpression][] = [['HAPPY', 'happy'], ['ANGRY', 'angry'], ['SHOCKED', 'shocked'], ['SMUG', 'smug'], ['SAD', 'sad']];
    row.forEach(([name, expression], i) => {
      const x = 120 + i * 210;
      const fig = new RonaldoCelFigure({ x, y: 1680, scale: 0.95, expression });
      this.figures.push(fig);
      this.add(fig, label(name, x, 1740, 32));
    });
  }

  animate(tl: Timeline): void {
    tl.set({}, {}, 2);
    for (const f of this.figures) tl.add(act.blinkRandomly(f, 2), 0);
  }
}

class MotionScene extends Scene {
  readonly title = 'Ronaldo R2 – motion test';
  private cr!: RonaldoCelFigure;

  build(): void {
    const { width, height } = this.stage;
    const bg = new Actor({ name: 'bg' });
    bg.draw('rect', { x: 0, y: 0, width, height, fill: '#d9cdb6' });
    bg.draw('rect', { x: 0, y: 1500, width, height: height - 1500, fill: '#8a6a4a' });
    this.cr = new RonaldoCelFigure({ x: -150, y: 1640, scale: 1.7 });
    this.add(bg, this.cr, label('R2 · MOTION TEST', width / 2, 300, 56));
  }

  animate(tl: Timeline): void {
    const c = this.cr;
    tl.add(act.walk(c, { to: 540, duration: 2.2 }))
      .add(act.wave(c))
      .add(act.celebrate(c))
      .add(act.rage(c))
      .add(act.laugh(c, { voice: false }))
      .add(act.run(c, { to: 1300, duration: 1.2 }));
    tl.add(act.blinkRandomly(c, tl.duration()), 0);
  }
}

export const RONALDO_R2_SCENES: SceneClass[] = [PortraitScene, MotionScene];
