#!/usr/bin/env python3
"""Generates lib/atelier/decor-tones.ts: decor code -> average colour of its swatch image.

The configurator uses these tones for swatches / the 3D model before the texture
image loads (and when it fails to load).

Rerun after the CRM decor catalogue changes (needs Pillow: pip install pillow):

    python3 scripts/gen-decor-tones.py [path/to/epicmob-ofertare]

The CRM repo defaults to ../epicmob-ofertare. Reads
data/decoruri-furnizori/catalog-decoruri.json (rows with tip "placa") and the
images under public/decoruri.
"""
import json
import os
import sys

from PIL import Image

here = os.path.dirname(os.path.abspath(__file__))
crm = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, "..", "..", "epicmob-ofertare"))
rows = json.load(open(os.path.join(crm, "data", "decoruri-furnizori", "catalog-decoruri.json"), encoding="utf-8"))

def trim_white(im):
    """Cuts the white bars some supplier swatches have left/right or top/bottom."""
    w, h = im.size
    px = im.load()

    def white_col(x):
        return sum(min(px[x, y]) > 243 for y in range(h)) > 0.97 * h

    def white_row(y):
        return sum(min(px[x, y]) > 243 for x in range(w)) > 0.97 * w

    l, r, t, b = 0, w, 0, h
    while l < r and white_col(l):
        l += 1
    while r > l and white_col(r - 1):
        r -= 1
    while t < b and white_row(t):
        t += 1
    while b > t and white_row(b - 1):
        b -= 1
    if r - l < w // 3 or b - t < h // 3:  # an all-white decor: keep it whole
        return im, (0, 0, w, h)
    return im.crop((l, t, r, b)), (l, t, r, b)


# Photos of a glossy board in a showroom (reflections, windows) or of a product, not of the
# decor: useless as a tiling texture.
FORCE_PLAIN = {"608", "670", "384", "662", "6004", "3006", "675"}
# A white „NEW" on a near-white decor: the detector cannot see it, the eye can.
FORCE_TOP_LABEL = {"3074", "3075", "3076"}
# The maker's round emblem, bottom left, on these three photos.
FORCE_BOTTOM_LABEL = {"A656 PS76", "A660 PS76", "A662 PS76"}

# Decor families by supplier code. Uni colours are flat by definition; woods, stones and
# textiles keep their photo even when it is low-contrast (a pale oak is still an oak).
import re

UNI_CODE = re.compile(r"^(U|W|D)\d")  # Egger U/W, Kastamonu D
TEXTURED_CODE = re.compile(r"^(H|F|A)\d")  # Egger H/F, Kastamonu A/F


def centre_detail(im):
    w, h = im.size
    return max(detail(im.crop((int(w * 0.2), int(h * 0.2), int(w * 0.8), int(h * 0.8)))))


def sticker_free_band(im):
    """Supplier photos sometimes carry a „NOU" / „NEW" label or an emblem in a corner. Returns the
    (top, bottom) fractions of the band without it — (0, 1) when the photo is clean."""
    w, h = im.size
    px = im.load()

    def odd(x, y):
        r, g, b = px[x, y]
        white = min(r, g, b) > 232
        red = r > 190 and g < 90 and b < 90
        return white or red

    def share(box):
        l, t, r, b = box
        n = max(1, (r - l) * (b - t))
        return sum(odd(x, y) for y in range(t, b) for x in range(l, r)) / n

    centre = share((int(w * 0.3), int(h * 0.3), int(w * 0.7), int(h * 0.7)))
    limit = centre * 4 + 0.004
    cw, ch = int(w * 0.34), int(h * 0.26)

    def rows_with_label(cols, rows):
        """Rows (within `rows`) where one of the corner column ranges holds label pixels."""
        hit = []
        for y in rows:
            for l, r in cols:
                if sum(odd(x, y) for x in range(l, r)) / max(1, r - l) > limit * 2:
                    hit.append(y)
                    break
        return hit

    cols = [(0, cw), (w - cw, w)]
    top, bottom = 0.0, 1.0
    if max(share((0, 0, cw, ch)), share((w - cw, 0, w, ch))) > limit:
        hit = rows_with_label(cols, range(0, int(h * 0.45)))
        top = min(0.45, (max(hit) + 1) / h + 0.04) if hit else 0.28
    if max(share((0, h - ch, cw, h)), share((w - cw, h - ch, w, h))) > limit:
        hit = rows_with_label(cols, range(int(h * 0.55), h))
        bottom = max(0.55, min(hit) / h - 0.04) if hit else 0.72
    return top, bottom


# The supplier photos of the blacks are washed-out mid greys; the boards are black.
TONE_OVERRIDES = {
    "U999 ST19": "#2a2a2b",
    "U999 ST7": "#2a2a2b",
    "U999 TM28": "#262627",
    "U998 ST38": "#313132",
    "U899 ST9": "#3a3a3b",
    "D107 PS14": "#2d2d2e",
}


def detail(im):
    """Mean brightness step between neighbouring pixels, across (dx) and down (dy)."""
    g = im.convert("L")
    w, h = g.size
    px = g.load()
    dx = sum(abs(px[x + 1, y] - px[x, y]) for y in range(h) for x in range(w - 1)) / (h * (w - 1))
    dy = sum(abs(px[x, y + 1] - px[x, y]) for y in range(h - 1) for x in range(w)) / (w * (h - 1))
    return dx, dy


