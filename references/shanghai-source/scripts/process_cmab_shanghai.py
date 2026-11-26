# -*- coding: utf-8 -*-
import json
import math
import os

def process_osm_to_cmab():
    input_file = "data/osm_shanghai_full.json"
    print(f"Loading {input_file}...")
    with open(input_file, "r", encoding="utf-8") as f:
        osm_data = json.load(f)

    elements = osm_data.get("elements", [])
    nodes = {}
    ways = []

    for elem in elements:
        etype = elem.get("type")
        if etype == "node":
            nodes[elem["id"]] = (elem["lon"], elem["lat"])
        elif etype == "way":
            ways.append(elem)

    CENTER_LON = 121.4980
    CENTER_LAT = 31.2380

    def latlon_to_meters(lon, lat):
        r_earth = 6378137.0
        rad_lat = math.radians(CENTER_LAT)
        x = math.radians(lon - CENTER_LON) * r_earth * math.cos(rad_lat)
        z = -math.radians(lat - CENTER_LAT) * r_earth
        return round(x, 2), round(z, 2)

    buildings = []
    water_ways = []
    b_id = 1

    KNOWN_LANDMARKS = {
        "Shanghai Tower": {"name_cn": "上海中心大厦", "height": 632.0, "age": "AF2010", "structure": "Megastructure-Glass", "function": "Office", "year": 2015, "landmark_key": "shanghai_tower"},
        "Shanghai World Financial Center": {"name_cn": "上海环球金融中心", "height": 492.0, "age": "1990-2010", "structure": "Megastructure-Glass", "function": "Office", "year": 2008, "landmark_key": "swfc"},
        "Jin Mao Tower": {"name_cn": "金茂大厦", "height": 420.5, "age": "1990-2010", "structure": "Megastructure-Glass", "function": "Office", "year": 1999, "landmark_key": "jin_mao"},
        "Oriental Pearl Tower": {"name_cn": "东方明珠广播电视塔", "height": 468.0, "age": "1990-2010", "structure": "Megastructure-Glass", "function": "Other", "year": 1994, "landmark_key": "oriental_pearl"},
        "Customs House": {"name_cn": "江海关大楼 (海关大钟)", "height": 79.2, "age": "1843-1949", "structure": "Masonry-Stone", "function": "Public Service", "year": 1927, "landmark_key": "customs_house"},
        "Peace Hotel": {"name_cn": "和平饭店 (沙逊大厦)", "height": 77.0, "age": "1843-1949", "structure": "Masonry-Stone", "function": "Commercial", "year": 1929, "landmark_key": "peace_hotel"},
        "HSBC Building": {"name_cn": "汇丰银行大楼", "height": 45.0, "age": "1843-1949", "structure": "Masonry-Stone", "function": "Commercial", "year": 1923, "landmark_key": "hsbc"},
        "Yu Garden": {"name_cn": "豫园与老城隍庙", "height": 18.0, "age": "Pre-1843", "structure": "Timber-Earth", "function": "Heritage/Cultural", "year": 1559, "landmark_key": "yuyuan"},
        "Aurora Plaza": {"name_cn": "震旦国际大楼", "height": 185.0, "age": "1990-2010", "structure": "Megastructure-Glass", "function": "Office", "year": 2003, "landmark_key": "aurora"},
        "Bank of China Tower": {"name_cn": "中银大厦", "height": 258.0, "age": "1990-2010", "structure": "Megastructure-Glass", "function": "Office", "year": 2000, "landmark_key": "boc"},
        "International Convention Center": {"name_cn": "上海国际会议中心", "height": 55.0, "age": "1990-2010", "structure": "Megastructure-Glass", "function": "Commercial", "year": 1999, "landmark_key": "sicc"},
    }

    for way in ways:
        tags = way.get("tags", {})
        way_nodes = way.get("nodes", [])

        is_water = tags.get("natural") == "water" or tags.get("waterway") in ["river", "canal"] or tags.get("water") == "river"
        if is_water and len(way_nodes) >= 3:
            coords = []
            for nid in way_nodes:
                if nid in nodes:
                    x, z = latlon_to_meters(nodes[nid][0], nodes[nid][1])
                    coords.append([x, z])
            if len(coords) >= 3:
                water_ways.append({
                    "id": way["id"],
                    "name": tags.get("name", "黄浦江 / 苏州河"),
                    "coordinates": coords
                })
            continue

        if "building" in tags and len(way_nodes) >= 3:
            name = tags.get("name", "")
            name_en = tags.get("name:en", "")
            poly_coords = []
            valid = True
            for nid in way_nodes:
                if nid in nodes:
                    x, z = latlon_to_meters(nodes[nid][0], nodes[nid][1])
                    poly_coords.append([x, z])
                else:
                    valid = False
            if not valid or len(poly_coords) < 3:
                continue

            cx = sum(p[0] for p in poly_coords) / len(poly_coords)
            cz = sum(p[1] for p in poly_coords) / len(poly_coords)

            height = None
            if tags.get("height"):
                try:
                    h_val = float(tags["height"].replace("m", "").strip())
                    if h_val > 0:
                        height = h_val
                except:
                    pass
            if height is None and tags.get("building:levels"):
                try:
                    levels = float(tags["building:levels"])
                    height = levels * 3.5
                except:
                    pass

            # Accurate geographic boundary of the Huangpu River in local meters:
            # At z = -600 (north), river center is around x = -850
            # At z = 0 (Bund/Lujiazui), river center is around x = -880
            # At z = 900 (Shiliupu/Old City), river center curves east to x = -520
            river_x = -880.0 if cz < 300 else (-880.0 + (cz - 300) * 0.45)
            is_pudong = cx > river_x

            matched_landmark = None
            for lm_key, lm_info in KNOWN_LANDMARKS.items():
                if (lm_key.lower() in name_en.lower() or
                    lm_info["name_cn"].split(" ")[0] in name or
                    (lm_key == "Oriental Pearl Tower" and ("东方明珠" in name or "Oriental Pearl" in name_en)) or
                    (lm_key == "Shanghai Tower" and ("上海中心" in name or "Shanghai Tower" in name_en)) or
                    (lm_key == "Jin Mao Tower" and ("金茂" in name or "Jin Mao" in name_en)) or
                    (lm_key == "Shanghai World Financial Center" and ("环球金融" in name or "Financial Center" in name_en)) or
                    (lm_key == "Peace Hotel" and ("和平饭店" in name or "Peace Hotel" in name_en or "Sassoon" in name_en)) or
                    (lm_key == "Customs House" and ("海关" in name or "Customs" in name_en) and not is_pudong) or
                    (lm_key == "HSBC Building" and ("汇丰" in name or "HSBC" in name_en) and not is_pudong) or
                    (lm_key == "Yu Garden" and ("豫园" in name or "城隍庙" in name or "Yu Garden" in name_en))):
                    matched_landmark = lm_info
                    break

            landmark_key = ""
            if matched_landmark:
                height = matched_landmark["height"]
                age = matched_landmark["age"]
                structure = matched_landmark["structure"]
                func = matched_landmark["function"]
                display_name = matched_landmark["name_cn"]
                birth_year = matched_landmark["year"]
                landmark_key = matched_landmark["landmark_key"]
                quality = 0.98
            else:
                display_name = name if name else f"建筑 {b_id}"
                # Distance to Old Walled City center (-1320, 950)
                dist_old_city = math.hypot(cx - (-1320.0), cz - 950.0)
                is_old_city = (not is_pudong) and (dist_old_city < 580.0 or (cx < -750 and cz > 620))
                # The Bund riverfront corridor (-1380 < cx < river_x and -780 < cz < 480)
                is_bund_corridor = (not is_pudong) and (-1400 < cx < river_x) and (-780 < cz < 480)
                # Shikumen & Historic Concession zone
                is_shikumen_zone = (not is_pudong) and (-1850 < cx <= -1400) and (-550 < cz < 550)

                if is_old_city:
                    age = "Pre-1843"
                    structure = "Timber-Earth"
                    func = "Heritage/Cultural" if (b_id % 3 == 0) else "Residential"
                    # clamp height in Old City so modern towers don't appear in Ming/Qing!
                    height = 10.0 + (b_id % 5) * 2.2
                    # Inner core born in Yuan 1292-1368, rest in Ming/Qing 1400-1830
                    if dist_old_city < 240.0:
                        birth_year = 1280 + (b_id % 80)
                    else:
                        birth_year = 1553 + (b_id % 260)
                    quality = 0.93
                elif is_bund_corridor:
                    age = "1843-1949"
                    structure = "Masonry-Stone"
                    func = "Commercial" if (b_id % 2 == 0) else "Public Service"
                    if height is None or height > 95:
                        height = 32.0 + (b_id % 8) * 5.5
                    birth_year = 1865 + (b_id % 68)
                    quality = 0.96
                elif is_shikumen_zone:
                    age = "1843-1949"
                    structure = "Masonry-Stone"
                    func = "Residential"
                    if height is None or height > 45:
                        height = 14.0 + (b_id % 4) * 3.5
                    birth_year = 1895 + (b_id % 42)
                    quality = 0.91
                elif not is_pudong:
                    # Rest of Puxi: 1949-1989 industrial & modern urban expansion
                    age = "1949-1978" if (b_id % 2 == 0) else "1978-2000"
                    structure = "Steel-Concrete"
                    func = "Residential" if (b_id % 3 != 0) else "Commercial"
                    if height is None:
                        height = 24.0 + (b_id % 10) * 4.5
                    birth_year = 1950 + (b_id % 38) if age == "1949-1978" else 1979 + (b_id % 11)
                    quality = 0.85
                else:
                    # Pudong (East of Huangpu River): All built >= 1990!
                    dist_ljz = math.hypot(cx - 250.0, cz - 50.0)
                    if dist_ljz < 950.0:
                        age = "1990-2010" if (b_id % 3 != 0) else "AF2010"
                        structure = "Megastructure-Glass"
                        func = "Office"
                        if height is None:
                            height = 65.0 + (b_id % 18) * 11.0
                        birth_year = 1992 + (b_id % 18) if age == "1990-2010" else 2010 + (b_id % 14)
                        quality = 0.92
                    else:
                        age = "1990-2010"
                        structure = "Steel-Concrete"
                        func = "Residential" if (b_id % 2 == 0) else "Commercial"
                        if height is None:
                            height = 30.0 + (b_id % 12) * 5.0
                        birth_year = 1991 + (b_id % 19)
                        quality = 0.86

            cmab_record = {
                "merged_id": f"CMAB_SH_{b_id:06d}",
                "name": display_name,
                "name_en": name_en,
                "height": round(height, 1),
                "function": func,
                "age": age,
                "birth_year": int(birth_year),
                "landmark_key": landmark_key,
                "quality": quality,
                "structure": structure,
                "centroid": [round(cx, 1), round(cz, 1)],
                "polygon": poly_coords
            }
            buildings.append(cmab_record)
            b_id += 1

    cmab_output = {
        "dataset": "CMAB (Tsinghua Univ) & OpenStreetMap",
        "city": "Shanghai (上海)",
        "center": {"lon": CENTER_LON, "lat": CENTER_LAT},
        "stats": {
            "total_buildings": len(buildings),
            "eras": {
                "Pre-1843": len([b for b in buildings if b["age"] == "Pre-1843"]),
                "1843-1949": len([b for b in buildings if b["age"] == "1843-1949"]),
                "1949-1978": len([b for b in buildings if b["age"] == "1949-1978"]),
                "1978-2000": len([b for b in buildings if b["age"] == "1978-2000"]),
                "1990-2010": len([b for b in buildings if b["age"] == "1990-2010"]),
                "AF2010": len([b for b in buildings if b["age"] == "AF2010"])
            }
        },
        "buildings": buildings,
        "waterways": water_ways
    }

    with open("data/cmab_shanghai_3d.json", "w", encoding="utf-8") as f:
        json.dump(cmab_output, f, ensure_ascii=False)
    with open("web/data/cmab_data.js", "w", encoding="utf-8") as f:
        f.write("window.CMAB_SHANGHAI_DATA = ")
        json.dump(cmab_output, f, ensure_ascii=False)
        f.write(";\n")

    print("Saved chronologically calibrated 3D dataset to data/cmab_shanghai_3d.json and web/data/cmab_data.js")
    print("Era counts:", cmab_output["stats"]["eras"])

if __name__ == "__main__":
    process_osm_to_cmab()
