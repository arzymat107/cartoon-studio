/** A reusable set (background) shared by several scenes. */
import { gsap } from 'gsap';
import { birdsong, drift, spin, sway } from '@/animations';
import { Cloud, Ground, Sky, Sun, Tree } from '@/components';
import type { Actor, Timeline } from '@/engine';

/** y coordinate where characters stand. */
export const GROUND_Y = 880;

export interface Meadow {
  sky: Sky;
  /** Orange sunrise sky on top of the blue one; fade it out for dawn. */
  dawn: Sky;
  sun: Sun;
  clouds: Cloud[];
  ground: Ground;
  trees: Tree[];
  /** Everything above in back-to-front order, ready for scene.add(...). */
  layers: Actor[];
}

export function createMeadow(width: number, height: number, { sunrise = false } = {}): Meadow {
  const sky = new Sky({ width, height });
  const dawn = new Sky({ width, height, top: '#ff9e6d', bottom: '#ffe0a3', opacity: sunrise ? 1 : 0 });
  const sun = new Sun({ x: 1500, y: sunrise ? 1000 : 230 });
  const clouds = [
    new Cloud({ x: 250, y: 180 }),
    new Cloud({ x: 900, y: 110, scale: 0.7 }),
    new Cloud({ x: 1250, y: 320, scale: 0.85 }),
  ];
  const ground = new Ground({ width, height, top: 800 });
  const trees = [
    new Tree({ x: 230, y: 830, height: 300 }),
    new Tree({ x: 1720, y: 845, height: 230, leaves: '#4cb85c' }),
  ];
  return { sky, dawn, sun, clouds, ground, trees, layers: [sky, dawn, sun, ...clouds, ground, ...trees] };
}

/** Background life: drifting clouds, spinning sun rays, trees in the wind, birds singing. */
export function animateMeadow(meadow: Meadow, duration: number): Timeline {
  const tl = gsap.timeline();
  tl.add(birdsong(duration), 0);
  tl.add(spin(meadow.sun.rays, { turns: duration / 30, duration }), 0);
  meadow.clouds.forEach((cloud, i) => tl.add(drift(cloud, { dx: (15 + i * 8) * duration, duration }), 0));
  meadow.trees.forEach((tree, i) => tl.add(sway(tree.foliage, { angle: 2.5, period: 2.6 + i * 0.5, duration }), 0));
  return tl;
}
