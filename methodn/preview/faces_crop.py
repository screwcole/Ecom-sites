"""Crop the GAN faces to clean centered square headshots (removing the
bottom-corner watermark) and save as review avatars in assets/.
Mapping to testimonial order: rv1 Jordan (man), rv2 Priya (woman), rv3 Marcus (older man)."""
import os
from PIL import Image

FACES = os.path.join(os.path.dirname(__file__), "_faces")
ASSETS = os.path.join(os.path.dirname(__file__), "..", "assets")

# source face -> output avatar
MAP = {
    "face1.jpg": "reviewer-1.jpg",  # younger man  -> Jordan M.
    "face3.jpg": "reviewer-2.jpg",  # woman        -> Priya S.
    "face2.jpg": "reviewer-3.jpg",  # older man    -> Marcus L.
}

for src, dst in MAP.items():
    img = Image.open(os.path.join(FACES, src)).convert("RGB")
    w, h = img.size
    side = int(min(w, h) * 0.80)
    left = (w - side) // 2
    top = int(h * 0.04)                 # bias toward the top (face), cut the bottom
    box = (left, top, left + side, top + side)
    crop = img.crop(box).resize((256, 256), Image.LANCZOS)
    crop.save(os.path.join(ASSETS, dst), quality=88, optimize=True)
    print(f"{src} -> {dst}")
print("done")
