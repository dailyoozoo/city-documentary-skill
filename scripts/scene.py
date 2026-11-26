from functools import lru_cache
import math
from pathlib import Path
import random

from PIL import Image, ImageDraw, ImageFont, ImageOps


@lru_cache(maxsize=32)
def font(path, size):
    return ImageFont.truetype(str(path), size)


def font_path(explicit):
    if explicit:
        return Path(explicit).resolve(strict=True)
    for candidate in ('C:/Windows/Fonts/msyh.ttc', '/System/Library/Fonts/PingFang.ttc',
                      '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'):
        if Path(candidate).is_file():
            return Path(candidate)
    raise ValueError('Choose a font with Simplified Chinese glyphs using --font.')


def water(y):
    return 46 + math.sin(y / 22) * 9 + math.cos(y / 50) * 4


@lru_cache(maxsize=8)
def buildings(kind):
    rng = random.Random(2480)
    depths = {'river': (0, 0), 'wharf': (3, 0), 'bridge': (3, 2), 'city': (5, 5)}
    rows = []
    for y in range(5, 113, 8):
        for bank, depth in zip((-1, 1), depths[kind]):
            for street in range(depth):
                if (y in (53, 61) and kind in ('bridge', 'city')) or rng.random() < .22:
                    continue
                x = water(y) + bank * (16 + street * 9)
                if bank == -1:
                    x -= 5
                height = rng.uniform(2, 6 if kind != 'city' else 9 + 3 * street)
                rows.append((x, y, rng.uniform(4.8, 7.2), rng.uniform(4.3, 6.3), height))
    return rows


def paint(project, shot, progress, face, photo=None):
    w, h = project['width'], project['height']
    kind = shot['kind']
    background = (Image.new('RGB', (w, h), '#ece4d2') if photo is None else
                  ImageOps.fit(photo, (w, h), Image.Resampling.LANCZOS))
    draw = ImageDraw.Draw(background, 'RGBA')
    scale = h / 540
    inset = min(w * .062, 46 * scale)

    def text(x, y, message, size, color):
        f = font(face, max(10, int(size * scale)))
        limit = w - x - inset
        while f.size > 8 and draw.textlength(message, font=f) > limit:
            f = font(face, f.size - 1)
        draw.text((x, y * scale), message, font=f, fill=color)

    if kind != 'image':
        zoom = min(w / 960, scale) * (5.5 + .4 * progress)
        def point(x, y, z=0):
            return (.56*w + (x-50 + .38*(y-50) + 2*progress)*zoom,
                    .51*h + (.67*(y-55) - .30*(x-50) - z)*zoom)
        def polygon(points, color):
            draw.polygon([point(*p) for p in points], fill=color)
        def line(points, color, lw=1):
            draw.line([point(*p) for p in points], fill=color, width=max(1, round(lw*scale)))
        for x in range(-120, 220, 9):
            line([(x,-120),(x,210)], '#ded2bc')
        for y in range(-120, 220, 9):
            line([(-120,y),(220,y)], '#ded2bc')
        left = [(water(y)-9,y) for y in range(-190,250,3)]
        right = [(water(y)+9,y) for y in range(-190,250,3)]
        polygon(left + right[::-1], '#416970')
        line(left, '#b39162', 2)
        line(right, '#b39162', 2)
        for distance in (-5, 1, 6):
            for start in range(-60, 171, 15):
                line([(water(y)+distance, y) for y in range(start,start+8,2)], (181,211,200,115))
        if kind != 'river':
            for y in (24,39,69,84):
                x = water(y)-9
                polygon([(x-3,y-1),(x+5,y-1),(x+5,y+1),(x-3,y+1)], '#a37d52')
        if kind in ('bridge','city'):
            y = 57
            left_x, right_x = water(y)-15, water(y)+15
            polygon([(left_x,y-2),(right_x,y-2),(right_x,y+2),(left_x,y+2)], '#795f52')
            polygon([(left_x,y-2,1.4),(right_x,y-2,1.4),(right_x,y+2,1.4),(left_x,y+2,1.4)], '#c8935f')
            line([(left_x,y+2,1.7),(right_x,y+2,1.7)], '#695243', 2)
        for x,y,dx,dy,z in sorted(buildings(kind), key=lambda b: point(b[0],b[1])[1]):
            a,b,c,d = (x,y),(x+dx,y),(x+dx,y+dy),(x,y+dy)
            polygon([(*d,0),(*c,0),(*c,z),(*d,z)], '#c7a987')
            polygon([(*a,0),(*d,0),(*d,z),(*a,z)], '#9d8070')
            polygon([(*a,z),(*b,z),(*c,z),(*d,z)], '#8f5144' if kind != 'city' else '#53686b')
        yy = 22 + progress*20
        xx = water(yy)+3
        polygon([(xx,yy-2),(xx-1.2,yy+1),(xx,yy+2),(xx+1.2,yy+1)], '#f4ddad')

    draw.rectangle((0,0,w,int(130*scale)), fill=(30,48,47,231))
    draw.rectangle((0,int(464*scale),w,h), fill=(30,48,47,245))
    role = '空间示意' if photo is None else shot['visual_role']
    text(inset, 24, f"{project['title']}   /   {shot['chapter']}   /   {role}", 21, '#f2cca1')
    text(inset, 57, shot['title'], 42, '#fff7e7')
    text(inset, 470, shot['zh'], 23, '#fff7e7')
    text(inset, 505, shot['en'], 16, '#f0c896')
    return background
