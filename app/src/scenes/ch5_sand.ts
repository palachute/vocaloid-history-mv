// CHAPTER 5 · A2 → 一声惊雷 → the sand planet (bars 58–69).
//  b232–257.5  2012–2016, from high above. Her voice is a river of light on a dark plain. One by one
//              branches split off and run out to where her songs went: a producer's own debut, a band,
//              novels and anime, covers in human voices, stages, 紅白, kabuki, a symphony… The branches
//              shine; the river they left behind runs thinner, and by lyric L27 it is a thread.
//  b257.5–260  一声惊雷 (thunder) — cut on the b260 downbeat.
//  b260–276    "視界は遠く": a planet of ASCII sand, far away; the camera falls toward it. 2017: ハチ
//              comes back to the "sand planet". A sprout pushes out of the glyphs; its leaves are the new
//              names. Then the camera is yanked back out — the planet becomes a small grey sphere (which
//              the next chapter turns into a heart).
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import { LIN, rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { clamp, ease, fbm2, frameIdx, hash, lerp, prog, pulse } from '../engine/util';
import { Chapter, W, H } from './kit/base';
import { drawCover, label } from './kit/draw';
import { chapterTitle } from './kit/title';
import { LineBatch } from '../engine/lines';
import { GlyphPlanet, Stage } from './kit/three3d';
import { makeHeart } from './kit/heart';
import { mix3, mul, type RGB } from './kit/lines';

const RAD = 3000;
const LEAVES: [string, string, string, number][] = [['ロキ', 'みきとP', '2018', 271.5], ['幽霊東京', 'Ayase', '2019', 272.3], ['劣等上等', 'Giga', '2019', 273.1], ['ラグトレイン', '稲葉曇', '2020', 273.9]];
// where her songs went (2012–2016) — each a branch off the river
const BRANCH: { b: number; z: number; side: number; zh: string; ja: string; year: string; col: string }[] = [
  { b: 233.0, z: -600, side: -1, year: '2012', zh: 'ハチ 以本名「米津玄師」发表《diorama》', ja: 'ハチ、本名でデビュー', col: 'bone' },
  { b: 235.5, z: -1500, side: 1, year: '2012', zh: 'wowaka 组建乐队 ヒトリエ', ja: 'wowaka、バンド・ヒトリエへ', col: 'bone' },
  { b: 238.0, z: -2400, side: -1, year: '2012 — 2014', zh: 'カゲロウプロジェクト：小说 · 动画', ja: '小説とアニメへ', col: 'rin' },
  { b: 240.5, z: -3300, side: 1, year: '2010s', zh: '歌ってみた：人声翻唱', ja: '人の声で歌われる', col: 'luka' },
  { b: 243.0, z: -4200, side: -1, year: '2013 —', zh: 'マジカルミライ：演唱会与展会', ja: 'ライブと企画展', col: 'miku' },
  { b: 245.5, z: -5100, side: 1, year: '2015', zh: '紅白：小林幸子演唱《千本桜》', ja: '紅白で、人が歌う「千本桜」', col: 'magenta' },
  { b: 248.0, z: -6000, side: -1, year: '2016', zh: '超歌舞伎《千本桜》', ja: '超歌舞伎', col: 'ember' },
  { b: 250.5, z: -6900, side: 1, year: '2016', zh: '初音ミクシンフォニー：交响乐', ja: 'オーケストラへ', col: 'luo' },
];
const riverX = (z: number) => Math.sin(z / 1400) * 380 + Math.sin(z / 530 + 1) * 90;

export default class Ch5Sand extends Chapter {
  st = new Stage();
  rst = new Stage();
  planet = new GlyphPlanet(RAD, 160000);
  L3 = new LineBatch(40000, { screen2D: false, blend: 'add' });
  v3 = new THREE.Vector3();
  heart = makeHeart(330, 14, 9);
  setup() { this.st.scene.add(this.planet.points); }

  scr(st: Stage, x: number, y: number, z: number) {
    const v = this.v3.set(x, y, z).project(st.cam);
    return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, z: v.z };
  }
  /** branch i: a curve from the river at z out to its end point */
  branchPt(i: number, u: number) {
    const br = BRANCH[i]!;
    const x0 = riverX(br.z), z0 = br.z;
    const x1 = br.side * (1250 + (i % 3) * 260), z1 = br.z - 700 - (i % 2) * 300;
    const e = u * u * (3 - 2 * u);
    return [lerp(x0, x1, u) + Math.sin(u * 5 + i) * 120 * u * (1 - u), 0, lerp(z0, z1, e)] as [number, number, number];
  }

  frame(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const t = f.t, B = (b: number) => this.bt(b), beat = this.ctx.audio.beatAt(t);
    const A2 = beat < 257.7;
    const thin = prog(t, B(234), B(256), (x) => ease.inOutQuad(x));
    const fall = ease.inOutCubic(prog(t, B(260), B(271)));
    const sprout = prog(t, B(270.5), B(275), ease.outCubic);
    const pull = prog(t, B(274.6), B(276), ease.inCubic);

    this.resetBg();
    this.setBg(A2 ? { base: [0.003, 0.003, 0.004], glowC: LIN.miku, glowA: 0.04 * (1 - thin * 0.7), glowR: 900, glowP: [960, 300], vign: 0.6, noiseA: 0.6 }
      : { base: [0.006, 0.004, 0.003], glowC: LIN.sand, glowA: (0.05 + fall * 0.08) * (1 - pull), glowP: [1500, 300], glowR: 900, vign: 0.55, noiseA: 0.4 });
    this.bg.render(renderer, out);
    this.ov.clockOverride = A2 ? String(2012 + Math.min(4, Math.floor(prog(t, B(233), B(251)) * 4.99))) : beat < 271.5 ? '2017' : beat < 272.3 ? '2018' : beat < 273.9 ? '2019' : '2020';

    if (A2) {
      // ---- the river and its branches (3D, from high above) ----
      const L = this.L3; L.clear();
      const fly = prog(t, B(232), B(257.6));
      const camZ = lerp(1800, -5200, ease.inOutQuad(fly));
      this.rst.lookAt(Math.sin(t * 0.15) * 300, 4300 - fly * 500, camZ + 600, 0, 0, camZ - 3000, Math.sin(t * 0.2) * 0.04);
      // terrain contours (faint)
      const g = mul(LIN.graphite, 0.8);
      for (let zi = 0; zi < 40; zi++) {
        const z = 2400 - zi * 300;
        let px = -6000, py = 0;
        for (let xi = 0; xi <= 60; xi++) {
          const x = -6000 + xi * 200, y = fbm2(x / 2000, z / 2000, 3, 7) * 220 - 110;
          if (xi) L.seg(px, py, z, x, y, z, 1, g[0], g[1], g[2], 0.35);
          px = x; py = y;
        }
      }
      // the river: brightness thins as branches take its flow
      const taken = BRANCH.reduce((m, br) => m + prog(t, B(br.b), B(br.b + 1.5)), 0) / BRANCH.length;
      const main = clamp(1 - taken * 0.85 - prog(t, B(254.5), B(257)) * 0.15);
      const rc = mul(LIN.mikuHi, 0.9 + main * 1.6);
      let pz = 3000, ppx = riverX(3000);
      for (let k = 1; k <= 200; k++) {
        const z = 3000 - k * 60, x = riverX(z);
        L.seg(ppx, 0, pz, x, 0, z, 2 + main * 6, rc[0], rc[1], rc[2], 0.25 + main * 0.7);
        pz = z; ppx = x;
      }
      // flow particles on the river
      const nFlow = Math.floor(30 + main * 260);
      for (let i = 0; i < nFlow; i++) {
        const z = 3000 - (((t * 900 + hash(i, 1) * 12000) % 12000));
        const x = riverX(z) + (hash(i, 2) - 0.5) * 60 * main;
        L.seg(x, 4, z, x, 4, z - 50, 6, rc[0] * 2, rc[1] * 2, rc[2] * 2, 0.8);
      }
      // branches grow out and carry the flow away
      BRANCH.forEach((br, i) => {
        const grow = prog(t, B(br.b), B(br.b + 1.4), ease.outCubic);
        if (grow <= 0) return;
        const col = mul(LIN[br.col as 'miku'], 2.6);
        let prev = this.branchPt(i, 0);
        const N = 40;
        for (let s = 1; s <= N * grow; s++) {
          const p = this.branchPt(i, s / N);
          L.seg(prev[0], prev[1], prev[2], p[0], p[1], p[2], 3 + 4 * (1 - s / N), col[0], col[1], col[2], 0.9);
          prev = p;
        }
        for (let j = 0; j < 40 * grow; j++) {
          const u = ((t * 0.35 + hash(i, j)) % 1) * grow;
          const p = this.branchPt(i, u);
          L.seg(p[0], 6, p[2], p[0] + 1, 6, p[2] - 30, 6, col[0] * 1.6, col[1] * 1.6, col[2] * 1.6, 0.85);
        }
        if (grow >= 1) { const e = this.branchPt(i, 1); for (let r = 0; r < 3; r++) { const rr = 60 + r * 50 + Math.sin(t * 3 + r) * 10; let q: number[] | null = null; for (let a = 0; a <= 24; a++) { const an = (a / 24) * Math.PI * 2; const pt = [e[0] + Math.cos(an) * rr, 0, e[2] + Math.sin(an) * rr]; if (q) L.seg(q[0]!, 0, q[2]!, pt[0]!, 0, pt[2]!, 1.5, col[0], col[1], col[2], 0.5 - r * 0.12); q = pt; } } }
      });
      L.render(renderer, out, this.rst.cam);
    } else {
      // ---- the planet ----
      const u = this.planet.mat.uniforms;
      u.uT!.value = t;
      u.uSize!.value = lerp(46, 22, fall) + pull * 20;
      u.uOpacity!.value = prog(t, B(259.8), B(260.4)) * (1 - pull * 0.8);
      (u.uLight!.value as THREE.Vector3).set(0.8, 0.5, 0.35).normalize();
      (u.uCol!.value as THREE.Color).setRGB(lerp(0.75, 0.5, pull), lerp(0.5, 0.5, pull), lerp(0.28, 0.5, pull));
      const camFar = new THREE.Vector3(5200, 3400, 15500), camNear = new THREE.Vector3(0, RAD + 70, 560);
      const tgtFar = new THREE.Vector3(0, 0, 0), tgtNear = new THREE.Vector3(0, RAD + 55, -120);
      const k = fall;
      const cp = camFar.clone().lerp(camNear, k), tp = tgtFar.clone().lerp(tgtNear, Math.pow(k, 0.7));
      cp.y += Math.sin(t * 0.3) * 10 * k;
      if (pull > 0) { cp.lerp(new THREE.Vector3(0, 0, 26000), pull); tp.lerp(new THREE.Vector3(0, 0, 0), Math.min(1, pull * 1.5)); }
      this.planet.points.rotation.y = (1 - k) * (t * 0.05);
      this.st.lookAt(cp.x, cp.y, cp.z, tp.x, tp.y, tp.z, (1 - k) * 0.2 * (1 - pull));
      this.st.render(renderer, out);

      const L = this.L3; L.clear();
      if (pull > 0) {
        // the planet's skin becomes a faceted cage — the same grid the heart is made of
        const sp = this.heart.verts.map((v) => v.clone().setY(v.y - 40).normalize().multiplyScalar(RAD * 1.01));
        const wc = mul(LIN.sand, 1.6);
        for (const [ia, ib] of this.heart.edges) { const a = sp[ia]!, b = sp[ib]!; L.seg(a.x, a.y, a.z, b.x, b.y, b.z, 1.6, wc[0], wc[1], wc[2], ease.inCubic(pull)); }
      }
      if (sprout > 0 && pull < 0.5) {
        const g = mul(LIN.gumi, 2.6);
        const base = new THREE.Vector3(0, RAD, 0);
        const hgt = 150 * sprout;
        let prev = base.clone();
        const pts: THREE.Vector3[] = [];
        for (let i = 1; i <= 40; i++) {
          const v = i / 40;
          const p = new THREE.Vector3(Math.sin(v * 3 + t * 0.7) * 10 * v, RAD + v * hgt, Math.cos(v * 2) * 6 * v);
          L.seg(prev.x, prev.y, prev.z, p.x, p.y, p.z, 4 - v * 2, g[0], g[1], g[2], 1); prev = p; pts.push(p);
        }
        LEAVES.forEach(([, , , b0], i) => {
          const lk = prog(t, B(b0), B(b0 + 1.0), ease.outCubic);
          if (lk <= 0) return;
          const at = pts[Math.min(pts.length - 1, Math.floor(pts.length * (0.35 + i * 0.15)))]!;
          const side = i % 2 ? 1 : -1;
          let q = at.clone();
          for (let j = 1; j <= 14; j++) {
            const v = j / 14;
            const p = new THREE.Vector3(at.x + side * v * 70 * lk, at.y + Math.sin(v * Math.PI) * 18 * lk + v * 14 * lk, at.z + v * 8);
            L.seg(q.x, q.y, q.z, p.x, p.y, p.z, 3, g[0], g[1], g[2], 1); q = p;
          }
        });
      }
      L.render(renderer, out, this.st.cam);
    }

    // ---- 2D ----
    const T = this.T; T.clear();
    const c = T.ctx;
    if (A2) {
      BRANCH.forEach((br, i) => {
        const a = Math.min(prog(t, B(br.b + 0.6), B(br.b + 1.0)), 1 - prog(t, B(256.6), B(257.5)));
        if (a <= 0) return;
        const e = this.branchPt(i, 1);
        const p = this.scr(this.rst, e[0], 0, e[2]);
        if (p.z > 1 || p.x < -200 || p.x > W + 200) return;
        const right = br.side > 0;
        const lx = right ? Math.min(p.x + 30, W - 620) : Math.max(p.x - 30, 620);
        c.save(); c.globalAlpha = a; c.textAlign = right ? 'left' : 'right';
        c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 12;
        label(c, br.year, lx, p.y - 34, { align: right ? 'left' : 'right', color: rgba(br.col as 'miku', 1), size: 14 });
        c.font = font(F.sc(700), 28); c.fillStyle = rgba('bone', 1); c.fillText(br.zh, lx, p.y);
        c.font = font(F.jp(300), 18); c.fillStyle = rgba('ash', 1); c.fillText(br.ja, lx, p.y + 26);
        c.restore();
      });
      const head = Math.min(prog(t, B(233.5), B(234.5)), 1 - prog(t, B(241), B(242)));
      if (head > 0) {
        c.save(); c.globalAlpha = head;
        label(c, '2012 — 2016', 96, 110, { color: rgba('miku', 1), size: 16 });
        c.font = font(F.scSerif(), 50); c.fillStyle = rgba('bone', 1); c.fillText('她的歌，流向了四面八方。', 96, 180);
        c.font = font(F.jp(300), 22); c.fillStyle = rgba('ash', 1); c.fillText('彼女の歌は、四方へ流れていった。', 98, 220);
        c.restore();
      }
      const quiet = Math.min(prog(t, B(250.6), B(251.6)), 1 - prog(t, B(256.6), B(257.5)));
      if (quiet > 0) {
        c.save(); c.globalAlpha = quiet;
        c.font = font(F.scSerif(), 50); c.fillStyle = rgba('bone', 1); c.fillText('原来的河道，渐渐安静了。', 96, 180);
        c.font = font(F.jp(300), 22); c.fillStyle = rgba('ash', 1); c.fillText('もとの川は、少しずつ静かになっていった。', 98, 220);
        c.restore();
        const src = this.scr(this.rst, riverX(-7400), 0, -7400);
        if (src.z < 1) label(c, 'VOCALOID · 原创曲 / オリジナル曲', src.x, src.y - 20, { align: 'center', color: rgba('mikuHi', 1), size: 13, alpha: quiet });
      }
    } else {
      const intro = Math.min(prog(t, B(262), B(263)), 1 - prog(t, B(270), B(271)));
      if (intro > 0) {
        c.save(); c.globalAlpha = intro;
        drawCover(c, this.cover('suna'), 96, 140, 280, 158);
        label(c, '2017 · ハチ · 砂の惑星 · マジカルミライ 2017', 96, 330, { color: rgba('sand', 1), size: 15 });
        c.font = font(F.scSerif(), 52); c.fillStyle = rgba('bone', 1);
        c.fillText('他回到了这颗寸草不生的星球，', 96, 420);
        c.fillText('因为他相信这里还有生命。', 96, 486);
        c.font = font(F.jp(300), 22); c.fillStyle = rgba('ash', 1);
        c.fillText('草も生えない星に、彼は帰ってきた。まだ命があると信じて。', 98, 530);
        const vk = prog(t, B(266.5), B(267));
        if (vk > 0) { c.globalAlpha = intro * vk; c.font = font(F.sc(700), 34); c.fillStyle = rgba('sand', 1); c.fillText('"它们有 VOCALOID 味儿。"', 96, 610); label(c, '——ハチ，谈他心中的 VOCALOID（据讲稿）', 98, 645, { size: 13 }); }
        c.restore();
      }
      if (sprout > 0 && pull < 0.3) {
        LEAVES.forEach(([title, p, y, b0], i) => {
          const a = prog(t, B(b0 + 0.3), B(b0 + 0.6)) * (1 - pull * 3);
          if (a <= 0) return;
          const side = i % 2 ? 1 : -1;
          const v = new THREE.Vector3(side * 75, RAD + 150 * (0.35 + i * 0.15) * sprout + 20, 0).project(this.st.cam);
          const x = (v.x * 0.5 + 0.5) * W, yy = (-v.y * 0.5 + 0.5) * H;
          c.save(); c.globalAlpha = a; c.textAlign = side > 0 ? 'left' : 'right';
          const lx = x + side * 30;
          c.font = font(F.jp(900), 34); c.fillStyle = rgba('bone', 1); c.fillText(title, lx, yy);
          label(c, `${p} · ${y}`, lx, yy + 26, { color: rgba('gumi', 1), size: 13, align: side > 0 ? 'left' : 'right' });
          c.restore();
        });
        label(c, '2018 — 2020 · 新的一代 / 新しい世代', 96, 120, { color: rgba('gumi', 1), size: 15, alpha: prog(t, B(271.5), B(272)) * (1 - pull * 3) });
      }
      if (fall < 0.4) { c.save(); c.globalAlpha = (1 - fall / 0.4) * 0.25; c.fillStyle = 'rgba(8,6,4,1)'; c.fillRect(0, 0, W, H); c.restore(); }
    }
    chapterTitle(c, 'thunder', '一声惊雷', '青天の霹靂', '05', beat, 257.6, 2.4, { col: rgba('sand', 1) });
    comp.draw(renderer, T.upload(), out);

    this.ov.lyricBig.add(27);
    this.ov.lyricBig.add(28);
    if (!A2 && sprout > 0) this.ov.lyricX = 1300;
    const th = pulse(t, B(257.6), 0.1);
    const br = A2 ? BRANCH.reduce((m, b) => Math.max(m, pulse(t, B(b.b), 0.08)), 0) : 0;
    void mix3; void (0 as unknown as RGB);
    return {
      flash: th * 1.2 + pulse(t, B(260), 0.08) * 0.4,   // no screen flash per branch — it greyed the whole frame every 2.5 beats bloom: 0.55 + (A2 ? 0.15 : 0), grain: 0.07, vignette: 0.5, ca: 1.2 + th * 6 + br * 1 + pull * 3,
      shake: [th * 16 * (hash(frameIdx(t), 1) - 0.5), th * 16 * (hash(frameIdx(t), 2) - 0.5)] as [number, number],
      zoom: 1 + pull * 0.03,
    };
  }
}
