"""Apply cached narration repairs at inspected pauses and reconstruct the V11 mix."""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import subprocess
import wave
import numpy as np

J = Path(__file__).resolve().parent
ROOT = J.parents[1]
SOURCE = ROOT / "video_jobs/narration_voice_v11_20261102"
FFMPEG = Path(shutil.which("ffmpeg") or "ffmpeg")


def sha(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as f:
        for block in iter(lambda: f.read(1024*1024), b""):
            h.update(block)
    return h.hexdigest()


def read(path):
    with wave.open(str(path)) as w:
        assert w.getsampwidth() == 2
        return w.getframerate(), w.getnchannels(), np.frombuffer(w.readframes(w.getnframes()), "<i2").reshape(-1, w.getnchannels())


def write(path, x, rate):
    path.parent.mkdir(parents=True, exist_ok=True)
    assert x.dtype == np.int16
    with wave.open(str(path), "wb") as w:
        w.setnchannels(x.shape[1] if x.ndim == 2 else 1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(x.astype("<i2", copy=False).tobytes())


def rms(x):
    y = x.astype(float)
    return float(np.sqrt(np.mean(y*y)))


def gated_rms(x, rate):
    step = round(rate*.02)
    y = x[:len(x)//step*step].astype(float).reshape(-1, step)
    powers = np.mean(y*y, axis=1)
    gate = max(200.0, float(np.percentile(np.sqrt(powers), 90))*.08)
    active = powers > gate*gate
    assert np.any(active)
    return float(np.sqrt(np.mean(powers[active]))), float(np.count_nonzero(active)*step/rate), gate


def fade_to_zero(x, n, front=False):
    n = min(n, len(x))
    ramp = np.linspace(0.0, 1.0, n)
    if front:
        x[:n] *= ramp
    else:
        x[-n:] *= ramp[::-1]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--rebuild", action="store_true", help="Rebuild local repair output only; never generate TTS")
    args = p.parse_args()
    spec = json.loads((J / "edit_spec.json").read_text("utf8"))
    plan = json.loads((J / "repair_plan.json").read_text("utf8"))
    names = {b["name"]:b for b in plan["blocks"]}
    ledger_paths = [J / "qa/request_ledger.json", J / "rescue_four/qa/request_ledger.json"]
    for path in ledger_paths:
        ledger = json.loads(path.read_text("utf8"))
        assert ledger["status"] == "COMPLETE" and ledger["generation_request_count"] == 1 and ledger["automatic_retries"] == 0
    dest = J / "audio/narration.wav"
    if dest.exists() and not args.rebuild:
        raise SystemExit("Local corrected narration already exists; use --rebuild only after an intentional edit-spec change.")
    baseline = json.loads((J / "qa/baseline.json").read_text("utf8"))
    # Verify the editable input and soundtrack against the frozen source.
    for row in baseline["files"]:
        if row["path"] in {"video_jobs/narration_voice_v11_20261102/audio/narration.wav", "video_jobs/narration_voice_v11_20261102/audio/soundtrack.wav"}:
            assert sha(ROOT / row["path"]) == row["sha256"], row["path"]
    rate, channels, old_matrix = read(SOURCE / "audio/narration.wav")
    assert rate == spec["sample_rate"] == 24000 and channels == 1
    old = old_matrix[:,0]
    fixed = old.copy()
    changed = np.zeros(len(old), dtype=bool)
    cache = {}
    edits = []
    context_chunks = []
    quiet_ramp = round(rate*.004)
    sentence_ramp = round(rate*.012)
    for b in spec["blocks"]:
        a,z = [round(t*rate) for t in b["old"]]
        assert z > a and not np.any(changed[a:z])
        if b["source"] not in cache:
            sr, ch, xx = read(J / b["source"])
            assert sr == rate and ch == 1
            cache[b["source"]] = xx[:,0]
        src = cache[b["source"]]
        sa,sz = [round(t*rate) for t in b["take"]]
        x = src[sa:sz].astype(float)
        org_level, org_active, gate_old = gated_rms(old[a:z], rate)
        new_level, new_active, gate_new = gated_rms(x, rate)
        desired_gain = org_level / new_level
        assert .6 <= desired_gain <= 1.6, (b["name"], desired_gain)
        # Keep headroom for a high transient without introducing compression/EQ.
        gain = min(desired_gain, 32000.0 / float(np.max(np.abs(x))))
        x *= gain
        assert np.max(np.abs(x)) < 32767, (b["name"], "gain would clip")
        operations = []
        # Descending source coordinates keep prior locations stable.
        for e in sorted(b["pause_edits"], key=lambda q:q["remove"][0] if "remove" in q else q["at"], reverse=True):
            ea,ez = e["remove"] if "remove" in e else (e["at"],e["at"])
            ia,iz = round(ea*rate)-sa, round(ez*rate)-sa
            assert 0 < ia <= iz < len(x)
            check_a = round(ea*rate) if "remove" in e else round(ea*rate)-round(rate*.01)
            check_z = round(ez*rate) if "remove" in e else round(ea*rate)+round(rate*.01)
            energy = rms(src[check_a:check_z])
            assert energy <= 35.0, (b["name"], e, "not verified low energy", energy)
            left, right = x[:ia].copy(), x[iz:].copy()
            fade_to_zero(left, quiet_ramp)
            fade_to_zero(right, quiet_ramp, front=True)
            padding = np.zeros(round(e.get("insert", 0)*rate))
            x = np.concatenate([left, padding, right])
            operations.append({**e,"source_samples":[round(ea*rate),round(ez*rate)],"removed_samples":iz-ia,"inserted_samples":len(padding),"rms_pcm_before_gain":energy,"edge_fade_samples":quiet_ramp})
        lead = round(b["leading_pad"]*rate)
        tail = z-a-lead-len(x)
        assert tail >= 0, (b["name"], "does not fit", tail/rate)
        fade_to_zero(x, sentence_ramp, front=True)
        fade_to_zero(x, sentence_ramp)
        replacement = np.concatenate([np.zeros(lead),x,np.zeros(tail)])
        assert len(replacement) == z-a
        # Crossfade only the inspected quiet sentence boundaries, inside repair windows.
        ramp = np.linspace(0.0, 1.0, sentence_ramp)
        replacement[:sentence_ramp] = old[a:a+sentence_ramp]*(1-ramp)+replacement[:sentence_ramp]*ramp
        replacement[-sentence_ramp:] = replacement[-sentence_ramp:]*(1-ramp)+old[z-sentence_ramp:z]*ramp
        quantized = np.rint(replacement).astype(np.int16)
        fixed[a:z] = quantized
        changed[a:z] = True
        matched_level, matched_active, _ = gated_rms(quantized, rate)
        join_jumps = [int(fixed[a])-int(old[a-1]), int(old[z])-int(fixed[z-1])]
        assert max(map(abs,join_jumps)) < 128, (b["name"], "unexpected quiet-boundary discontinuity", join_jumps)
        row = {**b, "canonical_sentence":names[b["name"]]["text"], "text":b.get("replacement_text",names[b["name"]]["text"]),
               "terms":names[b["name"]]["terms"], "old_samples":[a,z], "source_samples":[sa,sz], "source_sha256":sha(J/b["source"]),
               "gain":gain,"gain_db":20*np.log10(gain),"desired_gain":desired_gain,"peak_headroom_adjustment_db":20*np.log10(gain/desired_gain),"original_gated_rms":org_level,"source_gated_rms":new_level,"matched_gated_rms":matched_level,
               "matched_vs_original_db":20*np.log10(matched_level/org_level),"gated_active_seconds":[org_active,new_active,matched_active],
               "gates_pcm":[gate_old,gate_new],"leading_samples":lead,"trailing_samples":tail,"pause_operations":operations,
               "sentence_fade_samples":sentence_ramp,"quiet_join_jumps_pcm":join_jumps,"replacement_pcm_sha256":hashlib.sha256(quantized.tobytes()).hexdigest(),
               "speech_time_stretch":False,"pitch_or_eq_change":False}
        edits.append(row)
        context_a,context_z = max(0,a-round(rate*.9)), min(len(old),z+round(rate*.9))
        write(J/f"audio/comparisons/{b['name']}_original.wav",old[context_a:context_z],rate)
        write(J/f"audio/comparisons/{b['name']}_corrected.wav",fixed[context_a:context_z],rate)
        context_chunks.append({"name":b["name"],"start":max(0,b["old"][0]-.45),"end":min(len(old)/rate,b["old"][1]+.45),"repair_start":b["old"][0],"repair_end":b["old"][1],"expected":row["text"]})
        print(b["name"], "gain",round(row["gain_db"],2),"dB; level residual",round(row["matched_vs_original_db"],3),"dB; trailing pause",round(tail/rate,3),flush=True)
    assert np.array_equal(old[~changed],fixed[~changed])
    write(dest,fixed,rate)
    report = {"original_narration_sha256":sha(SOURCE/"audio/narration.wav"),"corrected_narration_sha256":sha(dest),"edit_spec_sha256":sha(J/"edit_spec.json"),
              "duration":len(old)/rate,"sample_rate":rate,"samples":len(old),"replacement_window_seconds":float(np.count_nonzero(changed)/rate),
              "unmodified_samples":int(np.count_nonzero(~changed)),"unmodified_pcm_identical":True,"unmodified_pcm_sha256":hashlib.sha256(fixed[~changed].tobytes()).hexdigest(),
              "clipped_samples":int(np.count_nonzero(np.abs(fixed.astype(np.int32))>=32767)),"peak_pcm":int(np.max(np.abs(fixed.astype(np.int32)))),
              "generation_requests_total":2,"automatic_retries":0,"speaker":"achernar","speech_time_stretch":False,"blocks":edits,
              "scope":"Sample-exact local edit audit. ASR and speaker model results are separate evidence, not human listening."}
    (J/"qa/narration_edit_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),"utf8")
    (J/"qa/final_chunks.json").write_text(json.dumps(context_chunks,ensure_ascii=False,indent=2),"utf8")
    filt = "[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=1.35[n];[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=0.13,afade=t=in:st=0:d=3,afade=t=out:st=518.2:d=4[b];[n][b]amix=inputs=2:duration=first:dropout_transition=2[out]"
    soundtrack=J/"audio/soundtrack.wav"
    subprocess.run([str(FFMPEG),"-v","error","-y" if args.rebuild else "-n","-i",str(dest),"-stream_loop","-1","-i",str(ROOT/"assets/audio/guzheng_morning.mp3"),"-filter_complex",filt,"-map","[out]","-c:a","pcm_s16le","-ar","48000",str(soundtrack)],check=True)
    sr,ch,old_mix=read(SOURCE/"audio/soundtrack.wav")
    nr,nch,new_mix=read(soundtrack)
    assert (sr,ch,old_mix.shape)==(nr,nch,new_mix.shape)==(48000,2,(25065600,2))
    # Account explicitly for the resampler FIR support around repair windows.
    mix_mask=np.zeros(len(old_mix),dtype=bool)
    for b in edits:
        mix_mask[round(b["old"][0]*sr)-256:round(b["old"][1]*sr)+256]=True
    difference=old_mix.astype(np.int32)-new_mix.astype(np.int32)
    assert not np.any(difference[~mix_mask])
    mix_report={"soundtrack_sha256":sha(soundtrack),"original_soundtrack_sha256":sha(SOURCE/"audio/soundtrack.wav"),"duration":len(old_mix)/sr,
                "original_mix_reconstruction_exact":True,"music_file": "assets/audio/guzheng_morning.mp3","music_sha256":sha(ROOT/"assets/audio/guzheng_morning.mp3"),"filter_complex":filt,
                "resampler_guard_samples_48khz":256,"unmodified_pcm_identical":True,"unmodified_stereo_sample_frames":int(np.count_nonzero(~mix_mask)),
                "unmodified_pcm_sha256":hashlib.sha256(new_mix[~mix_mask].tobytes()).hexdigest(),"clipped_samples":int(np.count_nonzero(np.abs(new_mix.astype(np.int32))>=32767)),"peak_pcm":int(np.max(np.abs(new_mix.astype(np.int32)))),
                "first_changed_sample_frame":int(np.flatnonzero(np.any(difference!=0,axis=1))[0]),"last_changed_sample_frame":int(np.flatnonzero(np.any(difference!=0,axis=1))[-1])}
    (J/"qa/mix_edit_report.json").write_text(json.dumps(mix_report,ensure_ascii=False,indent=2),"utf8")
    print("Corrected narration and soundtrack built; unaffected PCM is identical.",flush=True)


if __name__=="__main__":
    main()
