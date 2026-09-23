#!/usr/bin/env python3
"""Build the Kukis logo from the navbar wordmark.

    python3 scripts/build-logo.py          # writes public/logo/*.svg
    node scripts/build-logo-png.mjs        # then rasterises the PNGs

Both take --out <dir> to write somewhere else (the portable brand bundle uses it).

The mark is the same "Kukis" the header renders (app: src/components/ui/Logo.tsx)
-- Gabarito ExtraBold, Blueberry on Milk, tracked -0.04em -- with the dot of the
"i" turned into a bitten cookie, which is the logo direction locked in
brand-guidelines-final.md ("cookie-bite negative space ... or the dot of the i").

The letterforms are baked to outlines, so the files need no font at render time.
The bite is a real hole punched through the glyph rather than a Milk-coloured
dot, so the mark still works if it is ever dropped on another background.
"""
import argparse
import math
import os
import urllib.request
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_args = argparse.ArgumentParser(description="Build the Kukis logo SVGs.")
_args.add_argument("--out", default=os.path.join(ROOT, "public", "logo"),
                   help="directory to write the SVGs into")
OUT = os.path.abspath(_args.parse_known_args()[0].out)
FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                    ".gabarito-extrabold.ttf")         # cached beside the script, git-ignored
FONT_URL = "https://fonts.gstatic.com/s/gabarito/v9/QGYwz_0dZAGKJJ4t3FFkc3Q8AkNP9Pj2Y8W0Fg.ttf"

# --- tokens, copied from src/index.css --------------------------------------
MILK = "#fff6e7"        # --color-milk, the page background
BLUEBERRY = "#2f6fb0"   # --color-blueberry, the wordmark colour
TRACKING_EM = -0.04     # tracking-[-0.04em], as the navbar sets it

# --- the bite, in font units relative to the i's dot -------------------------
# Four overlapping scallops, not one circle: a single circle big enough to read
# as a bite leaves a thin horn and the dot turns into a crescent moon. Four
# shallow ones give a wide, toothed mouth instead. (angle, distance, radius)
BITE = [(4, 86, 50), (30, 80, 58), (58, 80, 58), (86, 86, 50)]
# Crumbs that broke off with it. Same polar frame.
CRUMBS = [(10, 134, 16), (62, 128, 20), (34, 178, 10), (88, 172, 8)]


def load_font():
    os.makedirs(OUT, exist_ok=True)
    if not os.path.exists(FONT):
        print("fetching Gabarito ExtraBold…")
        urllib.request.urlretrieve(FONT_URL, FONT)
    return TTFont(FONT)


font = load_font()
upem = font["head"].unitsPerEm
glyphset, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font["hmtx"]
TRACKING = TRACKING_EM * upem


def layout(word="Kukis"):
    """Outlines in font units: origin at the text origin, y up from the baseline."""
    parts, offsets, x = [], {}, 0.0
    xmin = ymin = float("inf")
    xmax = ymax = float("-inf")
    for i, ch in enumerate(word):
        g = cmap[ord(ch)]
        pen = SVGPathPen(glyphset, ntos=lambda v: f"{v:.1f}")
        glyphset[g].draw(pen)
        if pen.getCommands():
            parts.append(f'<path transform="translate({x:.1f} 0)" d="{pen.getCommands()}"/>')
        bp = BoundsPen(glyphset)
        glyphset[g].draw(bp)
        if bp.bounds:
            x0, y0, x1, y1 = bp.bounds
            xmin, ymin = min(xmin, x0 + x), min(ymin, y0)
            xmax, ymax = max(xmax, x1 + x), max(ymax, y1)
        offsets[ch + str(i)] = x
        x += hmtx[g][0] + TRACKING
    return parts, (xmin, ymin, xmax, ymax), offsets


PATHS, GLYPHS, OFF = layout()
DOT = (OFF["i3"] + 130.5, 646.0)   # centre of the i's dot: the cookie


def polar(specs):
    return [
        (DOT[0] + math.cos(math.radians(a)) * d, DOT[1] + math.sin(math.radians(a)) * d, r)
        for a, d, r in specs
    ]


def svg(width, height, mark_width, label="Kukis"):
    """A Milk canvas with the mark optically centred on its ink box."""
    bite, crumbs = polar(BITE), polar(CRUMBS)
    x0, y0, x1, y1 = GLYPHS
    for cx, cy, r in crumbs:                 # crumbs are part of the mark
        x0, y0 = min(x0, cx - r), min(y0, cy - r)
        x1, y1 = max(x1, cx + r), max(y1, cy + r)
    w, h = x1 - x0, y1 - y0
    s = mark_width / w                       # font units -> px
    tx = (width - w * s) / 2 - x0 * s
    ty = (height - h * s) / 2 + y1 * s       # y flips below, so this is the baseline
    b = 250                                  # mask bleed, so no edge clips
    circles = lambda cs: "\n      ".join(
        f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}"/>' for cx, cy, r in cs
    )
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}" role="img" aria-label="{label}">
  <title>{label}</title>
  <rect width="{width}" height="{height}" fill="{MILK}"/>
  <g transform="translate({tx:.3f} {ty:.3f}) scale({s:.6f} -{s:.6f})" fill="{BLUEBERRY}">
    <mask id="bite" maskUnits="userSpaceOnUse" x="{x0-b:.0f}" y="{y0-b:.0f}" width="{w+2*b:.0f}" height="{h+2*b:.0f}">
      <rect x="{x0-b:.0f}" y="{y0-b:.0f}" width="{w+2*b:.0f}" height="{h+2*b:.0f}" fill="#fff"/>
      <g fill="#000">
      {circles(bite)}
      </g>
    </mask>
    <g mask="url(#bite)">
      {(chr(10) + "      ").join(PATHS)}
    </g>
    {circles(crumbs)}
  </g>
</svg>
'''


if __name__ == "__main__":
    gw, gh = GLYPHS[2] - GLYPHS[0], GLYPHS[3] - GLYPHS[1]
    pad = round(gh * 0.5)            # clear space = half the mark height, all round
    wm_w, wm_h = round(gw) + 2 * pad, round(gh) + 2 * pad
    sq = 1024

    with open(os.path.join(OUT, "kukis-wordmark.svg"), "w") as f:
        f.write(svg(wm_w, wm_h, gw, "Kukis wordmark"))
    with open(os.path.join(OUT, "kukis-logo.svg"), "w") as f:
        f.write(svg(sq, sq, sq * 0.74))
    print(f"kukis-wordmark.svg {wm_w}x{wm_h}\nkukis-logo.svg {sq}x{sq}")
