# Cartoon Studio

Make cartoons with web technologies. Characters and props are **reusable SVG components**,
and their acting is a set of **reusable animation functions**. Scenes join them on a
**GSAP timeline** that you can play, pause and scrub like a video.

```
npm install
npm run dev        # http://localhost:5173
```

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Dev server with hot reload            |
| `npm run build`     | Type-check + production build (`dist/`) |
| `npm run preview`   | Serve the production build            |
| `npm run typecheck` | TypeScript only                       |

URL options: `?episode=demo` picks an episode, `?t=4.5` opens paused at 4.5 s, `?paused` opens paused at the start.
Keyboard: <kbd>Space</kbd> play/pause, <kbd>←</kbd>/<kbd>→</kbd> seek 1 s, <kbd>Home</kbd> restart.

## Stack

| Library | Why |
| ------- | --- |
| **SVG** | Vector art that stays sharp at any size, every part can be animated, and you can style it with CSS or import it from Inkscape, Figma or Illustrator. |
| **[GSAP](https://gsap.com)** | The industry-standard animation engine: timelines, easing, labels, scrubbing. All plugins are free (MotionPath, MorphSVG, DrawSVG…). |
| **TypeScript + Vite** | Autocomplete for every component and option, plus instant reload. |

## Architecture

```
src/
├─ engine/              The framework. You rarely need to change it.
│  ├─ Actor.ts          Base component: SVG <g> with x, y, rotation, scale, opacity
│  ├─ Stage.ts          The 1920×1080 SVG canvas
│  ├─ Camera.ts         Pan/zoom container (focus(x, y, zoom))
│  ├─ Scene.ts          build() actors + animate(timeline)
│  ├─ Movie.ts          Joins an episode's scenes into one master timeline
│  └─ Player.ts         Play / pause / scrub / speed / chapters UI
├─ components/          Reusable "puppets" (all extend Actor)
│  ├─ characters/       Character (rigged: legs, torso, arms, head, eyes, mouth)
│  ├─ environment/      Sky, Sun, Cloud, Ground, Tree
│  ├─ ui/               SpeechBubble
│  └─ SvgArt.ts         Wrap any hand-drawn .svg file as an Actor
├─ animations/          Reusable acting, each returns a timeline
│  ├─ character.ts      walk, wave, cheer, blink, blinkRandomly, talk, say, face, standStill
│  └─ motion.ts         fadeIn/Out, popIn/Out, drift, sway, bob, spin, jump
└─ episodes/            Your cartoons
   ├─ index.ts          Episode registry
   └─ demo/
      ├─ cast.ts        Recurring characters (Bob, Alice)
      ├─ meadow.ts      Reusable set + its background animation
      └─ scenes/        MorningScene, FriendScene
```

### Core idea: everything is an Actor

An `Actor` is an SVG group with numeric properties that GSAP can tween directly.
Actors nest, so moving a parent moves its children. **Rotation and scale happen around the
actor's origin (0, 0)**, so draw each part relative to its pivot point:

```ts
const arm = new Actor({ name: 'arm', x: 30, y: -78 });         // origin = shoulder
arm.draw('line', { x1: 0, y1: 0, x2: 0, y2: 64, stroke: 'blue', 'stroke-width': 16 });
gsap.to(arm, { rotation: -150, duration: 0.3 });                // swings around the shoulder
```

## How to…

### Add a new component

```ts
// src/components/props/Ball.ts
import { Actor, type ActorOptions } from '@/engine';

export interface BallOptions extends ActorOptions { radius?: number; color?: string }

export class Ball extends Actor {
  constructor({ radius = 40, color = '#e63946', ...options }: BallOptions = {}) {
    super({ name: 'Ball', ...options });
    this.draw('circle', { cy: -radius, r: radius, fill: color });   // origin = bottom of the ball
  }
}
```

Export it from `src/components/index.ts`. For complex art, draw it in a vector editor and use `SvgArt`:

```ts
import hatMarkup from '@/assets/hat.svg?raw';
const hat = new SvgArt({ markup: hatMarkup, originX: 50, originY: 90 });
```

### Add a new animation

Write a function that returns a timeline. Use `immediateRender: false` on `fromTo`/`set`
so building the timeline doesn't change the first frame:

```ts
export function nod(char: Character, { times = 2 } = {}) {
  return gsap.timeline().to(char.head, { rotation: 8, duration: 0.15, repeat: times * 2 - 1, yoyo: true });
}
```

### Add a scene

```ts
export class ParkScene extends Scene {
  readonly title = 'In the Park';
  private bob!: Character;

  build() {
    const meadow = createMeadow(this.stage.width, this.stage.height);
    this.bob = createBob({ x: 300, y: GROUND_Y });
    this.add(...meadow.layers, this.bob);         // first = furthest back
  }

  animate(tl: Timeline) {
    tl.add(walk(this.bob, { to: 1200, duration: 4 }))
      .addLabel('hello')
      .add(wave(this.bob), 'hello')
      .to(this.camera, { ...this.camera.focus(1200, 600, 1.4), duration: 1.5 }, 'hello');
  }
}
```

### Add an episode

Create `src/episodes/<name>/` with its scenes, then register it in `src/episodes/index.ts`:

```ts
export const episodes = {
  demo: { title: 'Demo – A Sunny Day', scenes: [MorningScene, FriendScene] },
  park: { title: 'Episode 1 – The Park', scenes: [ParkScene] },
};
```

Open `?episode=park`.

## Rules of thumb

- **Timelines must be finite.** Never use `repeat: -1` in a scene, or the player can't scrub it. For a background loop, compute the scene length and pass it in (see `animateMeadow`).
- **Use positions and labels**, not `delay`: `tl.add(x, 'greet+=0.3')`, `'<'` (with previous), `'>'` (after previous).
- **Origin = pivot.** Characters stand on y = 0, limbs hang from their joint, and trees grow from their base.
- The stage is always **1920×1080** logical units and is scaled to fit the screen.

## Roadmap ideas

- **Sound and voices:** [Howler.js](https://howlerjs.com) synced to the master timeline (`tl.call(() => sound.play())`, plus seek sync).
- **Lip-sync:** generate mouth shapes from audio with [Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync).
- **Export to MP4:** step the timeline frame by frame with Playwright (`?t=` already supported), screenshot each frame, then join them with ffmpeg.
- **Shape morphing and paths:** GSAP MorphSVGPlugin for facial expressions, MotionPathPlugin for flying objects.
- **More rigs:** animals, vehicles, and a Character with elbows and knees (two-segment limbs).
- **Heavy scenes** (thousands of particles): add a PixiJS (WebGL) layer behind the SVG.
