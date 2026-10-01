// CHAPTER 6 · wowaka (bars 69–78).
//  b276–283  "始まり": 2017.08.22 — "おひさしぶりです、wowakaです。" His first VOCALOID song in six
//            years, アンノウン・マザーグース; its cover is a grey low-poly heart — it turns in the dark.
//  b283–295  "終わり": the heart stops. One grey line walks across and stops. 2019.04.05.
//            「生きて、また会おう」. (kept from v2 — the beat of this passage is untouched)
//  b296–309  chorus 2, first refrain: his heart stopped — the songs did not. The play counters climb
//            to 10,000,000 (神话) one after another; each one is a heartbeat on the ECG, and the grey
//            heart starts beating again, lit from inside.
//  b309–312  新的时代 (denoise), cut on the downbeat.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import { LIN, rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { clamp, ease, frameIdx, hash, lerp, prog, pulse } from '../engine/util';
import { Chapter, W, H } from './kit/base';
import { drawCover, label } from './kit/draw';
import { chapterTitle } from './kit/title';
import { LineBatch } from '../engine/lines';
import { Stage } from './kit/three3d';
import { drawHeart, makeHeart } from './kit/heart';
import { mix3, mul, voiceLine } from './kit/lines';

const COUNTERS: [string, string, number, number, string][] = [
  ['ワールズエンド・ダンスホール', '2019.04 · 一周之内 → 神话', 9_000_000, 10_000_000, 'worldsend'],
  ['ローリンガール', '2023.02 · 神话', 6_000_000, 10_000_000, 'rolling'],
  ['アンノウン・マザーグース', '2023.04 · 神话', 3_000_000, 10_000_000, 'mothergoose'],
  ['裏表ラバーズ', '2023.08 · 神话', 7_000_000, 10_000_000, 'uraomote'],
];
const C0 = 296.05, CSTEP = 1.2, CRISE = 2.0;
const TITLE_LINES = [32, 33];

export default class Ch6Wowaka extends Chapter {
  st = new Stage();
  L3 = new LineBatch(20000, { screen2D: false, blend: 'add' });
  heart = makeHeart(330, 14, 9);
  P = this.heart.verts.map((v) => v.clone());

