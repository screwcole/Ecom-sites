"""Recolor Method/N packaging from blue to green across all product photos.
Shifts blue-range hues to green in HSV; leaves whites, blacks, grays and skin tones alone.
Originals are preserved in the source zip on the Desktop.
"""
import numpy as np
from PIL import Image
import os

ASSETS = os.path.join(os.path.dirname(__file__), "..", "assets")
FILES = [
    "methodnproductimage.jpeg",
    "methodn1box.jpeg",
    "methodn2box.jpeg",
    "methodn3box.jpeg",
    "methodnugcproductimage.jpeg",
]

# PIL HSV is 0-255 per channel. Blue ~ 150-170, target green ~ 95-110.
H_LO, H_HI = 120, 190      # blue / azure / cyan-blue range to recolor
SHIFT = 52                 # hue degrees (0-255 scale) to subtract -> moves blue into green
SAT_MIN = 22               # ignore near-gray/white so the white box & gray bg stay neutral

for name in FILES:
    path = os.path.join(ASSETS, name)
    img = Image.open(path).convert("RGB")
    hsv = np.array(img.convert("HSV")).astype(np.int16)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]

    mask = (h >= H_LO) & (h <= H_HI) & (s >= SAT_MIN)
    # Shift hue into green; gently lift saturation so it reads clearly green
    h[mask] = np.clip(h[mask] - SHIFT, 0, 255)
    s[mask] = np.clip((s[mask].astype(np.float32) * 1.05), 0, 255).astype(np.int16)

    hsv[..., 0], hsv[..., 1] = h, s
    out = Image.fromarray(hsv.astype(np.uint8), "HSV").convert("RGB")
    out.save(path, quality=90)
    pct = round(100.0 * mask.sum() / mask.size, 1)
    print(f"{name}: recolored {pct}% of pixels")

print("done")
