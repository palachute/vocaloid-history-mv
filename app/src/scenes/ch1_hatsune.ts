// CHAPTER 1 · 神的上升 (bars 16–24). The pinprick opens into a ring of light; 初音诞生 rises out
// of the glow (same unhurried breath as 黎明之前 — no slams). Four beats of her portrait in the ring —
// then she steps out of the picture into a body of light (3D). The editor's lanes orbit her; on
// "肝心な感情以外" the hollow 心 from the dawn returns, dashed, over her chest: still undefined.
// Then the internet paints her (Ievan Polkka, みくみく…), 8888 — and the praise turns into insults.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import { LIN, rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { clamp, ease, frameIdx, hash, lerp, prog, pulse } from '../engine/util';
import { Chapter, W, H } from './kit/base';
import { danmaku, drawCover, label } from './kit/draw';
import { drawLanes } from './kit/roll';
import { chapterTitle } from './kit/title';
import { BIRTH } from './kit/birth';
import { mul, ring, spectrumRing } from './kit/lines';
import { PointFigure, Stage } from './kit/three3d';

const D8 = ['8888888', '初音ミク', 'きたああああ', 'wwwww', '8888', '神調教', 'ミク！', '888888888', 'これは流行る', 'はじめまして', '葱', '可愛い', '歌ってみた', '描いてみた', '踊ってみた'];
const PAINT_COLS = ['miku', 'luka', 'rin', 'bone', 'magenta', 'len', 'gumi'] as const;

export default class Ch1Hatsune extends Chapter {
  st = new Stage();
  fig!: PointFigure;
  setup() {
    this.fig = new PointFigure(this.char('miku_v2'), { n: 80000, height: 1000 });
    this.st.scene.add(this.fig.points);
  }

