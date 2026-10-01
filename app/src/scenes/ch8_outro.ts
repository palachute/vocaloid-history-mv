// CHAPTER 8 · 尾声 (bar 94 → the end of the song, then a silent tail for the credits).
//  b376–377.6  silence: VOCALOID = ?   (where the drum stopped)
//  b377.6      "君まで届け": the answer. The "?" breaks apart and becomes the grey-then-teal low-poly heart.
//  b380–384    the heart comes toward us and passes through the camera — the screen becomes its colour:
//              这首歌，现在抵达了你。
//  b388–402    the last image: a small heart, beating; 2007.08.31 → ∞.
//  b402 → end  the credits roll (continuing past the end of the music), then black.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import { LIN, rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { clamp, ease, frameIdx, hash, lerp, prog, pulse } from '../engine/util';
import { Chapter, W, H } from './kit/base';
import { label, lyric } from './kit/draw';
import { mix3, mul, voiceLine } from './kit/lines';
import { LineBatch } from '../engine/lines';
import { Stage } from './kit/three3d';
import { drawHeart, makeHeart } from './kit/heart';
import { VQ_FONT } from './ch7_sing';

const ANCHORS = [
  '1961　IBM 7090/7094 · Daisy Bell', '2000　YAMAHA × UPF（代号 Daisy）', '2003　VOCALOID 发表', '2004　LEON · LOLA · MIRIAM · MEIKO', '2006　KAITO',
  '2007　VOCALOID2 · 初音ミク · 鏡音リン・レン', '2008　UTAU', '2009　巡音ルカ · GUMI · Project DIVA', '2010　首场专场「ミクの日感謝祭」', '2011　MIKUNOPOLIS · VOCALOID3',
  '2011　Google Chrome CM · Tell Your World', '2012　洛天依 · 千年食谱颂 · 66CCFF', '2012　米津玄師《diorama》· ヒトリエ', '2013　Piapro Studio · CeVIO · 魔法未来',
  '2014　VOCALOID4 · MIKU EXPO · Late Show', '2015　紅白《千本桜》· 普通DISCO', '2016　超歌舞伎 · BML · 交响乐', '2017　砂の惑星 · アンノウン・マザーグース',
  '2018　VOCALOID5 · Synthesizer V', '2019　wowaka 1987—2019', '2020　NEUTRINO · X Studio · NT · 世界计划', '2021　CeVIO AI · 可不 · 春晚《听我说》',
  '2022　ACE Studio · VOCALOID6 · 冬奥文化节', '2023　神话：ローリンガール · マザーグース', '2024　Suno · Coachella', '2025　SynthV Studio 2 · ACE Studio 2.0', '2026　初音ミク V6 · 告死鸟',
];
const PPU = (H / 2) / (Math.tan((19 * Math.PI) / 180) * 1900);   // screen px per world unit at z = 0

export default class Ch8Outro extends Chapter {
  st = new Stage();
  L3 = new LineBatch(12000, { screen2D: false, blend: 'add' });
  heart = makeHeart(1, 14, 9);
  P = this.heart.verts.map((v) => v.clone());

  frame(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp, audio } = this.ctx;
    const t = f.t, B = (b: number) => this.bt(b), beat = audio.beatAt(t);
    const end = this.ctx.end, songEnd = (audio as unknown as { songDuration: number }).songDuration ?? end;
    const answer = prog(t, B(377.6), B(379.2), ease.outCubic);
    const come = prog(t, B(380.2), B(384), ease.inCubic);
    const arrive = prog(t, B(384), B(385));
    const rollT0 = B(402), rollT1 = end - 1.6;
    const fadeOut = prog(t, end - 1.4, end - 0.05);
    const last = prog(t, B(388), B(389.5));

    this.resetBg();
    this.setBg({ base: [0.002, 0.002, 0.0025], vign: 0.55, noiseA: 0.3, glowC: LIN.miku, glowA: answer * 0.05 * (1 - come) + last * 0.05 * (1 - prog(t, rollT0, rollT0 + 2) * 0.6), glowR: 500 });
    this.bg.render(renderer, out);
    this.ov.clock = false; this.ov.captions = false;
    this.ov.lyricBig.add(41);
    this.ov.lyrics = false;   // the last line is drawn below, held until the arrival text leaves

