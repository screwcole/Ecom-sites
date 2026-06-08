"""Step 3: take the Real-ESRGAN 4x outputs, downscale to a crisp web size,
and save optimized JPEGs into assets/ (overwriting). Downscaling a big AI
upscale yields very sharp results at sane file sizes.
"""
import os
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), "_tools", "out")
ASSETS = os.path.join(os.path.dirname(__file__), "..", "assets")
TARGET = 2000  # long-edge px for the final web image

for fn in os.listdir(OUT):
    if not fn.endswith(".png"):
        continue
    img = Image.open(os.path.join(OUT, fn)).convert("RGB")
    long = max(img.size)
    if long > TARGET:
        scale = TARGET / long
        img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    dest = os.path.join(ASSETS, fn.replace(".png", ".jpeg"))
    img.save(dest, quality=92, optimize=True, progressive=True)
    kb = round(os.path.getsize(dest) / 1024)
    print(f"{os.path.basename(dest)}: {img.width}x{img.height}  {kb}KB")
print("done")