  frame(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const t = f.t, B = (b: number) => this.bt(b);
    const beat = this.ctx.audio.beatAt(t);
    const open = prog(t, B(64), B(64.7), ease.outCubic);          // the pinprick opens into the ring
    const settle = prog(t, B(64), B(64.9), ease.outExpo);
    const step = prog(t, B(70.5), B(73), ease.inOutCubic);     // out of the picture
    const paint = prog(t, B(84), B(92));
    const cx = W / 2, cy = H / 2 - 30;
    const kick = pulse(t, B(Math.floor(beat)), 0.09);
    const ringR = lerp(8, 250, open) + kick * 14 * settle;

    this.resetBg();
    this.setBg({ glowC: LIN.miku, glowA: 0.05 + open * 0.1, glowR: lerp(200, 620, open), glowP: [cx, cy], grid: step * 0.5, vign: 0.45 });
    this.bg.render(renderer, out);
    this.ov.clock = false;

    // ---- the ring ----
    const L = this.L; L.clear();
    for (let k = 0; k < 4; k++) {
      const ts = B(64 + k); if (t < ts) continue;
      const u = (t - ts) / 1.8; if (u > 1) continue;
      ring(L, cx, cy, 30 + ease.outCubic(u) * 900, mul(LIN.miku, 2.5), { width: 2 + 4 * (1 - u), alpha: (1 - u) * (1 - u) * 0.7, seg: 160 });
    }
    const ra = open * (1 - step);
    if (ra > 0) {
      spectrumRing(L, t, cx, cy, ringR + step * 400, LIN.miku, LIN.mikuHi, { alpha: ra * (0.3 + settle * 0.7), kick: f.a.kick, len: 30 + settle * 50 });
      ring(L, cx, cy, ringR + step * 400, mul(LIN.mikuHi, 3), { width: 2, alpha: ra, seg: 240 });
    }
    if (paint > 0) {
      for (let i = 0; i < 220; i++) {
        const born = B(84) + hash(i, 5) * (B(93) - B(84));
        const age = t - born; if (age < 0) continue;
        const k = clamp(age / 0.5);
        const a0 = hash(i, 6) * Math.PI * 2;
        const r = lerp(1300, 60 + hash(i, 7) * 260, ease.outCubic(k));
        const x = cx + Math.cos(a0) * r * 0.8, y = cy + Math.sin(a0) * r;
        const len = 30 + 160 * (1 - k);
        const col = LIN[PAINT_COLS[i % PAINT_COLS.length]!];
        L.seg2(x, y, x + Math.cos(a0) * len, y + Math.sin(a0) * len, 5 + hash(i, 8) * 9, mul(col, 1.2), (k < 1 ? 0.9 : 0.55) * (1 - prog(t, B(94), B(96)) * 0.5));
      }
    }
    L.render(renderer, out);

    // ---- 3D: the body of light ----
    const orbit = lerp(0, 0.55, ease.inOutCubic(prog(t, B(70.5), B(96)))) + Math.sin(t * 0.7) * 0.05;
    const dist = lerp(1900, 2300, step);
    this.st.lookAt(Math.sin(orbit) * dist, 60, Math.cos(orbit) * dist, 0, 20, 0);
    if (step > 0) {
      const u = this.fig.u;
      u.uTime!.value = t; u.uFlat!.value = 1 - step; u.uMorph!.value = 0;
      u.uOpacity!.value = Math.min(1, step * 1.6);
      u.uNoise!.value = 4 + paint * 10; u.uScatter!.value = (1 - step) * 300 + pulse(t, B(78.2), 0.4) * 60;
      u.uSize!.value = 2.3; u.uBright!.value = 1.2 + paint * 0.4;
      u.uTint!.value = 0; u.uPaint!.value = paint * 0.7;
      this.st.render(renderer, out);
    }

    // ---- 2D ----
    const T = this.T; T.clear();
    const c = T.ctx;
    // the date, quietly, as she is born
    const da = prog(t, B(65), B(66.5)) * (1 - prog(t, B(94), B(96)));
    c.save(); c.globalAlpha = da;
    c.font = font(F.archivo(62, 900), 60); c.textAlign = 'right'; c.fillStyle = rgba('bone', 0.95);
    c.fillText('2007.08.31', W - 96, 150);
    c.restore();
    // four beats in the picture
    if (settle > 0 && step < 1) {
      const im = this.char('miku_v2');
      c.save(); c.beginPath(); c.arc(cx, cy, ringR - 6 + step * 400, 0, Math.PI * 2); c.clip();
      drawCover(c, im, cx - ringR, cy - ringR * 0.95, ringR * 2, ringR * 2.6, { fit: 'cover', focusY: 0.02, reveal: prog(t, B(64), B(65.4)), seed: 39, alpha: 1 - step });
      c.restore();
      const nA = prog(t, B(65.6), B(66.8), ease.outCubic) * (1 - step);
      if (nA > 0) {
        c.save(); c.globalAlpha = nA;
        c.font = font(F.jp(900), 88); c.fillStyle = rgba('bone', 1); c.fillText('初音ミク', 96, 300);
        label(c, 'HATSUNE MIKU · CV01 · VOCALOID2', 100, 340, { color: rgba('miku', 1), spacing: 7, size: 16 });
        label(c, 'CRYPTON FUTURE MEDIA', 100, 366, { spacing: 5, size: 13 });
        c.restore();
      }
    }
    // the editor around her: every parameter… and the hollow 心 over her chest
    const lanes = Math.min(prog(t, B(75), B(76.5)), 1 - prog(t, B(84), B(85)));
    if (lanes > 0) {
      label(c, 'VOICE PARAMETERS / 歌声参数', 1240, 300, { color: rgba('miku', 1), size: 14, alpha: lanes });
      drawLanes(c, 1290, 330, 520, t, { heart: 0, alpha: lanes, heartLabel: beat > 78 });
      const hk = prog(t, B(78), B(78.4));
      if (hk > 0) {
        c.save(); c.globalAlpha = lanes * hk;
        c.strokeStyle = rgba('ember', 1); c.lineWidth = 2; c.strokeRect(1240, 588, 600, 44);
        c.restore();
      }
    }
    const hollow = Math.min(prog(t, B(78), B(78.6), ease.outCubic), 1 - prog(t, B(85.5), B(87)));
    if (hollow > 0 && step > 0.5) {
      const p = new THREE.Vector3(-10, 170, 60).project(this.st.cam);
      const x = (p.x * 0.5 + 0.5) * W, y = (-p.y * 0.5 + 0.5) * H;
      const beatK = pulse(t, B(Math.floor(beat)), 0.15);
      c.save(); c.translate(x, y); c.scale(1 + beatK * 0.04, 1 + beatK * 0.04);
      c.globalAlpha = hollow;
      c.font = font(F.jpSerif(), 280); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 10; c.strokeStyle = 'rgba(0,0,0,0.55)'; c.strokeText('心', 0, 0);
      c.setLineDash([12, 9]); c.lineDashOffset = -t * 30; c.lineWidth = 3.5; c.strokeStyle = rgba('ember', 1);
      c.shadowColor = 'rgba(255,80,40,0.9)'; c.shadowBlur = 22;
      c.strokeText('心', 0, 0);
      c.restore();
      label(c, '心 · UNDEFINED', x - 170, y - 150, { align: 'right', color: rgba('ember', 1), size: 13, spacing: 6, alpha: hollow * (frameIdx(t) % 24 < 16 ? 1 : 0.3) });
      c.save(); c.globalAlpha = hollow * prog(t, B(79), B(79.5)); c.strokeStyle = rgba('ember', 0.5); c.lineWidth = 1;
      c.beginPath(); c.moveTo(x - 165, y - 145); c.lineTo(x - 110, y - 100); c.stroke(); c.restore();
    }
    // the canvas: tags of the first derivative works
    const tags: [string, string, number][] = [['ievan', '2007.09 · Ievan Polkka · Otomania', 85], ['mikumiku', '2007.09 · みくみくにしてあげる♪ · ika', 86.5], ['koisuru', '2007 · 恋スルVOC@LOID · OSTER project', 88]];
    tags.forEach(([id, s, b0], i) => {
      const a = Math.min(prog(t, B(b0), B(b0 + 0.2)), 1 - prog(t, B(93), B(95)));
      if (a <= 0) return;
      c.save(); c.globalAlpha = a;
      const y = 250 + i * 150;
      drawCover(c, this.cover(id), 96, y, 120, 120);
      c.fillStyle = rgba('bone', 1); c.fillRect(230, y, 3, 120);
      label(c, s, 248, y + 30, { color: rgba('bone', 0.95), size: 15, spacing: 2 });
      label(c, ['二次创作的起点', '"被大家做成了歌"', '第一批原创曲'][i]!, 248, y + 60, { color: rgba('ash', 1), size: 14, spacing: 1 });
      c.restore();
    });
    if (paint > 0.2) {
      const a = Math.min(prog(t, B(88), B(88.3)), 1 - prog(t, B(94), B(96)));
      if (a > 0) label(c, '描いてみた · 歌ってみた · 踊ってみた · 作ってみた', W - 96, H - 250, { align: 'right', color: rgba('miku', 1), size: 15, alpha: a });
    }
    danmaku(c, t, D8, B(88.5), B(92.5), { n: 34, seed: 7, accent: rgba('miku', 1), speed: 680, rows: [80, 760] });
    // …and the praise turns: the first insults
    danmaku(c, t, ['机械音', '棒読み', 'ロボット声', '只是软件', '人間が歌えよ', '没有感情', 'ただの道具', '这不是音乐'], B(92.5), B(96), { n: 22, seed: 13, color: rgba('ash', 1), speed: 760, rows: [80, 760], size: 42 });
    // 神的上升 — slow, rising out of the glow of her birth
    chapterTitle(c, 'rise', '初音诞生', '初音の誕生', '02', beat, 62.2, 3.8, BIRTH);
    comp.draw(renderer, T.upload(), out);

    if (lanes > 0) this.ov.lyricX = 700;
    const k = f.a.kick * 0.25 + pulse(t, B(78.2), 0.1) * 0.6;
    return {
      flash: pulse(t, B(64), 0.12) * 0.18 + pulse(t, B(70.5), 0.08) * 0.5, bloom: 0.6 + settle * 0.3 + open * 0.2, bloomThreshold: 0.8, halation: 0.3,
      grain: 0.06, vignette: 0.5, ca: 1.2 + k * 6,
      shake: [k * 10 * (hash(frameIdx(t), 1) - 0.5), k * 10 * (hash(frameIdx(t), 2) - 0.5)] as [number, number], zoom: 1 + k * 0.02,
    };
  }
}
