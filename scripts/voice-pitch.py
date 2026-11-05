"""
Estimates the voice pitch of sound files, to check a voice noise (ow, phew, scream…) is the
gender the character needs before using it – Freesound titles rarely say.

  python3 scripts/voice-pitch.py src/assets/sounds/vocals/*.mp3

Roughly, for calm sounds (ahh, chuckle, gulp, hmm): below ~165 Hz is a male voice, above ~190 Hz
female or a child. Shouts and screams (ow!, aaah!) run 250–400 Hz even for men, and breaths
(phew, huff) have little pitch – judge those by ear, and distrust results from only a few frames. Pure Python (no numpy); decodes with the project's ffmpeg-static.
"""
import statistics
import subprocess
import sys
from array import array
from pathlib import Path

FFMPEG = Path(__file__).resolve().parent.parent / 'node_modules/ffmpeg-static/ffmpeg'
RATE = 8000
FRAME = 400  # 50 ms
MIN_HZ, MAX_HZ = 70, 500


def samples(path: Path) -> array:
    raw = subprocess.run([str(FFMPEG), '-loglevel', 'error', '-i', str(path), '-t', '4', '-ac', '1', '-ar', str(RATE), '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    return array('h', raw)


def frame_pitch(x: list[float]) -> float | None:
    energy = sum(v * v for v in x)
    if energy < len(x) * 300 ** 2:
        return None  # too quiet
    best_lag, best = 0, 0.0
    for lag in range(RATE // MAX_HZ, RATE // MIN_HZ):
        c = sum(x[i] * x[i + lag] for i in range(len(x) - lag))
        if c > best:
            best_lag, best = lag, c
    # A best match at the shortest lag means noise (a breath or hiss), not a voice.
    return RATE / best_lag if best_lag > RATE // MAX_HZ and best / energy > 0.4 else None


def main(paths: list[str]) -> None:
    if not paths:
        sys.exit(__doc__)
    for p in paths:
        s = samples(Path(p))
        pitches = [f for i in range(0, len(s) - FRAME, FRAME // 2) if (f := frame_pitch([float(v) for v in s[i:i + FRAME]]))]
        if not pitches:
            print(f'{p}: no clear pitch (breath, noise or too quiet)')
            continue
        hz = statistics.median(pitches)
        guess = 'male' if hz < 165 else 'female / child' if hz > 190 else 'unclear'
        print(f'{p}: ~{hz:.0f} Hz over {len(pitches)} frames → {guess}')


if __name__ == '__main__':
    main(sys.argv[1:])
