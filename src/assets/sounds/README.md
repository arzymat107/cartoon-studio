# Sounds

Audio files here load automatically and are referred to by their path without the extension:
`sfx/whoosh.mp3` → `'sfx/whoosh'`.

| Folder    | What                                                   |
| --------- | ------------------------------------------------------ |
| `music/`  | background music (comedy loop, sneaky pizzicato)       |
| `sfx/`    | action sounds (fire, extinguisher, crash, poof…)       |
| `vocals/` | wordless voice noises (gulp, ow, phew, scream, ahh…)   |
| `laughs/` | laughs and the sitcom audience track                   |

```ts
tl.add(clip('music/comedy-loop', { volume: 0.22, duration: 11.8 }), 0); // music under a scene
tl.add(clip('vocals/ow'), 4.6);                                        // one sound at 4.6 s
```

New sounds come from Freesound (CC0 only): add them to `scripts/sounds.json` and run
`npm run sounds`. Each folder's `CREDITS.md` lists where every file came from.
