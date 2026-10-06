import { svg, type Attrs } from './svg';

export interface ActorOptions {
  name?: string;
  x?: number;
  y?: number;
  rotation?: number;
  /** Sets scaleX and scaleY together. */
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
}

/**
 * The base building block of every cartoon object.
 *
 * An Actor wraps an SVG <g> element and exposes plain numeric properties
 * (x, y, rotation, scaleX, scaleY, scale, opacity) that GSAP can tween directly:
 *
 *   gsap.to(actor, { x: 500, rotation: 45, duration: 1 })
 *
 * Rotation and scale always happen around the actor's local origin (0, 0),
 * so draw each part relative to the point it should pivot around
 * (an arm is drawn from the shoulder downwards, a character from its feet upwards).
 *
 * Actors nest: moving a parent moves all of its children.
 */
export class Actor {
  readonly el: SVGGElement;
  readonly name: string;
  readonly children: Actor[] = [];
  parent: Actor | null = null;

  private _x: number;
  private _y: number;
  private _rotation: number;
  private _scaleX: number;
  private _scaleY: number;
  private _opacity: number;

  constructor(options: ActorOptions = {}) {
    this.name = options.name ?? 'Actor';
    this._x = options.x ?? 0;
    this._y = options.y ?? 0;
    this._rotation = options.rotation ?? 0;
    this._scaleX = options.scaleX ?? options.scale ?? 1;
    this._scaleY = options.scaleY ?? options.scale ?? 1;
    this._opacity = options.opacity ?? 1;
    this.el = svg('g', { 'data-actor': this.name });
    this.render();
  }

  /** Append child actors (drawn on top of what is already there). */
  add(...actors: Actor[]): this {
    for (const actor of actors) {
      actor.remove();
      actor.parent = this;
      this.children.push(actor);
      this.el.appendChild(actor.el);
    }
    return this;
  }

  /** Detach this actor from its parent. */
  remove(): void {
    if (!this.parent) return;
    const siblings = this.parent.children;
    siblings.splice(siblings.indexOf(this), 1);
    this.parent = null;
    this.el.remove();
  }

  /** Draw a raw SVG shape inside this actor and return it. */
  draw<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}): SVGElementTagNameMap[K] {
    const el = svg(tag, attrs);
    this.el.appendChild(el);
    return el;
  }

  /** Find a descendant actor by name (depth-first). */
  find(name: string): Actor | undefined {
    for (const child of this.children) {
      if (child.name === name) return child;
      const found = child.find(name);
      if (found) return found;
    }
    return undefined;
  }

  get x() { return this._x; }
  set x(value: number) { this._x = value; this.render(); }

  get y() { return this._y; }
  set y(value: number) { this._y = value; this.render(); }

  get rotation() { return this._rotation; }
  set rotation(value: number) { this._rotation = value; this.render(); }

  get scaleX() { return this._scaleX; }
  set scaleX(value: number) { this._scaleX = value; this.render(); }

  get scaleY() { return this._scaleY; }
  set scaleY(value: number) { this._scaleY = value; this.render(); }

  get scale() { return this._scaleX; }
  set scale(value: number) { this._scaleX = this._scaleY = value; this.render(); }

  get opacity() { return this._opacity; }
  set opacity(value: number) { this._opacity = value; this.render(); }

  protected render(): void {
    this.el.setAttribute(
      'transform',
      `translate(${this._x} ${this._y}) rotate(${this._rotation}) scale(${this._scaleX} ${this._scaleY})`,
    );
    this.el.setAttribute('opacity', String(this._opacity));
  }
}
