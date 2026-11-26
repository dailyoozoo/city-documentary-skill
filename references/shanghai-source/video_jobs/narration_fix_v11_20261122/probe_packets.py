"""Compare original AAC to its lossless-PCM reconstruction re-encode."""
from pathlib import Path
import av
import hashlib
import json

J = Path(__file__).resolve().parent
ROOT = J.parents[1]


def packets(path, kind):
    with av.open(str(path)) as container:
        stream = next(s for s in container.streams if s.type == kind)
        info = {"codec": stream.codec_context.name, "time_base": str(stream.time_base),
                "start_time": stream.start_time, "duration": stream.duration,
                "extradata": stream.codec_context.extradata.hex()}
        rows = [(p.pts, p.dts, p.duration, str(p.time_base), hashlib.sha256(bytes(p)).hexdigest(), p.size)
                for p in container.demux(stream) if p.size]
    return info, rows


def main():
    source = ROOT / "output/cinematic_v11/shanghai_cinematic_master.mp4"
    rebuilt = J / "qa/original_audio_reencode.m4a"
    oi, op = packets(source, "audio")
    ri, rp = packets(rebuilt, "audio")
    aligned = [(a, b) for a, b in zip(op, rp)]
    report = {"original": oi, "rebuilt": ri, "counts": [len(op), len(rp)],
              "payload_equal": sum(a[4] == b[4] for a, b in aligned),
              "timing_equal": sum(a[:4] == b[:4] for a, b in aligned),
              "original_first_last": [op[:3], op[-2:]], "rebuilt_first_last": [rp[:3], rp[-2:]],
              "first_payload_differences": [{"index": i, "pts": a[0], "sizes": [a[5], b[5]]}
                    for i, (a, b) in enumerate(aligned) if a[4] != b[4]][:10]}
    (J / "qa/original_aac_comparison.json").write_text(json.dumps(report, indent=2), "utf8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
