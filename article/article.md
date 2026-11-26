# 城市纪录片 Skill 怎么用？先写稿配音，再做画面

**顺序：装 Skill → 写旁白稿 → 录旁白 → 按声音做分镜 → 导出视频。** 先定声音，因为每句话实际读了多久，决定镜头和字幕放在哪几秒。

## 01｜装 Skill

在你的项目目录打开终端，运行下面这行，再重新打开 Codex 项目会话。出片环境：Python 3.11+、FFmpeg 和中文字体，安装说明见文末仓库的 README。

```sh
git clone https://github.com/dailyoozoo/city-documentary-skill.git .agents/skills/city-documentary-skill
```

## 02｜第一次调用：写旁白稿

把**城市、要讲的变化、目标片长、已有资料**发给 Codex。第一条消息可以直接这么写：

> 用 `$city-documentary-skill` 给【城市】写一条 30 秒旁白，讲清【一个变化】。参考【资料链接或文件路径】。交付 `narration.md`：一行一句，按 01、02、03 编号。先说在哪，再说原来怎样、后来变了什么。每句只讲一个信息，史实出处和专名读音另列。先停在稿子，不出片。

拿到稿子先出声读一遍，拗口就改短，读超时就删一句。**稿子定了再录。**

## 03｜把配音先做出来

按编号顺序录一条干净的人声，句间留短停顿，导出 `voice.wav` 放进项目。手机录音或用你自己的配音工具都行。用合成语音时，同一条片用同一声线，先试听地名和数字。

在剪辑软件的波形上标出**每句开始**和**全段结束**的时间，比如 `01=0.0、02=5.8、03=11.6、结束=18.0`。这样第 02 句对应的镜头是 5.8 秒（11.6 − 5.8）。音乐留到剪完再加。

## 04｜第二次调用：按配音出片

把定稿、音频、句界和可用图片交给 Codex。第二条消息照抄，换成自己的路径和时间：

> 用 `$city-documentary-skill` 继续。定稿是 `narration.md`，配音是 `voice.wav`，素材在【目录，附来源】。句界是【填刚才的时间】。按录音给每句配图或地图，生成 `project.json` 和双语字幕；用 `scripts/build.py` 的 `--narration` 参数接入这条配音，导出到 `build/my-city-v1`。给我 `film.mp4`、字幕和 `review.html`。

打开 `review.html`，先听旁白，再看切镜和字幕是否跟得上。哪句有问题，就记下编号和秒数，让 Codex 改那一段。

**GitHub｜城市纪录片制作 Skill**

[https://github.com/dailyoozoo/city-documentary-skill](https://github.com/dailyoozoo/city-documentary-skill)
