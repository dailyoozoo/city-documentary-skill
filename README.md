# 城市纪录片制作 Skill

从史料写出旁白稿，先定配音，再排分镜和双语字幕，最后导出视频与观看页。仓库包含一个可离线运行的入门示例，以及《上海 · 城市纪事》的关键制作源码和 V11 配音返修案例。

[公众号快速上手：先写稿配音，再做画面](article/article.md) · [HTML 排版版](article/shanghai-city-documentary.html) · [上海案例与源码](references/shanghai.md) · [制作手册](references/workflow.md)

## 先做一部 24 秒短片

准备 Python **3.11+**、能运行 `ffmpeg` / `ffprobe` 的 FFmpeg（含 `libx264`）以及简体中文字体。先在终端执行 `ffmpeg -version`、`ffprobe -version`。以下命令从仓库根目录运行：

```sh
python -m pip install -r requirements.txt
python -X utf8 scripts/build.py --out build/river-town
python -X utf8 scripts/serve.py build/river-town --port 8765
```

打开 `http://127.0.0.1:8765/review.html`。四个章节可以跳播，页面可下载 MP4、SRT 和 VTT，`verification.json` 记录解码和成片参数。示例是虚构地形，默认静音，成片已烧录双语字幕；交付的字幕文件也可单独使用。服务只监听本机，结束后在终端按 `Ctrl+C`。

如果找不到系统自带的简体中文字体，给 `build.py` 加 `--font <字体文件路径>`，例如 Noto Sans CJK SC 的 `.ttc` 或 `.otf` 文件。Linux 可安装发行版的 Noto CJK 字体包。每次构建用一个**尚不存在**的输出目录，保留上一版供对照。

## 换成你自己的城市

复制 [示例 JSON](assets/river-town/project.json) 到新工作目录，保留目录里用到的照片，再编辑标题、按顺序排列的 `shots`、各句中英文、展示时长和 `source`。确认源资料和许可，用 [素材与事实表](assets/source-register.tsv) 记录。

- `river`、`wharf`、`bridge`、`city` 是同一虚构地形的四种空间示意，无法定制坐标；要改地形，可从 `scripts/scene.py` 的 `water()` 和 `buildings()` 开始。
- `image` 使用项目目录下的图片，相对路径写入 `image`，并填写 `visual_role`（`历史资料`、`现代参照`、`示意图`）。适合换入自己绘制或获准使用的地图、照片。最好按目标画幅准备素材，以免裁掉主要元素。
- 中文旁白和英文字幕写入 `zh`、`en`。根据录音句界设置 `seconds`，脚本会按帧率量化。输出宽高为偶数，默认示例 960×540 / 24fps。
- 有录音以后添加 `--narration path/to/voice.wav`。录音比时间轴长时会提示调整分镜，比时间轴短时补静音。添加 `--music path/to/music.wav` 可循环铺底；音量为固定增益，发布前仍需试听和量响度。

```sh
python -X utf8 scripts/build.py --project path/to/project.json --narration path/to/voice.wav --out build/my-city-v1
```

`build.py` 不下载素材、不接触 API，也不自动断句。录音的句界由你根据实际声音决定。先做一段包含困难转场的样片，再增加章节。

## 在 Codex 里使用

把本仓库完整克隆到目标项目的 `.agents/skills/city-documentary-skill`，重新打开项目会话：

```sh
git clone https://github.com/dailyoozoo/city-documentary-skill.git .agents/skills/city-documentary-skill
```

分两次调用：第一次提供城市、主题、片长和来源，只写分句旁白。确认稿子后录成 `voice.wav`，标出每句开始和全段结束。第二次提供定稿、录音、句界和素材，请 Codex 按录音排镜头和双语字幕，再构建视频。两条可直接复制的提示词见[公众号教程](article/article.md)。

## 上海案例范围

[案例索引](references/shanghai.md) 说明地理叙事、三维建模、分镜与音轨如何接起来，以及怎样对应到保留源码。历史源码用来学习原有做法，需要自行准备媒体、数据和依赖；上海原片、配音缓存、地图数据原包、照片、音乐、第三方前端库及其使用许可没有随仓库分发。案例中的史实与空间示意应独立核验后再引用。仓库内的工具和资料范围见 [使用说明](RIGHTS.md)。
