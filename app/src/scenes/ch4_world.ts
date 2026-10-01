// CHAPTER 4 · 走向世界 / 焦土 (bars 48–58, interlude). Title (the four notes fly out). A wire globe:
// the line leaves Tokyo and every arc lands somewhere — a stage, a TV studio, a producer abroad.
// A second source lights up: Shanghai, 2012.07.12, 洛天依. Then the same years seen from two sides:
// in Japan a burned field (deco*27 to Neru, 2016: 焼け野原) — in China a fire just catching.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import { LIN, rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { clamp, ease, fbm2, frameIdx, hash, lerp, prog, pulse } from '../engine/util';
import { Chapter, W, H } from './kit/base';
import { drawCover, label } from './kit/draw';
import { chapterTitle } from './kit/title';
import { mix3, mul, type RGB } from './kit/lines';
import { LineBatch } from '../engine/lines';
import { Stage } from './kit/three3d';
import { cityCamera, drawLanterns, drawStars, makeCity } from './kit/city';

const R = 1000;
const ll = (lat: number, lon: number, r = R) => {
  const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
  return new THREE.Vector3(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo));
};
const TOKYO: [number, number] = [35.7, 139.7], SHANGHAI: [number, number] = [31.2, 121.5];
// where the arcs land (results, not just lines)
const ENDS: { at: [number, number]; when: string; what: string; whatJa: string; b: number; img?: string }[] = [
  { at: [51.5, -0.1], when: '2012.01', what: 'Google Chrome 全球广告 · Tell Your World', whatJa: 'Google Chrome CM', b: 196.5, img: 'tyw' },
  { at: [-6.2, 106.8], when: '2014.05', what: 'MIKU EXPO · 雅加达（第一站）', whatJa: 'MIKU EXPO Jakarta', b: 199 },
  { at: [34, -118.4], when: '2014.10', what: 'MIKU EXPO · 洛杉矶 / 纽约', whatJa: 'MIKU EXPO LA / NY', b: 201, img: 'stage_expo' },
  { at: [40.7, -74], when: '2014.10', what: '登上美国电视《Late Show》', whatJa: 'Late Show（米国TV）', b: 202 },
  { at: [37, -95], when: '2014', what: '海外 P 主 · Crusher-P《ECHO》', whatJa: '海外のボカロP', b: 203, img: 'echo' },
  { at: [19.4, -99.1], when: '2016', what: 'MIKU EXPO · 北美 / 墨西哥城', whatJa: 'MIKU EXPO 北米・メキシコ', b: 204.5 },
];
const CN = ['BEIJING', 'CHENGDU', 'GUANGZHOU', 'WUHAN', 'XI\'AN', 'HANGZHOU'];
const CN_LL: [number, number][] = [[39.9, 116.4], [30.7, 104], [23.1, 113.3], [30.6, 114.3], [34.3, 108.9], [30.3, 120.2]];
const CHINA: { y: string; t: string; s: string; id?: string }[] = [
  { y: '2012.07.12', t: '洛天依 · 第一个中文 VOCALOID 声库', s: '代表色：#66CCFF' },
  { y: '2012.07.13', t: '千年食谱颂 · 发售第二天', s: 'bilibili', id: 'shipu' },
  { y: '2012.09', t: '66CCFF · 杉田朗', s: '以她的颜色为名', id: '66ccff' },
  { y: '2015', t: '普通DISCO · ilem · 14 天达成传说', s: '中 V 的黄金年', id: 'disco' },
  { y: '2015', t: '权御天下 · 乌龟Sui', s: '38 天传说', id: 'quanyu' },
  { y: '2016.07', t: 'Bilibili Macro Link · 全息', s: '《CONNECT~心的连接~》', id: 'stage_bml' },
];

export default class Ch4World extends Chapter {
  st = new Stage();
  L3 = new LineBatch(60000, { screen2D: false, blend: 'add' });
  LC = new LineBatch(8000, { screen2D: false, blend: 'add' });
  cst = new Stage();
  cityWin = makeCity().win;

