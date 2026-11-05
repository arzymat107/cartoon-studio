---
name: make-short
description: Make a new wordless football comedy Short (vertical 1080×1920, ~25 s) in cartoon-studio – from the joke idea through meta.ai character prompts, cut-out cleanup, pose rigs, scene timeline, Freesound sounds, frame checks, MP4 export and the YouTube caption. Use when the user wants a new Short / cartoon / episode about players or managers.
argument-hint: <the joke idea>
---

# Make a Short

The reference build is `src/episodes/hot-seat/` ("Carrick – The Hot Seat", commit 6f33e66). Read
its three files before building – copy patterns from them instead of inventing new ones.

House rules (from the user):
- **Wordless:** no on-screen text, no speech. Only music, sound effects and voice noises
  (gulp, ow, phew, scream, chuckle, aaah) that express action and emotion.
- **Characters come from meta.ai** – the user generates them from your prompts. They're
  saved in `src/assets/characters/<Name>/` (git-ignored, local only).
- **Commit directly on main.**
- **Phone safe zones:** YouTube's interface covers parts of the 1080×1920 frame on phones.
  Faces, key actions and props that carry the joke must stay out of them; background, floor
  and feet may pass under them.

  | Zone | Covered by | Keep clear |
  |---|---|---|
  | Top | status bar / camera island, search, back button | y < 250 |
  | Bottom | channel name, subscribe, title, hashtags, sound | y > 1420 |
  | Right, middle down | like, dislike, comment, share, remix buttons | x > 900 for y > 960 |

  `npm run frames` shades these zones red on its sheet (the values are `SAFE` in `scripts/frames.mjs`).

Work in steps and stop for the user at the ⏸ marks.

## 1. Idea → storyboard ⏸

Turn the idea into 4–6 beats over 20–25 s:
- **Start:** a clear situation in the first 2 s.
- **Middle:** escalation, a false relief, then a worse relapse.
- **End:** the payoff/twist about 80% through, then a short button (rimshot, sigh, wink).

Each beat must read with no words, so faces and actions carry it.

List, for the user to confirm:
- **The beats**, with rough times.
- **The cast**, and every pose/face each character needs.
- **The props**, drawn in code: seats, balls, effects.

Keep the pose count low; reuse one picture with different motion wherever possible.

## 2. Character prompts for meta.ai ⏸

**Style reference:** chosen per Short, not fixed. Suggest one existing character picture that fits this Short's poses (standing vs sitting), or a new style; the user decides. Every character in this Short uses that same reference. Extra poses of a character already made use that character's own base picture.

**Likeness:** a real person's face comes from a cartoon/caricature image of them that the user finds online, not a photo. A photo makes meta.ai draw a realistic face.

Prompt template (image 1 = style reference, image 2 = the person):

> Using image 1 only for the drawing style (line weight, colouring, shading, proportions) –
> not its face, hair, beard, glasses or clothes – and image 2 only for who the person is,
> draw <Name> as a full-body caricature, <pose and face>, wearing <outfit>. Front or 3/4
> view, whole body including feet in frame, arms clear of the body, no logos, no text,
> transparent background, tall portrait 1024×2448.

**Wording meta.ai accepts:** it refuses pain, danger or harm to real people. Use "surprised", "amazed", "leaping", "carrying a folded camping chair" instead. When it offers a softer version, accept it, because panic/pain is added in code with a head swap from a face pose, plus flames and shakes.

**Face poses:** for these, ask for the same picture with only the expression changed ("same image, same pose, only change the face to …"). Then the body lines up and a rig can switch faces.

Tell the user the exact file name to save each picture as: `<name>_<pose>.png`.

## 3. Check and clean the pictures

```bash
python3 scripts/contact-sheet.py src/assets/characters/<Name>/*.png          # on green: look for holes
python3 scripts/contact-sheet.py --grid src/assets/characters/<Name>/<file>  # read picture coordinates
python3 scripts/clean-cutout.py <file> [--keep x,y]... [--fill x,y]...
```

**Look at the sheet.** Background removal often erases white parts: shoe soles, eye whites, teeth, white shorts.

`clean-cutout.py` fills small enclosed holes, trims the white fringe and smooths edges:
- **`--fill x,y`:** forces a big enclosed area opaque (e.g. erased shorts).
- **`--keep x,y`:** keeps a real gap transparent (between an arm and the body, hair strands, chair frame).

Re-check the sheet after cleaning.

The script cleans from `<name>.orig.png` when one exists. If the user replaces a picture, delete its old `.orig.png` first, or the old picture gets cleaned. Once the user is happy, the `.orig` backups can be deleted.

## 4. Rigs, props, scene

Create `src/episodes/<slug>/` with `rigs.ts`, `props.ts` and `scenes.ts`, and register the episode in `src/episodes/index.ts` (`width: 1080, height: 1920`).

