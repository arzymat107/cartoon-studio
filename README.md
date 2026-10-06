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
| `npm run voices`    | Generate voice lines (see Sound and voices) |
| `npm run export`    | Render an episode to MP4 → `exports/` |

URL options: `?episode=demo` picks an episode, `?t=4.5` opens paused at 4.5 s.
Keyboard: <kbd>Space</kbd> play/pause, <kbd>←</kbd>/<kbd>→</kbd> seek 1 s, <kbd>Home</kbd> restart, <kbd>M</kbd> mute.

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
│  ├─ Movie.ts          Joins an episode's scenes into one master timeline; play/pause/seek
│  └─ Player.ts         Play / pause / scrub / mute / speed / chapters UI
├─ audio/               Sound
│  ├─ AudioEngine.ts    Keeps sound in sync with the timeline (pause, scrub, speed, mute)
│  ├─ synth.ts          Generated sounds: pop, boing, step, whoosh, chirp, voice blip, notes
│  └─ library.ts        Loads every file in src/assets/sounds/ by name
├─ assets/sounds/       Your audio files (voices, music, effects)
├─ components/          Reusable "puppets" (all extend Actor)
│  ├─ characters/       Character (rigged: legs, torso, arms, head, eyes, mouth)
│  ├─ environment/      Sky, Sun, Cloud, Ground, Tree
│  ├─ ui/               SpeechBubble
│  └─ SvgArt.ts         Wrap any hand-drawn .svg file as an Actor
├─ animations/          Reusable acting, each returns a timeline
│  ├─ character.ts      walk, wave, cheer, blink, blinkRandomly, talk, say, face, standStill
│  ├─ motion.ts         fadeIn/Out, popIn/Out, drift, sway, bob, spin, jump
│  └─ sound.ts          sfx, clip, melody, birdsong
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

## Sound and voices

Sound is placed on the timeline like any animation, so it stays in sync when you pause, scrub,
jump to a chapter or change speed. Browsers block sound until the user clicks, which is why the
page starts with a big **Play with sound** button.

**Built-in sounds (no files needed)**

- Characters talk in a gibberish voice (Animal Crossing style). Pick the voice per character:
  `new Character({ voice: { pitch: 1.5, wave: 'sine' } })`, or `voice: false` for a silent one.
- `walk` plays footsteps, `jump` plays a boing, and `say` plays a pop when the bubble appears.
  Turn them off with `footsteps: false` or `sound: false`.
- Effects anywhere on the timeline: `tl.add(sfx(synth.whoosh), 'chat')`.
  Available: `pop`, `boing`, `step`, `whoosh`, `chirp`, `blip`, `note`.
- Tunes: `tl.add(melody('C5 E5 G5 - C6:2', { bpm: 180 }), 0)`, where `:2` is the length in beats and `-` is a rest.
- Birds: `tl.add(birdsong(duration), 0)`.

**Audio files: recorded voices, music, effects**

Drop files into `src/assets/sounds/` (see its README) and use them by name:

```ts
// Recorded voice: Bob's mouth moves for exactly the length of the recording.
tl.add(say(bob, hello, { voice: 'voices/bob-hello' }), 2);

// Background music for the whole scene.
tl.add(clip('music/theme', { volume: 0.3, loop: true, duration: tl.duration() }), 0);
```

**Generated voices (Kokoro AI text-to-speech)**

The demo's voice lines are generated with [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M), a free,
open-source (Apache 2.0) neural voice model that runs on your computer. The model (~90 MB)
downloads once from Hugging Face; after that it works offline.

1. Add a line to `scripts/voices.json`:
   `{ "id": "bob-wow", "character": "bob", "text": "Wow, look at that!" }`
2. Run `npm run voices`. It creates `src/assets/sounds/voices/bob-wow.wav`, trims the silence and evens out the volume.
3. Use it in a scene: `say(bob, bubble, { voice: 'voices/bob-wow' })`.

Each character in `voices.json` has a `voice`, a `speed` (1 = normal) and an optional `pitch`.
Bob uses `am_puck` and Alice uses `af_heart`. Other good voices: `am_michael`, `am_fenrir`,
`bm_george` (male) and `af_bella`, `bf_emma` (female); the prefix `a` means American and `b` British. See the
[full list](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md). After changing a voice,
regenerate with `npm run voices -- --force` (or `npm run voices -- --force bob` for one character).
Windows' built-in voices still work with `"engine": "windows"` (see the comment at the top of
`scripts/generate-voices.mjs`).

You can also record real voices with any recorder (Audacity is free, or use your phone) and save them
in the same folder. A real voice actor sounds much better than text-to-speech.

## Football kit

Components (`src/components/sport/`):

