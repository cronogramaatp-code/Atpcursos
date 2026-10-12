"""Remove lettering from Thay avatar's chest patches, preserving face/outfit/transparent background.

Input images remain outside the public website.
This retouch only changes the blank embroidered nameplates, not the person's features.
Use: python tools/clean-thay-lettering.py
"""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
from collections import deque

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"public"/"brand"

def inpaint_letters(src:Image.Image,box:tuple[int,int,int,int]):
    """Fill bright lettering through local nearest nonmasked dark cloth pixels."""
    src=src.copy().convert("RGBA")
    x0,y0,x1,y1=box
    roi=src.crop(box).convert("RGB")
    w,h=roi.size
    pix=roi.load()
    mask=Image.new("L",(w,h))
    mp=mask.load()
    # The letters are bright white-gray in a dark nameplate.
    for y in range(h):
        for x in range(w):
            r,g,b=pix[x,y]
            if min(r,g,b)>95 and max(r,g,b)-min(r,g,b)<70:
                mp[x,y]=255
    mask=mask.filter(ImageFilter.MaxFilter(7))
    m=mask.load()
    filled=roi.copy()
    fp=filled.load()
    distance=[[-1]*w for _ in range(h)]
    q=deque()
    # All clean pixels are the initial boundary.
    for y in range(h):
        for x in range(w):
            if m[x,y]<128:
                distance[y][x]=0
                q.append((x,y))
    # Multi-source wavefront; each masked pixel takes the nearest known cloth color.
    while q:
        x,y=q.popleft()
        for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0<=nx<w and 0<=ny<h and distance[ny][nx]==-1:
                distance[ny][nx]=distance[y][x]+1
                fp[nx,ny]=fp[x,y]
                q.append((nx,ny))
    # Feather replaced lettering into the surrounding natural patch texture.
    filled=filled.filter(ImageFilter.GaussianBlur(0.8))
    mask=mask.filter(ImageFilter.GaussianBlur(0.65))
    patch=Image.composite(filled,roi,mask).convert("RGBA")
    src.alpha_composite(patch,(x0,y0))
    return src

def clean_full():
    original=Image.open(Path.home()/"Desktop"/"Thay_corpo_inteiro_sem_fundo.png").convert("RGBA")
    # Full-body figure: lettering occupies x~233-303, y~339-352.
    cleaned=inpaint_letters(original,(227,335,311,355))
    cleaned.save(OUT/"thay-avatar-full.webp","WEBP",quality=91,method=6)
    return cleaned

def clean_portrait():
    source=Image.open(Path.home()/"Desktop"/"Thay_bracos_cruzados_sem_fundo.jpeg").convert("RGBA")
    # Portrait: lettering occupies x~354-472, y~620-653.
    cleaned=inpaint_letters(source,(349,617,478,657))
    # Remove white JPEG backdrop as the previous approved website rendering did.
    p=cleaned.load()
    for y in range(cleaned.height):
        for x in range(cleaned.width):
            r,g,b,a=p[x,y]
            bright=min(r,g,b)
            alpha=max(0,min(255,int((252-bright)*9)))
            if bright<217:
                alpha=255
            p[x,y]=(r,g,b,alpha)
    bounds=cleaned.getchannel("A").getbbox()
    if bounds:cleaned=cleaned.crop(bounds)
    cleaned.save(OUT/"thay-avatar-portrait.webp","WEBP",quality=91,method=6)
    return cleaned

def verify_clean(im,box,threshold=.08):
    x0,y0,x1,y1=box
    patch=im.crop(box).convert("RGB")
    count=0
    for r,g,b in patch.getdata():
        if min(r,g,b)>140 and max(r,g,b)-min(r,g,b)<70:
            count+=1
    density=count/(patch.width*patch.height)
    if density>threshold:
        raise RuntimeError(f"Unremoved white lettering: {density:.3f}")
    return density

if __name__=="__main__":
    full=clean_full()
    portrait=clean_portrait()
    print("Cleaned",OUT/"thay-avatar-full.webp",full.size)
    print("Cleaned",OUT/"thay-avatar-portrait.webp",portrait.size)
    print("White patch fractions",round(verify_clean(full,(227,335,311,355)),4),round(verify_clean(portrait,(349,617,478,657)),4))
