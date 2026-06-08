"""Render the brand favicon as a PNG (forest tile + bright-green circle + white N)."""
import os
from PIL import Image, ImageDraw, ImageFont

ASSETS = os.path.join(os.path.dirname(__file__), "..", "assets")
S = 512
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
# forest rounded tile
d.rounded_rectangle([0, 0, S, S], radius=int(S * 0.23), fill=(27, 58, 47, 255))
# bright-green packaging circle
r = int(S * 0.33)
cx, cy = S // 2, int(S * 0.485)
d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(22, 192, 74, 255))
# white serif "N"
font = None
for fp in [r"C:\Windows\Fonts\georgiab.ttf", r"C:\Windows\Fonts\timesbd.ttf", r"C:\Windows\Fonts\arialbd.ttf"]:
    if os.path.exists(fp):
        font = ImageFont.truetype(fp, int(S * 0.42)); break
if font is None:
    font = ImageFont.load_default()
tb = d.textbbox((0, 0), "N", font=font)
tw, th = tb[2] - tb[0], tb[3] - tb[1]
d.text((cx - tw / 2 - tb[0], cy - th / 2 - tb[1]), "N", font=font, fill=(255, 255, 255, 255))
img.save(os.path.join(ASSETS, "favicon.png"))
img.resize((32, 32), Image.LANCZOS).save(os.path.join(ASSETS, "favicon-32.png"))
print("wrote favicon.png (512) and favicon-32.png")
