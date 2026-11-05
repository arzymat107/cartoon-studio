# Cartoon Studio

Wordless football comedy Shorts (vertical 1080×1920), made with web technologies: cut-out
characters drawn in meta.ai, SVG props, and a **GSAP timeline** you can play, pause and scrub
like a video, then export to MP4.

```
npm install
npm run dev        # http://localhost:5173/?episode=hot-seat
```

The character pictures live in the private `data-for-cartoons` repo; clone it next to this one
(or set `CHARACTERS_DIR` in `.env.local`, see `scripts/characters-dir.mjs`).

| Command              | What it does                                                    |
| -------------------- | --------------------------------------------------------------- |
| `npm run dev`        | Dev server with hot reload                                      |
| `npm run build`      | Type-check + production build (`dist/`)                         |
| `npm run typecheck`  | TypeScript only                                                 |
| `npm run characters` | List the character library, find missing or uncatalogued pictures |
| `npm run sounds`     | Download the Freesound (CC0) sounds listed in `scripts/sounds.json` |
| `npm run frames -- --episode hot-seat 2.4 9.6` | Still frames + a contact sheet with the phone safe zones |
| `npm run export -- --episode hot-seat` | Render to MP4 → `exports/`                    |

Helper scripts: `scripts/clean-cutout.py` (tidy a meta.ai cut-out), `scripts/contact-sheet.py`
(check pictures on green, `--grid` for coordinates), `scripts/voice-pitch.py` (is a voice male?).

URL options: `?episode=klopp-laughs` picks an episode, `?t=4.5` opens paused at 4.5 s.
Keyboard: <kbd>Space</kbd> play/pause, <kbd>←</kbd>/<kbd>→</kbd> seek 1 s, <kbd>Home</kbd> restart, <kbd>M</kbd> mute.

**Making a new Short:** run `/make-short <idea>` in Claude Code. The skill
(`.claude/skills/make-short/SKILL.md`) has the whole workflow: storyboard, reuse from the
character library, meta.ai prompts, rigs, sound, safe zones, export and the YouTube caption.

## Architecture

```
src/
├─ engine/              The framework
│  ├─ Actor.ts          Base component: SVG <g> with x, y, rotation, scale, opacity
│  ├─ Stage.ts          The SVG canvas
│  ├─ Camera.ts         Pan/zoom container (focus(x, y, zoom))
│  ├─ Scene.ts          build() actors + animate(timeline)
│  ├─ Movie.ts          Joins an episode's scenes into one master timeline; play/pause/seek
│  └─ Player.ts         Play / pause / scrub / mute / speed UI
├─ audio/               AudioEngine (sound in sync with the timeline), synth (generated
│                       pop, boing, step, whoosh, cheer, murmur…), library (loads assets/sounds)
├─ assets/sounds/       music/, sfx/, vocals/, laughs/ – CC0, credited in each CREDITS.md
├─ characters/          The character library
│  ├─ library.json      Every picture: who, pose, face, view, measured anchor points
│  ├─ pictures.ts       picture(), point(), PoseRig – pictures → puppets
│  └─ rigs.ts           CarrickRig, BrunoRig, OleRig, OleSeated
├─ components/          TextLabel, createParodyNotice
├─ animations/          motion (fadeIn, popIn, bob, jump…), sound (clip, sfx, melody, laughTrack)
├─ ui/                  The Export button
└─ episodes/
   ├─ index.ts          Episode registry
   ├─ hot-seat/         "Carrick – The Hot Seat": props.ts (stadium, dugout, seat, fire…), scenes.ts
   └─ klopp-laughs/     "Klopp – Can't Stop Laughing": klopp.ts (head/body rig), scenes.ts
```

### Core idea: everything is an Actor

An `Actor` is an SVG group with numeric properties that GSAP can tween directly. Actors nest,
so moving a parent moves its children. **Rotation and scale happen around the actor's origin
(0, 0)**, so draw each part relative to its pivot point. Character rigs put their origin on
the feet (standing), the underside of the thighs (sitting) or the middle of the body (flying).

```ts
const carrick = new CarrickRig({ x: 690, y: 1230, scale: 0.5 });   // origin = where he sits
carrick.show(tl, 'panic', 11.8);                                    // switch picture at 11.8 s
tl.to(carrick, { y: -1500, rotation: 900, duration: 1 }, 17.75);    // launch him
```

### Add an episode

Create `src/episodes/<name>/` with its scenes, then register it in `src/episodes/index.ts`
and open `?episode=<name>`. Use `src/episodes/hot-seat/` as the model.

## Sound

Sound is placed on the timeline like any animation, so it stays in sync when you pause, scrub
or change speed. Browsers block sound until the user clicks, which is why the page starts with
a big **Play with sound** button.

```ts
tl.add(clip('music/comedy-loop', { volume: 0.22, duration: 11.8 }), 0);  // a sound file
tl.add(sfx(synth.boing), 17.55);                                         // a generated sound
```
