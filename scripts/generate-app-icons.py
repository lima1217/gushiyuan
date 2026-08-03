#!/usr/bin/env python3
"""Generate full-bleed opaque app icons from the brand source artwork.

The source PNG may include a pre-masked squircle + drop shadow. Mobile OSes
apply their own mask, so shipped icons must be opaque squares that fill the
canvas edge-to-edge (paper background, no transparency).

Requires: Pillow (`pip install Pillow`)
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/brand/app-icon-source.png"
# Match SITE_THEME_COLOR / --palette-paper
PAPER = (250, 248, 244, 255)

OUTPUTS: list[tuple[int, float, Path]] = [
    # (size, art fill ratio, path)
    (192, 0.92, ROOT / "src/app/icon.png"),
    (180, 0.92, ROOT / "src/app/apple-icon.png"),
    (512, 0.92, ROOT / "public/icon-512.png"),
    # Maskable safe zone ≈ center 80%; keep art inside it.
    (512, 0.72, ROOT / "public/icon-maskable-512.png"),
]


def extract_art(source: Image.Image) -> Image.Image:
    rgba = source.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    ink = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ink_px = ink.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 128:
                continue
            # Drop original white board
            if r >= 235 and g >= 235 and b >= 230:
                continue
            # Drop soft drop-shadow fringe
            if a < 230 and (r + g + b) / 3 < 80:
                continue
            ink_px[x, y] = (r, g, b, a)

    minx = miny = w
    maxx = maxy = -1
    for y in range(h):
        for x in range(w):
            if ink_px[x, y][3] > 16:
                minx = min(minx, x)
                miny = min(miny, y)
                maxx = max(maxx, x)
                maxy = max(maxy, y)
    if maxx < 0:
        raise RuntimeError(f"no ink found in {SOURCE}")
    return ink.crop((minx, miny, maxx + 1, maxy + 1))


def make_icon(art: Image.Image, size: int, fill_ratio: float, path: Path) -> None:
    canvas = Image.new("RGBA", (size, size), PAPER)
    aw, ah = art.size
    target = int(size * fill_ratio)
    scale = target / max(aw, ah)
    nw = max(1, int(round(aw * scale)))
    nh = max(1, int(round(ah * scale)))
    resized = art.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas.alpha_composite(resized, ((size - nw) // 2, (size - nh) // 2))
    out = canvas.convert("RGB")
    path.parent.mkdir(parents=True, exist_ok=True)
    out.save(path, format="PNG", optimize=True)
    print(f"wrote {path.relative_to(ROOT)} ({size}x{size}, fill={fill_ratio})")


def main() -> None:
    if not SOURCE.is_file():
        raise SystemExit(f"missing source icon: {SOURCE}")
    art = extract_art(Image.open(SOURCE))
    for size, fill, path in OUTPUTS:
        make_icon(art, size, fill, path)


if __name__ == "__main__":
    main()
