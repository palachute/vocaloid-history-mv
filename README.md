# 眼中的 VOCALOID 发展史 · それでも僕は歌わなくちゃ MV

**中文** · [English](#english) · [日本語](#日本語)

一支**完全用代码逐帧渲染**的 MV（约 3:17 + 片尾），用 Neru《それでも僕は歌わなくちゃ》讲 VOCALOID 的发展史。
从 1961 年 IBM 7090 第一次唱歌，到初音未来、百花齐放、走向世界、wowaka，再到 AI 歌声合成，最后回到一个问题：**VOCALOID = ?**

- 成片：[bilibili · BV1KSaB6KEdH](https://www.bilibili.com/video/BV1KSaB6KEdH/)
- 制作：帕拉褚特 && Claude Opus 5.5　讲稿原案：现世妍术组

> ⚠️ 本仓库**只包含代码**。歌曲音源、歌词、曲绘、歌手立绘均不随仓库分发（见 [NOTICE.md](NOTICE.md)）。
> 不放任何素材也能完整运行：音源会退回占位节拍，曲绘退回文字卡片，立绘退回抽象图形。

## 它是怎么做的

- **TypeScript + three.js**，引擎基于 [pdoom-video](https://github.com/mexicat/pdoom-video)（MIT）。
- **每一帧都是歌曲时间 t 的纯函数**：没有关键帧动画、没有剪辑软件。浏览器里的实时预览和离线导出的画面逐帧一致。
- **一切按节拍写**：`app/src/timeline.ts` 用小节号切章节，场景里用拍号（如 `B(309.6)`）安排每个动作。
- **离线导出**：无头 Chrome 逐帧渲染 → ffmpeg 编码，支持多重采样运动模糊。

## 运行

需要 [bun](https://bun.sh)、Google Chrome、带 libx264 的 ffmpeg。

```sh
cd app
bun install
bunx vite        # 打开 http://localhost:5173 预览（空格 播放/暂停，←/→ 跳 1 秒，h 隐藏 UI）
```

## 导出

```sh
cd app
# 单帧
bun scripts/render.ts stills --t 61.3,148.4 --out ../out/stills
# 快速版（发群用）
bun scripts/render.ts video --from 0 --fps 30 --samples 1 --shutter 0 --preset ultrafast --crf 22 --out ../out/share.mp4
# 正式版（1080p60，带运动模糊；加 --scale 2 可导出 4K）
bun scripts/render.ts video --from 0 --fps 60 --samples 4 --shutter 0.5 --preset slow --crf 14 --out ../out/final.mp4
```

Linux / 无头环境下把 `CHROME_PATH` 设成 Chromium 的路径。

## 放入自己的素材（可选）

| 素材 | 放哪里 | 说明 |
|---|---|---|
| 音源 | `audio/song.mp3` | 见 [audio/README.md](audio/README.md) |
| 歌词（逐行时间轴 + 中译） | `data/lyrics.json` | 格式见 `data/lyrics.example.json` |
| 曲绘 | `app/public/covers/` | 文件名清单见 [covers/README.md](app/public/covers/README.md) |
| 歌手立绘 | `app/public/chars/` | 文件名清单见 [chars/README.md](app/public/chars/README.md) |

请只使用你有权使用的素材。

## 目录

```
app/src/engine/      渲染核心（pdoom-video 改）
app/src/scenes/      一章一个文件：ch0_dawn … ch8_outro
app/src/scenes/kit/  可复用的小件：低多边形心、钢琴卷帘、城市、章节标题……
app/src/timeline.ts  章节表（按小节）
app/scripts/         预览服务器、离线渲染
data/                节拍分析、字幕、曲目表、素材清单
docs/                计划与逐轮修改记录（PROGRESS.md 记录了与 Claude 协作的全过程）
tools/               音频分析、字体子集化等脚本
```

## 说明

- 场景代码是为这一首歌量身写的（大量写死的拍号），更适合当作「一部作品的源码 + 一套可借鉴的写法」，而不是通用框架。
- 欢迎 issue / PR，但不保证长期维护。

## 许可

代码：MIT（[LICENSE](LICENSE)）；引擎部分另见 [LICENSE.pdoom-video](LICENSE.pdoom-video)；字体为 SIL OFL 等，见 [NOTICE.md](NOTICE.md)。
音乐、歌词、曲绘、立绘、讲稿文本的权利归各自权利方，不在 MIT 许可范围内。

---

## English

Video: [bilibili · BV1KSaB6KEdH](https://www.bilibili.com/video/BV1KSaB6KEdH/)

A music video for Neru's *Sore demo Boku wa Utawanakucha*, telling the history of VOCALOID — **every frame rendered by code**.
TypeScript + three.js on top of [pdoom-video](https://github.com/mexicat/pdoom-video); each frame is a pure function of song time, so the live preview and the offline 1080p60 export match exactly.

**This repo contains code only.** The song, lyrics, cover art and character art are not included (see [NOTICE.md](NOTICE.md)); the project still runs end-to-end without them, using a placeholder beat and fallback visuals.

```sh
cd app && bun install && bunx vite                      # preview at http://localhost:5173
bun scripts/render.ts video --from 0 --fps 60 --samples 4 --shutter 0.5 --crf 14 --out ../out/final.mp4
```

To use your own (licensed) media, see the table above: `audio/song.mp3`, `data/lyrics.json` (format: `data/lyrics.example.json`), `app/public/covers/`, `app/public/chars/`.
Code is MIT; media and narration text belong to their respective rights holders.
Credits: 帕拉褚特 && Claude Opus 5.5 · narration draft: 现世妍术组.

## 日本語

動画：[bilibili · BV1KSaB6KEdH](https://www.bilibili.com/video/BV1KSaB6KEdH/)

Neru「それでも僕は歌わなくちゃ」で VOCALOID の歴史を描く MV です。**全フレームをコードでレンダリング**しています（TypeScript + three.js、[pdoom-video](https://github.com/mexicat/pdoom-video) ベース）。

このリポジトリには**コードのみ**が含まれます。楽曲・歌詞・ジャケット・立ち絵は含まれていません（[NOTICE.md](NOTICE.md)）。素材がなくてもプレースホルダーで最後まで動きます。
ご自身で権利をお持ちの素材は上の表の場所に置いてください。コードは MIT、楽曲・画像・原案テキストの権利は各権利者に帰属します。
