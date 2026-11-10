import { Actor, type ActorOptions } from '@/engine';

export interface PitchOptions extends ActorOptions {
  width: number;
  /** y of the far edge of the grass, and how far down it goes. */
  top: number;
  height: number;
  light?: string;
  dark?: string;
}

/** Mown grass in stripes that widen towards the viewer, with the far touchline. */
export class Pitch extends Actor {
  constructor({ width, top, height, light = '#4caf50', dark = '#43a047', ...options }: PitchOptions) {
    super({ name: 'Pitch', ...options });
    this.draw('rect', { x: -width, y: top, width: width * 3, height: height + 400, fill: dark });
    let y = top;
    for (let band = 24, i = 0; y < top + height + 400; y += band, band *= 1.18, i++) {
      if (i % 2 === 0) this.draw('rect', { x: -width, y, width: width * 3, height: band, fill: light });
    }
    this.draw('rect', { x: -width, y: top + 26, width: width * 3, height: 5, fill: 'rgba(255,255,255,0.85)' });
  }
}

export interface AdBoardsOptions extends ActorOptions {
  width: number;
  y: number;
  height?: number;
  texts?: string[];
  colors?: string[];
}

/** Advertising boards along the touchline. Keep the texts generic – no real brands. */
export class AdBoards extends Actor {
  constructor({
    width, y, height = 56,
    texts = ['FOOTBALL', 'FAIR PLAY', 'GOAL!', 'CARTOON CUP'],
    colors = ['#1d3557', '#e63946', '#2a9d8f', '#f4a261'],
    ...options
  }: AdBoardsOptions) {
    super({ name: 'AdBoards', ...options });
    const boardWidth = 360;
    for (let x = -width, i = 0; x < width * 2; x += boardWidth, i++) {
      this.draw('rect', { x, y, width: boardWidth - 4, height, fill: colors[i % colors.length] });
      const label = this.draw('text', {
        x: x + boardWidth / 2, y: y + height * 0.7, 'text-anchor': 'middle',
        'font-family': 'Impact, "Arial Black", system-ui, sans-serif', 'font-size': height * 0.55,
        fill: '#fff', 'letter-spacing': 2,
      });
      label.textContent = texts[i % texts.length];
    }
    this.draw('rect', { x: -width, y: y + height, width: width * 3, height: 6, fill: 'rgba(0,0,0,0.3)' });
  }
}
