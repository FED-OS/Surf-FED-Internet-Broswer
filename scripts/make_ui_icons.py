"""
Generates plain placeholder toolbar icons (back, forward, reload, home,
new-tab, close) as 24x24 PNGs so the UI has something to display.
Replace any file in assets/icons/ui/ with real artwork of the same name/size
and the toolbar picks it up automatically -- no code changes needed.
"""
from PIL import Image, ImageDraw
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "icons", "ui")
os.makedirs(OUT_DIR, exist_ok=True)

SIZE = 24
FG = (255, 255, 255, 255)

def blank():
    return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

def save(name, img):
    img.save(os.path.join(OUT_DIR, f"{name}.png"))

# back: simple left-pointing chevron placeholder
img = blank(); d = ImageDraw.Draw(img)
d.line([(15, 4), (7, 12), (15, 20)], fill=FG, width=3, joint="curve")
save("back", img)

# forward: right-pointing chevron
img = blank(); d = ImageDraw.Draw(img)
d.line([(9, 4), (17, 12), (9, 20)], fill=FG, width=3, joint="curve")
save("forward", img)

# reload: circular arrow placeholder (just a ring with a gap)
img = blank(); d = ImageDraw.Draw(img)
d.arc([4, 4, 20, 20], 30, 300, fill=FG, width=3)
d.polygon([(17, 3), (20, 8), (14, 7)], fill=FG)
save("reload", img)

# home: simple triangle + square placeholder
img = blank(); d = ImageDraw.Draw(img)
d.polygon([(12, 4), (21, 12), (18, 12), (18, 20), (6, 20), (6, 12), (3, 12)], outline=FG, width=2)
save("home", img)

# new-tab: plus sign placeholder
img = blank(); d = ImageDraw.Draw(img)
d.line([(12, 5), (12, 19)], fill=FG, width=3)
d.line([(5, 12), (19, 12)], fill=FG, width=3)
save("new-tab", img)

# close: X placeholder
img = blank(); d = ImageDraw.Draw(img)
d.line([(6, 6), (18, 18)], fill=FG, width=3)
d.line([(18, 6), (6, 18)], fill=FG, width=3)
save("close", img)

print("Placeholder UI icons written to assets/icons/ui/")
