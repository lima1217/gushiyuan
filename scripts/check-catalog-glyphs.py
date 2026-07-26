#!/usr/bin/env python3
"""Check catalog-visible CJK against wenkai subset cmap."""
from __future__ import annotations

import json
import re
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "scripts/.cache/wenkai.manifest.json"


def subset_font_path() -> Path:
    if MANIFEST.exists():
        manifest = json.loads(MANIFEST.read_text("utf8"))
        return ROOT / "public/fonts/wenkai" / manifest["fontFile"]
    return ROOT / "public/fonts/wenkai/wenkai-subset.woff2"


def catalog_strings() -> set[str]:
    strings: set[str] = set()
    for volume in json.loads((ROOT / "content/volumes.json").read_text("utf8")):
        strings.add(volume["name"])
    for poem in (ROOT / "content/poems").glob("*.md"):
        frontmatter = poem.read_text("utf8").split("---", 2)[1]
        for line in frontmatter.splitlines():
            match = re.match(r"^(title|author|dynasty):\s*(.+)", line)
            if match:
                strings.add(match.group(2).strip())
    strings.update({"尚未录入", "目录", "古诗源"})
    return strings


def main() -> None:
    font_path = subset_font_path()
    cmap = TTFont(font_path).getBestCmap()
    chars = sorted(
        {ch for text in catalog_strings() for ch in text if ord(ch) >= 0x4E00},
        key=lambda c: ord(c),
    )
    missing = [(c, ord(c)) for c in chars if ord(c) not in cmap]
    print(f"font: {font_path.relative_to(ROOT)}")
    print(f"catalog CJK unique: {len(chars)}")
    print(f"missing from woff2: {len(missing)}")
    for ch, cp in missing:
        print(f"  {ch} U+{cp:04X}")


if __name__ == "__main__":
    main()
