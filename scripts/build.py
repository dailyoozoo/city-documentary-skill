from __future__ import annotations

import argparse
from fractions import Fraction
from hashlib import file_digest
from html import escape
import json
from pathlib import Path
import re
import shutil
import subprocess as sp

from PIL import Image
from scene import font_path, paint

ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT / 'assets/river-town/project.json'
KINDS = {'river', 'wharf', 'bridge', 'city', 'image'}


def load(path):
    p = json.loads(path.read_text(encoding='utf-8-sig'), parse_float=Fraction)
    for key, low, high in (('fps',12,60), ('width',320,3840), ('height',240,2160)):
        v = p[key]
        if type(v) is not int or not low <= v <= high or (key != 'fps' and v % 2):
            raise ValueError(f'{key} out of range or an odd video dimension')
    for key in ('title','subtitle'):
        if not isinstance(p[key],str) or not p[key].strip():
            raise ValueError(f'{key} must be nonempty text')
    if not isinstance(p['shots'],list) or not p['shots']:
        raise ValueError('Provide at least one shot')
    seen = set()
    elapsed = Fraction(0)
    start = 0
    for s in p['shots']:
        for key in ('id','chapter','kind','title','zh','en','source'):
            if not isinstance(s[key],str) or not s[key].strip() or '\n' in s[key] or '\r' in s[key]:
                raise ValueError(f'{key} must be a nonempty line')
        if not re.fullmatch('[a-z][a-z0-9-]{0,49}', s['id']) or s['id'] in seen:
            raise ValueError('Shot IDs must be unique lowercase ASCII slugs')
        seen.add(s['id'])
        if s['kind'] not in KINDS:
            raise ValueError(f"Unsupported shot kind {s['kind']}")
        if s['kind'] == 'image':
            image = Path(s['image'])
            resolved = (path.parent / image).resolve(strict=True)
            if image.is_absolute() or not resolved.is_relative_to(path.parent):
                raise ValueError('Place images next to the project or in a child folder')
            s['image_path'] = resolved
            if s['visual_role'] not in ('历史资料','现代参照','示意图'):
                raise ValueError('image needs a valid visual_role')
        seconds = s['seconds']
        if type(seconds) not in (int, Fraction) or not 0 < seconds <= 120:
            raise ValueError('seconds must be a positive JSON number up to 120')
        elapsed += seconds
        finish = round(elapsed * p['fps'])
        if finish <= start:
            raise ValueError('A shot is shorter than a frame')
        s['in_frame'], s['out_frame'] = start, finish
        start = finish
    return p, start


def timestamp(frame, fps, separator):
    ms = round(Fraction(frame * 1000, fps))
    seconds, ms = divmod(ms, 1000)
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return f'{hours:02}:{minutes:02}:{seconds:02}{separator}{ms:03}'


def subtitles(project, out):
    srt, vtt = [], ['WEBVTT']
    for i, s in enumerate(project['shots'],1):
        line = lambda sep: ' --> '.join(timestamp(s[key], project['fps'], sep) for key in ('in_frame','out_frame'))
        srt.append(f"{i}\n{line(',')}\n{s['zh']}\n{s['en']}")
        vtt.append(f"{line('.')}\n{escape(s['zh'])}\n{escape(s['en'])}")
    (out/'subtitles.srt').write_text('\n\n'.join(srt)+'\n', encoding='utf-8')
    (out/'subtitles.vtt').write_text('\n\n'.join(vtt)+'\n', encoding='utf-8')


def review(project, out):
    fps = project['fps']
    links = []
    for s in project['shots']:
        sec = s['in_frame'] / fps
        poster = f"still-{s['id']}.jpg"
        links.append(f'<li><button type="button" data-at="{sec:.6f}">{timestamp(s["in_frame"], fps, ".")[:8]} · {escape(s["chapter"])}</button> <a href="{poster}">镜头图</a><p>{escape(s["source"])}</p></li>')
    title = escape(project['title'])
    subtitle = escape(project['subtitle'])
    markup = f'''<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title>
<style>body{{margin:0;background:#f4ecdc;color:#263f3d;font:16px/1.65 system-ui,sans-serif}}main{{width:min(92%,900px);margin:2rem auto 4rem}}video{{display:block;width:100%;background:#263f3d}}a{{color:#246269}}button{{font:inherit;padding:.35rem .65rem;color:#fff;background:#2c5653;border:0;border-radius:.25rem;cursor:pointer}}li{{margin:.75rem 0}}li p{{margin:.2rem 0;color:#595954}}</style></head>
<body><main><h1>{title}</h1><p>{subtitle}</p>
<video controls preload="metadata" playsinline poster="poster.jpg" src="film.mp4" aria-label="{title}"></video>
<p><a href="film.mp4" download>下载成片</a> · <a href="subtitles.srt" download>双语 SRT</a> · <a href="subtitles.vtt" download>双语 VTT</a> · <a href="verification.json">技术检查</a></p><h2>镜头与来源</h2><ol>{''.join(links)}</ol></main>
<script>const video = document.querySelector('video');
for (const b of document.querySelectorAll('button[data-at]')) b.addEventListener('click', () => {{
  const jump = () => {{ video.currentTime = Number(b.dataset.at); }};
  if (video.readyState > 0) jump();
  else video.addEventListener('loadedmetadata', jump, {{once:true}});
  video.play().catch(() => {{}});
}});</script></body></html>'''
    (out/'review.html').write_text(markup, encoding='utf-8')


def probe(name, *opts):
    proc = sp.run(['ffprobe','-v','error',*opts,'-of','json',str(name)],
                  check=True, capture_output=True)
    return json.loads(proc.stdout)


