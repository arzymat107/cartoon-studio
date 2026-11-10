import { Actor, seededRandom, type ActorOptions } from '@/engine';

export interface StandsOptions extends ActorOptions {
  width: number;
  /** y of the roof edge and of the bottom of the stands. */
  top: number;
  bottom: number;
  /** Colors fans wear – use the two teams' colors. */
  shirts?: string[];
  seed?: number;
}

const SKIN = ['#ffd7b5', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];

/** Stadium stands full of fans. Each row is an Actor in `rows`, so crowds can jump in waves. */
export class Stands extends Actor {
  readonly rows: Actor[] = [];

  constructor({ width, top, bottom, shirts = ['#e63946', '#3a86ff', '#ffd60a', '#ffffff'], seed = 7, ...options }: StandsOptions) {
    super({ name: 'Stands', ...options });
    const random = seededRandom(seed);

    this.draw('rect', { x: -width, y: top, width: width * 3, height: bottom - top, fill: '#2b2f45' });
    this.draw('rect', { x: -width, y: top - 30, width: width * 3, height: 46, fill: '#171a28' }); // roof

    const rowHeight = 44;
    for (let y = top + 70, i = 0; y < bottom - 10; y += rowHeight, i++) {
      this.draw('rect', { x: -width, y: y + 14, width: width * 3, height: rowHeight - 14, fill: i % 2 ? '#353a55' : '#30344d' });
      const row = new Actor({ name: `row${i}`, y });
      for (let x = -width * 0.2 + random.range(0, 20); x < width * 1.2; x += random.range(28, 38)) {
        if (random.next() < 0.06) continue; // an empty seat here and there
        row.draw('rect', { x: x - 13, y: -2, width: 26, height: 30, rx: 11, fill: random.pick(shirts) });
        row.draw('circle', { cx: x, cy: -12, r: 10, fill: random.pick(SKIN) });
      }
      this.rows.push(row);
      this.add(row);
    }
  }
}
