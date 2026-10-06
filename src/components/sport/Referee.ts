import { Actor } from '@/engine';
import { Footballer, type FootballerOptions } from './Footballer';

/** Referee in black with a whistle; holds a yellow and a red card in the right hand (hidden). */
export class Referee extends Footballer {
  readonly yellowCard: Actor;
  readonly redCard: Actor;

  constructor(options: Partial<FootballerOptions> = {}) {
    super({
      kit: { shirt: '#1c1c1c', trim: '#f2c94c', shorts: '#1c1c1c', socks: '#1c1c1c' },
      hairStyle: 'bald',
      ...options,
    });
    // Whistle on a cord.
    this.torsoDetail.draw('path', { d: 'M -12 -92 Q 0 -60 10 -62', stroke: '#ddd', 'stroke-width': 2, fill: 'none' });
    this.torsoDetail.draw('rect', { x: 6, y: -66, width: 12, height: 7, rx: 3, fill: '#c0c0c0' });

    const card = (name: string, fill: string) => {
      const actor = new Actor({ name, y: 64, opacity: 0 });
      actor.draw('rect', { x: -11, y: -4, width: 22, height: 30, rx: 3, fill, stroke: 'rgba(0,0,0,0.3)', 'stroke-width': 1.5 });
      return actor;
    };
    this.yellowCard = card('yellowCard', '#ffd60a');
    this.redCard = card('redCard', '#e63946');
    this.rightArm.add(this.yellowCard, this.redCard);
  }
}
