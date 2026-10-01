// CHAPTER 7a · 新的时代 (bars 75–81.5). The machines that sing, 2011 → 2026.
// A flight down a corridor of editor windows — one engine per step, each drawn in its own era's idiom:
// piano roll → hand-drawn pitch → AI-predicted pitch → spectrogram → a single text box and a button.
// Behind the corridor, a dense stream of the events of these years scrolls past. At the end of the
// corridor: 告死鸟 (ilem, 2026) and the line under the whole decade — "in an age where any dream can be
// generated with one click…".
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import { LIN, rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { clamp, ease, frameIdx, hash, hexToLinear, lerp, noise1, prog, pulse } from '../engine/util';
import { Chapter, W, H } from './kit/base';
import { drawCover, hexA, label } from './kit/draw';
import { Stage } from './kit/three3d';
import { LineBatch } from '../engine/lines';
import { mul, type RGB } from './kit/lines';
import { chapterTitle } from './kit/title';

type Kind = 'roll' | 'piapro' | 'cevio' | 'growl' | 'ai' | 'spec' | 'prompt';
const ENGINES: { y: string; name: string; sub: string; kind: Kind; col: string; img?: string }[] = [
  { y: '2011.10', name: 'VOCALOID3', sub: '新编辑器 · 中/西/韩语声库', kind: 'roll', col: '#9C978F' },
  { y: '2012.07', name: '洛天依 V3', sub: '第一个中文 VOCALOID', kind: 'roll', col: '#66CCFF', img: 'chars/luotianyi' },
  { y: '2013.02', name: 'Piapro Studio', sub: 'Crypton 自研编辑器', kind: 'piapro', col: '#39C5BB' },
  { y: '2013.09', name: 'CeVIO Creative Studio', sub: 'HMM 歌声 / 说话合成', kind: 'cevio', col: '#E0A33B' },
  { y: '2014.12', name: 'VOCALOID4', sub: '吼声 · 声库交叉合成', kind: 'growl', col: '#D8322F' },
  { y: '2018.07', name: 'VOCALOID5', sub: '', kind: 'roll', col: '#EEE9DF' },
  { y: '2018.12', name: 'Synthesizer V', sub: 'Dreamtonics', kind: 'roll', col: '#FF8FB1' },
  { y: '2020.02', name: 'NEUTRINO', sub: '神经网络歌声合成', kind: 'spec', col: '#7ED957' },
  { y: '2020.08', name: 'X Studio', sub: '小冰 · AI 歌手', kind: 'ai', col: '#66CCFF' },
  { y: '2020.11', name: '初音ミク NT', sub: 'Crypton 自研引擎', kind: 'piapro', col: '#39C5BB', img: 'chars/miku' },
  { y: '2020.12', name: 'Synthesizer V AI', sub: 'AI 引擎 · 跨语种', kind: 'ai', col: '#FF8FB1' },
  { y: '2021.07', name: 'CeVIO AI · 可不', sub: 'KAFU', kind: 'ai', col: '#B9A8E6', img: 'chars/kafu' },
  { y: '2022.05', name: 'ACE Studio · 洛天依 AI', sub: '时域科技', kind: 'ai', col: '#66CCFF', img: 'chars/luotianyi_ai' },
  { y: '2022.10', name: 'VOCALOID6', sub: 'VOCALOID:AI', kind: 'ai', col: '#EEE9DF' },
  { y: '2023', name: 'OpenUtau × DiffSinger', sub: '开源 · 扩散模型', kind: 'spec', col: '#E0473F' },
  { y: '2024.03', name: 'Suno v3', sub: '一键生成整首歌', kind: 'prompt', col: '#FFC400' },
  { y: '2026.04', name: '初音ミク V6', sub: 'VOCALOID:AI', kind: 'ai', col: '#39C5BB', img: 'chars/miku_v6' },
];
// when each engine is passed: the pre-AI tools run straight on from his heartbeat (2011 → 2018);
// then a held breath for the title — 新的时代 = the AI era — on the b312 downbeat; then the AI engines.
const PRE = 7, EB: number[] = [];
for (let i = 0; i < PRE; i++) EB.push(304.5 + i * 0.83);
EB.push(312.1); for (let j = 1; j < 10; j++) EB.push(313.1 + (j - 1) * 0.775);   // NEUTRINO holds a beat; last = 319.3 (告死鸟 freeze unchanged)
const E0 = EB[0]!;              // engine i is passed at E0 + i * STEP
const GAP = 1100;
// the decade, scrolling past behind the corridor
const STREAM = [
  '2011.07 MIKUNOPOLIS · LA', '2011.12 Google Chrome CM · Tell Your World', '2012.10 ミクパ 香港 · 台北', '2012.11 イーハトーヴ交響曲', '2012.12 THE END · YCAM',
  '2013.08 マジカルミライ 2013', '2014.05 Lady Gaga ArtRave', '2014.05 MIKU EXPO Jakarta', '2014.10 Late Show', '2014.10 MIKU EXPO LA / NY', '2015.06 MIKU EXPO 上海',
  '2015.09 日本武道館', '2015.12 紅白 · 千本桜', '2016.02 洛天依 · 湖南卫视', '2016.04 超歌舞伎', '2016.07 BML · CONNECT~心的连接~', '2016.08 初音ミクシンフォニー',
  '2016.11 ドクター・コッペリウス', '2017.06 洛天依 首场全息个唱', '2017.08 砂の惑星 · マザーグース', '2017.11 未来有你 · 上海', '2018.12 MIKU EXPO Europe', '2019.02 洛天依 × 郎朗',
  '2019.07 BML · 初音 × 洛天依', '2019 — ヒトリエ 三人で、続けていく', '2020.09 プロジェクトセカイ', '2021.02 春晚 · 听我说', '2021.06 MIKU EXPO Online', '2022.02 冬奥文化节 · 洛天依',
  '2023.09 Pokémon × Miku VOLTAGE', '2024.04 Coachella', '2024.07 未来有你 回归线下', '2024.10 MIKU EXPO Europe / AU', '2025.01 Fortnite × Miku', '2025.03 世界计划 国服',
  '2025.05 大阪万博 · 超歌舞伎', '2025.11 MIKU EXPO Asia', '2026.03 VOLTAGE Live', '2026.04 MIKU EXPO 2026 NA', '2026.04 告死鸟 · ilem',
];

function engineCard(e: (typeof ENGINES)[number], img: HTMLImageElement | undefined): HTMLCanvasElement {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 640;
  const c = cv.getContext('2d')!;
  const col = e.col;
  c.fillStyle = 'rgba(12,12,14,0.96)'; c.fillRect(0, 0, 1024, 640);
  c.strokeStyle = hexA(col, 0.7); c.lineWidth = 3; c.strokeRect(1.5, 1.5, 1021, 637);
  c.fillStyle = hexA(col, 0.22); c.fillRect(0, 0, 1024, 44);
  c.font = font(F.mono(500), 22); c.fillStyle = hexA(col, 1); c.fillText(`${e.name}  —  ${e.y}`, 18, 30);
  const X = 40, Y = 70, Wd = 944, Hh = 520;
  c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = 1;
  for (let r = 0; r <= 16; r++) { c.beginPath(); c.moveTo(X, Y + (r / 16) * Hh); c.lineTo(X + Wd, Y + (r / 16) * Hh); c.stroke(); }
  for (let b = 0; b <= 16; b++) { c.beginPath(); c.moveTo(X + (b / 16) * Wd, Y); c.lineTo(X + (b / 16) * Wd, Y + Hh); c.stroke(); }
  const seed = e.name.length * 7 + e.y.length;
  if (e.kind === 'prompt') {
    // a single box and a button
    c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(120, 230, 784, 90);
    c.strokeStyle = hexA(col, 0.8); c.strokeRect(120.5, 230.5, 784, 90);
    c.font = font(F.sc(400), 34); c.fillStyle = 'rgba(238,233,223,0.75)'; c.fillText('一首关于虚拟歌手的、悲伤的歌…', 150, 288);
    c.fillStyle = hexA(col, 1); c.fillRect(380, 370, 264, 76);
    c.font = font(F.sc(700), 38); c.fillStyle = '#0a0a0b'; c.textAlign = 'center'; c.fillText('生成 / Create', 512, 422);
  } else if (e.kind === 'spec') {
    // spectrogram
    for (let x = 0; x < 236; x++) for (let y = 0; y < 64; y++) {
      const v = Math.max(0, noise1(x * 0.08 + y * 0.31, seed + y) * 0.6 + Math.sin(x * 0.12 + y * 0.4) * 0.3 + (y < 12 ? 0.35 : 0) - y / 140);
      if (v <= 0.05) continue;
      c.fillStyle = hexA(col, Math.min(1, v)); c.fillRect(X + x * 4, Y + Hh - (y + 1) * 8, 4, 8);
    }
  } else {
    // notes + pitch curve (hand-drawn early, predicted later)
    let b = 0; const notes: [number, number, number][] = [];
    for (let i = 0; i < 18 && b < 16; i++) { const len = [0.5, 1, 1, 0.75, 1.5][Math.floor(hash(i, seed) * 5)]!; notes.push([b, len, 3 + Math.floor(hash(i, seed + 1) * 10)]); b += len; }
    for (const [nb, nl, p] of notes) { c.fillStyle = hexA(col, 0.85); c.fillRect(X + (nb / 16) * Wd, Y + Hh - ((p + 1) / 16) * Hh, (nl / 16) * Wd - 3, Hh / 16 - 3); }
    c.strokeStyle = e.kind === 'ai' ? hexA(col, 1) : 'rgba(238,233,223,0.9)'; c.lineWidth = e.kind === 'ai' ? 3 : 2; c.beginPath();
    for (let k = 0; k <= 400; k++) {
      const bb = (k / 400) * 16; const n = notes.find((q) => bb < q[0] + q[1]) ?? notes[notes.length - 1]!;
      let p = n[2] + 0.5 + Math.sin(bb * 14) * 0.18 * (e.kind === 'ai' ? 1 : 0.5) + (e.kind === 'growl' ? (hash(k, 3) - 0.5) * 0.6 : 0);
      const prev = notes[notes.indexOf(n) - 1]; if (prev && bb < n[0] + 0.3) p = prev[2] + 0.5 + (p - prev[2] - 0.5) * ((bb - n[0] + 0.3) / 0.6);
      const x = X + (bb / 16) * Wd, y = Y + Hh - (p / 16) * Hh;
      if (k) c.lineTo(x, y); else c.moveTo(x, y);
    }
    c.stroke();
    if (e.kind === 'ai') { c.font = font(F.mono(500), 20); c.fillStyle = hexA(col, 1); c.fillText('AI PITCH · AUTO', X + 10, Y + 28); }
    if (e.kind === 'cevio') { c.font = font(F.mono(500), 20); c.fillStyle = hexA(col, 1); c.fillText('HMM · TALK + SONG', X + 10, Y + 28); }
    if (e.kind === 'growl') { c.font = font(F.mono(500), 20); c.fillStyle = hexA(col, 1); c.fillText('GROWL · XSY', X + 10, Y + 28); }
  }
  if (img) {
    const s = Math.min(300 / img.width, 520 / img.height);
    c.globalAlpha = 0.95; c.drawImage(img, 1024 - img.width * s - 20, 640 - img.height * s - 10, img.width * s, img.height * s); c.globalAlpha = 1;
  }
  return cv;
}

export default class Ch7Era extends Chapter {
  st = new Stage();
  planes: THREE.Mesh[] = [];
  L3 = new LineBatch(20000, { screen2D: false, blend: 'add' });
  v3 = new THREE.Vector3();

  setup() {
    ENGINES.forEach((e, i) => {
      const img = e.img ? this.D.img[e.img] : undefined;
      const tex = new THREE.CanvasTexture(engineCard(e, img)); tex.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1024, 640), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
      const side = i % 2 ? 1 : -1;
      m.position.set(side * 520, (hash(i, 3) - 0.5) * 260, -i * GAP);
      m.rotation.y = -side * 0.42;
      this.st.scene.add(m); this.planes.push(m);
    });
  }

  camZ(beat: number) {
    let k: number;
    if (beat < EB[0]!) k = (beat - EB[0]!) / 0.83;
    else { let i = 0; while (i < EB.length - 2 && beat >= EB[i + 1]!) i++; k = i + clamp((beat - EB[i]!) / (EB[i + 1]! - EB[i]!), 0, 1.4); }
    return 900 - k * GAP;
  }

  frame(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const t = f.t, B = (b: number) => this.bt(b), beat = this.ctx.audio.beatAt(t);
    const endB = EB[EB.length - 1]!;     // last engine (b319.3)
    const outro = prog(t, B(endB + 0.6), B(endB + 1.6), ease.inOutCubic);
    let idx = 0; while (idx < ENGINES.length - 1 && beat >= EB[idx + 1]! - 0.6) idx++;
    const titleA = Math.min(prog(t, B(309.4), B(309.8)), 1 - prog(t, B(311.8), B(312.1)));
    this.ov.clockOverride = ENGINES[idx]!.y.slice(0, 4);

    this.resetBg();
    this.setBg({ base: [0.003, 0.003, 0.005], glowC: LIN.miku, glowA: 0.05, glowR: 900, grid: 0.25, vign: 0.55 });
    this.bg.render(renderer, out);

    // ---- the corridor ----
    const cz = this.camZ(Math.min(beat, endB + 0.4)) - outro * 1600;
    const sway = Math.sin(t * 0.7) * 120;
    this.st.lookAt(sway, 40 + Math.sin(t * 0.5) * 40, cz, sway * 0.2, 0, cz - 2000, Math.sin(t * 0.4) * 0.05);
    this.planes.forEach((m, i) => {
      const d = cz - m.position.z;
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = clamp((7000 - d) / 2000) * clamp(d / 300) * (1 - outro * 0.9) * (1 - titleA * 0.78);   // the corridor steps back for the title
      m.visible = mat.opacity > 0.01;
      void i;
    });
    // rails of light along the corridor
    const L3 = this.L3; L3.clear();
    for (const sx of [-1100, 1100]) for (const sy of [-420, 420]) {
      const col = mul(LIN.miku, 0.9);
      L3.seg(sx, sy, cz + 400, sx, sy, cz - 12000, 1.2, col[0], col[1], col[2], 0.5);
    }
    for (let i = 0; i < 160; i++) { // dust of notes streaming past
      const z = cz - ((hash(i, 1) * 9000 + t * 2200) % 9000);
      const x = (hash(i, 2) - 0.5) * 3600, y = (hash(i, 3) - 0.5) * 1600;
      const c = mul(i % 3 ? LIN.mikuHi : LIN.luka, 2.5);
      L3.seg(x, y, z, x, y, z - 60, 3, c[0], c[1], c[2], 0.6);
    }
    L3.render(renderer, out, this.st.cam);
    this.st.render(renderer, out);
    // the heartbeat runs on into the corridor, and then evolves with the technology, each stage landing on its engine:
    //   心跳 (ECG) → 音高线 (新的时代, NEUTRINO) → 神经网络 (NEUTRINO → NT) → AI 声库 (SynthV AI / 可不 / 洛天依 AI / V6)
    //   → 扩散模型 (DiffSinger: the line is noised, then denoised step by step) → gone before 告死鸟
    const mo = ease.inOutCubic(prog(t, B(309.6), B(311.6)));                 // ECG → pitch line
    const nk = ease.inOutCubic(prog(t, B(312.0), B(312.9)));                 // → neural network
    const vk = ease.inOutCubic(prog(t, B(314.4), B(315.1)));                 // → AI voicebank (the net folds into a voice)
    const nA = nk * (1 - vk);
    const sigma = beat < 317.15 ? ease.inCubic(prog(beat, 316.55, 317.15))  // → diffusion: noise in …
      : 1 - Math.min(1, Math.floor(((beat - 317.15) / 0.78) * 6 + 1e-6) / 6 + ease.outCubic(clamp((((beat - 317.15) / 0.78) * 6) % 1 / 0.35)) / 6);   // … denoised in 6 steps
    const dk = prog(beat, 316.55, 316.95);                                    // diffusion stage is on
    const ecgA = 1 - prog(t, B(318.8), B(319.3));
    if (ecgA > 0) {
      const L = this.L; L.clear();
      const y0 = lerp(760, 830, ease.inOutCubic(prog(t, B(308.8), B(309.6)))), N = 480, span = 6, x0 = 80, xw = W - 160;
      const xOf = (bb: number) => x0 + ((bb - (beat - span)) / span) * xw;
      const PH = 0.12;                                                     // where a heartbeat's spike sits in its beat
      const lvl = (n: number) => [0.0, 1.1, 0.5, 1.7, 1.1, 0.0, -0.7, 0.5, 1.4][((n % 9) + 9) % 9]!;
      const pitch = (bb: number) => {
        const n = Math.floor(bb - PH + 0.05), f = bb - PH + 0.05 - n;
        const glide = clamp(f / 0.16), sm = glide * glide * (3 - 2 * glide);
        const over = Math.sin(Math.PI * glide) * 0.12 * Math.sign(lvl(n) - lvl(n - 1));
        const vib = f > 0.45 ? Math.sin(bb * Math.PI * 2 * 2.6) * 0.09 * clamp((f - 0.45) / 0.25) : 0;
        return lerp(lvl(n - 1), lvl(n), sm) + over + vib;
      };
      const ecg = (bb: number) => {
        const d = (bb - Math.floor(bb)) * 6;
        return d < 0.4 ? -d * 2.5 : d < 0.9 ? -1 + (d - 0.4) * 6 : d < 1.4 ? 2 - (d - 0.9) * 5 : d < 2.5 ? -0.5 + (d - 1.4) * 0.45 : 0;
      };
      const yOn = (bb: number) => y0 - lerp(ecg(bb), pitch(bb), mo) * 70;
      // colour of the line: miku (heart) → NEUTRINO green → the voicebank being passed → DiffSinger red
      const engCol = hexToLinear(ENGINES[idx]!.col) as RGB;
      const mixc = (a: RGB, b: RGB, k: number): RGB => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
      const lineCol = mixc(mixc(mixc(LIN.miku, LIN.gumi, mo), engCol, vk), hexToLinear('#E0473F') as RGB, dk);
      const pcol = mixc(LIN.gumi, lineCol, Math.max(vk, dk));
      // the notes the line sings: blocks under each held pitch (fade as the voice takes over)
      const blockA = clamp((mo - 0.3) / 0.7) * (1 - vk * 0.6) * (1 - dk * 0.7);
      if (blockA > 0) {
        for (let n = Math.floor(beat - span) - 1; n <= Math.floor(beat) + 1; n++) {
          const b0 = n + PH + 0.1, b1 = n + 1 + PH - 0.08;
          if (b0 > beat) continue;
          const xa = Math.max(x0, xOf(b0)), xb = Math.min(xOf(Math.min(b1, beat)), x0 + xw);
          if (xb <= xa) continue;
          const yy = y0 - lvl(n) * 70;
          for (const dy of [-10, 10]) L.seg2(xa, yy + dy, xb, yy + dy, 1.6, mul(pcol, 2.2), blockA * ecgA * 0.95);
          L.seg2(xa, yy - 10, xa, yy + 10, 1.6, mul(pcol, 2.2), blockA * ecgA * 0.95);
          L.seg2(xa, yy, xb, yy, 18, mul(pcol, 0.8), blockA * ecgA * 0.55);
        }
        for (let r = -2; r <= 3; r++) L.seg2(x0, y0 - r * 35, x0 + xw, y0 - r * 35, 1, mul(LIN.miku, 0.25), mo * ecgA * 0.35 * (1 - dk));
      }
      // neural network: two hidden layers above the line, wired into it; signals run left → right
      if (nA > 0.002) {
        const lay = [{ y: y0 - 300, st: 1.0 }, { y: y0 - 200, st: 0.5 }];
        const nodes: { x: number; y: number; bb: number }[][] = lay.map((ly, li) => {
          const a: { x: number; y: number; bb: number }[] = [];
          for (let bb = Math.ceil((beat - span) / ly.st) * ly.st + (li ? 0.25 : 0); bb <= beat; bb += ly.st) {
            const fold = lerp(ly.y, yOn(bb), vk);                          // the net folds down into the voice
            a.push({ x: xOf(bb), y: fold + (hash(Math.round(bb * 4), li) - 0.5) * 30 * (1 - vk), bb });
          }
          return a;
        });
        const outs: { x: number; y: number; bb: number }[] = [];
        for (let bb = Math.ceil((beat - span) * 4) / 4; bb <= beat; bb += 0.25) outs.push({ x: xOf(bb), y: yOn(bb), bb });
        const grow = (x: number) => clamp((nk * (xw + 400) - (x - x0)) / 300);   // wires grow in from the left
        const wire = (A: { x: number; y: number; bb: number }[], Bn: { x: number; y: number; bb: number }[], reach: number, li: number) => {
          for (const a of A) for (const b of Bn) {
            if (Math.abs(a.bb - b.bb) > reach) continue;
            const sig = Math.pow(0.5 + 0.5 * Math.sin((a.bb + b.bb) * 3.1 - beat * 9 + hash(Math.round(a.bb * 4), Math.round(b.bb * 4), li) * 6), 6);
            const g = grow(b.x);
            if (g <= 0) continue;
            L.seg2(a.x, a.y, lerp(a.x, b.x, g), lerp(a.y, b.y, g), 1, mul(lineCol, 0.7 + sig * 3), nA * ecgA * (0.16 + sig * 0.5));
          }
        };
        wire(nodes[0]!, nodes[1]!, 0.8, 0); wire(nodes[1]!, outs, 0.4, 1);
        for (const ly of nodes) for (const p of ly) { const g = grow(p.x); if (g > 0) L.seg2(p.x - 4, p.y, p.x + 4, p.y, 8, mul(lineCol, 2.2), nA * ecgA * g); }
      }
      // AI voicebank: the sung line now carries a voice — a waveform whose envelope follows each note
      const wA = vk * (1 - dk * 0.85);
      if (wA > 0.002) {
        for (let k = 0; k <= N; k += 2) {
          const u = k / N, x = x0 + u * xw, bb = beat - span + u * span;
          const f = bb - PH + 0.05 - Math.floor(bb - PH + 0.05);
          const env = clamp(f / 0.08) * (1 - clamp((f - 0.78) / 0.2)) * (0.55 + 0.45 * Math.abs(Math.sin(bb * 37 + Math.sin(bb * 11) * 2)));
          const a = env * (16 + 22 * u) * (0.6 + 0.4 * hash(k, Math.floor(bb * 4)));
          const y = yOn(bb);
          L.seg2(x, y - a, x, y + a, 1.4, mul(lineCol, 1.3 + u), wA * ecgA * (0.25 + 0.6 * u));
        }
      }
      // the line itself (or, while diffusing, a cloud of noisy samples settling back onto it)
      const step = beat < 317.15 ? Math.floor(beat * 6) : 1000 + Math.floor(((beat - 317.15) / 0.78) * 6);
      let px = 0, py = 0;
      for (let k = 0; k <= N; k++) {
        const u = k / N, x = x0 + u * xw;
        const bb = beat - span + u * span;
        const y = yOn(bb);
        const head = Math.exp(-Math.pow((u - 1) * 30, 2));
        const col = mixc(lineCol, LIN.bone, head * 0.3);
        if (sigma > 0.02) {
          const nx = x + (hash(k, step, 7) - 0.5) * 60 * sigma, ny = y + (hash(k, step, 8) - 0.5) * 260 * sigma;
          L.seg2(nx - 2, ny, nx + 2, ny, 4, mul(col, 2.4), ecgA * dk * (0.35 + 0.5 * u));
        }
        if (k) L.seg2(px, py, x, y, 2 + head * 2 + mo * 1.5, mul(col, 1.6 + head * 4), ecgA * (0.4 + 0.6 * u) * (1 - Math.min(1, sigma * 1.4) * dk));
        px = x; py = y;
      }
      L.render(renderer, out);
    }
    const chainA = Math.min(prog(t, B(310.8), B(311.4)), 1 - prog(t, B(318.8), B(319.3)));

    // ---- 2D ----
    const T = this.T; T.clear();
    const c = T.ctx;
    // the event stream (right): fast, dense, the whole decade
    {
      const sp = 26 * (1 + outro * 2);                         // lines per second… roughly
      const off = (t - B(304)) * sp;
      c.save();
      c.font = font(F.mono(500), 15);
      for (let k = -2; k < 34; k++) {
        const j = Math.floor(off) + k;
        if (j < 0) continue;
        const s = STREAM[j % STREAM.length]!;
        const y = H - 40 - (k - (off % 1)) * 30;
        if (y < 60 || y > H - 20) continue;
        const fresh = k > 26;
        c.globalAlpha = (0.25 + (fresh ? 0.5 : 0.25) * (1 - outro * 0.6)) * (1 - titleA * 0.75);
        c.fillStyle = s.includes('ヒトリエ') ? rgba('bone', 1) : s.startsWith('20') ? rgba('miku', 1) : rgba('ash', 1);
        c.textAlign = 'right'; c.fillText(s, W - 60, y);
      }
      c.restore();
      label(c, 'EVENTS · 2011 — 2026', W - 60, 50, { align: 'right', color: rgba('ash', 1), size: 12, alpha: 1 - outro });
    }
    // the engine being passed: big name + year, left
    if (outro < 1) {
      const e = ENGINES[idx]!;
      const lt = beat - (EB[idx]! - 0.6);
      const k = ease.outExpo(clamp(lt / 0.25));
      c.save(); c.globalAlpha = (1 - outro) * clamp(lt / 0.12) * (1 - titleA);
      label(c, e.y, 96, 150, { color: e.col, size: 18, spacing: 6 });
      c.font = font(F.archivo(112, 900), 86); c.fillStyle = rgba('bone', 1); c.shadowColor = 'rgba(0,0,0,0.85)'; c.shadowBlur = 20;
      c.fillText(e.name, 96 + (1 - k) * 40, 240);
      if (e.sub) { c.font = font(F.sc(700), 28); c.fillStyle = e.col; c.fillText(e.sub, 100, 288); }
      c.restore();
      // progress: the engines so far, as ticks
      for (let i = 0; i < ENGINES.length; i++) {
        c.fillStyle = i <= idx ? hexA(ENGINES[i]!.col, 1) : 'rgba(255,255,255,0.12)';
        c.fillRect(96 + i * 22, 330, 16, 4);
      }
      label(c, 'SINGING SYNTHESIS · 歌声合成', 96, 360, { size: 12, color: rgba('ash', 1), alpha: (1 - outro) * (1 - titleA) });
    }
    // the end of the corridor: 告死鸟, 2026
    const ka = prog(t, B(endB + 1.0), B(endB + 1.6));
    if (ka > 0) {
      c.save(); c.globalAlpha = ka;
      c.fillStyle = 'rgba(4,4,6,0.6)'; c.fillRect(0, 0, W, H);
      drawCover(c, this.cover('kokushi'), W / 2 - 280, 170, 560, 315, { alpha: 0.7 });
      c.textAlign = 'center';
      label(c, '2026.04.20 · 告死鸟 · ilem · 洛天依 AI', W / 2, 560, { align: 'center', color: rgba('luo', 1), size: 16 });
      c.font = font(F.sc(700), 44); c.fillStyle = rgba('bone', 1); c.fillText('"在这个什么梦想都可以一键生成的时代……"', W / 2, 640);
      c.font = font(F.jp(300), 24); c.fillStyle = rgba('ash', 1); c.fillText('「どんな夢でもワンクリックで生成できるこの時代に……」—— ilem（投稿留言 · 日译）', W / 2, 688);
      c.restore();
    }
    // 新的时代: the AI era — lands on the b312 downbeat, over the corridor
    chapterTitle(c, 'denoise', '新的时代', '新しい時代', '06', beat, 309.6, 2.5, { appear: 0.6, overlay: true, size: 210, y: 440 });
    if (chainA > 0) {                                                   // what the line has become, so far
      const CH: [number, string, string][] = [[0, '心跳', '鼓動'], [309.6, '音高线', '音高線'], [312.0, '神经网络', 'ニューラルネット'], [314.4, 'AI 声库', 'AI歌声ライブラリ'], [316.55, '扩散模型', '拡散モデル']];
      let cur = 0; CH.forEach(([b], i) => { if (beat >= b) cur = i; });
      c.save(); c.globalAlpha = chainA;
      let x = 96;
      CH.forEach(([b, zh, ja], i) => {
        if (i > cur) return;
        const k = i === 0 ? 1 : clamp((beat - b) / 0.3);
        c.globalAlpha = chainA * k;
        const on = i === cur;
        c.font = font(F.sc(on ? 700 : 400), on ? 24 : 18); c.fillStyle = on ? rgba('bone', 1) : rgba('ash', 0.85);
        c.fillText(zh, x, 704);
        const zw = c.measureText(zh).width;
        const den = i === 4 && beat >= 317.15 && beat < 318.1 ? `  ·  去噪 ${Math.min(6, Math.floor(((beat - 317.15) / 0.78) * 6) + 1)} / 6` : '';
        c.font = font(F.jp(300), 13); c.fillStyle = on ? rgba('gumi', 1) : rgba('ash', 0.6); c.fillText(ja + den, x, 726);
        const jw = c.measureText(ja).width;
        if (i < cur) { c.font = font(F.mono(400), 16); c.fillStyle = rgba('ash', 0.7); c.fillText('→', x + zw + 8, 702); }
        x += Math.max(zw + 34, jw + 18);
      });
      c.restore();
    }
    if (titleA > 0) label(c, '2020 — · AI 歌声合成 / AI歌声合成', W / 2, 648, { align: 'center', color: rgba('kafu', 1), size: 16, spacing: 6, alpha: titleA });
    comp.draw(renderer, T.upload(), out);

    this.ov.lyricY = H - 60;
    const hit = EB.reduce((m, b) => Math.max(m, pulse(t, B(b), 0.07)), 0) * (outro < 1 ? 1 : 0);
    void frameIdx; void lerp;
    return {
      bloom: 0.55 * (1 - ka * 0.5), grain: 0.065, vignette: 0.5, ca: 1.2 + hit * 4,
      shake: [hit * 6 * (hash(frameIdx(t), 1) - 0.5), hit * 6 * (hash(frameIdx(t), 2) - 0.5)] as [number, number],
      flash: pulse(t, B(304), 0.08) * 0.3 + pulse(t, B(endB + 1.0), 0.1) * 0.25, zoom: 1 + hit * 0.01,
    };
  }
}