    // layout of "VOCALOID = ?" — identical to where the drum stopped
    const T = this.T; T.clear();
    const c = T.ctx;
    c.font = font(F.jp(900), VQ_FONT);
    const full = c.measureText('VOCALOID = ?').width, qW = c.measureText('?').width;
    const qx = W / 2 + full / 2 - qW / 2, cy = H / 2 - 10;

    // ---- the heart (3D) ----
    const L3 = this.L3; L3.clear();
    let hScale = 0, hx = 0, hy = 0, beatP = 0;
    if (beat >= 377.4 && arrive < 1) {
      const sx = lerp(qx, W / 2, ease.inOutCubic(prog(t, B(379.4), B(381)))), sy = cy;
      hx = (sx - W / 2) / PPU; hy = -(sy - H / 2) / PPU;
      hScale = lerp(0, 62, answer) * (1 + ease.inExpo(come) * 40);
    } else if (last > 0) {
      hScale = 60 * last; hx = 0; hy = 40 / PPU;
      beatP = pulse(t, B(Math.floor(beat)), 0.35) * (t < songEnd ? 1 : 0.4);
    }
    if (hScale > 0.5) {
      const spin = Math.sin(t * 0.6) * 0.5 + (1 - answer) * 2;
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), spin);
      const s = hScale * (1 + beatP * 0.1);
      this.heart.verts.forEach((v, i) => this.P[i]!.copy(v).multiplyScalar(s).applyQuaternion(q).add(new THREE.Vector3(hx, hy - s * 0.12, 0)));
      const col = mix3(mul(LIN.ash, 1.2), mul(LIN.miku, 2.4), clamp(answer * 1.4 - 0.2)) as [number, number, number];
      const a = (1 - fadeOut) * (rollT0 < t ? 1 - prog(t, rollT0, rollT0 + 1.5) * 0.85 : 1) * (last > 0 && come >= 1 ? 0.75 : 1);
      const small = hScale < 120 ? 0.45 : 1;
      drawHeart(L3, this.P, this.heart.edges, mul(col, (1 + beatP * 1.2) * small), { width: (1.4 + beatP * 1.2) * (small < 1 ? 0.7 : 1) + come * 2, alpha: a, k: Math.min(1, answer * 1.3 + last) });
      if (small === 1) for (const p of this.P) L3.seg(p.x, p.y, p.z, p.x + 0.5, p.y, p.z, 3 + beatP * 1.5, col[0] * 0.8, col[1] * 0.8, col[2] * 0.8, a * 0.7);
    }
    this.st.lookAt(0, 0, 1900, 0, 0, 0);
    L3.render(renderer, out, this.st.cam);

    const L = this.L; L.clear();
    if (last > 0) voiceLine(L, t, { x0: W * 0.2, x1: W * 0.8, y: H / 2 + 190, amp: 6 + pulse(t, B(Math.floor(beat)), 0.3) * 10 * (t < songEnd ? 1 : 0), color: mul(LIN.bone, 1.1), width: 1.4, alpha: last * 0.6 * (1 - prog(t, rollT0, rollT0 + 1.5)) * (1 - fadeOut), freq: 3, speed: 1.2, seed: 1 });
    L.render(renderer, out);

    // ---- 2D ----
    // VOCALOID = ?  → VOCALOID = (heart)
    if (beat < 381.2) {
      const qa = 1 - answer;
      const ta = 1 - prog(t, B(379.6), B(381));
      c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = font(F.jp(900), VQ_FONT);
      c.fillStyle = rgba('bone', 1); c.globalAlpha = ta;
      c.fillText('VOCALOID = ', W / 2 - qW / 2, cy);
      // the "?" breaks apart into its strokes and falls away
      if (qa > 0) {
        for (let k = 0; k < 6; k++) {
          c.save();
          c.beginPath(); c.rect(qx - qW, cy - 70 + k * 24, qW * 2, 24); c.clip();
          c.globalAlpha = qa * ta;
          c.fillStyle = rgba('miku', 1);
          c.fillText('?', qx + (hash(k, 3) - 0.5) * 120 * answer, cy + answer * (30 + hash(k, 4) * 80));
          c.restore();
        }
      }
      c.restore();
    }
    if (arrive > 0 && t < B(388.6)) {
      const a = Math.min(arrive, 1 - prog(t, B(387.6), B(388.6)));
      c.save(); c.globalAlpha = a;
      c.fillStyle = `rgba(57,197,187,${(1 - prog(t, B(384), B(385.6))) * 0.9})`; c.fillRect(0, 0, W, H);
      c.textAlign = 'center';
      c.font = font(F.scSerif(), 88); c.fillStyle = rgba('bone', 1); c.fillText('这首歌，现在抵达了你。', W / 2, H / 2 + 10);
      c.font = font(F.jp(300), 32); c.fillStyle = rgba('ash', 1); c.fillText('この歌は、いま、あなたに届いた。', W / 2, H / 2 + 70);
      c.restore();
    }
    // the last image
    if (last > 0) {
      const a = last * (1 - prog(t, rollT0, rollT0 + 1.2)) * (1 - fadeOut);
      c.save(); c.globalAlpha = a; c.textAlign = 'center';
      c.font = font(F.archivo(62, 900), 84); c.fillStyle = rgba('bone', 0.95); c.fillText('2007.08.31  →  ∞', W / 2, H / 2 + 300);
      c.restore();
      label(c, 'それでも僕は歌わなくちゃ', W / 2, H / 2 + 350, { align: 'center', color: rgba('miku', 1), size: 16, spacing: 10, alpha: a });
      label(c, '即便如此，我也不能不歌唱', W / 2, H / 2 + 380, { align: 'center', size: 14, spacing: 8, alpha: a });
    }
    // credits: three columns, rolling past the end of the music
    if (t > rollT0 && t < rollT1 + 0.4) {
      const songs = [...this.D.songs].sort((a, b) => a.year - b.year);
      const colW = 560, x0 = W / 2 - colW * 1.5 + 20;
      const lh = 36;
      const half = Math.ceil(songs.length / 2);
      const cols: string[][] = [['# 出现曲目 / 登場楽曲'], [''], []];
      songs.forEach((s, i) => cols[i < half ? 0 : 1]!.push(`${s.year}　${s.title} — ${s.p}`));
      cols[2]!.push('# 历史 / 年表', ...ANCHORS, '', '# 曲 / 楽曲', 'それでも僕は歌わなくちゃ — Neru', '', '# 提及 / 言及', 'diorama — 米津玄師（2012, 专辑）', '', '# 讲稿 / 原案', '现世妍术组', '', '# 制作 / 制作', '帕拉褚特 && claude opus 5.5', '',
        '# 资料 / 資料', 'VocaDB · ニコニコ大百科 · 萌娘百科 · Wikipedia', 'niconico · bilibili 投稿说明', '', '感谢所有 P 主、声库厂商，与每一位听众', 'すべてのボカロP、声の作り手、そしてあなたへ');
      const total = Math.max(...cols.map((x) => x.length)) * lh;
      const y0 = H + 10 - ((t - rollT0) / (rollT1 - rollT0)) * (total + H * 0.55);
      c.textAlign = 'left';
      cols.forEach((col, ci) => col.forEach((s, i) => {
        const y = y0 + i * lh;
        if (y < -40 || y > H + 40 || !s) return;
        c.globalAlpha = clamp(Math.min(y - 40, H - 40 - y) / 120) * (1 - fadeOut);
        const head = s.startsWith('#');
        c.font = head ? font(F.mono(500), 15) : s.includes('&&') || s === '现世妍术组' ? font(F.sc(700), 30) : font(F.jp(300), 19);
        c.fillStyle = head ? rgba('miku', 1) : rgba('bone', 0.88);
        c.fillText(head ? s.slice(2) : s, x0 + ci * colW, y);
      }));
      c.globalAlpha = 1;
    }
    if (t > rollT1 - 0.5) {
      const a = prog(t, rollT1 - 0.5, rollT1 + 0.3) * (1 - fadeOut);
      label(c, '现世妍术组 · 帕拉褚特 && claude opus 5.5', W / 2, H / 2 + 6, { align: 'center', size: 16, color: rgba('bone', 0.9), alpha: a, spacing: 6 });
    }
    const ln = this.D.lyrics[40];
    if (ln && t < B(388.8)) lyric(c, { ...ln, end: B(388.3) }, t, { big: true });
    comp.draw(renderer, T.upload(), out);
    void frameIdx;
    return { bloom: (last > 0 && arrive >= 1 ? 0.3 : 0.5) + come * 0.4 + beatP * 0.1, grain: 0.05, vignette: 0.5, fade: fadeOut, flash: pulse(t, B(384), 0.1) * 0.6 + pulse(t, B(377.6), 0.1) * 0.25, zoom: 1 + ease.inExpo(come) * 0.05 };
  }
}
