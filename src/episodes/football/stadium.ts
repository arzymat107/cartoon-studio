/** Reusable night-stadium set for vertical (1080×1920) football Shorts. */
import { gsap } from 'gsap';
import { crowdIdle, crowdMurmur } from '@/animations';
import { AdBoards, Goal, Pitch, Sky, Stands } from '@/components';
import { Actor, svg, uid, type Timeline } from '@/engine';

/** y coordinate where players stand. */
export const GROUND_Y = 1600;
/** Where the ball is placed for free kicks, and where the kicker stands. */
export const BALL_SPOT = 520;
export const KICK_SPOT = 450;

export interface Stadium {
  stands: Stands;
  goal: Goal;
  /** Back-to-front layers behind the players. */
  background: Actor[];
}

export function createStadium(width: number, height: number): Stadium {
  const sky = new Sky({ width, height, top: '#0b1736', bottom: '#4b3b7c' });
  const lights = [floodlight(110, 160), floodlight(width - 110, 160)];
  const stands = new Stands({ width, top: 560, bottom: 1180, shirts: ['#75c3ea', '#ffffff', '#c8102e', '#1e7f3a', '#ffd60a'] });
  const boards = new AdBoards({ width, y: 1180, height: 64 });
  const pitch = new Pitch({ width, top: 1244, height: height - 1244 });
  const goal = new Goal({ x: 800, y: GROUND_Y, height: 400, depth: 230 });
  return { stands, goal, background: [sky, ...lights, stands, boards, pitch] };
}

/** Crowd shuffling and murmuring for the whole scene. */
export function animateStadium(stadium: Stadium, duration: number): Timeline {
  return gsap.timeline()
    .add(crowdIdle(stadium.stands, duration), 0)
    .add(crowdMurmur(duration), 0);
}

function floodlight(x: number, y: number): Actor {
  const light = new Actor({ name: 'Floodlight', x, y });
  const glowId = uid('glow');
  const gradient = light.draw('radialGradient', { id: glowId });
  gradient.append(
    svg('stop', { offset: 0, 'stop-color': '#fffbe0', 'stop-opacity': 0.9 }),
    svg('stop', { offset: 1, 'stop-color': '#fffbe0', 'stop-opacity': 0 }),
  );
  light.draw('circle', { r: 190, fill: `url(#${glowId})` });
  light.draw('rect', { x: -8, y: 40, width: 16, height: 420, fill: '#1c2033' });
  light.draw('rect', { x: -70, y: -40, width: 140, height: 80, rx: 8, fill: '#2b2f45' });
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      light.draw('circle', { cx: -48 + col * 32, cy: -18 + row * 36, r: 12, fill: '#fffbe0' });
    }
  }
  return light;
}