tones = {}
crops = {}
plain = set()
horizontal = set()
missing = []
for row in rows:
    if row.get("tip") != "placa" or not row.get("cod_decor") or not row.get("image"):
        continue
    code = row["cod_decor"]
    if code in tones:
        continue
    path = os.path.join(crm, "public", row["image"].lstrip("/"))
    try:
        whole = Image.open(path).convert("RGB")
        im, box = trim_white(whole)
    except Exception:
        missing.append(code)
        continue
    px = list(im.resize((64, 64), Image.BOX).get_flattened_data())
    med = [sorted(p[i] for p in px)[len(px) // 2] for i in range(3)]
    near = sum(all(abs(p[i] - med[i]) < 14 for i in range(3)) for p in px) / len(px)
    dx, dy = detail(im)
    wpx = list(whole.resize((48, 48), Image.BOX).get_flattened_data())
    white_bg = sum(min(p) > 243 for p in wpx) / len(wpx)
    if code in FORCE_PLAIN or UNI_CODE.match(code) or (code.startswith("LB-") and white_bg > 0.08):
        # (LB-… with a white background: a product photo of slatted panels, not a decor)
        textured = False
        if white_bg > 0.08 and code.startswith("LB-"):
            # the colour of the product, not of the white backdrop
            solid = [p for p in wpx if min(p) <= 243] or wpx
            med = [sorted(p[i] for p in solid)[len(solid) // 2] for i in range(3)]
    elif TEXTURED_CODE.match(code):
        textured = centre_detail(im) >= 0.5
    else:  # AGT and others: decided by the photo itself
        textured = not (near >= 0.9 or max(dx, dy) < 1.6) or centre_detail(im) >= 1.2
    if not textured:
        # one flat colour (the rest is a "NOU" / "PROMOȚIE" sticker): the median ignores the sticker
        plain.add(code)
        rgb = med
    else:
        # wood / stone: only the clean part of the photo is used (no white bars, no label)
        top, bottom = sticker_free_band(im)
        if code in FORCE_TOP_LABEL:
            top = max(top, 0.28)
        if code in FORCE_BOTTOM_LABEL:
            bottom = min(bottom, 0.6)
        W, H = whole.size
        l, t, r, b = box
        t, b = t + round((b - t) * top), t + round((b - t) * bottom)
        if (l, t, r, b) != (0, 0, W, H):
            crops[code] = [round(l / W, 4), round(t / H, 4), round((r - l) / W, 4), round((b - t) / H, 4)]
            im = whole.crop((l, t, r, b))
            px = list(im.resize((64, 64), Image.BOX).get_flattened_data())
            dx, dy = detail(im)
        # average in linear light
        lin = [sum((p[i] / 255) ** 2.2 for p in px) / len(px) for i in range(3)]
        rgb = [round(255 * v ** (1 / 2.2)) for v in lin]
        if dy > 2 * dx:
            horizontal.add(code)  # the photo shows the grain lying down
    tones[code] = "#%02x%02x%02x" % tuple(rgb)

tones.update(TONE_OVERRIDES)
plain.update(TONE_OVERRIDES)

out = os.path.join(here, "..", "lib", "atelier", "decor-tones.ts")
with open(out, "w", encoding="utf-8") as f:
    f.write("// GENERATED by scripts/gen-decor-tones.py — do not edit by hand.\n")
    f.write("/** Average colour of each decor's swatch image, by supplier decor code. */\n")
    f.write("export const DECOR_TONES: Record<string, string> = {\n")
    for code in sorted(tones):
        f.write(f"  {json.dumps(code)}: \"{tones[code]}\",\n")
    f.write("};\n\n")
    f.write("/**\n * Uni decors (one flat colour). Their swatch photo adds nothing and often carries a\n")
    f.write(" * supplier sticker or white bars, so they are drawn as the flat tone, never as a texture.\n */\n")
    f.write("export const PLAIN_DECORS: ReadonlySet<string> = new Set([\n")
    for code in sorted(plain):
        f.write(f"  {json.dumps(code)},\n")
    f.write("]);\n\n")
    f.write("/**\n * The clean part of a decor photo, as fractions [x, y, width, height]: without the white bars\n")
    f.write(" * or the supplier's label. Swatches and the 3D texture use only this region.\n */\n")
    f.write("export const DECOR_CROPS: Record<string, readonly [number, number, number, number]> = {\n")
    for code in sorted(crops):
        f.write(f"  {json.dumps(code)}: {json.dumps(crops[code])},\n")
    f.write("};\n\n")
    f.write("/** Wood decors whose photo shows the grain horizontally (turned 90° when used as a texture). */\n")
    f.write("export const HORIZONTAL_GRAIN_DECORS: ReadonlySet<string> = new Set([\n")
    for code in sorted(horizontal):
        f.write(f"  {json.dumps(code)},\n")
    f.write("]);\n")
print(f"{len(tones)} tones written ({len(plain)} plain, {len(crops)} cropped), {len(missing)} images missing: {missing[:10]}")
