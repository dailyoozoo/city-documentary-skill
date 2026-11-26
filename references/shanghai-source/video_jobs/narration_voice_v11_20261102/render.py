"""Render the V11 Gemini-TTS female-voice version.

The approved visual sources (studio page, JS, timeline) are reused read-only
from the V10 job; only the audio, anchors and subtitles come from V11. Output
goes to a new protected folder under project/output.
"""
from pathlib import Path
import argparse
import json
import math
import shutil
import types

ROOT = Path(__file__).resolve().parents[2]
JOB = Path(__file__).resolve().parent
SRC_JOB = ROOT / 'video_jobs/narration_voice_v10_20261101'
DEFAULT_OUTPUT = ROOT / 'output/cinematic_v11'


def resolve_output(value):
    out = Path(value)
    if not out.is_absolute():
        out = ROOT / out
    out = out.resolve()
    output_root = (ROOT / 'output').resolve()
    if not out.is_relative_to(output_root) or out == output_root:
        raise ValueError('Output must be a separate folder under this project/output.')
    for name in ('cinematic_v6', 'cinematic_v7', 'cinematic_v8', 'cinematic_v9', 'cinematic_v10'):
        delivery = (output_root / name).resolve()
        if out == delivery or out.is_relative_to(delivery):
            raise ValueError('Preserved V6-V10 delivery folders cannot be render targets.')
    if any(out.glob('*.mp4')):
        raise ValueError('This output folder already contains videos. Choose a new --output folder.')
    return out


def main():
    p = argparse.ArgumentParser(description=__doc__)
    modes = p.add_mutually_exclusive_group()
    modes.add_argument('--stills-only', action='store_true')
    modes.add_argument('--preview', action='store_true')
    p.add_argument('--start', type=float, default=0)
    p.add_argument('--duration', type=float)
    p.add_argument('--chrome')
    p.add_argument('--output', default=str(DEFAULT_OUTPUT),
                   help='New folder under project/output; V6-V10 folders are protected')
    a = p.parse_args()
    try:
        out = resolve_output(a.output)
    except ValueError as exc:
        p.error(str(exc))
    total = json.loads((JOB / 'qa/audio_build.json').read_text('utf8'))['duration']
    if not math.isfinite(a.start) or not 0 <= a.start < total or (
            a.duration is not None and (not math.isfinite(a.duration) or a.duration <= 0)):
        p.error(f'start must be within [0, {total}); duration must be finite and positive')
    if a.preview and (a.start or a.duration is not None):
        p.error('preview cannot be combined with start/duration')
    required = ['studio.html', 'timeline.json', 'architecture.js', 'oldcity_scene.js',
                'timeline.js', 'hero_geometry.js', 'editorial.js', 'compositor.js']
    for name in required:
        if not (SRC_JOB / name).is_file():
            p.error(f'Missing prepared visual source: {name}')
    if not (JOB / 'audio/soundtrack.wav').is_file():
        p.error('Missing V11 audio/soundtrack.wav; run align_and_build.py first.')
    out.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(JOB / 'subtitles.srt', out / 'shanghai_cinematic_subtitles.srt')
    a.fps = 24
    source_file = ROOT / 'scripts/render_cinematic.py'
    source = source_file.read_text(encoding='utf-8')
    needle = 'studio = (ROOT / "web/render_studio.html").read_text(encoding="utf-8")'
    assert source.count(needle) == 1
    source = source.replace(needle, 'studio = Path(_STUDIO).read_text(encoding="utf-8").replace("narration_voice_v10_20261101/audio_timeline.js", "narration_voice_v11_20261102/audio_timeline.js")')
    source = source.replace("await post('/done','complete');",
                            "await post('/audit',JSON.stringify(window.V7_AUDIT()));\n      await post('/done','complete');")
    source = source.replace('elif path.path == "/done":',
                            'elif path.path == "/audit":\n                    (OUT / "scene_audit.json").write_bytes(body)\n                elif path.path == "/done":')
    source = source.replace("for(let f=0;f<FRAME_TIMES.length;f++)await post('/frame?f='+f,await capture(FRAME_TIMES[f]));",
                            "const frameAudit=[];for(let f=0;f<FRAME_TIMES.length;f++){const blob=await capture(FRAME_TIMES[f]);frameAudit.push({frame:f,...window.V8_FRAME_STATE});await post('/frame?f='+f,blob);}await post('/frame-audit',JSON.stringify(frameAudit));")
    source = source.replace('elif path.path == "/audit":',
                            'elif path.path == "/frame-audit":\n                    (OUT / (label + "_frame_state.json")).write_bytes(body)\n                elif path.path == "/audit":')
    mod = types.ModuleType('v11_pipeline'); mod.__file__ = str(source_file)
    exec(compile(source, str(source_file), 'exec'), mod.__dict__)
    mod.OUT = out; mod._STUDIO = str(SRC_JOB / 'studio.html'); mod.AUDIO = JOB / 'audio/soundtrack.wav'
    timeline = json.loads((SRC_JOB / 'timeline.json').read_text('utf8'))
    import numpy as np
    anchors = json.loads((JOB / 'qa/audio_build.json').read_text('utf8'))['anchors']
    warp = lambda t: float(np.interp(t, [x[0] for x in anchors], [x[1] for x in anchors]))
    mod.STILLS = [round(warp((s['start'] + s['end']) / 2), 2) for s in timeline]
    mod.PREVIEW = [(0, warp(70.68)), (warp(95.93), 10), (warp(346), 10)]
    mod.render(a)


if __name__ == '__main__':
    main()
