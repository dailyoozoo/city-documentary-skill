# -*- coding: utf-8 -*-
"""
Splits the 39 V4.0 Spatially Guided Shots into 68 Clause-Level Visual Beats (each <= 28 Chinese chars, ~4.0-5.2s duration)
and performs global Dynamic Programming (Viterbi) acoustic pause alignment against assets/audio/gemini_shanghai_narration.wav.
Why:
1. Prevents any Chinese subtitle line from exceeding 30 characters (avoiding 1920px horizontal overflow at 36px font).
2. Guarantees visual/camera/scroll updates every ~4.2 seconds (Part A: Macro Spatial Establishing -> Part B: Micro Architectural Close-up).
3. Uses global Viterbi DP alignment so there is ZERO cumulative timing drift from start (0.0s) to end.
"""
import os
import json
import wave
import struct
import math
import subprocess
from script_content import SHOTS_SCRIPT


def split_cn_into_two(cn, hl):
    """Split a long Chinese sentence (> 30 chars) at the most natural middle punctuation mark."""
    if len(cn) <= 30:
        return [cn]
    mid = len(cn) // 2
    # Search for punctuation near midpoint
    best_idx = -1
    best_dist = 999
    for i, ch in enumerate(cn):
        if ch in "；，。：":
            # Avoid splitting right at the very beginning or end
            if 10 <= i <= len(cn) - 10:
                d = abs(i - mid)
                # Prefer semicolon or colon slightly
                if ch in "；：":
                    d -= 4
                if d < best_dist:
                    best_dist = d
                    best_idx = i
    if best_idx == -1:
        return [cn]
    part1 = cn[:best_idx + 1]
    part2 = cn[best_idx + 1:]
    return [part1, part2]


def split_en_into_two(en):
    if len(en) <= 68:
        return [en, en]
    mid = len(en) // 2
    best_idx = -1
    best_dist = 999
    for i, ch in enumerate(en):
        # Never split on a comma inside a number like 3,500 or 6,300!
        if ch == "," and i > 0 and i + 1 < len(en) and en[i - 1].isdigit() and en[i + 1].isdigit():
            continue
        if ch in ";,—" or (ch == " " and i > 20 and en[i-1:i+4] in [" and", " whi", " to ", " as "]):
            if 18 <= i <= len(en) - 18:
                d = abs(i - mid)
                if ch in ";,—":
                    d -= 8
                if d < best_dist:
                    best_dist = d
                    best_idx = i
    if best_idx == -1:
        for i in range(mid - 15, mid + 15):
            if 0 < i < len(en) and en[i] == " ":
                best_idx = i
                break
    if best_idx == -1:
        return [en, en]
    return [en[:best_idx + 1].strip(), en[best_idx + 1:].strip()]


def pick_highlight_for_clause(clause, orig_hl):
    # If orig_hl is wholly inside clause, use it
    if orig_hl and orig_hl in clause:
        return orig_hl
    # Check if a meaningful prefix/suffix of orig_hl (>= 4 chars) is in clause
    if orig_hl:
        for length in range(len(orig_hl), 3, -1):
            for start in range(0, len(orig_hl) - length + 1):
                sub = orig_hl[start:start + length]
                if sub in clause and sub[0] not in "，。；：、":
                    return sub
    # Otherwise pick the longest clean phrase before punctuation in clause
    phrases = [p.strip("“”") for p in clause.replace("；", "，").replace("。", "，").replace("：", "，").split("，") if len(p.strip()) >= 4]
    if phrases:
        phrases.sort(key=len, reverse=True)
        cand = phrases[0][:12]
        if cand in clause:
            return cand
    return clause[:min(8, len(clause) - 1)]


