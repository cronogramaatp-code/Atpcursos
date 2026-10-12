"""ATPCursos brand asset generator, preserving the original emblem geometry.

Requires Pillow >=12. Run from repository root:
    python tools/build-amber-brand.py

Input: assets/brand/logo-atp-original.png (untouched approved emblem).
Output: transparent logo, favicons, PWA icons, social preview.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import math

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "public" / "brand"
SOURCE = ROOT / "assets" / "brand" / "logo-atp-original.png"
if not SOURCE.exists():
    raise SystemExit("Missing original logo source: " + str(SOURCE))

def C(hexcode: str):
    s = hexcode.lstrip("#")
    return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))

COAL = C("#171512")
COAL_SOFT = C("#28221C")
AMBER = C("#EE701E")
SAND = C("#F2C98D")
OAT = C("#F8F3EA")
CREAM = C("#FFFDF9")

original = Image.open(SOURCE).convert("RGBA")
if original.size != (512, 512):
    raise SystemExit("Unexpected original logo dimensions: " + str(original.size))

# Apply a warm metallic scale to the existing grayscale emblem.
# The darkest recesses remain black, medium highlights shift to amber,
# and upper specular highlights become sand. Keep the original alpha mask.
gray = ImageOps.grayscale(original)
tinted = ImageOps.colorize(gray, black=COAL, mid=C("#EE701E"),
                           white=C("#FFE1AD"), blackpoint=10,
                           whitepoint=245, midpoint=120)
# Blend lightly to preserve the embossed detail of the official symbol.
detail = Image.blend(original.convert("RGB"), tinted, 0.99)
logo = detail.convert("RGBA")
logo.putalpha(original.getchannel("A"))
# Approved brand direction: warm metal relief, bright orange rim, cream highlights.
ring = ImageDraw.Draw(logo)
ring.ellipse((21, 21, 491, 491), outline=AMBER + (245,), width=7)
ring.ellipse((33, 33, 479, 479), outline=SAND + (170,), width=3)
logo.save(BRAND / "logo-atp.png", optimize=True)


# Horizontal premium lockup (transparent) for the site navbar and marketing.
# Preserve the brand's metallic emblem and render the approved orange/sand wordmark.
font_path = "C:/Windows/Fonts/bahnschrift.ttf"
if not Path(font_path).exists():
    font_path = "C:/Windows/Fonts/arialbd.ttf"
f = ImageFont.truetype(font_path, 185)
word = Image.new("RGBA", (1390, 330), (0, 0, 0, 0))
mark = logo.resize((296, 296), Image.Resampling.LANCZOS)
word.alpha_composite(mark, (10, 17))
wd = ImageDraw.Draw(word)
wd.text((336, 74), "ATP", font=f, anchor="lt", fill=OAT + (255,))
atp_length = wd.textlength("ATP", font=f)
wd.text((336 + round(atp_length) - 8, 74), "Cursos", font=f, anchor="lt", fill=AMBER + (255,))
# Crop only transparent margins without trimming anti-aliased glyphs.
bbox = word.getbbox()
if bbox:
    word = word.crop((max(0,bbox[0]-10), max(0,bbox[1]-10), min(1390,bbox[2]+10), min(330,bbox[3]+10)))
word.save(BRAND / "wordmark-atpcursos.png", optimize=True)

def centered_icon(size: int, visual_ratio: float, bg=None):
    if bg is None:
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    else:
        canvas = Image.new("RGBA", (size, size), bg + (255,))
    visual = max(1, round(size * visual_ratio))
    mark = logo.resize((visual, visual), Image.Resampling.LANCZOS)
    canvas.alpha_composite(mark, ((size - visual)//2, (size - visual)//2))
    return canvas

for size in (16, 32, 48):
    centered_icon(size, 0.91).save(BRAND / f"favicon-{size}.png", optimize=True)
centered_icon(180, 0.82, COAL).save(BRAND / "apple-touch-icon.png", optimize=True)
centered_icon(192, 0.92).save(BRAND / "icon-192.png", optimize=True)
centered_icon(512, 0.92).save(BRAND / "icon-512.png", optimize=True)
# Maskable icon keeps critical content in the middle 70% safe zone.
centered_icon(512, 0.64, COAL).save(BRAND / "icon-512-maskable.png", optimize=True)
centered_icon(96, 0.91).save(BRAND / "favicon.ico", format="ICO", sizes=[(16,16),(32,32),(48,48),(64,64)])

# Social preview, warm duotone, with large readable type and the real emblem.
w, h = 1200, 630
og = Image.new("RGB", (w, h), COAL)
d = ImageDraw.Draw(og)
for x in range(w):
    t = x / (w - 1)
    # In the right half, the coal backdrop warms subtly toward dark umber.
    boost = max(0, (t-0.4)/0.6)
    col = tuple(round(COAL[i] * (1 - 0.50*boost) + C("#4B2D1F")[i] * .50*boost) for i in range(3))
    d.line((x, 0, x, h), fill=col)
d.rectangle((0, 0, 12, h), fill=AMBER)
d.rounded_rectangle((55, 67, 238, 112), radius=20, fill=C("#3C2C21"), outline=C("#6A4C2E"), width=2)

def font(size, bold=False):
    candidates = (["C:/Windows/Fonts/seguisb.ttf","C:/Windows/Fonts/arialbd.ttf"] if bold
                  else ["C:/Windows/Fonts/segoeui.ttf","C:/Windows/Fonts/arial.ttf"])
    for c in candidates:
        if Path(c).exists():
            return ImageFont.truetype(c, size)
    return ImageFont.load_default()

d.text((82, 75), "ESTUDE COM DIREÇÃO", fill=SAND, font=font(18, True))
d.text((56, 171), "ATP", font=font(78, True), fill=OAT, stroke_width=0)
d.text((56+round(d.textlength("ATP", font=font(78, True)))-3, 171), "Cursos", font=font(78, True), fill=AMBER, stroke_width=0)
d.text((58, 277), "PDFs para concursos", font=font(46, True), fill=SAND)
d.text((59, 352), "Simulados, mapas mentais e cronogramas", font=font(26), fill=OAT)
d.text((59, 398), "Materiais digitais organizados em um só lugar.", font=font(23), fill=C("#C9BDAA"))
d.rounded_rectangle((58, 492, 412, 566), radius=16, fill=AMBER)
d.text((88, 506), "EXPLORE A BIBLIOTECA", font=font(23, True), fill=COAL)
orb = logo.resize((442, 442), Image.Resampling.LANCZOS)
overlay = Image.new("RGBA", (w, h), (0,0,0,0))
overlay.alpha_composite(orb, (728, 91))
og = Image.alpha_composite(og.convert("RGBA"), overlay).convert("RGB")
og.save(BRAND / "og-atpcursos.jpg", quality=89, optimize=True, subsampling=0)

print("ATP_AMBER_BRAND_READY", len(list(BRAND.glob("*.png"))), "png files")