  frame(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const t = f.t, B = (b: number) => this.bt(b), beat = this.ctx.audio.beatAt(t);
    const globe = beat < 207;
    const burn = prog(t, B(208), B(226));
    const dark = prog(t, B(228), B(231.5));

    this.resetBg();
    this.setBg({ base: [0.003, 0.003, 0.004], glowC: globe ? LIN.miku : LIN.luo, glowA: globe ? 0.06 : 0.12 * (1 - dark * 0.5), glowP: globe ? [960, 540] : [1560, 540], glowR: 700,
      burn: globe ? 0 : (1 - dark) * 0.6 * clamp(burn * 2), vign: 0.5 });
    this.bg.render(renderer, out);
    this.ov.clock = false;

    // the same lanterns as the night city — same windows, same particles, same upward camera — keep
    // rising; the world fades in high above them; then the lanterns fade and the globe takes over
    const zoomIn = ease.inOutCubic(prog(t, B(192.6), B(197)));
    const gA = prog(t, B(192.4), B(194.6));
    {
      const lf = 1 - prog(t, B(195), B(197.4));
      if (lf > 0) {
        const LC = this.LC; LC.clear();
        cityCamera(this.cst, t, B);
        drawLanterns(LC, t, beat, B, this.cityWin, lf);
        drawStars(LC, t, lf);
        LC.render(renderer, out, this.cst.cam);
      }
    }
    const L = this.L3; L.clear();
    if (globe) {
      // wire globe, turning so Tokyo faces us, then America
      const rot = lerp(-2.3, -4.35, ease.inOutCubic(prog(t, B(199), B(205))));
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot);
      const P = (lat: number, lon: number, r = R) => ll(lat, lon, r).applyQuaternion(q);
      const g = mul(LIN.graphite, 0.9 + (1 - zoomIn) * 1.2);
      for (let lat = -60; lat <= 60; lat += 20) for (let lon = 0; lon < 360; lon += 6) { const a = P(lat, lon), b = P(lat, lon + 6); L.seg(a.x, a.y, a.z, b.x, b.y, b.z, 1, g[0], g[1], g[2], 0.5 * gA); }
      for (let lon = 0; lon < 360; lon += 20) for (let lat = -80; lat < 80; lat += 6) { const a = P(lat, lon), b = P(lat + 6, lon); L.seg(a.x, a.y, a.z, b.x, b.y, b.z, 1, g[0], g[1], g[2], 0.5); }
      // arcs with landings
      const arc = (from: [number, number], to: [number, number], k: number, col: RGB, w = 2.2) => {
        const a = P(...from), b = P(...to);
        const N = 50; let prev = a.clone();
        for (let i = 1; i <= N * k; i++) {
          const u = i / N;
          const p = a.clone().lerp(b, u).normalize().multiplyScalar(R * (1 + Math.sin(u * Math.PI) * 0.25));
          L.seg(prev.x, prev.y, prev.z, p.x, p.y, p.z, w, col[0], col[1], col[2], 0.9); prev = p;
        }
      };
      for (const e of ENDS) {
        const k = prog(t, B(e.b - 1.2), B(e.b), ease.inOutCubic);
        if (k > 0) arc(TOKYO, e.at, k, mul(LIN.mikuHi, 2.4));
      }
      const cnk = prog(t, B(197.5), B(199.5));
      CN_LL.forEach((c, i) => { const k = clamp(cnk * 1.4 - i * 0.08); if (k > 0) arc(SHANGHAI, c, k, mul(LIN.luo, 2.6)); });
      { const d = lerp(14000, 2550, zoomIn); this.st.lookAt(0, 380 * d / 2550, d, 0, 60, 0); }
      L.render(renderer, out, this.st.cam);
    } else {
      // the field: ridgelines with grass; a fire front sweeps toward us; behind it, char
      const front = lerp(-7000, 400, burn);
      const camZ = 700 - burn * 500;
      for (let zi = 0; zi < 46; zi++) {
        const z = -6500 + zi * 150;
        const behind = z < front;            // burned
        const near = Math.abs(z - front) < 500;
        for (let xi = 0; xi < 110; xi++) {
          const x = -4400 + xi * 80;
          const h = fbm2(x / 1400, z / 1400, 4, 3) * 260;
          const h2 = fbm2((x + 80) / 1400, z / 1400, 4, 3) * 260;
          let col: RGB = mul(mix3(LIN.gumi, LIN.ash, 0.6), 0.55);
          let bladeH = 40 + hash(xi, zi) * 70, bladeCol: RGB = col, ba = 0.55;
          if (near) { const k = 1 - Math.abs(z - front) / 500; bladeCol = mul(LIN.ember, 2 + k * 5 * (0.6 + 0.4 * Math.sin(t * 20 + xi))); bladeH *= 1 + k * 2.5; ba = 0.9; col = mul(LIN.ember, 1.5 * k + 0.2); }
          else if (behind) { bladeCol = mul(LIN.graphite, 0.35); bladeH *= 0.25; col = mul(LIN.graphite, 0.5); ba = 0.6; }
          L.seg(x, h, z, x + 80, h2, z, 1.6, col[0], col[1], col[2], 0.7);
          const sway = Math.sin(t * 2 + xi * 0.3 + zi) * 8;
          L.seg(x, h, z, x + sway, h + bladeH, z, 1.4, bladeCol[0], bladeCol[1], bladeCol[2], ba);
        }
      }
      // embers rising from the front
      for (let i = 0; i < 600; i++) {
        const born = hash(i, 1) * 3, age = ((t * 0.9 + born) % 3);
        const x = (hash(i, 2) - 0.5) * 8000, z = front - hash(i, 3) * 400, y = 50 + age * 300 + Math.sin(age * 3 + i) * 30;
        const a = burn > 0 && burn < 1 ? (1 - age / 3) : 0;
        if (a > 0) L.seg(x, y, z, x, y + 12, z, 3, LIN.ember[0] * 5, LIN.ember[1] * 5, LIN.ember[2] * 5, a * (1 - dark));
      }
      this.st.lookAt(0, 420 - burn * 120, camZ, 0, 80, -3000);
      L.render(renderer, out, this.st.cam);
    }

