"""Render the existing Shanghai studio safely, with stills and excerpt support.

Examples:
    python scripts/render_cinematic.py --stills-only
    python scripts/render_cinematic.py --preview
    python scripts/render_cinematic.py
"""
from __future__ import annotations

import argparse
import functools
import http.server
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import time
from urllib.parse import parse_qs, urlsplit
import wave

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "assets/audio/master_soundtrack.wav"
OUT = ROOT / "output/cinematic_v6"
STILLS = [4, 18, 31, 87, 102, 115, 170, 184, 205, 252, 285, 333, 352, 371, 393, 421, 438, 459]
PREVIEW = [(0, 15), (95.93, 14), (175.98, 13), (319, 14), (385.01, 14), (420.95, 12)]
COLOR_FILTER = "scale=in_range=full:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p"
COLOR_TAGS = ["-color_range", "tv", "-colorspace", "bt709", "-color_trc", "bt709", "-color_primaries", "bt709"]
COLOR_BITSTREAM = "h264_metadata=video_full_range_flag=0:colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1"


def finalize_color(path):
    """Conform an already rendered candidate when its color metadata is missing.

    Current renders set the range and matrix directly in the encoder. This
    migrates candidates produced before that fix without repeating WebGL work.
    """
    path = Path(path)
    probe_cmd = ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json"]
    before = json.loads(subprocess.run(probe_cmd + [str(path)], capture_output=True, text=True, check=True).stdout)
    video = next(s for s in before["streams"] if s["codec_type"] == "video")
    color_correct = video.get("color_range") == "tv" and video.get("color_space") == "bt709" and video.get("pix_fmt") == "yuv420p"
    if color_correct and video.get("color_transfer") == "bt709" and video.get("color_primaries") == "bt709":
        return
    candidate = path.with_suffix(".rec709.mp4")
    with path.with_suffix(".color.log").open("wb") as log:
        video_options = ["-c:v", "copy"] if color_correct else ["-vf", COLOR_FILTER, "-c:v", "libx264", "-preset", "fast", "-crf", "17", "-pix_fmt", "yuv420p", *COLOR_TAGS]
        subprocess.run(["ffmpeg", "-y", "-i", str(path), "-map", "0:v:0", "-map", "0:a:0", *video_options,
                        "-bsf:v", COLOR_BITSTREAM, "-c:a", "copy", "-movflags", "+faststart", str(candidate)], stderr=log, stdout=subprocess.DEVNULL, check=True)
    after = json.loads(subprocess.run(probe_cmd + [str(candidate)], capture_output=True, text=True, check=True).stdout)
    checked = next(s for s in after["streams"] if s["codec_type"] == "video")
    if any(checked.get(k) != video.get(k) for k in ["nb_frames", "width", "height", "r_frame_rate"]):
        raise RuntimeError("Color conform changed the video timebase or dimensions")
    if checked.get("color_range") != "tv" or checked.get("color_space") != "bt709" or checked.get("pix_fmt") != "yuv420p" or checked.get("color_transfer") != "bt709" or checked.get("color_primaries") != "bt709":
        raise RuntimeError("Color conform failed to produce limited-range Rec.709")
    candidate.replace(path)
    label = "preview" if path.stem.endswith("preview") else "master"
    manifest_path = path.parent / f"{label}_manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest.update(color_space="bt709", color_range="tv", color_transfer="bt709", pixel_format="yuv420p", color_conformed=True)
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Rec.709 conform completed: {path}", flush=True)


def duration():
    with wave.open(str(AUDIO), "rb") as audio:
        return audio.getnframes() / audio.getframerate()


