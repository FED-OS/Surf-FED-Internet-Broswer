"""
Generates simple placeholder icon PNGs so the app has something to run with.
Replace the files in assets/icons/ with your real artwork later -- just keep
the same filenames and sizes and everything (packaging, tray, taskbar) will
keep working.
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024]

BG = (54, 94, 255, 255)      # placeholder blue
FG = (255, 255, 255, 255)    # placeholder white

def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = max(1, size // 16)
    d.rounded_rectangle(
        [pad, pad, size - pad, size - pad],
        radius=max(2, size // 6),
        fill=BG,
    )
    # Simple "globe" placeholder mark: circle + crossing lines
    cx, cy = size / 2, size / 2
    r = size * 0.32
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=FG, width=max(1, size // 32))
    d.line([cx - r, cy, cx + r, cy], fill=FG, width=max(1, size // 32))
    d.line([cx, cy - r, cx, cy + r], fill=FG, width=max(1, size // 32))
    d.arc([cx - r, cy - r * 1.5, cx + r, cy + r * 1.5], 0, 360, fill=FG, width=max(1, size // 40))
    return img

for s in SIZES:
    icon = draw_icon(s)
    icon.save(os.path.join(OUT_DIR, f"icon-{s}x{s}.png"))

# Also drop a top-level icon.png (512) at assets/icons root and one at build/
# since electron-builder looks for build/icon.png (and .ico/.icns) by default.
main_icon = draw_icon(512)
main_icon.save(os.path.join(OUT_DIR, "icon.png"))

build_dir = os.path.join(os.path.dirname(__file__), "..", "build")
os.makedirs(build_dir, exist_ok=True)
draw_icon(1024).save(os.path.join(build_dir, "icon.png"))

print("Placeholder icons written to assets/icons and build/")