**`rigs.ts`:** copy `picture()` and `PoseRig` from hot-seat.
- **Pose switching:** each pose is a full picture, and `rig.show(tl, pose, at)` switches between them instantly.
- **Origin:** pick one body point as the rig's origin (feet when standing, the underside of the thighs when sitting). Place every picture so that point lines up; read the coordinates with `--grid`.
- **Face poses that drift by a few pixels:** measure the shift on the body and correct it, like `FACE_SHIFT`.
- **Head swap:** clip the head from a face picture with a `clipPath` and pin it onto another pose's chin at a slight scale/rotation. Draw it slightly bigger so it covers the old head, and don't erase anything (see `panicHead`).

**`props.ts`:** plain SVG props in the cartoon style (outline `#3a0a0a`, flat fills). Hot-seat has reusable pieces worth copying:
- the stadium, dugout and roof hole;
- flames, puffs, foam, debris and the twinkle star;
- the thermometer.

**`scenes.ts`:** one `Scene` with a GSAP timeline; layer order is set by the order you add actors.
- **Camera:** `camera.focus` / `camera.reset` for zooms.
- **Randomness:** `seededRandom` for jitter, so every render is the same.
- **Helpers:** hot-seat's `shake`, `hop`, `puff`, `smoke`, `fire` and `flicker` show the patterns. Pass `x0` to `shake` when the actor starts off-screen.
- **Safe zones:** plan the layout inside the safe area from the start: floor at about y 1430,
  heads below y 250, nothing important bottom-right. Zoom targets (`camera.focus`) must keep
  faces inside it too. Hot-seat raises its whole set with a resting camera offset (`HOME`) instead of moving every coordinate.
- **Header:** put a beat list with times at the top of the file.
- **Ending:** end the scene ~1 s after the last sound.

## 5. Sound

Prefer real recordings from Freesound (CC0 only; the API key is in `.env.local`).
- **Add a sound:** add `{ name: "sfx/…" | "vocals/…" | "music/…", query, duration: [min, max], max }` to `scripts/sounds.json`.
- **Choose a recording:** `npm run sounds -- --list <name>` shows the top matches. Set `pick` to the chosen id, then run `npm run sounds`. Use `--force <name>` to re-download after changing the query or pick. `CREDITS.md` files are written automatically.
- **Queries:** keep them short (2 words); long ones often find nothing.
- **Reuse:** check `src/assets/sounds/` first; many sounds already exist (whoosh, poof, pop, fanfare, rimshot, crackle, crash, comedy-loop, sneaky…).
- **Synth sounds:** `synth.*` has pop, boing, step, whoosh, cheer, murmur, groan, whistle, kick and clang.
- **Voice noises must match the character's gender:**
  `python3 scripts/voice-pitch.py src/assets/sounds/vocals/*.mp3`. Calm sounds under ~165 Hz are male. Shouts, screams and breaths can't be judged this way; pick those by the Freesound description.
- **In the timeline:** `tl.add(clip('vocals/ow', { volume: 1 }), t)` and `tl.add(sfx(synth.boing), t)`.
- **Music:** under the action at ~0.2 volume. Cut or switch it at the story turn (e.g. comedy loop → sneaky pizzicato).

You cannot hear the result, so tell the user which voice noises to listen to.

## 6. Check frames, export, commit

```bash
npm run typecheck
npm run frames -- --episode <slug> <t1> <t2> ...   # → exports/frames/<slug>/sheet.png
npm run export -- --episode <slug>                 # → exports/<slug>.mp4
```

**Frames:** render a frame at every beat and look at the sheet. Check that:
- faces read;
- faces, key actions and important props stay out of the red safe zones (brief moments
  like a jump or a flight passing through are fine);
- poses line up when they switch;
- nothing floats above the floor or is cut off at the frame edge;
- effects are drawn in front of or behind the right layer.

Fix the scene and re-render until every beat reads.

**Audio check after export:** run `node_modules/ffmpeg-static/ffmpeg -i exports/<slug>.mp4 -af volumedetect -f null -`. `max_volume` should be near 0 dB but not clipping.

The user can also watch it live at `http://127.0.0.1:5173/?episode=<slug>` with `npm run dev`.

**Commit on main:** commit the episode code, `sounds.json` and the new sounds. Character pictures stay uncommitted (they're git-ignored).

## 7. Report and publish ⏸

Tell the user:
- the beat list with times and sounds;
- the MP4 path;
- which sounds to listen to.

Then offer timing or sound changes.

Give them ready-to-paste YouTube text:
- **Title:** under ~40 characters, emoji, `#shorts`.
- **Description:** 2 lines of joke, plus a parody notice:
  "Animated parody / fan-made cartoon. Not affiliated with <club> or any player. Just for fun." The video has no on-screen text, so the description must say it's a parody.
  Also add "Sounds: CC0 from Freesound.org".
- **Hashtags:** about 15, with club, player and #shorts first.
- **Pinned comment:** a question that invites replies.

Finally, delete scratch files: rendered frames in `exports/frames/`, `exports/contact-sheet.png` and anything in the session scratchpad.
