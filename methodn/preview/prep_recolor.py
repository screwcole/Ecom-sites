"""Step 1 of the AI-upscale pipeline: extract ORIGINALS from the zip,
recolor blue->green, and write native-resolution PNGs (lossless) into _tools/in/.
Real-ESRGAN then upscales these; a later step downsizes + saves final JPEGs.
"""
import zipfile, io, os
import numpy as np
from PIL import Image

ZIP = r"C:\Users\colet\Desktop\Site Pics\MethodN.zip"
INDIR = os.path.join(os.path.dirname(__file__), "_tools", "in")
os.makedirs(INDIR, exist_ok=True)
FILES = {
    "methodnproductimage.jpeg", "methodn1box.jpeg", "methodn2box.jpeg",
    "methodn3box.jpeg", "methodnugcproductimage.jpeg",
}
H_LO, H_HI, SHIFT, SAT_MIN = 120, 190, 52, 22

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
        img = recolor(Image.open(io.BytesIO(z.read(entry))).convert("RGB"))
        out = os.path.join(INDIR, base.replace(".jpeg", ".png"))
        img.save(out)
        print(f"prepped {os.path.basename(out)} {img.size}")
print("done")
