"""Copy V11 H.264 and unaffected AAC packets, patching cached corrected AAC only."""
from pathlib import Path
import hashlib
import json
import av

J=Path(__file__).resolve().parent
ROOT=J.parents[1]
OUT=ROOT/"output/cinematic_v11_audio_fix_20261122"


def main():
    source=ROOT/"output/cinematic_v11/shanghai_cinematic_master.mp4"
    fresh=J/"audio/corrected_audio_full.m4a"
    assert fresh.is_file()
    final=OUT/"shanghai_cinematic_master.mp4"
    if final.exists():
        raise SystemExit("Corrected MP4 already exists; refuse to overwrite a delivery.")
    OUT.mkdir(exist_ok=True)
    temp=OUT/"shanghai_cinematic_master.partial.mp4"
    if temp.exists():
        raise SystemExit("A staged MP4 already exists; inspect it before any retry.")
    spec=json.loads((J/"edit_spec.json").read_text("utf8"))
    guard=.25
    with av.open(str(source)) as original, av.open(str(fresh)) as generated:
        vs=original.streams.video[0]
        os=original.streams.audio[0]
        ns=generated.streams.audio[0]
        assert os.codec_context.extradata==ns.codec_context.extradata
        assert os.time_base==ns.time_base and os.duration==ns.duration
        new_packets=[p for p in generated.demux(ns) if p.size]
        new_map={p.pts:p for p in new_packets}
        assert len(new_map)==len(new_packets)
        windows=[{"name":b["name"],"start":b["old"][0]-guard,"end":b["old"][1]+guard,"packets":0} for b in spec["blocks"]]
        replaced=0
        kept=0
        video=0
        differing_outside=0
        copied_digest=hashlib.sha256()
        with av.open(str(temp),"w",options={"movflags":"+faststart"}) as dest:
            ov=dest.add_stream_from_template(vs)
            oa=dest.add_stream_from_template(os)
            dest.metadata.update(original.metadata)
            ov.metadata.update(vs.metadata)
            oa.metadata.update(os.metadata)
            for p in original.demux(vs,os):
                if not p.size:
                    continue
                if p.stream.type=="video":
                    p.stream=ov
                    dest.mux(p)
                    video+=1
                    continue
                npacket=new_map[p.pts]
                assert (p.pts,p.dts,p.duration,p.time_base)==(npacket.pts,npacket.dts,npacket.duration,npacket.time_base)
                start=float(p.pts*p.time_base)
                end=float((p.pts+p.duration)*p.time_base)
                owners=[w for w in windows if end>w["start"] and start<w["end"]]
                if owners:
                    chosen=npacket
                    replaced+=1
                    for w in owners:
                        w["packets"]+=1
                else:
                    chosen=p
                    kept+=1
                    differing_outside+=int(bytes(p)!=bytes(npacket))
                    copied_digest.update(bytes(p))
                # AAC demux reports a nominal last 1024 samples; keep original 128-sample final media duration.
                if chosen.pts>=0 and chosen.pts+chosen.duration>os.duration:
                    chosen.duration=os.duration-chosen.pts
                chosen.stream=oa
                dest.mux(chosen)
        assert kept+replaced==len(new_packets)
    temp.replace(final)
    report={"source":str(source.relative_to(ROOT)),"output":str(final.relative_to(ROOT)),"method":"PyAV stream remux: original H.264 packets; original AAC outside repair guards; corrected continuous AAC within guards",
            "video_packets_copied":video,"aac_packets_kept":kept,"aac_packets_replaced":replaced,"codec_guard_seconds":guard,"windows":windows,
            "fresh_encode_different_outside_guards":differing_outside,"kept_original_aac_payload_sha256":copied_digest.hexdigest(),
            "speech_time_stretch":False,"visual_rerender":False,"music_source_unchanged":True,"complete":True}
    (J/"qa/remux_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),"utf8")
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
