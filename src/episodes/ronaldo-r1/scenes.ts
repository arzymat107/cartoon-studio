/**
 * Ronaldo R1 check: the portrait big, the full figure in a few expressions, then a motion test.
 *
 *   npm run frames -- --episode ronaldo-r1 0.5 2.5 5 9
 *
 * The first second is the portrait at 1:1 in the top-left corner (its 680 × 880 frame = stage pixels
 * 0..680 × 0..880), for laying a reference photo over it.
 */
import { TextLabel, type FigureExpression } from '@/components';
import { Actor, Scene, type SceneClass, type Timeline } from '@/engine';
import { figureActions as act } from '@/animations';
import { createRonaldoPortrait, RonaldoFigure } from '@/components/figures/players/ronaldo';

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const label = (text: string, x: number, y: number, fontSize = 40) =>
  new TextLabel({ text, x, y, fontSize, font: FONT, weight: 400, color: '#1d120d' });

class PortraitScene extends Scene {
  readonly title = 'Ronaldo R1 – portrait and expressions';
  private figures: RonaldoFigure[] = [];

  build(): void {
    const { width, height } = this.stage;
    const bg = new Actor({ name: 'bg' });
    bg.draw('rect', { x: 0, y: 0, width, height, fill: '#f3ede2' });
    this.add(bg, label('RONALDO · R1', width / 2, 110, 60));
    this.add(createRonaldoPortrait({ x: 540, y: 960, scale: 1.0 }));
    const row: [string, FigureExpression][] = [['NEUTRAL', 'neutral'], ['HAPPY', 'happy'], ['ANGRY', 'angry'], ['SHOCKED', 'shocked'], ['SMUG', 'smug']];
    row.forEach(([name, expression], i) => {
      const x = 120 + i * 210;
      const fig = new RonaldoFigure({ x, y: 1700, scale: 0.9, expression });
      this.figures.push(fig);
      this.add(fig, label(name, x, 1760, 32));
    });
  }

  animate(tl: Timeline): void {
    tl.set({}, {}, 2);
    for (const f of this.figures) tl.add(act.blinkRandomly(f, 2), 0);
  }
}

class MotionScene extends Scene {
  readonly title = 'Ronaldo R1 – motion test';
  private cr!: RonaldoFigure;

  build(): void {
    const { width, height } = this.stage;
    const bg = new Actor({ name: 'bg' });
    bg.draw('rect', { x: 0, y: 0, width, height, fill: '#cfe8f7' });
    bg.draw('rect', { x: 0, y: 1500, width, height: height - 1500, fill: '#6aa84f' });
    this.cr = new RonaldoFigure({ x: -150, y: 1640, scale: 1.7 });
    this.add(bg, this.cr, label('R1 · MOTION TEST', width / 2, 300, 56));
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

class TraceScene extends Scene {
  readonly title = 'Ronaldo R1 – 1:1 for tracing';

  build(): void {
    const { width, height } = this.stage;
    const bg = new Actor({ name: 'bg' });
    bg.draw('rect', { x: 0, y: 0, width, height, fill: '#ffffff' });
    this.add(bg, createRonaldoPortrait({ x: 340, y: 850, scale: 1 }));
  }

  animate(tl: Timeline): void {
    tl.set({}, {}, 1);
  }
}

export const RONALDO_R1_SCENES: SceneClass[] = [TraceScene, PortraitScene, MotionScene];
