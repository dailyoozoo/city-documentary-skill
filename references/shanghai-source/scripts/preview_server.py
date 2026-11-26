"""Local project preview server with byte-range support for video seeking."""
import argparse
import functools
import http.server
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


class RangeHandler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        self.byte_range = None
        header = self.headers.get("Range")
        path = Path(self.translate_path(self.path))
        if not header or not path.is_file():
            return super().send_head()
        size = path.stat().st_size
        match = re.fullmatch(r"bytes=(\d*)-(\d*)", header)
        if not match or not any(match.groups()) or not size:
            self.send_error(416, "Unsupported range")
            return None
        first, last = match.groups()
        if first:
            start, end = int(first), min(int(last) if last else size - 1, size - 1)
        else:
            start, end = max(0, size - int(last)), size - 1
        if start >= size or start > end:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None
        stream = path.open("rb")
        stream.seek(start)
        self.byte_range = (start, end)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(str(path)))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Last-Modified", self.date_time_string(path.stat().st_mtime))
        self.end_headers()
        return stream

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def copyfile(self, source, destination):
        if self.byte_range is None:
            return super().copyfile(source, destination)
        remaining = self.byte_range[1] - self.byte_range[0] + 1
        while remaining:
            block = source.read(min(256 * 1024, remaining))
            if not block:
                break
            destination.write(block)
            remaining -= len(block)

    def handle(self):
        try:
            super().handle()
        except (ConnectionResetError, BrokenPipeError):
            pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=18943)
    args = parser.parse_args()
    handler = functools.partial(RangeHandler, directory=str(ROOT))
    with http.server.ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        edition = "cinematic_v7" if (ROOT / "output/cinematic_v7/review.html").is_file() else "cinematic_v6"
        print(f"http://127.0.0.1:{server.server_port}/output/{edition}/review.html", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
