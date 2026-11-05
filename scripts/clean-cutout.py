"""
Cleans up a character cut-out (transparent PNG made from an AI image):

  1. Fills holes: transparent pixels that are not connected to the image border are inside the
     figure (e.g. white shoe soles erased by background removal) and become opaque again.
  2. Removes the light fringe: trims a thin ring of near-white pixels from the outer edge.
  3. Smooths the edge: a slight anti-aliased alpha instead of a jagged 0/255 edge.

  python3 scripts/clean-cutout.py src/assets/characters/Carrick/carrick_sitting.png [...]
  python3 scripts/clean-cutout.py carrick_launch.png --keep 540,268 --keep 398,1712

--keep x,y marks the enclosed transparent area under that pixel as a real gap (e.g. between hair
strands or behind a knee) that must stay transparent even though it is small.

Each file is cleaned in place; the original is kept next to it as <name>.orig.png (once).
"""
import shutil
import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

ALPHA_SOLID = 128
FRINGE_PASSES = 2
#: Enclosed transparent areas up to this many pixels are holes; bigger ones are real gaps.
MAX_HOLE = 4000


def outside_mask(alpha: Image.Image) -> bytearray:
    """1 for transparent pixels reachable from the border (the real background)."""
    w, h = alpha.size
    a = alpha.load()
    out = bytearray(w * h)
    queue = deque()
    for x in range(w):
        queue.extend([(x, 0), (x, h - 1)])
    for y in range(h):
        queue.extend([(0, y), (w - 1, y)])
    while queue:
        x, y = queue.popleft()
        i = y * w + x
        if out[i] or a[x, y] >= ALPHA_SOLID:
            continue
        out[i] = 1
        if x > 0: queue.append((x - 1, y))
        if x < w - 1: queue.append((x + 1, y))
        if y > 0: queue.append((x, y - 1))
        if y < h - 1: queue.append((x, y + 1))
    return out


def clean(path: Path, keep: list[tuple[int, int]] = ()) -> None:
    backup = path.with_name(path.stem + '.orig.png')
    if not backup.exists():
        shutil.copy2(path, backup)
    im = Image.open(backup).convert('RGBA')
    w, h = im.size
    px = im.load()
    out = outside_mask(im.getchannel('A'))

    # Enclosed transparent areas: small ones are holes (fill), big ones are real gaps such as the
    # space between the legs (keep transparent).
    alpha = im.getchannel('A').load()
    seen = bytearray(w * h)
    holes = 0
    for sy in range(h):
        for sx in range(w):
            i = sy * w + sx
            if seen[i] or out[i] or alpha[sx, sy] >= ALPHA_SOLID:
                continue
            component, queue = [], deque([(sx, sy)])
            seen[i] = 1
            while queue:
                x, y = queue.popleft()
                component.append((x, y))
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    j = ny * w + nx
                    if 0 <= nx < w and 0 <= ny < h and not seen[j] and alpha[nx, ny] < ALPHA_SOLID:
                        seen[j] = 1
                        queue.append((nx, ny))
            if len(component) <= MAX_HOLE and not any(p in keep for p in component):
                holes += len(component)
            else:
                for x, y in component:
                    out[y * w + x] = 1

    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            px[x, y] = (r, g, b, 0 if out[y * w + x] else 255)

    # Trim near-white pixels sitting on the outer edge (leftovers of the old white background).
    trimmed = 0
    for _ in range(FRINGE_PASSES):
        edge = []
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                r, g, b, a = px[x, y]
                if a and min(r, g, b) > 200 and any(px[nx, ny][3] == 0 for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))):
                    edge.append((x, y))
        for x, y in edge:
            r, g, b, _ = px[x, y]
            px[x, y] = (r, g, b, 0)
        trimmed += len(edge)

    # Anti-alias: soften the hard edge by about one pixel, keeping the inside fully solid.
    alpha = im.getchannel('A')
    soft = alpha.filter(ImageFilter.GaussianBlur(0.8))
    im.putalpha(Image.eval(soft, lambda v: 0 if v < 40 else min(255, int((v - 40) * 255 / 175))))
    im.save(path)
    print(f'{path}: filled {holes} hole pixels, trimmed {trimmed} fringe pixels (original: {backup.name})')


if __name__ == '__main__':
    args, keep, paths = sys.argv[1:], [], []
    while args:
        arg = args.pop(0)
        if arg == '--keep':
            x, y = args.pop(0).split(',')
            keep.append((int(x), int(y)))
        else:
            paths.append(arg)
    for arg in paths:
        clean(Path(arg), keep)
