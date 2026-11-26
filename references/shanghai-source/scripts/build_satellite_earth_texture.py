# -*- coding: utf-8 -*-
"""
Builds an ultra-crisp, broadcast-grade NASA Blue Marble 2048x1024 Earth Texture
with a luminous China national boundary, 6300km Yangtze River, Yellow River,
and Shanghai Estuary coordinate beacon.
"""
from PIL import Image, ImageDraw, ImageFilter
import math

W, H = 2048, 1024

def lon_lat_to_xy(lon, lat):
    x = ((lon + 180.0) / 360.0) * W
    y = ((90.0 - lat) / 180.0) * H
    return (x, y)

def interpolate_spline(pts, steps_per_seg=12):
    """Catmull-Rom spline interpolation to ensure smooth, natural geographic curves."""
    if len(pts) < 3:
        return pts
    smooth_pts = []
    # Wrap or clamp endpoints
    n = len(pts)
    for i in range(n):
        p0 = pts[(i - 1 + n) % n]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n]
        for s in range(steps_per_seg):
            t = s / float(steps_per_seg)
            t2 = t * t
            t3 = t2 * t
            # Catmull-Rom formula
            x = 0.5 * ((2 * p1[0]) +
                       (-p0[0] + p2[0]) * t +
                       (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                       (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) +
                       (-p0[1] + p2[1]) * t +
                       (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
                       (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            smooth_pts.append((x, y))
    return smooth_pts

def build_hd_earth_texture():
    base = Image.open('assets/images/earth_atmos_2048.jpg').convert('RGBA')

    # Create glowing overlay layer
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # China National Boundary Key Coordinate Control Points (Accurate Roost-like Silhouette)
    china_lonlat = [
        # Northeast / Heilongjiang & Jilin
        (121.5, 53.3), (124.0, 53.0), (126.8, 51.5), (128.5, 49.5), (130.5, 48.0),
        (134.8, 48.4), (133.5, 46.5), (131.0, 44.5), (130.4, 42.5), (124.2, 40.0),
        # Bohai Bay & Shandong Peninsula
        (121.8, 39.0), (117.5, 38.5), (118.5, 37.8), (122.5, 37.4), (121.0, 36.0),
        # Jiangsu Coastline & Shanghai Estuary
        (119.3, 34.5), (120.9, 32.5), (121.5, 31.23), (121.9, 30.8),
        # Zhejiang, Fujian & Guangdong Coastlines
        (121.5, 28.5), (120.0, 26.5), (118.0, 24.5), (116.5, 23.5), (114.2, 22.3),
        (113.0, 21.8), (110.5, 20.8),
        # Guangxi Coast & Beibu Gulf
        (108.5, 21.5), (107.8, 21.8),
        # Yunnan Southern Border
        (105.0, 23.0), (102.5, 22.5), (100.5, 21.5), (99.0, 22.5), (98.0, 24.0),
        (98.5, 27.5),
        # Tibet & Himalayas Southwest Border
        (95.0, 28.5), (92.0, 27.8), (89.0, 27.5), (85.5, 28.2), (81.0, 30.5),
        (79.0, 32.5), (78.5, 35.5),
        # Xinjiang Western Border (Pamir to Altai)
        (74.0, 37.2), (74.8, 39.5), (76.5, 40.5), (80.5, 42.2), (81.0, 45.0),
        (85.5, 47.5), (87.5, 49.2), (90.0, 47.5),
        # Inner Mongolia Northern Border
        (95.0, 44.5), (100.0, 42.5), (106.0, 41.8), (111.5, 42.5), (115.0, 44.5),
        (117.0, 48.0), (119.5, 50.0)
    ]

    china_xy = [lon_lat_to_xy(lon, lat) for lon, lat in china_lonlat]
    smooth_china = interpolate_spline(china_xy, steps_per_seg=10)

    # 1. Fill China Territory with subtle, elegant translucent deep-cyan tint
    draw.polygon(smooth_china, fill=(14, 116, 144, 38))

    # 2. Draw China Boundary outer soft atmospheric glow
    glow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    for i in range(len(smooth_china)):
        p1 = smooth_china[i]
        p2 = smooth_china[(i + 1) % len(smooth_china)]
        glow_draw.line([p1, p2], fill=(251, 191, 36, 180), width=6)
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=4))
    overlay = Image.alpha_composite(overlay, glow_layer)

    # 3. Draw China Boundary crisp golden line
    draw = ImageDraw.Draw(overlay)
    for i in range(len(smooth_china)):
        p1 = smooth_china[i]
        p2 = smooth_china[(i + 1) % len(smooth_china)]
        draw.line([p1, p2], fill=(254, 240, 138, 235), width=2)

    # 4. Taiwan & Hainan Islands
    taiwan_xy = [lon_lat_to_xy(lon, lat) for lon, lat in [(120.2, 25.3), (121.9, 25.1), (121.5, 22.0), (120.1, 22.8)]]
    draw.polygon(taiwan_xy, fill=(14, 116, 144, 55), outline=(254, 240, 138, 220), width=2)

    hainan_xy = [lon_lat_to_xy(lon, lat) for lon, lat in [(108.6, 19.9), (110.8, 20.1), (110.4, 18.2), (108.7, 18.4)]]
    draw.polygon(hainan_xy, fill=(14, 116, 144, 55), outline=(254, 240, 138, 220), width=2)

    # 5. Glowing 6,300km Yangtze River (万里长江)
    yangtze_lonlat = [
        (91.0, 34.0), (94.0, 33.5), (97.0, 32.5), (100.0, 28.5),
        (102.5, 27.5), (104.5, 28.8), (106.8, 29.8), (110.0, 31.0),
        (112.5, 30.0), (114.5, 30.5), (117.0, 30.6), (118.8, 32.0),
        (120.5, 32.1), (121.5, 31.23)
    ]
    yangtze_xy = [lon_lat_to_xy(lon, lat) for lon, lat in yangtze_lonlat]
    smooth_yangtze = []
    # Spline for open polyline
    for i in range(len(yangtze_xy) - 1):
        p0 = yangtze_xy[max(0, i - 1)]
        p1 = yangtze_xy[i]
        p2 = yangtze_xy[i + 1]
        p3 = yangtze_xy[min(len(yangtze_xy) - 1, i + 2)]
        for s in range(12):
            t = s / 12.0
            t2 = t * t
            t3 = t2 * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            smooth_yangtze.append((x, y))
    smooth_yangtze.append(yangtze_xy[-1])

    # River cyan outer glow
    river_glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    rg_draw = ImageDraw.Draw(river_glow)
    for i in range(len(smooth_yangtze) - 1):
        rg_draw.line([smooth_yangtze[i], smooth_yangtze[i+1]], fill=(0, 229, 255, 200), width=7)
    river_glow = river_glow.filter(ImageFilter.GaussianBlur(radius=3))
    overlay = Image.alpha_composite(overlay, river_glow)

    # River bright core
    draw = ImageDraw.Draw(overlay)
    for i in range(len(smooth_yangtze) - 1):
        draw.line([smooth_yangtze[i], smooth_yangtze[i+1]], fill=(254, 240, 138, 255), width=3)

    # 6. Yellow River (黄河)
    yellow_lonlat = [
        (96.0, 35.0), (99.0, 35.5), (101.5, 36.5), (103.5, 36.0),
        (106.0, 38.5), (108.5, 40.5), (111.0, 40.2), (111.0, 35.0),
        (113.0, 34.8), (116.0, 35.2), (118.5, 37.8)
    ]
    yellow_xy = [lon_lat_to_xy(lon, lat) for lon, lat in yellow_lonlat]
    for i in range(len(yellow_xy) - 1):
        draw.line([yellow_xy[i], yellow_xy[i+1]], fill=(251, 191, 36, 175), width=2)

    # 7. Radiant Golden Beacon at Shanghai Estuary (121.5E, 31.23N)
    sh_x, sh_y = lon_lat_to_xy(121.5, 31.23)
    sh_beacon = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sb_draw = ImageDraw.Draw(sh_beacon)
    # Multilayer soft radial flare
    for r, alpha in [(32, 35), (22, 60), (14, 110), (8, 180), (4, 255)]:
        sb_draw.ellipse([sh_x - r, sh_y - r, sh_x + r, sh_y + r], fill=(251, 191, 36, alpha))
    sb_draw.ellipse([sh_x - 3, sh_y - 3, sh_x + 3, sh_y + 3], fill=(255, 255, 255, 255))
    sh_beacon = sh_beacon.filter(ImageFilter.GaussianBlur(radius=1.5))
    overlay = Image.alpha_composite(overlay, sh_beacon)

    # Composite overlay onto base satellite photo
    final_img = Image.alpha_composite(base, overlay).convert('RGB')
    final_img.save('assets/images/earth_satellite_hd.jpg', quality=95)
    final_img.save('web/images/earth_satellite_hd.jpg', quality=95)
    print("Exported ultra-crisp NASA satellite Earth with China & Yangtze to assets/images/earth_satellite_hd.jpg and web/images/earth_satellite_hd.jpg!")

if __name__ == '__main__':
    build_hd_earth_texture()
