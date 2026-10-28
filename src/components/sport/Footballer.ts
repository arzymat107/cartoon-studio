import { svg, uid } from '@/engine';
import { Character, type CharacterOptions } from '../characters/Character';

export interface Kit {
  shirt: string;
  /** Vertical stripe color (e.g. white on sky blue). */
  stripes?: string;
  /** Collar and sleeve-cuff color. */
  trim?: string;
  number?: number | string;
  numberColor?: string;
  shorts: string;
  socks: string;
  boots?: string;
}

export interface FootballerOptions extends Omit<CharacterOptions, 'shirt' | 'pants' | 'socks' | 'shoes'> {
  kit: Kit;
}

/**
 * The "Classic" version of the players: a Character in a football kit, short sleeves, shorts, socks, optional stripes and a number.
 * No crests or logos – use colors and numbers, which are enough for fans to recognize a team.
 */
export class Footballer extends Character {
  readonly kit: Kit;
  /** Shirt number; un-mirrored when the player faces left so it stays readable. */
  private numberGroup?: SVGGElement;

  constructor({ kit, ...options }: FootballerOptions) {
    super({
      name: 'Footballer',
      shirt: kit.shirt,
      pants: kit.shorts,
      socks: kit.socks,
      shoes: kit.boots ?? '#1b1b1b',
      sleeves: 'short',
      legWear: 'shorts',
      ...options,
    });
    this.kit = kit;
    const detail = this.torsoDetail;

    if (kit.stripes) {
      const clipId = uid('kit');
      const clip = detail.draw('clipPath', { id: clipId });
      clip.appendChild(svg('rect', { x: -32, y: -95, width: 64, height: 100, rx: 26 }));
      const stripes = detail.draw('g', { 'clip-path': `url(#${clipId})` });
      for (const x of [-26, -6, 14]) {
        stripes.appendChild(svg('rect', { x, y: -100, width: 11, height: 110, fill: kit.stripes }));
      }
    }
    if (kit.trim) {
      detail.draw('path', { d: 'M -14 -95 Q 0 -80 14 -95', stroke: kit.trim, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' });
    }
    if (kit.number !== undefined) {
      this.numberGroup = detail.draw('g');
      const label = svg('text', {
        x: 0, y: -28, 'text-anchor': 'middle',
        'font-family': 'Impact, "Arial Black", system-ui, sans-serif',
        'font-size': 40, 'font-weight': 900,
        fill: kit.numberColor ?? '#fff',
        stroke: 'rgba(0,0,0,0.35)', 'stroke-width': 2, 'paint-order': 'stroke',
      });
      label.textContent = String(kit.number);
      this.numberGroup.appendChild(label);
      this.render();
    }
  }

  protected override render(): void {
    super.render();
    this.numberGroup?.setAttribute('transform', this.scaleX < 0 ? 'scale(-1 1)' : '');
  }
}
