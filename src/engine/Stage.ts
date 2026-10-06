import { Actor } from './Actor';
import { svg, uid } from './svg';

export interface StageOptions {
  /** Logical drawing size. Everything is authored in these units and scaled to fit the screen. */
  width?: number;
  height?: number;
  background?: string;
}

/** The SVG canvas everything is drawn on. */
export class Stage {
  readonly width: number;
  readonly height: number;
  readonly svg: SVGSVGElement;
  readonly root: Actor;

  constructor(container: HTMLElement, options: StageOptions = {}) {
    this.width = options.width ?? 1920;
    this.height = options.height ?? 1080;

    this.svg = svg('svg', {
      viewBox: `0 0 ${this.width} ${this.height}`,
      preserveAspectRatio: 'xMidYMid meet',
    });
    this.svg.appendChild(svg('rect', { width: this.width, height: this.height, fill: options.background ?? '#000' }));

    // Clip to the frame so camera zooms never draw outside it.
    const clipId = uid('stage-clip');
    const clip = svg('clipPath', { id: clipId });
    clip.appendChild(svg('rect', { width: this.width, height: this.height }));
    this.svg.appendChild(clip);

    this.root = new Actor({ name: 'Stage' });
    this.root.el.setAttribute('clip-path', `url(#${clipId})`);
    this.svg.appendChild(this.root.el);

    container.appendChild(this.svg);
  }

  add(...actors: Actor[]): void {
    this.root.add(...actors);
  }
}
