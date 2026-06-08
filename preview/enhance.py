"""Regenerate Method/N product photos from the ORIGINAL zip source:
  1) recolor blue packaging -> green
  2) upscale (Lanczos) so they're crisp at large display sizes
  3) mild unsharp mask to fight softness
  4) save at high quality
Working from the untouched originals avoids stacking JPEG compression.
"""
import zipfile, io, os
import numpy as np
from PIL import Image, ImageFilter

ZIP = r"C:\Users\colet\Desktop\Site Pics\MethodN.zip"
ASSETS = os.path.join(os.path.dirname(__file__), "..", "assets")
FILES = {
    "methodnproductimage.jpeg",
    "methodn1box.jpeg",
    "methodn2box.jpeg",
    "methodn3box.jpeg",
    "methodnugcproductimage.jpeg",
}

# Blue -> green recolor (PIL HSV 0-255). Blue ~150-170 -> green ~95-110.
H_LO, H_HI, SHIFT, SAT_MIN = 120, 190, 52, 22
TARGET_LONG = 1800   # upscale so the long edge is at least this many px

def recolor(img):
    hsv = np.array(img.convert("HSV")).astype(np.int16)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    mask = (h >= H_LO) & (h <= H_HI) & (s >= SAT_MIN)
    h[mask] = np.clip(h[mask] - SHIFT, 0, 255)
    s[mask] = np.clip(s[mask].astype(np.float32) * 1.05, 0, 255).astype(np.int16)
    hsv[..., 0], hsv[..., 1] = h, s
    return Image.fromarray(hsv.astype(np.uint8), "HSV").convert("RGB")

z = zipfile.ZipFile(ZIP)
for entry in z.namelist():
    base = os.path.basename(entry)
    if base in FILES and not entry.startswith("__MACOSX"):
        img = Image.open(io.BytesIO(z.read(entry))).convert("RGB")
        ow, oh = img.size
        img = recolor(img)
        # upscale
        longside = max(img.size)
        scale = max(TARGET_LONG / longside, 1.0)
        if scale > 1.0:
            img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
        # sharpen to counter softness
        img = img.filter(ImageFilter.UnsharpMask(radius=2.2, percent=110, threshold=2))
        img.save(os.path.join(ASSETS, base), quality=95, optimize=True, progressive=True)
        print(f"{base}: {ow}x{oh} -> {img.width}x{img.height}")
print("done")