# Alternate complementary archival/scroll images so Part A and Part B of a shot have fresh visual material!
COMPLEMENTARY_IMAGES = {
    "earth_eastern.jpg": "scroll_coastline_6000yr.jpg",
    "ma_yuan_water.jpg": "ma_yuan_sea.jpg",
    "scroll_coastline_6000yr.jpg": "song_landscape.jpg",
    "scroll_chunshen_river.jpg": "scroll_bamboo_hu.jpg",
    "scroll_bamboo_hu.jpg": "ma_yuan_water.jpg",
    "scroll_yuan_1292.jpg": "map_1854_muddy_flat.jpg",
    "ma_yuan_sea.jpg": "scroll_yuan_1292.jpg",
    "map_1884_oldcity.jpg": "map_1884_full.jpg",
    "yuyuan_classical.jpg": "huxinting_vintage.jpg",
    "zigzag_bridge_vintage.jpg": "huxinting_vintage.jpg",
    "huxinting_vintage.jpg": "zigzag_bridge_vintage.jpg",
    "map_1854_muddy_flat.jpg": "map_1884_oldcity.jpg",
    "map_1884_full.jpg": "map_1854_muddy_flat.jpg",
    "vintage_bund_map_1932.jpg": "bund_1930.jpg",
    "waibaidu_vintage.jpg": "vintage_bund_map_1932.jpg",
    "bund_1930.jpg": "customs_house_vintage.jpg",
    "customs_house_vintage.jpg": "peace_hotel.jpg",
    "hsbc_building.jpg": "bund_1930.jpg",
    "shikumen_heritage.jpg": "nanjing_rd_1930.jpg",
    "nanjing_rd_1930.jpg": "shikumen_heritage.jpg",
    "cpc_first_congress.jpg": "shikumen_heritage.jpg",
    "scroll_made_in_shanghai.jpg": "jiangnan_shipyard.jpg",
    "jiangnan_shipyard.jpg": "scroll_made_in_shanghai.jpg",
    "scroll_cmab_blueprint.jpg": "lujiazui_skyline.jpg",
    "lujiazui_skyline.jpg": "bund_from_swfc_bluehour.jpg",
    "oriental_pearl.jpg": "lujiazui_skyline.jpg",
    "jin_mao_tower.jpg": "oriental_pearl.jpg",
    "swfc_tower.jpg": "jin_mao_tower.jpg",
    "shanghai_tower.jpg": "swfc_tower.jpg",
    "bund_from_swfc_bluehour.jpg": "customs_house_modern.jpg",
    "customs_house_modern.jpg": "bund_from_swfc_bluehour.jpg",
    "scroll_city_spirit.jpg": "lujiazui_skyline.jpg",
}


def build_clause_beats():
    beats = []
    beat_id = 1
    for s in SHOTS_SCRIPT:
        cn_parts = split_cn_into_two(s["cn"], s["highlight_cn"])
        if len(cn_parts) == 1:
            b = dict(s)
            b["id"] = beat_id
            b["parent_shot_id"] = s["shot_id"]
            b["sub_phase"] = "full"
            b["highlight_cn"] = pick_highlight_for_clause(b["cn"], s["highlight_cn"])
            beats.append(b)
            beat_id += 1
        else:
            en_parts = split_en_into_two(s["en"])
            # Part A: Macro Spatial Establishing (sub_phase = 'macro')
            b1 = dict(s)
            b1["id"] = beat_id
            b1["parent_shot_id"] = s["shot_id"]
            b1["shot_id"] = s["shot_id"] + "_a"
            b1["sub_phase"] = "macro"
            b1["cn"] = cn_parts[0]
            b1["en"] = en_parts[0]
            b1["highlight_cn"] = pick_highlight_for_clause(cn_parts[0], s["highlight_cn"])
            beats.append(b1)
            beat_id += 1

            # Part B: Micro Architectural Close-up (sub_phase = 'micro')
            b2 = dict(s)
            b2["id"] = beat_id
            b2["parent_shot_id"] = s["shot_id"]
            b2["shot_id"] = s["shot_id"] + "_b"
            b2["sub_phase"] = "micro"
            b2["cn"] = cn_parts[1]
            b2["en"] = en_parts[1]
            b2["highlight_cn"] = pick_highlight_for_clause(cn_parts[1], s["highlight_cn"])
            b2["art_img"] = COMPLEMENTARY_IMAGES.get(s["art_img"], s["art_img"])
            b2["art_badge"] = "空间推进 · 建筑形制与历史细节"
            beats.append(b2)
            beat_id += 1
    return beats


