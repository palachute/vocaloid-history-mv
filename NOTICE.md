# NOTICE · 第三方组件与权利说明

## 代码 / Code
| 组件 | 许可 | 说明 |
|---|---|---|
| 本项目代码 | MIT（见 `LICENSE`） | |
| [pdoom-video](https://github.com/mexicat/pdoom-video) by Giacomo Magnanini | MIT（见 `LICENSE.pdoom-video`） | `app/src/engine/` 与渲染脚本基于它修改 |
| three.js、opentype.js、vite、playwright-core 等 npm 依赖 | 各自许可（MIT / Apache-2.0） | 通过 `bun install` 安装，不随仓库分发 |

## 字体 / Fonts（`app/public/fonts/`）
| 字体 | 许可 | 来源 |
|---|---|---|
| Archivo | SIL OFL 1.1（`fonts/src/OFL.txt`） | Omnibus-Type/Archivo |
| Cormorant Garamond | SIL OFL 1.1 | CatharsisFonts/Cormorant |
| IBM Plex Mono | SIL OFL 1.1 | IBM/plex |
| Noto Sans / Serif JP、Noto Sans / Serif SC（`fonts/cjk/`） | SIL OFL 1.1 | Google Noto CJK |
| EMS 系列单线字体（`fonts/stroke/EMS*.svg`） | SIL OFL 1.1（见各文件 metadata） | Windell H. Oskay / Evil Mad Scientist |
| Hershey 单线字体（`fonts/stroke/Hershey*.svg`） | Hershey Fonts 使用声明（可自由使用，需保留来源说明） | A. V. Hershey, U.S. National Bureau of Standards |

## 不随仓库分发的内容 / Not included
以下内容的权利不属于本项目，开源版中**已移除**，需要使用者自行准备并自行确认授权：

- 歌曲《それでも僕は歌わなくちゃ》（Neru）的音源与歌词 → `audio/`、`data/lyrics.json`
- 曲绘 / PV 截图（各 P 主与画师）→ `app/public/covers/`
- 歌手立绘（Crypton Future Media、上海禾念、AH-Software 等权利方）→ `app/public/chars/`

## 仍在代码里的文字 / Text that remains in the code
- 片中中日双语的历史叙述、点题字幕，原案为**现世妍术组**讲稿。
- 片中引用的 P 主留言 / 访谈语句为短引用，出处已在画面中标注。
- `data/audio.json` 是对音源做的节拍 / 响度分析结果（数值数据），不含音频本身。
