"""Build a separate V11 audio correction review page; never alter original media."""
from pathlib import Path
import hashlib
import html
import json
import re
import shutil

from pypinyin import lazy_pinyin

J = Path(__file__).resolve().parent
ROOT = J.parents[1]
OUT = ROOT / "output/cinematic_v11_audio_fix_20261122"


def stamp(seconds):
    s = int(seconds)
    return f"{s // 60:02d}:{s % 60:02d}"


def term_time(chunk, term):
    chars, times = [], []
    for token, t in zip(chunk["tokens"], chunk["timestamps"]):
        for char in token:
            if "\u4e00" <= char <= "\u9fff":
                chars.append(char)
                times.append(t)
    sounds = lazy_pinyin("".join(chars))
    target = lazy_pinyin(term)
    for i in range(len(sounds) - len(target) + 1):
        if sounds[i:i + len(target)] == target:
            return chunk["start"] + times[i]
    return chunk["repair_start"]


def main():
    if not (OUT / "shanghai_cinematic_master.mp4").is_file():
        raise SystemExit("Build the corrected MP4 first.")
    OUT.mkdir(exist_ok=True)
    (OUT / "exports").mkdir(exist_ok=True)
    (OUT / "audio_comparisons").mkdir(exist_ok=True)
    shutil.copy2(ROOT / "output/cinematic_v11/poster.jpg", OUT / "poster.jpg")
    shutil.copy2(ROOT / "output/cinematic_v11/shanghai_cinematic_subtitles.srt", OUT / "exports/shanghai_cinematic_subtitles.srt")
    edit = json.loads((J / "qa/narration_edit_report.json").read_text("utf8"))
    sense = json.loads((J / "qa/final_delivery_sense.json").read_text("utf8"))
    assert sense["complete"]
    assert sense["audio_sha256"] == hashlib.sha256((OUT / "shanghai_cinematic_master.mp4").read_bytes()).hexdigest()
    chunks = {c["name"]: c for c in sense["chunks"]}
    source_html = (ROOT / "output/cinematic_v11/review.html").read_text("utf8")
    css = re.search(r"<style>(.*?)</style>", source_html, re.S)[1]
    css += """
button:focus-visible,a:focus-visible{outline:2px solid var(--gold);outline-offset:4px}
.corrections{border-top:1px solid var(--line);padding-top:24px;margin:0 0 32px}.corrections h2{font-size:19px}.corrections>p{margin:0 0 16px}
.correction-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.correction-grid button{font:inherit;text-align:left;background:transparent;border:1px solid var(--line);color:var(--text);padding:13px;cursor:pointer;line-height:1.8}
.correction-grid button:hover{border-color:var(--gold)}.correction-grid span{display:block;font-size:12px;color:var(--gold)}.correction-grid small{display:block;color:var(--muted);font-size:12px}
details{border-top:1px solid var(--line);margin:24px 0 32px;padding-top:20px}summary{cursor:pointer;color:var(--gold);font-size:17px;margin-bottom:14px}
.comparison{display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:22px;align-items:center;border-bottom:1px solid var(--line);padding:18px 0}.comparison h3{font-size:14px;font-weight:500;margin:0 0 6px}.comparison p{font-size:12px}.comparison label{font-size:12px;color:var(--muted);display:block;margin-bottom:6px}.comparison audio{width:100%;height:36px}
@media(max-width:1000px){.correction-grid{grid-template-columns:repeat(3,1fr)}.comparison{grid-template-columns:1fr 1fr}.comparison>div:first-child{grid-column:1/-1}}
@media(max-width:600px){.correction-grid{grid-template-columns:repeat(2,1fr)}.comparison{grid-template-columns:1fr}.comparison>div:first-child{grid-column:auto}}
"""
    buttons, comparisons, points = [], [], []
    labels = {"鳞次栉比": "鳞次栉比 · 次", "燎原星火": "燎原星火 · 原", "华章": "时代华章 · 华", "镌刻": "镌刻 · 镌"}
    for block in edit["blocks"]:
        for term in block["terms"]:
            t = term_time(chunks[block["name"]], term["term"])
            point = {"name": block["name"], **term, "term_time_approx": round(t, 3), "seek": round(max(block["old"][0] - .2, t - 1.8), 3)}
            points.append(point)
            label = labels.get(term["term"], term["term"])
            buttons.append(f'<button data-seek="{point["seek"]}" data-label="{html.escape(label)}"><span>{stamp(t)}</span>{html.escape(label)}<small>{html.escape(term["pinyin"])}</small></button>')
        terms = " / ".join(t["term"] for t in block["terms"])
        for kind in ("original", "corrected"):
            filename = f'{block["name"]}_{kind}.wav'
            shutil.copy2(J / "audio/comparisons" / filename, OUT / "audio_comparisons" / filename)
        comparisons.append(f'''<div class="comparison"><div><h3>{html.escape(terms)}</h3><p>{html.escape(block["text"])}</p></div><div><label for="{block["name"]}-old">V11 原配音</label><audio id="{block["name"]}-old" controls preload="none" src="audio_comparisons/{block["name"]}_original.wav"></audio></div><div><label for="{block["name"]}-new">修正配音</label><audio id="{block["name"]}-new" controls preload="none" src="audio_comparisons/{block["name"]}_corrected.wav"></audio></div></div>''')
    assert len(points) == 13 and len(comparisons) == 12
    chapters = [{"label": "序幕 · 江海初开", "time": 0.0}, {"label": "第一章 · 九里环城", "time": 82.36}, {"label": "第二章 · 十里洋场", "time": 169.88}, {"label": "第三章 · 星火觉醒", "time": 273.86}, {"label": "第四章 · 浦东奇迹", "time": 359.02}, {"label": "终章 · 古今交响", "time": 459.88}]
    chapter_html = "".join(f'<button data-seek="{c["time"]}" data-label="{html.escape(c["label"])}"><span>{stamp(c["time"])}</span>{html.escape(c["label"])}</button>' for c in chapters)
    page = f'''<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>上海 · 城市纪事 | V11 配音修正版</title><style>{css}</style></head><body><main>
<header><div><div class="eyebrow">SHANGHAI / A CITY IN TIME</div><h1>上海 · 城市纪事</h1><p>从江海交汇，到古今交响。</p></div><p>V11 · 配音修正版 · Achernar 女声<br>完整片 8 分 42 秒 · 1080p / 24 fps · 双语字幕</p></header>
<div class="screen"><video id="film" controls playsinline preload="metadata" poster="poster.jpg" aria-label="上海城市纪事 V11 配音修正版"><source src="shanghai_cinematic_master.mp4" type="video/mp4"></video></div>
<div class="toolbar"><div class="buttons"><a class="download" href="shanghai_cinematic_master.mp4" download>下载完整片</a><a class="download" href="exports/shanghai_cinematic_subtitles.srt" download>双语字幕</a><a class="download" href="../cinematic_v11/review.html">查看 V11 原版</a></div><div id="status" role="status">点击播放即可观看</div></div>
<nav aria-label="章节跳转">{chapter_html}</nav>
<section class="corrections" aria-label="读音修正跳转"><h2>13 处读音修正</h2><p>点击词语可跳到对应句段；下方可对照原配音和修正配音。</p><div class="correction-grid">{"".join(buttons)}</div></section>
<details id="comparisons"><summary>展开逐段配音对照</summary>{"".join(comparisons)}</details>
<section class="notes"><div><h2>原主播声线</h2><p>沿用 V11 的 Achernar 女声，匹配原段音量并衔接前后旁白。</p></div><div><h2>仅修正配音</h2><p>画面、双语字幕、背景音乐与总时长沿用 V11。</p></div><div><h2>原版保留</h2><p><a href="../cinematic_v11/review.html">V11 原版</a>及历史版本均保留，可随时对照。</p></div></section>
<footer>画面包含历史影像、当代实景、绘画与程序化空间示意。长江口影像：NASA Ocean Color / Landsat 8，2020-08-16。</footer></main>
<script>
const film=document.querySelector('#film');const status=document.querySelector('#status');const audios=Array.from(document.querySelectorAll('audio'));
const fmt=t=>String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0');
document.querySelectorAll('[data-seek]').forEach(b=>b.addEventListener('click',async()=>{{audios.forEach(a=>a.pause());film.currentTime=Number(b.dataset.seek);status.textContent='正在播放 · '+b.dataset.label;document.querySelector('.screen').scrollIntoView({{behavior:'smooth',block:'center'}});try{{await film.play();}}catch(e){{status.textContent='已跳转 · '+b.dataset.label+' · 点击播放';}}}}));
film.addEventListener('play',()=>audios.forEach(a=>a.pause()));film.addEventListener('timeupdate',()=>{{status.textContent=(film.paused?'已暂停':'正在播放')+' · '+fmt(film.currentTime)+' / '+fmt(film.duration||522.208333);}});
film.addEventListener('ended',()=>status.textContent='完整片播放结束');film.addEventListener('error',()=>status.textContent='视频加载失败，请重新打开观看页');
audios.forEach(a=>a.addEventListener('play',()=>{{film.pause();audios.filter(x=>x!==a).forEach(x=>x.pause());}}));
</script></body></html>'''
    (OUT / "review.html").write_text(page, "utf8")
    (OUT / "corrections.json").write_text(json.dumps(points, ensure_ascii=False, indent=2), "utf8")
    (OUT / "chapters.json").write_text(json.dumps(chapters, ensure_ascii=False, indent=2), "utf8")
    print(json.dumps({"page": str((OUT / "review.html").relative_to(ROOT)), "correction_links": len(points), "comparison_pairs": len(comparisons), "points": points}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
