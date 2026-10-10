#!/usr/bin/env python3
"""Convert character portraits per scripts/.character-images-manifest.json.

Reads the manifest written by build-characters-data.mjs and converts each
source PNG to an optimized web JPEG (max 1024px wide, quality 82).
"""
import json
import os
import sys
from PIL import Image

MANIFEST = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".character-images-manifest.json")

def main():
    if not os.path.exists(MANIFEST):
        print("No manifest found — nothing to convert.")
        return
    with open(MANIFEST) as f:
        jobs = json.load(f)
    for job in jobs:
        src, dest = job["src"], job["dest"]
        if not os.path.exists(src):
            print(f"SKIP (missing): {src}")
            continue
        im = Image.open(src).convert("RGB")
        if im.width > 1024:
            im = im.resize((1024, int(im.height * 1024 / im.width)), Image.LANCZOS)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        im.save(dest, "JPEG", quality=82, optimize=True)
        print(f"OK: {os.path.basename(dest)} ({os.path.getsize(dest)//1024}KB)")

if __name__ == "__main__":
    sys.exit(main())
