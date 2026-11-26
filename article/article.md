# 用城市纪录片 Skill 出片：查资料、写稿、配音、剪视频

**流程：Agent 查资料写稿 → 配音并标句界 → 搜图或做图 → 按声音排镜头 → 导出 MP4。** 你给城市、主题和片长就能开工。下面以 30 秒样片为例，查资料和找画面都交给 Agent。

## 01｜把 Skill 装进项目

在你自己的项目根目录运行下面的命令，再重新打开 Codex 项目会话。文章余下的命令也从**这个根目录**运行。

```sh
git clone https://github.com/dailyoozoo/city-documentary-skill.git .agents/skills/city-documentary-skill
```

**产物：** `.agents/skills/city-documentary-skill/`，里面有 `SKILL.md`、示例和出片脚本。项目素材和成片另放 `work/`、`build/`，更新 Skill 时不影响它们。

## 02｜第一次调用：Agent 自己搜，写成旁白稿

> 用 `$city-documentary-skill` 做一条 30 秒的【城市】纪录短片，主题是【要讲的变化】。请自己上网找可信来源，写一份编号旁白和来源表，先交稿。缺证据的内容不要写进旁白。

**产物：** `work/city-film/narration.md` 和 `sources.tsv`。稿子按 01、02、03 编号，一行一句：**先说在哪，再说原来怎样，最后讲变化**。每句只讲一件事，地名读音和史实出处另外列。

**注意：** 查证到原始页面，记下链接和可支持的事实。拿到稿子出声读一遍，读不顺就改短，超时就删。定稿后进入配音。

## 03｜第二次调用：先配音、再找画面

> 用 `$city-documentary-skill` 继续。按 `work/city-film/narration.md`，用【已授权的配音工具／我提供的录音】做旁白和句界。再按每句主动搜索可用的照片、地图或视频资料，没有合适素材再做示意图。把文件、来源和镜头表放进 `work/city-film/`，最后导出到 `build/city-film-v1/`。

**配音产物：** `voice.wav` 和 `timing.tsv`。已接入配音工具时，Agent 可以按编号合成、检查发音、拼成一条干净人声；有现成录音就直接用。Agent 按实际声音标每句开始和全段结束。比如第 02 句在 5.8 秒开始，第 03 句在 11.6 秒开始，第 02 句就占 5.8 秒。先听清地名、数字和停顿，再拿它定镜头。

**画面产物：** `media/`、补完的 `sources.tsv`、`storyboard.md` 和 `project.json`。Agent 按句查图或找片段，打开原始来源核对年代、地点、许可和署名，把可用文件存下来。实拍适合交代现状，史料适合交代过去；找不到可用画面，就画地图、路线图或用生成工具做**标明「示意」**的画面。`project.json` 里每镜写时长、中英文字幕、对应素材和来源；图片路径以它所在目录为准，例如 `media/shot-01.jpg`。

**注意：** Skill 负责指挥 Agent 做这些事。联网搜索、语音合成和图片生成需要运行环境提供对应工具；没接入 TTS 时，可先交静音样片或接已有录音。许可不明的素材不进成片，也不需要你去找替代图，Agent 会继续搜或改用示意图。

## 04｜按录音出片，打开观看页验收

由 Agent 执行。出片机需要 Python 3.11+、FFmpeg（含 `libx264`，`ffprobe` 可运行）和中文字体。第一次装依赖，之后直接构建：

```sh
python -m pip install -r .agents/skills/city-documentary-skill/requirements.txt
python -X utf8 .agents/skills/city-documentary-skill/scripts/build.py --project work/city-film/project.json --narration work/city-film/voice.wav --out build/city-film-v1
python -X utf8 .agents/skills/city-documentary-skill/scripts/serve.py build/city-film-v1 --port 8765
```

准备好输入文件后再执行。预览地址：[http://127.0.0.1:8765/review.html](http://127.0.0.1:8765/review.html)。只做静音样片时，省略 `--narration` 和它后面的音频路径。

**产物：** `build/city-film-v1/film.mp4`、`subtitles.srt`、`subtitles.vtt`、`review.html` 和 `verification.json`。脚本用分镜渲染图片或程序场景，把双语字幕和旁白合进 MP4。搜到的授权视频片段如果要保留动态，由 Agent 用 FFmpeg 按句界裁剪、统一画幅和帧率，再配回旁白和字幕，复查最终成片。入门脚本的 `image` 镜头只收本地静态图。

**注意：** 输出目录每版换一个，时间轴别短于录音。先用观看页查句界、画面和字幕，再听一遍读音、音量和片尾。`verification.json` 记录技术检查，哪里不好就报「句子编号 + 秒数」，让 Agent 改那一段。

**GitHub｜城市纪录片制作 Skill**

[https://github.com/dailyoozoo/city-documentary-skill](https://github.com/dailyoozoo/city-documentary-skill)