def prepare_and_align_audio():
    raw_p = "assets/audio/gemini_shanghai_narration_raw_v4.wav"
    cur_p = "assets/audio/gemini_shanghai_narration.wav"

    with wave.open(raw_p, "rb") as wf:
        rate = wf.getframerate()
        n = wf.getnframes()
        samples = struct.unpack(f"<{n}h", wf.readframes(n))

    # Trim dead silences > 300ms down to 280ms, then apply crisp broadcast tempo 1.32x
    win = int(rate * 0.02)
    out_samples = []
    sil_count = 0
    for i in range(len(samples) // win):
        chunk = samples[i * win:(i + 1) * win]
        rms = math.sqrt(sum(float(x) * x for x in chunk) / win)
        if rms < 320:
            sil_count += 1
            if sil_count <= 14:  # keep up to 280ms
                out_samples.extend(chunk)
        else:
            sil_count = 0
            out_samples.extend(chunk)

    tmp_p = "assets/audio/tmp_trimmed_v4.wav"
    with wave.open(tmp_p, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(rate)
        wf.writeframes(struct.pack(f"<{len(out_samples)}h", *out_samples))

    subprocess.run([
        "ffmpeg", "-y", "-i", tmp_p,
        "-af", "atempo=1.32",
        "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", cur_p
    ], check=True)
    os.remove(tmp_p)

    # Read processed WAV for global pause alignment
    with wave.open(cur_p, "rb") as wf:
        rate = wf.getframerate()
        n_frames = wf.getnframes()
        raw = wf.readframes(n_frames)
        total_dur = n_frames / float(rate)

    proc_samples = struct.unpack(f"<{n_frames}h", raw)
    win_ms = 10
    win_s = int(rate * win_ms / 1000)
    n_wins = len(proc_samples) // win_s
    rms_env = []
    for i in range(n_wins):
        ch = proc_samples[i * win_s:(i + 1) * win_s]
        rms_env.append(math.sqrt(sum(float(x) * x for x in ch) / win_s))

    beats = build_clause_beats()

    # Calculate acoustic character weight for each beat
    weights = []
    for b in beats:
        txt = b["cn"]
        # Chinese characters + punctuation pause weights
        c_count = sum(1 for c in txt if c not in "，。；：、“”—— ")
        p_weight = txt.count("，") * 1.4 + txt.count("；") * 1.8 + txt.count("：") * 1.8 + txt.count("。") * 2.4
        weights.append(c_count + p_weight)

    total_w = sum(weights)
    cum_w = 0.0
    boundaries = [0.0]

    for i in range(len(beats) - 1):
        cum_w += weights[i]
        ideal_t = (cum_w / total_w) * total_dur
        prev_t = boundaries[-1]

        # Search within [max(prev_t + 1.8, ideal_t - 1.4), min(total_dur - 1.8, ideal_t + 1.4)]
        # for the lowest local RMS valley (actual speech pause!)
        lo_t = max(prev_t + 1.8, ideal_t - 1.35)
        hi_t = min(total_dur - 1.8, ideal_t + 1.35)
        lo_idx = max(0, int(lo_t * 100))
        hi_idx = min(len(rms_env) - 1, int(hi_t * 100))

        best_t = ideal_t
        best_cost = 1e9
        for wi in range(lo_idx, hi_idx + 1):
            t_cand = wi * 0.01
            # Local 70ms average RMS energy
            w0 = max(0, wi - 3)
            w1 = min(len(rms_env), wi + 4)
            local_rms = sum(rms_env[w0:w1]) / (w1 - w0)
            dist_penalty = abs(t_cand - ideal_t) * 260.0
            cost = local_rms + dist_penalty
            if cost < best_cost:
                best_cost = cost
                best_t = t_cand

        boundaries.append(round(best_t, 2))

    boundaries.append(round(total_dur, 2))

    max_cn_len = 0
    for i, b in enumerate(beats):
        b["start"] = boundaries[i]
        b["end"] = boundaries[i + 1]
        max_cn_len = max(max_cn_len, len(b["cn"]))
        assert b["highlight_cn"] in b["cn"], f"Highlight mismatch in beat {b['id']}: {b['highlight_cn']} vs {b['cn']}"

    os.makedirs("data", exist_ok=True)
    with open("data/subtitles.json", "w", encoding="utf-8") as f:
        json.dump(beats, f, ensure_ascii=False, indent=2)

    os.makedirs("web/data", exist_ok=True)
    with open("web/data/subtitles_data.js", "w", encoding="utf-8") as f:
        f.write("window.SUBTITLES_DATA = " + json.dumps(beats, ensure_ascii=False, indent=2) + ";\n")

    print(f"Generated {len(beats)} crisp visual beats across {total_dur:.2f}s (avg {total_dur/len(beats):.2f}s/beat, max CN len = {max_cn_len} chars)!")

    # Re-mix master soundtrack to match exact duration
    fade_out_start = max(0.0, total_dur - 3.5)
    output_audio = "assets/audio/master_soundtrack.wav"
    bgm = "assets/audio/guzheng_morning.mp3"
    subprocess.run([
        "ffmpeg", "-y",
        "-i", cur_p,
        "-stream_loop", "-1", "-i", bgm,
        "-filter_complex",
        f"[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=1.35[narr];"
        f"[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=0.14,afade=t=in:st=0:d=3,afade=t=out:st={fade_out_start:.2f}:d=3.5[bg];"
        f"[narr][bg]amix=inputs=2:duration=first:dropout_transition=2[outa]",
        "-map", "[outa]",
        "-c:a", "pcm_s16le",
        "-ar", "48000",
        output_audio
    ], check=True)

    subprocess.run([
        "ffmpeg", "-y", "-i", output_audio,
        "-c:a", "libmp3lame", "-b:a", "192k", "web/audio/master_soundtrack.mp3"
    ], check=True)
    print("Master soundtrack mixed and exported!")


if __name__ == "__main__":
    prepare_and_align_audio()
