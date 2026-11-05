"""
Puts character cut-outs side by side on a green background, so missing parts (erased white
shoes, eyes, shorts) and leftover white fringe are easy to spot.

  python3 scripts/contact-sheet.py src/assets/characters/Ole/*.png
  python3 scripts/contact-sheet.py --grid src/assets/characters/Ole/ole_eager.png

--grid draws a labelled 100 px grid over each picture, to read off picture coordinates
(rig origins, chin points, --keep / --fill points for clean-cutout.py).
Writes exports/contact-sheet.png and prints each file's size and mode.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

GREEN = (40, 170, 70, 255)
CELL_H = 1200


def main(args: list[str]) -> None:
    grid = '--grid' in args
    paths = [Path(a) for a in args if a != '--grid' and not a.endswith('.orig.png')]
    if not paths:
        sys.exit(__doc__)
    cells = []
    for path in paths:
        im = Image.open(path).convert('RGBA')
        print(f'{path}: {im.size[0]}×{im.size[1]} {Image.open(path).mode}')
        if grid:
            draw = ImageDraw.Draw(im)
            for x in range(0, im.width, 100):
                draw.line([(x, 0), (x, im.height)], fill=(255, 0, 255, 160), width=1)
                draw.text((x + 2, 2), str(x), fill=(255, 0, 255, 255))
            for y in range(0, im.height, 100):
                draw.line([(0, y), (im.width, y)], fill=(255, 0, 255, 160), width=1)
                draw.text((2, y + 2), str(y), fill=(255, 0, 255, 255))
        cell = Image.new('RGBA', im.size, GREEN)
        cell.alpha_composite(im)
        if not grid:
            cell = cell.resize((round(im.width * CELL_H / im.height), CELL_H))
        ImageDraw.Draw(cell).text((10, 10), path.stem, fill=(255, 255, 255, 255))
        cells.append(cell)
    sheet = Image.new('RGBA', (sum(c.width for c in cells) + 10 * (len(cells) + 1), max(c.height for c in cells) + 20), (255, 255, 255, 255))
    x = 10
    for cell in cells:
        sheet.paste(cell, (x, 10))
        x += cell.width + 10
    out = Path('exports/contact-sheet.png')
    out.parent.mkdir(exist_ok=True)
    sheet.convert('RGB').save(out)
    print(out)


if __name__ == '__main__':
    main(sys.argv[1:])
