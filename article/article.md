# 用城市纪录片 Skill 做一条片：四步，每步看成品

在你的项目目录打开终端，运行下面这行，再重新打开这个项目的 Codex 会话。看到 `.agents/skills/city-documentary-skill/SKILL.md`，就装好了。下面四步都在同一个 Codex 对话里做。

```sh
git clone https://github.com/dailyoozoo/city-documentary-skill.git .agents/skills/city-documentary-skill
```

下面用虚构示例《沿河而生》演示：**写稿 → 配音 → 找画面 → 出片**。每步下面就是它的产物。

## 01｜写旁白

**你怎么做：** 把城市、想讲的变化和片长填进这句话，发给 Codex：

> 用 `$city-documentary-skill` 做一条 24 秒短片，讲【城市】的【变化】。你自己查资料。先给我四句带编号的旁白和出处。

**产物：一份可以直接照着念的稿子。** 每句只讲一件事。配音前，先确认地名、年份和不好念的字。示例稿长这样：

01｜沿着河找一找，哪里最适合停船？

02｜码头有了人流，街道慢慢接到河岸。

03｜桥把两岸连在一起，人开始往对岸走。

04｜把四个时刻接起来，就看到了两岸的变化。

[打开示例旁白稿](demo/narration.md)

## 02｜先配音

**你怎么做：** 稿子定下来后，接着发：

> 按这四句配音。用我已授权的配音工具，或者我发的录音。给我一条干净的人声，再标出每句从哪秒到哪秒。

**产物：一条旁白 WAV，一张时间表。** 后面按这张表切镜头。下表是静音示例的排镜时间；真正配音后，要按实录更新。

| 句子 | 开始 | 结束 |
| --- | --- | --- |
| 01 | 0 秒 | 6 秒 |
| 02 | 6 秒 | 12 秒 |
| 03 | 12 秒 | 18 秒 |
| 04 | 18 秒 | 24 秒 |

[下载示例时间表](demo/timing.tsv)

## 03｜让 Agent 找画面

**你怎么做：** 接着发：

> 按时间表给每句话配一个画面。你去网上找能用的照片、地图或视频，记下出处和使用许可。找不到合适的就做示意图。先把分镜给我看。

**产物：一份分镜和对应的画面。** 图和片段都由 Agent 找；下面是本示例实际用上的四个镜头。

| 编号 | 时间 | 画面 |
| --- | --- | --- |
| 01 | 0–6 秒 | 俯看河流和两岸 |
| 02 | 6–12 秒 | 拉近到码头，看到街道接到河岸 |
| 03 | 12–18 秒 | 切到桥，交代人怎么过河 |
| 04 | 18–24 秒 | 拉远，看到两岸连成一片 |

![第 03 镜：桥把两岸连起来。画面是虚构河城示意。](still-bridge.jpg)

[打开示例分镜](demo/storyboard.md)

## 04｜让 Agent 出片

**你怎么做：** 看完分镜，接着发：

> 按分镜把画面剪到旁白上，加双语字幕。检查声音、字幕和画面对不对得上，再把 MP4、字幕和观看页发给我。缺出片工具就告诉我怎么装。

**产物：能打开播放的成片、一份独立字幕、一个能按镜头跳转的观看页。** 下面就是这四句、这四个镜头做出来的 24 秒样片。演示片是静音的，可以看画面和字幕怎么对应。

字幕长这样：**0–6 秒｜沿着河找一找，哪里最适合停船？｜Follow the river. Where could a boat stop?**

<video controls playsinline preload="metadata" poster="still-river.jpg" src="demo/film.mp4" aria-label="沿河而生，24 秒静音样片"></video>

[下载样片 MP4](demo/film.mp4) · [下载字幕 SRT](demo/subtitles.srt) · [打开样片观看页](demo/review.html)

**GitHub｜城市纪录片制作 Skill**

[https://github.com/dailyoozoo/city-documentary-skill](https://github.com/dailyoozoo/city-documentary-skill)
