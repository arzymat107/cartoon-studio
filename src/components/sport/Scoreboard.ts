import { gsap } from 'gsap';
import { Actor, type ActorOptions, type Timeline } from '@/engine';

export interface ScoreboardTeam {
  name: string;
  color: string;
  /** Second color (stripes, trim) for the little team chip. */
  accent?: string;
}

export interface ScoreboardOptions extends ActorOptions {
  home: ScoreboardTeam;
  away: ScoreboardTeam;
  width?: number;
}

const FONT = 'Impact, "Arial Black", system-ui, sans-serif';

/**
 * TV-style score bug. Origin is its top center.
 * Change the score on the timeline with `tl.add(scoreboard.setScore('home', 1), 'goal')` –
 * scrubbing back shows the old score again.
 */
export class Scoreboard extends Actor {
  private readonly scores = { home: [] as Actor[], away: [] as Actor[] };

  constructor({ home, away, width = 760, ...options }: ScoreboardOptions) {
    super({ name: 'Scoreboard', ...options });
    const h = 96;
    const half = width / 2;

    this.draw('rect', { x: -half, y: 0, width, height: h, rx: 20, fill: 'rgba(15,18,30,0.88)' });
    this.draw('rect', { x: -70, y: 0, width: 140, height: h, fill: '#f4f4f4' });

    const team = (t: ScoreboardTeam, side: -1 | 1) => {
      const chipX = side * (half - 46);
      this.draw('rect', { x: chipX - 16, y: 26, width: 32, height: 44, rx: 6, fill: t.color, stroke: t.accent ?? t.color, 'stroke-width': 6 });
      const label = this.draw('text', {
        x: side * (half - 82), y: 64, 'text-anchor': side < 0 ? 'start' : 'end',
        'font-family': FONT, 'font-size': 42, fill: '#fff', 'letter-spacing': 1,
      });
      label.textContent = t.name.toUpperCase();
    };
    team(home, -1);
    team(away, 1);
    const dash = this.draw('text', { x: 0, y: 66, 'text-anchor': 'middle', 'font-family': FONT, 'font-size': 44, fill: '#15192b' });
    dash.textContent = '–';

    this.scores.home.push(this.scoreLayer('home', 0, 1));
    this.scores.away.push(this.scoreLayer('away', 0, 1));
  }

  /** Timeline that swaps the shown score for one team, with a pop. */
  setScore(side: 'home' | 'away', score: number): Timeline {
    const layers = this.scores[side];
    const previous = layers[layers.length - 1];
    const next = this.scoreLayer(side, score, 0);
    layers.push(next);
    return gsap.timeline()
      .to(previous, { opacity: 0, duration: 0.1 }, 0)
      .fromTo(next, { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(3)', immediateRender: false }, 0);
  }

  private scoreLayer(side: 'home' | 'away', score: number, opacity: number): Actor {
    const layer = new Actor({ name: `${side}-${score}`, x: side === 'home' ? -38 : 38, y: 48, opacity });
    const text = layer.draw('text', {
      x: 0, y: 17, 'text-anchor': 'middle', 'font-family': FONT, 'font-size': 50, fill: '#15192b',
    });
    text.textContent = String(score);
    this.add(layer);
    return layer;
  }
}
