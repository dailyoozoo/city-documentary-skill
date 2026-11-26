"""Verify the audio-only V11 delivery without invoking any generation API."""
from pathlib import Path
from itertools import zip_longest
import hashlib
import json
import shutil
import math
import re
import subprocess
import time
import wave

import av
import numpy as np

J = Path(__file__).resolve().parent
ROOT = J.parents[1]
OUT = ROOT / "output/cinematic_v11_audio_fix_20261122"
QA = J / "qa"
FF = Path(shutil.which("ffmpeg") or "ffmpeg").resolve().parent
SOURCE = ROOT / "output/cinematic_v11/shanghai_cinematic_master.mp4"
FINAL = OUT / "shanghai_cinematic_master.mp4"


def sha(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as f:
        for block in iter(lambda: f.read(4 * 1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def run(args):
    result = subprocess.run(args, capture_output=True, text=True, encoding="utf8", errors="replace")
    if result.returncode:
        raise RuntimeError(result.stderr[-5000:])
    return result


def probe(path):
    return json.loads(run([str(FF / "ffprobe.exe"), "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)]).stdout)


def packets(path, kind):
    with av.open(str(path)) as container:
        s = next(s for s in container.streams if s.type == kind)
        for p in container.demux(s):
            if p.size:
                yield p


def compare_packets(kind, windows):
    count = equal = timing = outside = inside = outside_different = 0
    nominal_duration_equal = 0
    duration_annotations = []
    original_digest = hashlib.sha256()
    final_digest = hashlib.sha256()
    ranges = []
    for a, b in zip_longest(packets(SOURCE, kind), packets(FINAL, kind)):
        assert a is not None and b is not None, "Packet counts differ"
        count += 1
        same_time = (a.pts, a.dts, a.time_base) == (b.pts, b.dts, b.time_base)
        timing += int(same_time)
        assert same_time, "PTS/DTS/time_base changed"
        nominal_duration_equal += int(a.duration == b.duration)
        da, db = a.duration, b.duration
        if kind == "audio" and a.pts >= 0:
            da = min(da, a.stream.duration - a.pts)
            db = min(db, b.stream.duration - b.pts)
        assert da == db, "Effective packet media duration changed"
        if a.duration != b.duration:
            assert kind == "audio" and a.pts == 25065472 and (a.duration, b.duration, da) == (1024, 128, 128)
            duration_annotations.append({"packet_index": count - 1, "pts": a.pts,
                "original_nominal_samples": a.duration, "delivery_nominal_samples": b.duration,
                "effective_media_samples_both": da,
                "reason": "Original last AAC packet demux reports 1024 nominal samples but stream has only 128 remaining; delivery explicitly records the same 128-sample media ending."})
        pa, pb = bytes(a), bytes(b)
        same = pa == pb
        equal += int(same)
        original_digest.update(pa)
        final_digest.update(pb)
        if kind == "video":
            assert same, "Original H.264 payload changed"
        else:
            start = float(a.pts * a.time_base)
            end = float((a.pts + da) * a.time_base)
            owners = [w for w in windows if end > w["start"] and start < w["end"]]
            if owners:
                inside += 1
                if ranges and start <= ranges[-1][1] + 1e-7:
                    ranges[-1][1] = end
                else:
                    ranges.append([start, end])
            else:
                outside += 1
                outside_different += int(not same)
                assert same, "AAC outside repair guard changed"
    return {"packets": count, "payloads_identical": equal, "pts_dts_timebase_identical": timing,
            "effective_media_duration_identical": count, "nominal_duration_identical": nominal_duration_equal,
            "nominal_duration_annotations": duration_annotations,
            "original_payload_sha256": original_digest.hexdigest(), "delivery_payload_sha256": final_digest.hexdigest(),
            "outside_guard_packets": outside, "outside_guard_differences": outside_different,
            "inside_guard_packets": inside, "patched_packet_ranges_seconds": ranges}


def decode_audio(path, name):
    target = QA / (name + ".s16le")
    run([str(FF / "ffmpeg.exe"), "-v", "error", "-xerror", "-y", "-i", str(path),
         "-map", "0:a:0", "-ac", "2", "-ar", "48000", "-f", "s16le", str(target)])
    assert target.stat().st_size % 4 == 0
    return np.memmap(target, dtype="<i2", mode="r").reshape(-1, 2)


def pcm_report(a, b, packet_ranges):
    assert a.shape == b.shape, "Decoded audio length changed"
    # AAC MDCT overlap can affect the first decoded block after a packet switch.
    support = 2048
    mask = np.ones(len(a), dtype=bool)
    for start, end in packet_ranges:
        lo = max(0, math.floor(start * 48000) - support)
        hi = min(len(a), math.ceil(end * 48000) + support)
        mask[lo:hi] = False
    equal_outside = bool(np.array_equal(a[mask], b[mask]))
    diff = b[mask].astype(np.int32) - a[mask].astype(np.int32)
    result = {"sample_rate": 48000, "channels": 2, "decoded_sample_frames": len(a),
              "decoded_duration": len(a) / 48000, "declared_audio_duration": 522.2,
              "aac_overlap_support_samples": support, "preserved_sample_frames": int(mask.sum()),
              "outside_guard_pcm_identical": equal_outside,
              "outside_guard_max_difference_pcm": int(np.abs(diff).max(initial=0)),
              "outside_guard_different_channel_samples": int(np.count_nonzero(diff)),
              "delivery_peak_pcm": int(np.abs(b.astype(np.int32)).max()),
              "clipped_channel_samples": int(np.count_nonzero((b == 32767) | (b == -32768)))}
    assert equal_outside, "Decoded PCM differs beyond documented AAC support"
    assert result["clipped_channel_samples"] == 0, "Delivery audio clips"
    with wave.open(str(J / "audio/soundtrack.wav"), "rb") as w:
        assert (w.getframerate(), w.getnchannels(), w.getsampwidth()) == (48000, 2, 2)
        desired = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").reshape(-1, 2)
    spec = json.loads((J / "edit_spec.json").read_text("utf8"))
    result["corrected_windows"] = []
    for block in spec["blocks"]:
        lo, hi = [round(t * 48000) for t in block["old"]]
        x, y = desired[lo:hi].astype(np.float64), b[lo:hi].astype(np.float64)
        d = y - x
        result["corrected_windows"].append({"name": block["name"],
             "correlation": float(np.corrcoef(x.ravel(), y.ravel())[0, 1]),
             "codec_error_rms_pcm": float(np.sqrt(np.mean(d * d))),
             "codec_error_max_pcm": int(np.abs(d).max()),
             "rms_difference_db": float(20 * np.log10(np.sqrt(np.mean(y * y)) / np.sqrt(np.mean(x * x))))})
    result["minimum_corrected_window_correlation"] = min(i["correlation"] for i in result["corrected_windows"])
    assert result["minimum_corrected_window_correlation"] > 0.995, "Encoded patch disagrees with intended mix"
    result["codec_switches"] = []
    for start, end in packet_ranges:
        for t in (start, end):
            index = round(t * 48000)
            lo, hi = max(1, index - 480), min(len(desired), index + 480)
            error = b[lo:hi].astype(np.int32) - desired[lo:hi].astype(np.int32)
            result["codec_switches"].append({"time": t,
                "20ms_error_rms_pcm": float(np.sqrt(np.mean(error.astype(np.float64) ** 2))),
                "20ms_error_max_pcm": int(np.abs(error).max(initial=0)),
                "single_sample_step_pcm": int(np.abs(b[index].astype(np.int32) - b[index - 1].astype(np.int32)).max())})
    return result


def main():
    started = time.monotonic()
    report = {"complete": False, "scope": "Full delivery decode and exact audio-only preservation audit; no human listening claim"}
    original, delivery = probe(SOURCE), probe(FINAL)
    report["source"] = {"path": str(SOURCE.relative_to(ROOT)), "sha256": sha(SOURCE)}
    report["delivery"] = {"path": str(FINAL.relative_to(ROOT)), "sha256": sha(FINAL), "bytes": FINAL.stat().st_size, "probe": delivery}
    for kind in ("video", "audio"):
        os = next(s for s in original["streams"] if s["codec_type"] == kind)
        ns = next(s for s in delivery["streams"] if s["codec_type"] == kind)
        keys = ["codec_name", "profile", "time_base", "start_pts", "duration_ts", "nb_frames"]
        keys += ["width", "height", "pix_fmt", "avg_frame_rate", "color_range", "color_space", "color_transfer", "color_primaries"] if kind == "video" else ["sample_rate", "channels", "channel_layout"]
        assert {k: os.get(k) for k in keys} == {k: ns.get(k) for k in keys}, "Stream metadata changed"
    assert delivery["format"]["duration"] == original["format"]["duration"]
    remux = json.loads((QA / "remux_report.json").read_text("utf8"))
    report["video_packets"] = compare_packets("video", [])
    report["audio_packets"] = compare_packets("audio", remux["windows"])
    print("All H.264 packets and PTS/DTS identical; unaffected AAC payloads identical.", flush=True)
    decoded_original = decode_audio(SOURCE, "decoded_original")
    decoded_final = decode_audio(FINAL, "decoded_delivery")
    report["decoded_audio"] = pcm_report(decoded_original, decoded_final, report["audio_packets"]["patched_packet_ranges_seconds"])
    print("Decoded audio preservation and intended patch comparison passed.", flush=True)
    baseline = json.loads((QA / "baseline.json").read_text("utf8"))
    preserved = []
    for item in baseline["files"]:
        path = ROOT / item["path"]
        current = sha(path)
        assert path.stat().st_size == item["bytes"] and current == item["sha256"], "Protected source changed: " + item["path"]
        preserved.append({"path": item["path"], "sha256": current, "unchanged": True})
    report["protected_sources"] = {"count": len(preserved), "all_unchanged": True, "files": preserved}
    report["source_subtitle_copy_identical"] = sha(OUT / "exports/shanghai_cinematic_subtitles.srt") == sha(ROOT / "output/cinematic_v11/shanghai_cinematic_subtitles.srt")
    report["source_poster_copy_identical"] = sha(OUT / "poster.jpg") == sha(ROOT / "output/cinematic_v11/poster.jpg")
    assert report["source_subtitle_copy_identical"] and report["source_poster_copy_identical"]
    print("23 protected originals and unchanged subtitle/poster copies verified.", flush=True)
    decode_started = time.monotonic()
    decode = run([str(FF / "ffmpeg.exe"), "-hide_banner", "-v", "error", "-xerror", "-nostats", "-progress", "pipe:1",
                  "-i", str(FINAL), "-map", "0:v:0", "-map", "0:a:0", "-f", "null", "-"])
    (QA / "full_decode_progress.txt").write_text(decode.stdout, "utf8")
    (QA / "full_decode_stderr.txt").write_text(decode.stderr, "utf8")
    frames = [int(m) for m in re.findall(r"(?m)^frame=(\d+)$", decode.stdout)]
    assert frames and frames[-1] == 12533 and "progress=end" in decode.stdout
    assert not decode.stderr.strip(), "Unexpected decoder warnings"
    report["full_decode"] = {"exit_code": decode.returncode, "frames": frames[-1], "progress_end": True,
                              "stderr_empty": True, "wall_seconds": time.monotonic() - decode_started}
    loudness = run([str(FF / "ffmpeg.exe"), "-hide_banner", "-nostats", "-i", str(FINAL), "-map", "0:a:0", "-vn",
                    "-af", "ebur128=peak=true", "-f", "null", "-"])
    (QA / "true_peak_log.txt").write_text(loudness.stderr, "utf8")
    peak = re.findall(r"Peak:\s*(-?\d+(?:\.\d+)?)\s*dBFS", loudness.stderr)
    assert peak, "Missing true peak result"
    report["audio_true_peak_dbfs"] = float(peak[-1])
    assert report["audio_true_peak_dbfs"] < 0
    report["elapsed_seconds"] = time.monotonic() - started
    report["complete"] = True
    (QA / "delivery_verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), "utf8")
    (OUT / "delivery_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), "utf8")
    print(json.dumps({"complete": True, "sha256": report["delivery"]["sha256"], "frames": frames[-1],
        "video_payloads_identical": report["video_packets"]["payloads_identical"],
        "original_aac_packets_kept": report["audio_packets"]["outside_guard_packets"],
        "decoded_pcm_preserved": report["decoded_audio"]["outside_guard_pcm_identical"],
        "true_peak_dbfs": report["audio_true_peak_dbfs"], "elapsed_seconds": report["elapsed_seconds"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
