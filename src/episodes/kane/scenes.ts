/**
 * Kane check: walks up to a kit bag, picks it up (the fingers curl round the handle), carries it,
 * puts it down (the fingers open) and walks off.
 *
 *   npm run frames -- --episode kane 1.5 2 2.4 4 4.6 5.2
 */
import { Actor, Scene, type SceneClass, type Timeline } from '@/engine';
import { KaneFigure } from '@/figures/kane';
import { walk } from '@/figures/gait';
import { pickUp, putDown, reachSpot } from '@/figures/pickup';

const GROUND = 1520;
const SCALE = 2.4;
/** The bag's height from the top of its handle to its bottom (figure units). */
const BAG_HEIGHT = 46;
const INK = 'stroke="#1b1512" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';

/** Kit bag; origin = the top of its handle, where the hand grips it. */
function bag(): Actor {
  const a = new Actor({ name: 'bag' });
  a.draw('g').innerHTML = `
    <path d="M -14 21 C -14 7 -8 0 0 0 C 8 0 14 7 14 21" fill="none" stroke="#1b1512" stroke-width="4.2" stroke-linecap="round"/>
    <path d="M -14 21 C -14 7 -8 0 0 0 C 8 0 14 7 14 21" fill="none" stroke="#2c3a78" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M -24 20 C -25 30 -24 40 -21 46 L 21 46 C 24 40 25 30 24 20 C 10 17 -10 17 -24 20 Z" fill="#1d2650" ${INK}/>
    <path d="M -23 28 C -8 26 8 26 23 28" fill="none" stroke="#f6f5f1" stroke-width="2"/>
    <path d="M -10 34 L 10 34" stroke="#f6f5f1" stroke-width="1.4" stroke-linecap="round"/>`;
  return a;
}

class PickUpScene extends Scene {
  readonly title = 'Kane – pick up and put down';
  private kane!: KaneFigure;
  private bag!: Actor;

  build(): void {
    const { width, height } = this.stage;
    const bg = new Actor({ name: 'bg' });
    bg.draw('rect', { x: 0, y: 0, width, height, fill: '#d9d2c3' });
    bg.draw('rect', { x: 0, y: GROUND - 20, width, height: height - GROUND + 20, fill: '#5f8a4a' });
    this.kane = new KaneFigure({ x: 80, y: GROUND, scale: SCALE });
    this.bag = bag();
    Object.assign(this.bag, { x: 600, y: GROUND - BAG_HEIGHT * SCALE, scale: SCALE });
    this.add(bg, this.bag, this.kane);
  }

  animate(tl: Timeline): void {
    const { kane, bag: item } = this;
    const steps = { step: 0.5, cycle: 0.6 };
    const spot = reachSpot(kane, item);
    tl.add(walk(kane, { from: 80, to: spot, ...steps }))
      .add(pickUp(kane, item), '+=0.15')
      .add(walk(kane, { from: spot, to: 720, ...steps }), '+=0.1')
      .add(putDown(kane, item), '+=0.15')
      .add(walk(kane, { from: 720, to: 260, ...steps }), '+=0.4')
      .set({}, {}, '+=0.5');
  }
}

export const KANE_SCENES: SceneClass[] = [PickUpScene];