| Component | What it is |
| --- | --- |
| `Footballer` | Character in a kit: shirt (optional stripes and trim), number, shorts, socks, boots |
| `Referee` | Footballer in black with a whistle and hidden yellow and red cards |
| `Ball` | Ball with a ground shadow (`x` = along the ground, `body` = height and spin) |
| `Goal` | Side-view goal whose `net` can shake |
| `Stands`, `Pitch`, `AdBoards` | Crowd (rows can jump), striped grass, touchline boards |
| `Scoreboard` | TV score bug; `tl.add(scoreboard.setScore('home', 1), 'goal')` |

Animations (`src/animations/football.ts`): `shoot` (kick and ball flight), `flight` (true parabola),
`bounce`, `roll`, `shakeNet`, `celebrate`, `handsOnHead`, `flop` / `getUp`, `showCard`,
`crowdCheer`, `crowdGroan`, `crowdIdle`, `crowdMurmur`. Sounds: `synth.kick`, `clang`, `swish`,
`whistle`, `cheer`, `groan`, `murmur`.

Every `Character` now supports caricature options: `headScale`, `beard`, `hairStyle: 'quiff'`,
`sleeves: 'short'` and `legWear: 'shorts'` with `socks`.

**Detailed faces.** Pass `face` for a more realistic head: a shaped jaw, eyes with irises, eyebrows,
nose, lips, layered hair and beards. Without it you get the simple round cartoon face.

```ts
new Footballer({
  kit, beard: '#5a3a22',
  face: { width: 39, height: 48, jaw: 26, eyeColor: '#5b3a1e', browTilt: -1.5, nose: 'straight' },
});
```

Options: `width`, `height`, `jaw`, `chin` (face shape), `eyeColor`, `browColor`, `browWeight`,
`browTilt` (+ confident, − kind or worried), `nose` (`small` | `straight` | `broad`), `lips`,
`cheekbones`, `stubble`. The eyebrows are their own actor (`char.brows`), so you can raise them for surprise.

**Shot types.** `flight()` and `shoot()` draw an arc when given a `peak` (lob, chip, cross) and
a straight line with `straight: true` (driven shot):
`shoot(player, ball, { toX: goal.x + 95, land: 330, straight: true, duration: 0.55 })`.

**Thumbnails.** Open `?episode=football&export&t=23.4` for a clean, full-size frame at any moment,
then take a screenshot for the YouTube thumbnail.

The `football` episode (`?episode=football`) is a vertical Short with caricatures of two famous
players. The cast is in `src/episodes/football/cast.ts` and the night stadium set in `stadium.ts`.

**Parody rules for real people.** Use only colors and numbers (no crests, logos or sponsors), give
them generic voices (never clone a real voice), keep the "animated parody" notice on screen, and keep
the jokes about football, never about private life, injuries or origin.

## Vertical videos (Shorts, TikTok, Reels)

Give an episode a size in `src/episodes/index.ts`:

```ts
football: { title: '…', width: 1080, height: 1920, scenes: [...] },
```

The player shows it upright, and `npm run export -- --episode football` renders a 1080×1920 MP4.

## Export a video (MP4)

```
npm run export                                    # exports/demo.mp4, 1920×1080, 30 fps
npm run export -- --episode demo --fps 60         # smoother motion, takes about twice as long
npm run export -- --out exports/episode-1.mp4     # choose the file name
```

The script opens the cartoon in your installed Edge or Chrome (hidden), renders the soundtrack,
and captures each frame. Then ffmpeg (bundled with the project) builds an H.264/AAC MP4. Nothing
is recorded in real time, so the result is smooth even on a slow computer. The output plays everywhere and is
ready for YouTube, Instagram, TikTok (crop to vertical first) or a messenger. The `exports/` folder is
not committed to git.

## Rules of thumb

- **Timelines must be finite.** Never use `repeat: -1` in a scene, or the player can't scrub it. For a background loop, compute the scene length and pass it in (see `animateMeadow`).
- **Use positions and labels**, not `delay`: `tl.add(x, 'greet+=0.3')`, `'<'` (with previous), `'>'` (after previous).
- **Origin = pivot.** Characters stand on y = 0, limbs hang from their joint, and trees grow from their base.
- The stage is always **1920×1080** logical units and is scaled to fit the screen.

## Roadmap ideas

- **Lip-sync:** generate real mouth shapes from recorded voices with [Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync) instead of simple open/close flapping.
- **Shape morphing and paths:** GSAP MorphSVGPlugin for facial expressions, MotionPathPlugin for flying objects.
- **More rigs:** animals, vehicles, and a Character with elbows and knees (two-segment limbs).
- **Heavy scenes** (thousands of particles): add a PixiJS (WebGL) layer behind the SVG.
