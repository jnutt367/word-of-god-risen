#!/usr/bin/env python3
"""Build public/images/podcast-cover.jpg (3000x3000, Apple-spec).

The REAL TruVINE emblem master (truvine-shorts/brand/
truvine-emblem-cleaned-transparent.png), whole, flat, at true proportions,
on the deep vineyard field (#0c1f16), with the title in Quicksand Bold
(true 700) gold and the subtitle in cream.

Note: the master PNG's alpha channel carries a faint dotted diagonal
guide-line outside the triangle (alpha <= ~191 specks). We keep only the
largest connected alpha component — the emblem itself — so the cover
shows the emblem exactly as it appears on every other family surface.
Usage: python3 scripts/build-podcast-cover.py
"""
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from scipy import ndimage

MASTER = '/home/hatch/workspace/truvine-shorts/brand/truvine-emblem-cleaned-transparent.png'
FONT = '/home/hatch/workspace/truvine-shorts/bible-month-2026/swork/Quicksand[wght].ttf'
OUT = '/home/hatch/workspace/word-of-god-risen/public/images/podcast-cover.jpg'

S = 3000
FIELD = (12, 31, 22)      # vineyard-950 #0c1f16
GOLD = (228, 185, 92)     # gold-400 #e4b95c
CREAM = (243, 234, 211)

src = Image.open(MASTER).convert('RGBA')
arr = np.array(src)
a = arr[:, :, 3]
lab, n = ndimage.label(a >= 100, structure=np.ones((3, 3)))
sizes = ndimage.sum(a >= 100, lab, range(1, n + 1))
keep = lab == (1 + int(np.argmax(sizes)))
arr[:, :, 3] = np.where(keep, a, 0)
ys, xs = np.where(arr[:, :, 3] > 0)
bbox = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
emblem = Image.fromarray(arr, 'RGBA').crop(bbox)

img = Image.new('RGB', (S, S), FIELD)
d = ImageDraw.Draw(img)
EW = 1720
EH = round(EW * emblem.height / emblem.width)  # true proportions
emblem_r = emblem.resize((EW, EH), Image.LANCZOS)


def qfont(size):
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_axes([700])
    except Exception:
        pass
    return f


def fit(text, max_w, start):
    size = start
    while size > 40:
        f = qfont(size)
        if d.textbbox((0, 0), text, font=f)[2] <= max_w:
            return f
        size -= 10
    return qfont(40)


title_f = fit('WORD OF GOD RISEN', 2620, 340)
sub_f = qfont(158)
tb = d.textbbox((0, 0), 'WORD OF GOD RISEN', font=title_f)
tw, th = tb[2] - tb[0], tb[3] - tb[1]
sb = d.textbbox((0, 0), 'the Bible, read aloud', font=sub_f)
sw, sh = sb[2] - sb[0], sb[3] - sb[1]

GAP1, RULE_W, GAP2, GAP3 = 120, 860, 46, 64
stack = EH + GAP1 + th + GAP2 + 6 + GAP3 + sh
y = (S - stack) // 2
img.paste(emblem_r, ((S - EW) // 2, y), emblem_r)
y += EH + GAP1
d.text(((S - tw) // 2 - tb[0], y - tb[1]), 'WORD OF GOD RISEN', font=title_f, fill=GOLD)
y += th + GAP2
d.line([(S - RULE_W) // 2, y, (S + RULE_W) // 2, y], fill=GOLD, width=6)
y += 6 + GAP3
d.text(((S - sw) // 2 - sb[0], y - sb[1]), 'the Bible, read aloud', font=sub_f, fill=CREAM)

img.save(OUT, 'JPEG', quality=92)
print('saved', OUT)
