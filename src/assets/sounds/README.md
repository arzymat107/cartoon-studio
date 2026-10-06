# Sounds

Put audio files (`.mp3`, `.ogg`, `.wav`, `.m4a`, `.webm`) here. They load automatically
and are referred to by their path without the extension:

| File                         | Name                |
| ---------------------------- | ------------------- |
| `voices/bob-hello.mp3`       | `'voices/bob-hello'` |
| `music/theme.ogg`            | `'music/theme'`     |
| `sfx/door-knock.wav`         | `'sfx/door-knock'`  |

```ts
// A recorded voice line: the character talks for exactly as long as the recording.
tl.add(say(bob, hello, { voice: 'voices/bob-hello' }), 2);

// Background music under the whole scene, looped and quieter.
tl.add(clip('music/theme', { volume: 0.3, loop: true, duration: tl.duration() }), 0);

// A sound effect.
tl.add(clip('sfx/door-knock'), 'knock');
```

Free sources: [freesound.org](https://freesound.org), [pixabay.com/sound-effects](https://pixabay.com/sound-effects/),
[opengameart.org](https://opengameart.org). Check each file's license.