def audio_duration(path):
    result = probe(path, '-select_streams','a:0','-show_entries','stream=duration:format=duration')
    s = result['streams'][0] if result['streams'] else None
    if not s:
        raise ValueError(f'No audio stream in {path.name}')
    value = s.get('duration', result.get('format',{}).get('duration','N/A'))
    return Fraction(value)


def encode(args, project, total, face):
    fps = project['fps']
    seconds = f'{total/fps:.9f}'
    cmd = ['ffmpeg','-hide_banner','-loglevel','error','-n','-f','rawvideo','-pixel_format','rgb24',
           '-video_size',f'{project["width"]}x{project["height"]}','-framerate',str(fps),'-i','pipe:0']
    index = 1
    filters = []
    mix = []
    for path, volume, loop, label in ((args.narration,'0.8',False,'voice'),(args.music,'0.12',True,'music')):
        if path:
            if loop:
                cmd += ['-stream_loop','-1']
            cmd += ['-i',str(path)]
            filters.append(f'[{index}:a:0]aresample=48000,aformat=channel_layouts=stereo,volume={volume},apad,atrim=duration={seconds}[{label}]')
            mix.append(label)
            index += 1
    if not mix:
        cmd += ['-f','lavfi','-i',f'anullsrc=r=48000:cl=stereo:d={seconds}']
        audio = '1:a:0'
    else:
        if len(mix) == 2:
            filters.append('[voice][music]amix=inputs=2:duration=first:normalize=0[mix]')
        audio = '[mix]' if len(mix) == 2 else f'[{mix[0]}]'
        cmd += ['-filter_complex',';'.join(filters)]
    cmd += ['-map','0:v:0','-map',audio,'-c:v','libx264','-preset','fast','-crf','18',
            '-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-colorspace','bt709','-color_primaries','bt709',
            '-color_trc','bt709','-color_range','tv','-c:a','aac','-b:a','160k','-movflags','+faststart',str(args.out/'film.mp4')]
    with sp.Popen(cmd, stdin=sp.PIPE) as process:
        try:
            for i,s in enumerate(project['shots']):
                length = s['out_frame'] - s['in_frame']
                photo = None
                if s['kind'] == 'image':
                    with Image.open(s['image_path']) as image:
                        photo = image.convert('RGB')
                still = paint(project,s,.5,face,photo)
                still.save(args.out / f"still-{s['id']}.jpg", quality=93)
                if i == 0:
                    still.save(args.out/'poster.jpg', quality=93)
                for frame in range(length):
                    image = still if photo is not None else paint(project,s,frame/max(length-1,1),face)
                    process.stdin.write(image.tobytes())
        except Exception:
            process.kill()
            raise
        finally:
            try:
                process.stdin.close()
            except BrokenPipeError:
                pass
        if process.wait() != 0:
            raise ValueError('FFmpeg encoding failed; inspect the output and choose a new folder')


def verify(out, p, total, narration, music):
    movie = out/'film.mp4'
    result = probe(movie,'-count_frames','-show_streams','-show_format')
    videos = [s for s in result['streams'] if s['codec_type']=='video']
    audios = [s for s in result['streams'] if s['codec_type']=='audio']
    expected = Fraction(total,p['fps'])
    if len(videos)!=1 or len(audios)!=1:
        raise ValueError('Expected one video and one audio stream')
    v, a = videos[0], audios[0]
    if (int(v['nb_read_frames']) != total or v['width'] != p['width'] or v['height'] != p['height']
            or Fraction(v['avg_frame_rate']) != p['fps'] or abs(Fraction(a['duration'])-expected) > Fraction(1,p['fps'])):
        raise ValueError('Delivery does not match the expected duration, dimensions, frame rate or frame count')
    sp.run(['ffmpeg','-v','error','-xerror','-i',str(movie),'-map','0:v:0','-map','0:a:0','-f','null','-'],check=True)
    with movie.open('rb') as f:
        digest = file_digest(f,'sha256').hexdigest()
    report = dict(sha256=digest, bytes=movie.stat().st_size, seconds=float(expected),
                  video_frames=total, fps=p['fps'], width=p['width'], height=p['height'],
                  video_codec=v['codec_name'], audio_codec=a['codec_name'], audio_seconds=float(a['duration']),
                  audio_mode=('narration+music' if music else 'narration') if narration else ('music' if music else 'silent'),
                  full_decode_passed=True, human_review='not performed by this script',
                  shots=[{k:s[k] for k in ('id','chapter','in_frame','out_frame','source')} for s in p['shots']])
    (out/'verification.json').write_text(json.dumps(report, ensure_ascii=False,indent=2)+'\n',encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description='Build a city documentary from a local JSON project and optional local audio')
    parser.add_argument('--project',type=Path,default=DEMO)
    parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--font',type=Path)
    parser.add_argument('--narration',type=Path)
    parser.add_argument('--music',type=Path)
    args = parser.parse_args()
    try:
        if any(not shutil.which(tool) for tool in ('ffmpeg','ffprobe')):
            raise ValueError('Install FFmpeg with libx264 and make ffmpeg/ffprobe available on PATH')
        p,total = load(args.project.resolve(strict=True))
        face = font_path(args.font)
        if args.narration and audio_duration(args.narration) > Fraction(total,p['fps']):
            raise ValueError('Narration is longer than the timeline. Adjust shot times to the recording.')
        if args.music:
            audio_duration(args.music)
        args.out = args.out.resolve()
        args.out.mkdir(parents=True, exist_ok=False)
        encode(args,p,total,face)
        subtitles(p,args.out)
        verify(args.out,p,total,args.narration,args.music)
        review(p,args.out)
        print(args.out/'review.html')
    except (ValueError, OSError, KeyError, TypeError, sp.CalledProcessError) as exc:
        parser.exit(1, f'{exc}\n')


if __name__ == '__main__':
    main()
