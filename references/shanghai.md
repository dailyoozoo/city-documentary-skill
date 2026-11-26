# 《上海 · 城市纪事》制作索引

当前案例为 **2026-11-22 的 V11 配音修正版**，V8 是分镜迭代参考，V11 不沿用 V8 声线。成片主线依次是河口、老城、外滩与近代城区、工业、浦东、古今对望。六个观看页章节分别从 0、82.36、169.88、273.86、359.02、459.88 秒开始。

| 环节 | 看哪里 | 能学什么 |
|---|---|---|
| 城市主线与分句 | [V11 旁白稿](shanghai-source/video_jobs/narration_voice_v11_20261102/v11_full_text.py) · [V8 分镜](shanghai-source/video_jobs/narration_edit_v8_20261101/storyboard.md) | 用地理路径串史事；父镜头负责一组语义，子镜头负责视觉节奏；历史版本的时间码不可混用。 |
| 延展画面 | [城市查看器](shanghai-source/web/index.html) · [老城程序场景](shanghai-source/video_jobs/narration_voice_v10_20261101/oldcity_scene.js) · [代表建筑造型](shanghai-source/video_jobs/narration_voice_v10_20261101/hero_geometry.js) | 以水陆、街区、地标逐层搭空间；区分推定年代与史料，模型并非历史测绘。 |
| 控制剪辑与合成 | [时间轴](shanghai-source/video_jobs/narration_voice_v10_20261101/timeline.json) · [合成器](shanghai-source/video_jobs/narration_voice_v10_20261101/compositor.js) · [原浏览器渲染器](shanghai-source/scripts/render_cinematic.py) | V11 复用 V10 视觉场景；通过映射关联不同版本的旁白和视觉时钟，以帧序号捕获确定时刻，再用 FFmpeg 合成。 |
| 旁白校时 | [音频对齐](shanghai-source/video_jobs/narration_voice_v11_20261102/align_and_build.py) · [V11 双语 SRT](shanghai-source/video_jobs/narration_voice_v11_20261102/subtitles.srt) | 以 20 ms 能量窗口寻找停顿，推定句界并输出对应的画面锚点；最终仍需人工复核。 |
| 局部修音 | [最终剪辑表](shanghai-source/video_jobs/narration_fix_v11_20261122/edit_spec.json) · [声音拼接](shanghai-source/video_jobs/narration_fix_v11_20261122/build_audio.py) · [AAC 置换](shanghai-source/video_jobs/narration_fix_v11_20261122/mux_audio_patch.py) · [交付核验](shanghai-source/video_jobs/narration_fix_v11_20261122/verify_delivery.py) | 13 处读音对应 12 个完整句段或分句，最终替换窗口合计 88.545 秒；保护原视频包，正确处理音频编码重叠与有效片尾。 |
| 交付观看 | [对照页生成器](shanghai-source/video_jobs/narration_fix_v11_20261122/build_review.py) · [结果摘要](shanghai-v11-evidence.json) | 观看页聚合章节、读音定位和原声/修正声。全解码、静音跳转和片尾复核、人工试听是不同的证据。 |

## 复现所需输入

**想学流程**，运行仓库根目录 [24 秒示例](../README.md#先做一部-24-秒短片)，它包含全部本地输入。**想重建上海案例**，从同版本的授权素材准备起。`shanghai-source/` 保持生产目录相对位置，供阅读和迁移；它不是自带全部输入的工程备份。

1. 资源研究与建模：准备许可可用的上海底图、历史照片与现代参照、地理数据，以及匹配项目 JS 的 Three.js 和 OrbitControls。浏览器的 `web/images/`、`web/data/` 和 `web/js/` 内所需输入由 `web/index.html`、`studio.html` 和渲染构建器的资源路径确定。用自己核验过的地理数据替换旧输入；旧 CMAB 文件名不代表测绘权威或官方底模。可参考 [NASA 长江口图来源](shanghai-source/video_jobs/narration_edit_v8_20261101/qa/new_asset_sources.json)，其拍摄日期为 2020-08-16，只适合作现代定位。
2. 对齐与渲染：这条历史管线运行在 Chrome / WebGL、Python、NumPy、pypinyin 和 FFmpeg 上。准备 24 kHz 旁白及音乐素材，按 `align_and_build.py` 的输入路径放置。用已对齐的 `audio/soundtrack.wav`、`qa/audio_build.json`、`audio_timeline.js` 和字幕映射驱动 V11 渲染，输出到一个独立新目录。项目路径守卫和所缺文件以 `render.py` 的实际检查为准；少了原资源或配音就不会得到原片的画面或声音。
3. 返修：先留原视频、SRT、干声与混音输入，再另做分句配音。`edit_spec.json` 展示实剪边界；`build_audio.py` 还需要原片音轨、配音缓存、生成记录、基线报告等制作现场文件，公开包未提供这些输入。搭新项目时重做这些输入和基线，不要复用上海的片长、路径、音频包索引或补丁时间。示例用的是另一条轻量 2.5D 管线，不能用它替换原上海媒体。

V11 最终视频全解码 12,533 帧，视频包相同；片尾 AAC 的名义包时长发生一处变化，有效媒体结尾一致。读音的同音字和转写分歧保留，「十一颗」未由识别结果确认声调或数字。本轮并未人工试听，也未静音连续播放整片。涉及旧素材的许可未全量重审。公开包不包含配音服务调用器或真实凭证，也不要求用相同声音供应商。