    // ---- 2D ----
    const T = this.T; T.clear();
    const c = T.ctx;
    if (globe) {
      const rot = lerp(-2.3, -4.35, ease.inOutCubic(prog(t, B(199), B(205))));
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot);
      const scr = (lat: number, lon: number) => { const p = ll(lat, lon, R * 1.02).applyQuaternion(q); const front_ = p.z > -100; const v = p.project(this.st.cam); return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, front: front_ }; };
      const tk = scr(...TOKYO);
      label(c, 'TOKYO · 2007', tk.x + 14, tk.y - 10, { color: rgba('miku', 1), size: 14 });
      ENDS.forEach((e, i) => {
        const a = Math.min(prog(t, B(e.b), B(e.b + 0.2)), 1 - prog(t, B(206.5), B(207)));
        if (a <= 0) return;
        const p = scr(...e.at);
        const lx = 96, ly = 200 + i * 120;
        c.save(); c.globalAlpha = a;
        if (p.front) {
          c.strokeStyle = rgba('mikuHi', 0.5); c.lineWidth = 1; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(lx + 560, ly - 8); c.lineTo(lx + 540, ly - 8); c.stroke();
          c.fillStyle = rgba('mikuHi', 1); c.beginPath(); c.arc(p.x, p.y, 6 + pulse(t, B(e.b), 0.2) * 14, 0, Math.PI * 2); c.fill();
        }
        label(c, e.when, lx, ly - 30, { color: rgba('miku', 1), size: 13 });
        c.font = font(F.sc(700), 28); c.fillStyle = rgba('bone', 1); c.fillText(e.what, lx, ly);
        c.font = font(F.jp(300), 16); c.fillStyle = rgba('ash', 1); c.fillText(e.whatJa, lx, ly + 26);
        c.restore();
      });
      const sh = scr(...SHANGHAI), ca = prog(t, B(197.5), B(198)) * (1 - prog(t, B(200), B(201)));
      if (ca > 0) {
        c.save(); c.globalAlpha = ca;
        c.fillStyle = rgba('luo', 1); c.beginPath(); c.arc(sh.x, sh.y, 8 + pulse(t, B(197.5), 0.3) * 20, 0, Math.PI * 2); c.fill();
        c.font = font(F.sc(700), 34); c.fillText('上海 · 2012.07.12', sh.x - 330, sh.y + 60);
        label(c, '第二个源点 / もう一つの始まり', sh.x - 330, sh.y + 92, { color: rgba('luo', 1), size: 14 });
        c.restore();
      }
      label(c, 'TELL YOUR WORLD · livetune · 2012', 96, H - 60, { size: 14, color: rgba('bone', 0.8), alpha: prog(t, B(195), B(196)) * (1 - prog(t, B(206), B(207))) });
    } else {
      // left: Japan, the burned field
      // first the hint — then the field's name
      const ha = Math.min(prog(t, B(207.6), B(208.1)), 1 - dark);
      if (ha > 0) {
        c.save(); c.globalAlpha = ha;
        c.fillStyle = rgba('ember', 1); c.fillRect(96, 92, 8, 46);
        c.font = font(F.sc(700), 40); c.fillStyle = rgba('bone', 1); c.fillText('与此同时，日本', 120, 132);
        c.font = font(F.jp(300), 20); c.fillStyle = rgba('ember', 1); c.fillText('同じ頃、日本では　·　2012 — 2016', 420, 128);
        c.restore();
      }
      const qa = Math.min(prog(t, B(209.4), B(210.2)), 1 - dark);
      if (qa > 0) {
        c.save(); c.globalAlpha = qa;
        c.font = font(F.scSerif(), 92); c.fillStyle = rgba('bone', 1); c.fillText('被火烧过的原野', 96, 240);
        c.font = font(F.jp(300), 28); c.fillStyle = rgba('ash', 1); c.fillText('焼け野原 —— deco*27 が Neru に語った言葉（2016・讲稿）', 100, 280);
        const zh = ['周刊与再生数据持续下滑', 'じん转向小说与动画，けむ转向贝斯手，许多 P 主转向企划', '在日本，热潮退去了'];
        const ja = ['週刊ランキングも再生数も下がり続けた', 'じんは小説とアニメへ、けむはベーシストへ、多くのPが企画へ', '日本では、ブームが去っていった'];
        zh.forEach((s, i) => {
          const k = prog(t, B(210 + i * 0.8), B(210.4 + i * 0.8));
          c.globalAlpha = qa * k;
          c.font = font(F.sc(400), 22); c.fillStyle = rgba('bone', 0.85); c.fillText('· ' + s, 100, 344 + i * 66);
          c.font = font(F.jp(300), 17); c.fillStyle = rgba('ash', 1); c.fillText(ja[i]!, 120, 370 + i * 66);
        });
        c.globalAlpha = qa;
        c.restore();
      }
      // right: China, the same years
      const pa = prog(t, B(213), B(214)) * (1 - dark * 0.3);
      if (pa > 0) {
        c.save(); c.globalAlpha = pa;
        const x0 = 1200, w = 620;
        const grd = c.createLinearGradient(x0, 0, x0 + w, 0); grd.addColorStop(0, 'rgba(102,204,255,0)'); grd.addColorStop(0.3, 'rgba(102,204,255,0.10)'); grd.addColorStop(1, 'rgba(102,204,255,0.16)');
        c.fillStyle = grd; c.fillRect(x0, 0, w, H);
        c.fillStyle = rgba('luo', 1); c.fillRect(x0 + 60, 92, 8, 46);
        c.font = font(F.sc(700), 40); c.fillStyle = rgba('bone', 1); c.fillText('同一时期，中国', x0 + 84, 132);
        c.font = font(F.jp(300), 20); c.fillStyle = rgba('luo', 1); c.fillText('同じ頃、中国では', x0 + 384, 128);
        CHINA.forEach((e, i) => {
          const t0 = B(214 + i * 2.2);
          const k = prog(t, t0, t0 + 0.3, ease.outCubic);
          if (k <= 0) return;
          const y = 900 - i * 132 - (1 - k) * 40;
          c.globalAlpha = pa * k;
          if (e.id && this.cover(e.id)) drawCover(c, this.cover(e.id), x0 + 60, y - 96, 112, 112);
          else { c.fillStyle = rgba('luo', 0.25); c.fillRect(x0 + 60, y - 96, 112, 112); c.font = font(F.sc(700), 60); c.fillStyle = rgba('luo', 1); c.fillText(e.t.slice(0, 1), x0 + 86, y - 18); }
          label(c, e.y, x0 + 190, y - 70, { color: rgba('luo', 1), size: 13 });
          c.font = font(F.sc(700), 26); c.fillStyle = rgba('bone', 1); c.fillText(e.t, x0 + 190, y - 36);
          c.font = font(F.sc(400), 18); c.fillStyle = rgba('ash', 1); c.fillText(e.s, x0 + 190, y - 8);
        });
        c.globalAlpha = pa;
        const lt = this.char('luotianyi');
        if (lt) drawCover(c, lt, x0 + 330, 60, 300, 520, { fit: 'contain', alpha: 0.5 * prog(t, B(222), B(224)) });
        c.restore();
      }
      const end = prog(t, B(217), B(218)) * (1 - prog(t, B(231.2), B(232)));
      if (end > 0) {
        c.save(); c.globalAlpha = end;
        c.font = font(F.sc(700), 40); c.fillStyle = rgba('bone', 1); c.fillText('一边熄灭，一边点燃。', 96, H - 140);
        c.font = font(F.jp(300), 22); c.fillStyle = rgba('ash', 1); c.fillText('一方で燃え尽き、一方で燃え始めた。', 98, H - 100);
        c.restore();
      }
    }
    chapterTitle(c, 'fly', '走向世界', '世界へ', '04', beat, 191.9, 3.6, { overlay: true, appear: 0.6, size: 170, y: 190 });
    comp.draw(renderer, T.upload(), out);

    const hit = pulse(t, B(Math.floor(beat)), 0.07) * (1 - dark) * 0.5;
    return {
      bloom: 0.6 + burn * 0.3, grain: 0.06 + burn * 0.03, vignette: 0.45 + dark * 0.3, ca: 1.2 + hit * 2,
      shake: [hit * 5 * (hash(frameIdx(t), 1) - 0.5), hit * 5 * (hash(frameIdx(t), 2) - 0.5)] as [number, number],
      flash: pulse(t, B(207), 0.1) * 0.5,
    };
  }
}