def make_audio(segments, destination):
    parts = []
    for i, (start, length) in enumerate(segments):
        parts.append(f"[0:a]atrim=start={start}:duration={length},asetpts=PTS-STARTPTS[a{i}]")
    parts.append("".join(f"[a{i}]" for i in range(len(segments))) + f"concat=n={len(segments)}:v=0:a=1[out]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(AUDIO), "-filter_complex", ";".join(parts), "-map", "[out]", "-c:a", "pcm_s16le", str(destination)], check=True)


def render(args):
    OUT.mkdir(parents=True, exist_ok=True)
    total = duration()
    if args.start < 0 or args.start >= total or (args.duration is not None and args.duration <= 0):
        raise ValueError("Start/duration must describe a positive interval within the soundtrack")
    segments = PREVIEW if args.preview else [(args.start, min(args.duration or total, total - args.start))]
    # Quantize each excerpt to exactly match the video timebase.
    segments = [(start, round(length * args.fps) / args.fps) for start, length in segments]
    frame_times = [start + f / args.fps for start, length in segments for f in range(round(length * args.fps))]
    if args.stills_only:
        frame_times = []
    label = "preview" if args.preview else "master" if args.start == 0 and args.duration is None else "excerpt"
    destination = OUT / f"shanghai_cinematic_{label}.mp4"
    pending = OUT / f"shanghai_cinematic_{label}.partial.mp4"
    state = {"frames": 0, "stills": 0, "error": None, "last_activity": time.monotonic()}
    done = threading.Event()
    studio = (ROOT / "web/render_studio.html").read_text(encoding="utf-8")
    driver = r"""
    window.addEventListener('error', e => fetch('/error', {method:'POST', body:e.message}));
    window.addEventListener('unhandledrejection', e => fetch('/error', {method:'POST', body:String(e.reason)}));
    (async()=>{
      const start=performance.now();
      while(!window.CINEMATIC_READY){
        if(window.CINEMATIC_ERROR)throw new Error(window.CINEMATIC_ERROR);
        if(performance.now()-start>90000)throw new Error('Studio initialization timed out');
        await new Promise(r=>setTimeout(r,40));
      }
      const canvas=document.getElementById('composite-canvas');
      const post=async(path,body)=>{
        const response=await fetch(path,{method:'POST',body});
        if(!response.ok)throw new Error(await response.text());
      };
      const capture=async(t)=>{
        window.renderAt(t);
        const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',0.97));
        if(!blob)throw new Error('Empty canvas frame');
        return blob;
      };
      for(const t of STILL_TIMES)await post('/still?t='+t,await capture(t));
      for(let f=0;f<FRAME_TIMES.length;f++)await post('/frame?f='+f,await capture(FRAME_TIMES[f]));
      await post('/done','complete');
    })().catch(error=>fetch('/error',{method:'POST',body:String(error.stack||error)}));
    """.replace("STILL_TIMES", json.dumps(STILLS)).replace("FRAME_TIMES", json.dumps(frame_times))
    runner = studio.replace("<head>", '<head><base href="/web/">').replace("</body>", f"<script>{driver}</script></body>")
    ffmpeg = None
    t0 = time.monotonic()

    class Handler(http.server.SimpleHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def handle(self):
            try:
                super().handle()
            except (ConnectionResetError, BrokenPipeError):
                # Browser shutdown closes its idle keep-alive resource connections.
                pass

        def log_message(self, *_):
            pass

        def do_GET(self):
            if self.path == "/_render.html":
                body = runner.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            else:
                super().do_GET()

        def do_POST(self):
            body = self.rfile.read(int(self.headers.get("Content-Length", "0")))
            path = urlsplit(self.path)
            params = parse_qs(path.query)
            status, response = 200, b"ok"
            try:
                state["last_activity"] = time.monotonic()
                if path.path == "/frame":
                    index = int(params["f"][0])
                    if index != state["frames"]:
                        raise RuntimeError(f"Out-of-order frame {index}, expected {state['frames']}")
                    if not body.startswith(b"\xff\xd8") or len(body) < 1000:
                        raise RuntimeError("Invalid JPEG frame")
                    if ffmpeg is None or ffmpeg.poll() is not None:
                        raise RuntimeError("Encoder is unavailable; inspect the FFmpeg log")
                    ffmpeg.stdin.write(body)
                    state["frames"] += 1
                    if state["frames"] % 120 == 0 or state["frames"] == len(frame_times):
                        elapsed = time.monotonic() - t0
                        speed = state["frames"] / elapsed
                        eta = (len(frame_times) - state["frames"]) / speed
                        print(f"{state['frames']}/{len(frame_times)} frames | {speed:.1f} fps | ETA {eta:.0f}s", flush=True)
                elif path.path == "/still":
                    t = float(params["t"][0])
                    if t not in STILLS:
                        raise ValueError("Unexpected still time")
                    (OUT / f"after_{t:06.2f}.jpg").write_bytes(body)
                    state["stills"] += 1
                elif path.path == "/error":
                    raise RuntimeError(body.decode("utf-8", errors="replace"))
                elif path.path == "/done":
                    done.set()
                else:
                    raise ValueError("Unknown render endpoint")
            except Exception as error:
                state["error"] = str(error)
                status, response = 500, str(error).encode("utf-8")
                done.set()
            self.send_response(status)
            self.send_header("Content-Length", str(len(response)))
            self.end_headers()
            self.wfile.write(response)

    handler = functools.partial(Handler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    chrome = args.chrome or shutil.which("chrome") or r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not Path(chrome).is_file():
        server.shutdown()
        server.server_close()
        raise FileNotFoundError(f"Chrome not found: {chrome}")

    with tempfile.TemporaryDirectory(prefix="shanghai-render-", ignore_cleanup_errors=True) as temporary:
        temp = Path(temporary)
        render_audio = AUDIO
        if frame_times and (args.preview or args.start or args.duration is not None):
            render_audio = temp / "excerpt.wav"
            make_audio(segments, render_audio)
        log_path = OUT / f"{label}_ffmpeg.log"
        with log_path.open("wb") as log, (OUT / f"{label}_chrome.log").open("wb") as browser_log:
            if frame_times:
                ffmpeg = subprocess.Popen([
                    "ffmpeg", "-y", "-f", "image2pipe", "-vcodec", "mjpeg", "-framerate", str(args.fps), "-i", "-",
                    "-i", str(render_audio), "-vf", COLOR_FILTER, "-c:v", "libx264", "-preset", "fast", "-crf", "17",
                    "-pix_fmt", "yuv420p", *COLOR_TAGS, "-bsf:v", COLOR_BITSTREAM, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart",
                    "-t", str(len(frame_times) / args.fps), str(pending)
                ], stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=log)
            browser = None
            try:
                browser = subprocess.Popen([
                    str(chrome), "--headless=new", f"--user-data-dir={temp / 'chrome-profile'}", "--no-first-run",
                    "--no-default-browser-check", "--disable-background-networking", "--disable-gpu-vsync",
                    "--disable-frame-rate-limit", "--window-size=1920,1080",
                    f"http://127.0.0.1:{server.server_port}/_render.html"
                ], stdout=subprocess.DEVNULL, stderr=browser_log)
                print(f"Rendering {label}: {len(frame_times)} frames, {len(STILLS)} stills", flush=True)
                while not done.wait(1):
                    if browser.poll() is not None:
                        raise RuntimeError("Chrome exited before completing the render")
                    if time.monotonic() - state["last_activity"] > 120:
                        raise TimeoutError("No frame received for 120 seconds; inspect the Chrome log")
                if state["error"]:
                    raise RuntimeError(state["error"])
                if state["frames"] != len(frame_times) or state["stills"] != len(STILLS):
                    raise RuntimeError(f"Incomplete render: {state}")
            finally:
                if browser is not None and browser.poll() is None:
                    # On Windows Chrome's crash reporter outlives terminate() and locks
                    # the isolated profile. End only this renderer's process tree.
                    subprocess.run(["taskkill", "/PID", str(browser.pid), "/T", "/F"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    try:
                        browser.wait(10)
                    except subprocess.TimeoutExpired:
                        browser.kill()
                        browser.wait()
                server.shutdown()
                server.server_close()
                if ffmpeg is not None:
                    ffmpeg.stdin.close()
                    try:
                        ffmpeg.wait(120)
                    except subprocess.TimeoutExpired:
                        ffmpeg.kill()
                        ffmpeg.wait()
            if ffmpeg is not None:
                if ffmpeg.returncode != 0:
                    raise RuntimeError(f"FFmpeg exited {ffmpeg.returncode}; see {log_path}")
                probe = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(pending)], capture_output=True, text=True, check=True)
                metadata = json.loads(probe.stdout)
                v = next(s for s in metadata["streams"] if s["codec_type"] == "video")
                a = next(s for s in metadata["streams"] if s["codec_type"] == "audio")
                expected = len(frame_times) / args.fps
                if (v["width"], v["height"]) != (1920, 1080) or int(v["nb_frames"]) != len(frame_times):
                    raise RuntimeError("Video dimensions/frame count do not match the requested render")
                if abs(float(metadata["format"]["duration"]) - expected) > 1 / args.fps:
                    raise RuntimeError("Encoded duration does not match the requested timeline")
                if v.get("color_range") != "tv" or v.get("color_space") != "bt709" or v.get("pix_fmt") != "yuv420p" or v.get("color_transfer") != "bt709" or v.get("color_primaries") != "bt709":
                    raise RuntimeError("Encoded color format does not match Rec.709 limited range")
                pending.replace(destination)
                manifest = {"output": str(destination), "fps": args.fps, "frames": len(frame_times), "duration": expected, "segments": segments, "elapsed_seconds": round(time.monotonic() - t0, 2), "audio": str(AUDIO), "audio_codec": a["codec_name"], "stills": STILLS, "technical_metadata": "PASS", "listening_review": "NOT_ASSESSED: renderer validates technical metadata only", "color_space": v["color_space"], "color_range": v["color_range"], "pixel_format": v["pix_fmt"]}
                (OUT / f"{label}_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
                print(f"Saved {destination} ({destination.stat().st_size / 1024**2:.1f} MB)", flush=True)
    print("Render completed.", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--preview", action="store_true", help="Render an 82-second montage with matching narration excerpts")
    modes.add_argument("--stills-only", action="store_true", help="Render representative full-resolution stills")
    parser.add_argument("--start", type=float, default=0)
    parser.add_argument("--duration", type=float)
    parser.add_argument("--fps", type=int, choices=[24, 30], default=24)
    parser.add_argument("--chrome", help="Path to Chrome executable")
    render(parser.parse_args())


if __name__ == "__main__":
    main()
