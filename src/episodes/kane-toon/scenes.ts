/**
 * Style check for the Toon version of Kane: the traced K1 head next to the new Toon head, then the
 * Toon figure in a few expressions. Not a Short – a page to judge the look.
 *
 *   npm run frames -- --episode kane-toon 0.5
 */
import { TextLabel, type FigureExpression } from '@/components';
import { Actor, Scene, type SceneClass, type Timeline } from '@/engine';
import { figureActions as act } from '@/animations';
import { createKaneToonPortrait, KaneToonFigure } from '@/components/figures/players/kane-toon';
import { createKaneCaricaturePortrait, KaneCaricatureFigure } from '@/components/figures/players/kane-caricature';

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';
const label = (text: string, x: number, y: number, fontSize = 44) =>
  new TextLabel({ text, x, y, fontSize, font: FONT, weight: 400, color: '#1d120d' });

class CompareScene extends Scene {
  readonly title = 'Kane – T1 vs T2';
  private figures: (KaneToonFigure | KaneCaricatureFigure)[] = [];

  build(): void {
    const { width, height } = this.stage;
    const bg = new Actor({ name: 'bg' });
    bg.draw('rect', { x: 0, y: 0, width, height, fill: '#f3ede2' });
    this.add(bg, label('KANE · TOON T1 vs CARICATURE T2', width / 2, 110, 56));

    this.add(createKaneToonPortrait({ x: 280, y: 760, scale: 0.6 }), label('TOON (T1)', 280, 900));
    this.add(createKaneCaricaturePortrait({ x: 800, y: 760, scale: 0.6 }), label('CARICATURE (T2)', 800, 900));

    const row: [string, FigureExpression, boolean][] = [
      ['T1', 'neutral', false], ['T2', 'neutral', true], ['HAPPY', 'happy', true], ['ANGRY', 'angry', true], ['SHOCKED', 'shocked', true],
    ];
    row.forEach(([name, expression, t2], i) => {
      const x = 120 + i * 210;
      const fig = t2 ? new KaneCaricatureFigure({ x, y: 1640, scale: 0.95, expression }) : new KaneToonFigure({ x, y: 1640, scale: 0.95, expression });
      this.figures.push(fig);
      this.add(fig, label(name, x, 1700, 36));
    });

  }

  animate(tl: Timeline): void {
    tl.set({}, {}, 1);
    for (const f of this.figures) tl.add(act.blinkRandomly(f, 1), 0);
  }
}

/** Toon Kane in motion: walk in, wave, celebrate, rage, laugh, dance – to judge how the body bends. */
class MotionScene extends Scene {
  readonly title = 'Kane T2 – motion test';
  private kane!: KaneCaricatureFigure;

  build(): void {
    const { width, height } = this.stage;
    const bg = new Actor({ name: 'bg' });
    bg.draw('rect', { x: 0, y: 0, width, height, fill: '#cfe8f7' });
    bg.draw('rect', { x: 0, y: 1500, width, height: height - 1500, fill: '#6aa84f' });
    this.kane = new KaneCaricatureFigure({ x: -150, y: 1640, scale: 1.7 });
    this.add(bg, this.kane, label('T2 · MOTION TEST', width / 2, 300, 56));
  }

  animate(tl: Timeline): void {
    const k = this.kane;
    tl.add(act.walk(k, { to: 540, duration: 2.2 }))
      .add(act.wave(k))
      .add(act.celebrate(k))
      .add(act.rage(k))
      .add(act.laugh(k, { voice: false }))
      .add(act.dance(k))
      .add(act.run(k, { to: 1300, duration: 1.2 }));
    tl.add(act.blinkRandomly(k, tl.duration()), 0);
  }
}

export const KANE_TOON_SCENES: SceneClass[] = [CompareScene, MotionScene];