  frame(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const t = f.t, B = (b: number) => this.bt(b), beat = this.ctx.audio.beatAt(t);
    const ret = beat < 283;
    const dead = beat >= 283 && beat < 296;
    const ch = beat >= 296;
    const quiet = prog(t, B(283), B(284));
    const relight = prog(t, B(C0 + CRISE), B(301.8), ease.inOutCubic);
    const morph = prog(t, B(276), B(278.4), ease.inOutCubic);   // the sand planet (a grey sphere) becomes the heart
    for (const n of TITLE_LINES) this.ov.lyricHide.add(n);

    this.resetBg();
    this.setBg({ base: [0.004, 0.004, 0.005], glowC: ch ? LIN.miku : LIN.ash, glowA: ret ? 0.04 : ch ? 0.02 + relight * 0.1 : 0.01, glowR: 600, glowP: [960, 470], vign: 0.55 + (dead ? 0.15 : 0), noiseA: 0.5 });
    this.bg.render(renderer, out);
    this.ov.clockOverride = beat < 283 ? '2017' : beat < 296 ? '2019' : String(Math.min(2023, 2019 + Math.floor(prog(t, B(C0), B(C0 + 3 * CSTEP + CRISE)) * 4.99)));

    // ---- heartbeats: each counter reaching 10,000,000 is one beat; then every beat ----
    const milestones = COUNTERS.map((_, i) => C0 + i * CSTEP + CRISE);
    let beatP = 0;
    if (ch) {
      for (const m of milestones) beatP = Math.max(beatP, pulse(t, B(m), 0.35));
      if (beat > milestones[3]! + 0.5) beatP = Math.max(beatP, pulse(t, B(Math.floor(beat)), 0.3));
    }

    // ---- the heart (3D) ----
    const appear = 1;
    const spin = ret ? t * 0.35 : dead ? B(283) * 0.35 + ease.outCubic(prog(t, B(283), B(284.5))) * 0.15 : B(283) * 0.35 + 0.15 + Math.sin((t - B(296)) * 0.6) * 0.35 * relight;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), spin);
    const s = 1 + beatP * 0.08;
    this.heart.verts.forEach((v, i) => { const sph = v.clone().setY(v.y - 40).normalize().multiplyScalar(218); this.P[i]!.copy(sph.lerp(v, morph)).multiplyScalar(s).applyQuaternion(q); });
    const L3 = this.L3; L3.clear();
    const hx = dead ? 470 : ret ? lerp(0, 380, prog(t, B(277.6), B(279.2), ease.inOutCubic)) : 380, hy = ret ? lerp(0, 60, morph) : dead ? 170 : 60;
    this.P.forEach((p) => { p.x += hx; p.y += hy; });
    const grey = ret ? mix3(mul(LIN.sand, 1.6), mul(LIN.ash, 1.1), morph) : mul(LIN.ash, 1.1);
    const lit = mix3(grey, mul(LIN.miku, 1.5), relight);
    const hA = (ret ? appear : dead ? lerp(1, 0.16, prog(t, B(284), B(290))) : lerp(0.25, 1, prog(t, B(C0), B(C0 + 2)))) * 1;
    if (hA > 0.01) {
      drawHeart(L3, this.P, this.heart.edges, ch ? mul(lit, 1 + beatP * 0.7) : grey, { width: 1.4 + beatP * 1.0, alpha: hA, k: 1 });
      // vertices as small knots
      for (const p of this.P) L3.seg(p.x, p.y, p.z, p.x + 0.5, p.y, p.z, 5, (ch ? lit : grey)[0] * 1.5, (ch ? lit : grey)[1] * 1.5, (ch ? lit : grey)[2] * 1.5, hA * 0.8);
    }
    { const m = ret ? morph : 1; this.st.lookAt(0, 120 * m, 1900, 0, 80 * m, 0); }
    L3.render(renderer, out, this.st.cam);

    // ---- lines (2D): the walking line; the ECG ----
    const L = this.L; L.clear();
    if (dead) {
      const walk = prog(t, B(284), B(292));
      const x1 = lerp(200, 1500, walk);
      voiceLine(L, t, { x0: 200, x1, y: 560, amp: 26 * (1 - prog(t, B(291), B(292.5))), color: mul(LIN.bone, 0.9), width: 2, alpha: 0.9, freq: 6, seed: 87, speed: 3, env: false });
    }
    if (ch) {
      // ECG: flat… then a beat at each milestone, then steady
      const y0 = 760, N = 480, span = 6; // beats visible across the screen
      let px = 0, py = 0;
      for (let k = 0; k <= N; k++) {
        const u = k / N, x = 80 + u * (W - 160);
        const bb = beat - span + u * span; // beat at this x (scrolling)
        let v = 0;
        const spike = (b0: number) => { const d = (bb - b0) * 6; return d > -1 && d < 2.5 ? (d < 0 ? 0 : d < 0.4 ? -d * 2.5 : d < 0.9 ? -1 + (d - 0.4) * 6 : d < 1.4 ? 2 - (d - 0.9) * 5 : -0.5 + (d - 1.4) * 0.45) : 0; };
        for (const m of milestones) v += spike(m);
        if (bb > milestones[3]! + 0.5) v += spike(Math.floor(bb));
        const y = y0 - v * 70;
        const head = Math.exp(-Math.pow((u - 1) * 30, 2));
        if (k) L.seg2(px, py, x, y, 2 + head * 2, mul(relight > 0 ? LIN.miku : LIN.bone, 1.4 + head * 4 + relight), 0.4 + 0.6 * u);
        px = x; py = y;
      }
    }
    L.render(renderer, out);

    // ---- 2D ----
    const T = this.T; T.clear();
    const c = T.ctx;
    if (ret) {
      // the beginning: 2009, his first VOCALOID song
      const b1 = Math.min(prog(t, B(276.3), B(276.7)), 1 - prog(t, B(279.1), B(279.5)));
      if (b1 > 0) {
        c.save(); c.globalAlpha = b1;
        label(c, '2009.05 · wowaka · 最初の一曲 / 第一首', 96, 170, { color: rgba('bone', 0.9), size: 15 });
        c.font = font(F.jp(900), 76); c.fillStyle = rgba('bone', 1); c.fillText('グレーゾーンにて。', 96, 262);
        c.font = font(F.sc(400), 24); c.fillStyle = rgba('ash', 1); c.fillText('一个人，一台电脑，一个虚拟歌手。', 100, 310);
        c.font = font(F.jp(300), 20); c.fillText('一人と、一台のパソコンと、一人の歌姫から。', 100, 344);
        drawCover(c, this.cover('grayzone'), 100, 372, 256, 192);
        c.restore();
      }
      const a = Math.min(prog(t, B(279.4), B(279.8)), 1 - prog(t, B(282.4), B(283)));
      const msg = 'おひさしぶりです、wowakaです。';
      const n = Math.floor(Array.from(msg).length * prog(t, B(279.8), B(281.2)));
      if (a > 0) {
        c.save(); c.globalAlpha = a;
        c.fillStyle = 'rgba(10,10,11,0.85)'; c.fillRect(96, 140, 760, 250);
        c.strokeStyle = rgba('bone', 0.4); c.strokeRect(96.5, 140.5, 760, 250);
        label(c, 'UPLOAD · 2017.08.22 · 初音ミク 10th', 120, 172, { size: 13, color: rgba('ash', 1) });
        c.font = font(F.jp(900), 42); c.fillStyle = rgba('bone', 1);
        c.fillText(Array.from(msg).slice(0, n).join('') + (frameIdx(t) % 30 < 15 ? '│' : ''), 120, 244);
        c.font = font(F.sc(400), 22); c.fillStyle = rgba('ash', 1); c.fillText('"好久不见，我是 wowaka。"', 120, 288);
        const ck = prog(t, B(281.2), B(281.6));
        if (ck > 0) {
          c.globalAlpha = a * ck;
          drawCover(c, this.cover('mothergoose'), 120, 308, 110, 62);
          label(c, 'アンノウン・マザーグース', 248, 330, { color: rgba('bone', 1), size: 16 });
          label(c, '时隔六年的 VOCALOID 新曲 / 6年ぶりのボカロ曲', 248, 356, { size: 13 });
        }
        c.restore();
      }
    }
    if (dead) {
      const a1 = prog(t, B(284), B(285));
      c.save(); c.globalAlpha = a1;
      drawCover(c, this.cover('worldsend'), 200, 640, 120, 120, { mono: 1, alpha: 0.9 });
      label(c, 'wowaka · 1987 — 2019', 340, 680, { color: rgba('bone', 1), size: 16, spacing: 6 });
      label(c, 'ヒトリエ · 裏表ラバーズ · ワールズエンド・ダンスホール · ローリンガール · アンノウン・マザーグース', 340, 710, { size: 12 });
      c.restore();
      const a2 = prog(t, B(286), B(287));
      if (a2 > 0) { c.save(); c.globalAlpha = a2; c.font = font(F.scSerif(), 64); c.fillStyle = rgba('bone', 1); c.fillText('2019 年 4 月 5 日，wowaka 离开了。', 200, 340); c.font = font(F.jp(300), 26); c.fillStyle = rgba('ash', 1); c.fillText('2019年4月5日、wowakaはこの世を去った。31歳。', 204, 390); c.restore(); }
      const a3 = prog(t, B(289), B(290));
      if (a3 > 0) { c.save(); c.globalAlpha = a3; c.font = font(F.jp(900), 54); c.fillStyle = rgba('bone', 1); c.fillText('「生きて、また会おう」', 200, 880); c.font = font(F.sc(400), 26); c.fillStyle = rgba('ash', 1); c.fillText('"活下去，我们再见。" —— wowaka', 204, 926); c.restore(); }
    }
    if (ch) {
      const a = Math.min(prog(t, B(296), B(296.2)), 1 - prog(t, B(303.3), B(304)));
      c.save(); c.globalAlpha = a;
      c.font = font(F.scSerif(), 64); c.fillStyle = rgba('bone', 1); c.fillText('他的心停了。', 96, 170);
      c.globalAlpha = a * prog(t, B(298), B(298.3)); c.fillText('歌没有停。', 96, 246);
      c.font = font(F.jp(300), 24); c.fillStyle = rgba('ash', 1); c.fillText('彼の心臓は止まった。歌は止まらなかった。', 100, 290);
      COUNTERS.forEach(([title, note, v0, v1], i) => {
        const b0 = C0 + i * CSTEP;
        const k = prog(t, B(b0), B(b0 + CRISE), ease.inOutCubic);
        const v = Math.floor(lerp(v0, v1, k));
        const yy = 360 + i * 76;
        c.globalAlpha = a * prog(t, B(b0), B(b0 + 0.3));
        if (c.globalAlpha <= 0) return;
        drawCover(c, this.cover(COUNTERS[i]![4]), 96, yy - 4, 56, 56, { mono: k >= 1 ? 0 : 0.8 });
        c.font = font(F.archivo(62, 900), 50); c.fillStyle = k >= 1 ? rgba('miku', 1) : rgba('bone', 1);
        c.fillText(v.toLocaleString('en-US'), 170, yy + 44);
        c.font = font(F.jp(900), 20); c.fillStyle = rgba('bone', 1); c.fillText(title, 500, yy + 20);
        label(c, note, 500, yy + 46, { color: k >= 1 ? rgba('miku', 1) : rgba('ash', 1), size: 12 });
      });
      c.restore();
      label(c, 'ECG · 心拍', 96, 700, { color: rgba(relight > 0 ? 'miku' : 'ash', 1), size: 13, alpha: a });
    }
    // the title lines, big, under the heart
    TITLE_LINES.forEach((n) => {
      const ln = this.D.lyrics[n - 1]; if (!ln) return;
      const next = this.D.lyrics[n]?.start ?? ln.start + 4;
      const t0 = Math.max(ln.start, this.ctx.start, B(296)), t1 = Math.min(next - 0.1, B(304));
      if (t < t0 - 0.02 || t > t1) return;
      const a = Math.min(clamp((t - t0) / 0.15), clamp((t1 - t) / 0.2));
      const chars = Array.from(ln.text);
      c.save(); c.globalAlpha = a; c.textAlign = 'left';
      c.font = font(F.jpSerif(), 84);
      const full = c.measureText(ln.text).width;
      let x = W / 2 - full / 2;
      const y = 960;
      c.shadowColor = 'rgba(0,0,0,0.85)'; c.shadowBlur = 26;
      chars.forEach((chh, i) => { const kk = ease.outExpo(clamp((t - (t0 + i * 0.09)) / 0.18)); if (kk > 0) { c.fillStyle = rgba('bone', 1); c.fillText(chh, x, y - (1 - kk) * 40); } x += c.measureText(chh).width; });
      if (ln.zh) { c.font = font(F.sc(700), 30); c.textAlign = 'center'; c.fillStyle = rgba('miku', 1); c.fillText(ln.zh, W / 2, y + 48); }
      c.restore();
    });
    // (新的时代 now lands later — on the AI threshold, 2020 — see ch7_era)
    comp.draw(renderer, T.upload(), out);

    if (dead) { this.ov.lyricX = 1300; this.ov.lyricY = H - 300; }
    if (ret) this.ov.lyricY = H - 70;
    const hit = beatP * 0.6;
    return {
      bloom: 0.5 + relight * 0.15 + beatP * 0.15, grain: 0.07, vignette: 0.5 + quiet * 0.2 * (dead ? 1 : 0), ca: 1.2 + hit * 3,
      shake: [hit * 6 * (hash(frameIdx(t), 1) - 0.5), hit * 6 * (hash(frameIdx(t), 2) - 0.5)] as [number, number],
      flash: pulse(t, B(296), 0.07) * 0.4,
    };
  }
}
