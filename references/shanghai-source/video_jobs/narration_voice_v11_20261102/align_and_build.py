# -*- coding: utf-8 -*-
"""Align the single-call V11 narration and rebuild warp anchors, subtitles,
timeline and soundtrack.

The full WAV is segmented deterministically: per-shot syllable weights give a
prior boundary position, and the strongest silence near each prior (the inline
<pause> produced by the TTS call) is chosen as the real boundary. No ASR model
is needed. Clause splits, anchors, subtitles and the music mix follow the V10
pipeline so the approved camera path is untouched.
"""
from pathlib import Path
import json
import subprocess
import wave

import numpy as np
from pypinyin import lazy_pinyin

from v11_full_text import V11_LINES, CHAPTER_BOUND_AFTER

J = Path(__file__).resolve().parent
ROOT = J.parents[1]
RATE = 24000
FRAME = 480  # 20 ms RMS frames
FULL_WAV = J / "audio" / "full_narration.wav"


def read_wav(p):
    with wave.open(str(p)) as w:
        assert (w.getframerate(), w.getnchannels(), w.getsampwidth()) == (RATE, 1, 2)
        return np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").copy()


def write_wav(p, x):
    with wave.open(str(p), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(x.astype("<i2").tobytes())


def syllable_count(text):
    return len([p for p in lazy_pinyin(text) if p.isalpha()])


def rms_frames(x):
    n = len(x) // FRAME * FRAME
    xf = x[:n].astype(float).reshape(-1, FRAME)
    rms = np.sqrt(np.mean(xf ** 2, axis=1))
    return rms


def voiced_span(rms, threshold):
    voiced = np.where(rms > threshold)[0]
    if not len(voiced):
        return 0, len(rms) - 1
    return int(voiced[0]), int(voiced[-1])


def find_boundary(rms, prior_frame, half_window, threshold):
    lo = max(1, int(prior_frame - half_window))
    hi = min(len(rms) - 1, int(prior_frame + half_window))
    silence = rms[lo:hi] <= threshold
    # Longest run of consecutive silence inside the window.
    best_mid = None
    best_len = 0
    run = 0
    start = 0
    for k, is_sil in enumerate(silence):
        if is_sil:
            if run == 0:
                start = k
            run += 1
            if run > best_len:
                best_len = run
                best_mid = lo + start + run // 2
        else:
            run = 0
    if best_mid is not None:
        return best_mid
    # No silence found: fall back to the local energy minimum (prior on failure).
    return lo + int(np.argmin(rms[lo:hi]))


def silence_runs(rms, threshold):
    runs = []
    run = 0
    start = 0
    for k, is_sil in enumerate(rms <= threshold):
        if is_sil:
            if run == 0:
                start = k
            run += 1
        else:
            if run:
                runs.append((start, k))
            run = 0
    if run:
        runs.append((start, len(rms)))
    return runs


def match_priors(priors, candidates):
    """Globally align priors to candidate runs with dynamic programming.

    Every prior is matched to one candidate; candidates may be skipped but never
    reused, and order is monotonic. The cost is midpoint distance. Returns the
    matched candidate index for each prior (or -1 when no candidate exists).
    """
    p = len(priors)
    c = len(candidates)
    if c == 0:
        return [-1] * p
    cand_mid = np.array([run[2] for run in candidates], dtype=float)
    INF = 1e18
    dp = np.full((p, c), INF)
    prev = np.full((p, c), -1, dtype=int)
    for j in range(c):
        dp[0, j] = abs(cand_mid[j] - priors[0])
    for i in range(1, p):
        run_min = INF
        run_arg = -1
        for j in range(c):
            # Maintain the minimum over dp[i-1, 0..j-1].
            if j > 0:
                val = dp[i - 1, j - 1]
                if val < run_min:
                    run_min = val
                    run_arg = j - 1
            if run_min < INF:
                dp[i, j] = run_min + abs(cand_mid[j] - priors[i])
                prev[i, j] = run_arg
    matches = [-1] * p
    j = int(np.argmin(dp[p - 1]))
    for i in range(p - 1, -1, -1):
        matches[i] = j
        if i > 0:
            j = int(prev[i, j])
    return matches


def segment_shots(rms, first_frame, last_frame, weights, peak):
    """Assign shots onto pause runs via a duration-realism DP.

    Candidate boundary points are the midpoints of deep-silence runs (the inline
    pause tags), plus the voiced span ends. A dynamic program places the shots in
    order while minimizing the squared deviation of each shot's actual duration
    from its syllable-weighted expected duration, with a small reward for longer
    pauses. This prevents a long in-shot pause from being mistaken for a shot
    boundary and prevents shots from being truncated.
    """
    noise_floor = float(np.percentile(rms, 3))
    deep_thr = max(noise_floor * 4.0, peak * 0.003, 1.0)
    deep_thr = min(deep_thr, peak * 0.04)

    pts = [first_frame]
    plens = [0]
    for a, b in silence_runs(rms, deep_thr):
        mid = (a + b) // 2
        if first_frame < mid < last_frame:
            pts.append(mid)
            plens.append(b - a)
    pts = np.array(pts, dtype=float)
    plens = np.array(plens, dtype=float)
    max_plen = max(plens.max(), 1.0)

    n_shots = len(weights)
    m = len(pts)
    total_span = last_frame - first_frame
    expected = total_span * weights / weights.sum()

    INF = 1e18
    dp = np.full((n_shots, m), INF)
    back = np.full((n_shots, m), -1, dtype=int)
    pause_bonus = 0.06 * plens / max_plen

    for j in range(1, m):
        dur = pts[j] - first_frame
        dp[0, j] = ((dur - expected[0]) / expected[0]) ** 2 - pause_bonus[j]
    for i in range(1, n_shots):
        for j in range(i + 1, m):
            best = INF
            best_k = -1
            for k in range(i, j):
                if dp[i - 1, k] < INF:
                    dur = pts[j] - pts[k]
                    cost = ((dur - expected[i]) / expected[i]) ** 2 - pause_bonus[j]
                    value = dp[i - 1, k] + cost
                    if value < best:
                        best = value
                        best_k = k
            if best_k >= 0:
                dp[i, j] = best
                back[i, j] = best_k

    # Force the final shot to end at the voiced span end, then backtrack.
    j = m - 1
    chosen = []
    for i in range(n_shots - 1, -1, -1):
        chosen.append(j)
        if i > 0:
            j = int(back[i, j])
    chosen.reverse()
    # First frame plus the first n-1 shot ends; caller appends the last frame.
    boundaries = [first_frame] + [int(pts[k]) for k in chosen[:-1]]
    return boundaries, deep_thr, m - 1


def clause_split_seconds(x, t1, t2):
    rms = rms_frames(x)
    n1 = syllable_count(t1)
    n2 = syllable_count(t2)
    target = len(x) / RATE * n1 / max(n1 + n2, 1)
    step = FRAME / RATE
    c0 = int(target / step)
    lo = max(1, c0 - int(0.7 / step))
    hi = min(len(rms) - 1, c0 + int(0.7 / step))
    peak = max(rms.max(), 1)
    band = rms[lo:hi]
    if len(band):
        k = lo + int(np.argmin(band))
        if rms[k] < max(peak * 0.18, 120):
            return k * step
    return target


def main():
    x = read_wav(FULL_WAV)
    rms = rms_frames(x)
    peak = rms.max()
    threshold = max(peak * 0.15, 120)

    f0, f1 = voiced_span(rms, threshold)

    weights = np.array([syllable_count(line) for line in V11_LINES], dtype=float)
    boundaries, deep_thr, n_candidates = segment_shots(
        rms, f0, f1, weights, peak
    )
    boundaries.append(f1)
    print("deep threshold:", round(deep_thr, 2), "candidate points:", n_candidates)

    # Per-shot audio bounds in seconds.
    audio_shot = {}
    for i in range(1, 40):
        start = boundaries[i - 1] * FRAME / RATE
        end = boundaries[i] * FRAME / RATE
        audio_shot[i] = [round(start, 4), round(end, 4)]

    # Visual shot end times from the original (approved) timeline.
    old_clauses = json.loads((ROOT / "data/subtitles.json").read_text("utf8"))
    visual_shot_end = {i: old_clauses[2 * i - 1]["end"] for i in range(1, 40)}

    narration_duration = len(x) / RATE
    anchors = [[0.0, 0.0]]
    for i in range(1, 40):
        anchors.append([round(visual_shot_end[i], 5), round(audio_shot[i][1], 5)])
    anchors[-1] = [round(visual_shot_end[39], 5), round(narration_duration, 5)]

    # Clause splits inside each shot.
    v8_subs = json.loads(
        (ROOT / "video_jobs/narration_edit_v8_20261101/subtitles.json").read_text("utf8")
    )
    clause_split = {}
    for i in range(1, 40):
        s0, s1 = audio_shot[i]
        seg = x[int(s0 * RATE):int(s1 * RATE)]
        c1 = v8_subs[2 * i - 2]["cn"]
        c2 = v8_subs[2 * i - 1]["cn"]
        clause_split[i] = round(clause_split_seconds(seg, c1, c2), 3)

    new_subs = json.loads(
        (ROOT / "video_jobs/narration_edit_v8_20261101/subtitles.json").read_text("utf8")
    )
    for i in range(1, 40):
        s0, s1 = audio_shot[i]
        boundary = s0 + clause_split[i]
        next_start = audio_shot[i + 1][0] if i < 39 else narration_duration
        c1, c2 = new_subs[2 * i - 2], new_subs[2 * i - 1]
        c1["start"], c1["end"] = s0, boundary
        c1["display_start"], c1["display_end"] = round(s0, 3), round(boundary, 3)
        c2["start"], c2["end"] = boundary, s1
        c2["display_start"], c2["display_end"] = round(boundary, 3), round(next_start, 3)
    for k, c in enumerate(new_subs):
        assert c["display_end"] > c["display_start"], ("negative", c["id"])
        if k:
            assert abs(new_subs[k - 1]["display_end"] - c["display_start"]) < 1e-6, ("gap", c["id"])

    (J / "subtitles.json").write_text(
        json.dumps(new_subs, ensure_ascii=False, indent=2), "utf8"
    )
    (J / "audio_timeline.js").write_text(
        "window.V8_WARP=" + json.dumps(anchors) + ";\nwindow.V8_SUBTITLES="
        + json.dumps(new_subs, ensure_ascii=False) + ";",
        "utf8",
    )

    def stamp(t):
        ms = round(t * 1000)
        s, ms = divmod(ms, 1000)
        m, s = divmod(s, 60)
        h, m = divmod(m, 60)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03}"

    (J / "subtitles.srt").write_text(
        "\n\n".join(
            f"{k+1}\n{stamp(c['display_start'])} --> {stamp(c['display_end'])}\n"
            f"{c['cn']}\n{c['en']}"
            for k, c in enumerate(new_subs)
        )
        + "\n",
        "utf8",
    )

    # Save a normalized narration copy and build the music mix.
    write_wav(J / "audio" / "narration.wav", x)
    flt = (
        "[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,"
        "volume=1.35[n];"
        f"[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,"
        "volume=0.13,afade=t=in:st=0:d=3,"
        f"afade=t=out:st={narration_duration-4}:d=4[b];"
        "[n][b]amix=inputs=2:duration=first:dropout_transition=2[out]"
    )
    subprocess.run(
        [
            "ffmpeg", "-v", "error", "-y", "-i", str(J / "audio/narration.wav"),
            "-stream_loop", "-1", "-i",
            str(ROOT / "assets/audio/guzheng_morning.mp3"),
            "-filter_complex", flt, "-map", "[out]", "-c:a", "pcm_s16le",
            "-ar", "48000", str(J / "audio/soundtrack.wav"),
        ],
        check=True,
    )

    build = {
        "narration_duration": round(narration_duration, 4),
        "audio_shot_bounds": audio_shot,
        "clause_split_seconds": clause_split,
        "warp_anchors": anchors,
        "chapter_bound_after": sorted(CHAPTER_BOUND_AFTER),
        "generation": "single-call Gemini 3.8 Flash TTS; energy+prior segmentation",
    }
    (J / "qa_align_build.json").write_text(
        json.dumps(build, ensure_ascii=False, indent=2), "utf8"
    )
    # Render-compatible summary (same shape as V10 qa/audio_build.json).
    qa_dir = J / "qa"
    qa_dir.mkdir(exist_ok=True)
    (qa_dir / "audio_build.json").write_text(
        json.dumps(
            {"duration": round(narration_duration, 4), "anchors": anchors},
            ensure_ascii=False, indent=2,
        ),
        "utf8",
    )
    print("narration duration:", round(narration_duration, 3))
    print("shot1:", audio_shot[1], "shot39:", audio_shot[39])


if __name__ == "__main__":
    main()
