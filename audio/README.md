# audio

- 把正版音源放成 `audio/song.mp3`（《それでも僕は歌わなくちゃ》/ Neru）。
- 没有 `song.mp3` 时，预览和导出会自动用 `placeholder.wav`（`tools/placeholder_audio.py` 生成的占位节拍）代替，画面照常渲染。
- `data/audio.json` 已经包含对原曲的节拍分析，所以画面和原曲是对齐的；换别的歌需要用 `tools/analyze.py` 重新分析并重写 `app/src/timeline.ts`。

Put your own licensed copy of the song at `audio/song.mp3`. Without it, `placeholder.wav` is used and everything still renders.
