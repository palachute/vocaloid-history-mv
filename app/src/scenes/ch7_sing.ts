// CHAPTER 7b · the second refrain → build → the silent bar (bars 81.5–94).
//  b326–336  The world as a network: singers (faces) and producers (names) everywhere; arcs between them
//            carry notes back and forth — covers, tunings, replies.
//  b336–340  The network contracts: every node slides to a vertex of the grey low-poly heart from
//            アンノウン・マザーグース, every arc straightens into one of its edges.
//  b340–342  It beats. Under it, the editor's 心 lane — empty since 2007 — is written, by the heart.
//  b342.5–350.5 "瞳の雨…": the question. The lecture notes' questions, one per dotted eighth, then
//            VOCALOID = ?  (answered only at the very end, on the last 届け)
//  b350.5–358  届け: the heart sends notes out.
//  b358–372  build: a drum of every name, title, engine and year spins up, slow → fast.
//  b372–376  the silent bar: the drum runs down, fast → slow, and stops on: VOCALOID = ?
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import { LIN, rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { clamp, ease, frameIdx, hash, lerp, prog, pulse } from '../engine/util';
import { Chapter, W, H } from './kit/base';
import { drawCover, label } from './kit/draw';
import { LineBatch } from '../engine/lines';
import { Stage } from './kit/three3d';
import { makeHeart } from './kit/heart';
import { mix3, mul, type RGB } from './kit/lines';

const TITLE_LINES = [36, 37];
const WINC: RGB[] = [[2.2, 1.7, 1.0], [0.4, 2.0, 1.9], [2.2, 0.8, 1.2], [2.0, 1.9, 1.6], [0.6, 1.4, 2.4]];
const GR = 880;
const llv = (lat: number, lon: number, r = GR) => { const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180; return new THREE.Vector3(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo)); };
// who is where: singers (with a face) and producers (a name)
const NODES: { ll: [number, number]; city: string; who: string; img?: string; col: string }[] = [
  { ll: [35.7, 139.7], city: 'TOKYO', who: '初音ミク', img: 'miku', col: 'miku' },
  { ll: [31.2, 121.5], city: 'SHANGHAI', who: '洛天依', img: 'luotianyi', col: 'luo' },
  { ll: [39.9, 116.4], city: 'BEIJING', who: '言和', img: 'yanhe', col: 'bone' },
  { ll: [30.7, 104.0], city: 'CHENGDU', who: '乐正绫', img: 'yuezhengling', col: 'ember' },
  { ll: [34.7, 135.5], city: 'OSAKA', who: 'GUMI', img: 'gumi', col: 'gumi' },
  { ll: [35.0, 135.8], city: 'KYOTO', who: '可不', img: 'kafu', col: 'kafu' },
  { ll: [22.5, 114.1], city: 'SHENZHEN', who: '歌爱雪', img: 'yuki', col: 'yuki' },
  { ll: [43.1, 141.3], city: 'SAPPORO', who: 'MEIKO · KAITO', img: 'meiko', col: 'magenta' },
  { ll: [34.0, -118.2], city: 'LOS ANGELES', who: '巡音ルカ', img: 'luka', col: 'luka' },
  { ll: [40.7, -74.0], city: 'NEW YORK', who: '鏡音リン・レン', img: 'kagamine', col: 'rin' },
  { ll: [35.6, 139.6], city: 'TOKYO', who: 'wowaka', col: 'bone' },
  { ll: [35.5, 139.8], city: 'TOKYO', who: 'ハチ', col: 'bone' },
  { ll: [34.6, 135.4], city: 'OSAKA', who: 'DECO*27', col: 'bone' },
  { ll: [31.3, 121.4], city: 'SHANGHAI', who: 'ilem', col: 'bone' },
  { ll: [30.6, 114.3], city: 'WUHAN', who: '乌龟Sui', col: 'bone' },
  { ll: [37.0, -95.0], city: 'USA', who: 'Crusher-P', col: 'bone' },
  { ll: [-6.2, 106.8], city: 'JAKARTA', who: 'MIKU EXPO', col: 'bone' },
  { ll: [48.9, 2.35], city: 'PARIS', who: 'Japan Expo', col: 'bone' },
  { ll: [-23.5, -46.6], city: 'SÃO PAULO', who: 'COVER', col: 'bone' },
  { ll: [37.5, 127.0], city: 'SEOUL', who: 'LISTENER', col: 'bone' },
  { ll: [19.4, -99.1], city: 'MEXICO CITY', who: 'MIKU EXPO', col: 'bone' },
  { ll: [52.5, 13.4], city: 'BERLIN', who: 'P', col: 'bone' },
  { ll: [-33.9, 151.2], city: 'SYDNEY', who: 'LISTENER', col: 'bone' },
  { ll: [25.0, 121.5], city: 'TAIPEI', who: '翻唱 / 歌ってみた', col: 'bone' },
];
const HEART_COVERS = ['mothergoose', 'worldsend', 'melt', 'senbon', 'suna', 'disco', 'kokushi', '66ccff', 'shipu', 'rolling', 'matryoshka', 'tyw', 'phony', 'yurei', 'lagtrain', 'vampire', 'kagerou', 'onmyou', 'shoushitsu', 'teddy'];
const Q: [string, string][] = [
  ['是初音未来这个 IP？', '初音ミクというIP？'], ['是雅马哈的编辑器？', 'YAMAHAのエディタ？'], ['是神调教？', '神調教？'], ['是 J-pop 与 J-rock 的交融？', 'J-POPとJ-ROCKの融合？'],
  ['是超高语速与电子音？', '超高速の歌と電子音？'], ['是弹幕与唱见？', '弾幕と歌い手？'], ['是"VOCALOID 味儿"？', '「ボカロらしさ」？'], ['是新人不断涌现的社区？', '新人が生まれ続ける場所？'],
];
const QB = 342.5, QS = 1.2, VQ = QB + 8 * QS;    // VOCALOID = ? at b352.1
// the drum: everything this film has named
const WORDS = ['初音ミク', '2007', 'メルト', 'ryo', '鏡音リン・レン', 'UTAU', '初音ミクの消失', 'cosMo@暴走P', '巡音ルカ', '2009', 'wowaka', '裏表ラバーズ', 'ハチ', 'マトリョシカ', 'GUMI', 'DECO*27', 'Project DIVA', '2010',
  '千本桜', '黒うさP', 'カゲロウデイズ', 'じん', 'VOCALOID3', '洛天依', '2012', '千年食谱颂', '66CCFF', 'Tell Your World', 'マジカルミライ', 'Piapro Studio', 'CeVIO', '2014', 'MIKU EXPO', 'VOCALOID4',
  '普通DISCO', 'ilem', '权御天下', '言和', '乐正绫', '紅白', '2015', 'BML', '超歌舞伎', 'Synthesizer V', '砂の惑星', 'アンノウン・マザーグース', '2017', 'ロキ', '幽霊東京', 'Ayase', '2019', 'ヒトリエ',
  'NEUTRINO', 'プロセカ', '2020', 'ラグトレイン', '可不', 'フォニイ', 'ツミキ', '2021', '春晚', 'VOCALOID6', 'ACE Studio', '神っぽいな', 'ヴァンパイア', '2023', 'Coachella', 'Suno', '2024', '重音テト', 'メズマライザー',
  '2025', 'Synthesizer V 2', '告死鸟', '2026', '初音ミク V6', 'DAISY', '1961', '声'];
const D0 = 358.4, D1 = 372, DS = 375.6, V0 = 1, V1 = 14;    // peak speed lowered (was 24) so names stay readable
const S1 = V0 * (D1 - D0) + ((V1 - V0) * (D1 - D0)) / 3;
const TARGET = Math.round(S1 + (V1 * (DS - D1)) / 3);
const wordAt = (k: number) => (k === TARGET || k === 0 ? 'VOCALOID = ?' : WORDS[((k % WORDS.length) + WORDS.length) % WORDS.length]!);
function drumPos(b: number) {
  if (b < D0) return 0;
  if (b < D1) { const u = (b - D0) / (D1 - D0); return V0 * (b - D0) + ((V1 - V0) * (D1 - D0) * u * u * u) / 3; }
  const x = clamp((b - D1) / (DS - D1));
  return S1 + (TARGET - S1) * (1 - Math.pow(1 - x, 3));
}
function drumSpeed(b: number) { return (drumPos(b + 0.01) - drumPos(b - 0.01)) / 0.02; }
/** shared with the outro: where "VOCALOID = ?" sits */
export const VQ_FONT = 112;


export default class Ch7Sing extends Chapter {
  st = new Stage();
  L3 = new LineBatch(60000, { screen2D: false, blend: 'add' });
  heart = makeHeart(470, 14, 9);
  globe: THREE.Vector3[] = [];
  P: THREE.Vector3[] = [];
  nodeV: number[] = [];   // vertex index of each NODE
  coverV: number[] = [];  // vertex index of each cover on the heart
  fly: { x: number; y: number; w: string; a: number; s: number }[] = [];
  v3 = new THREE.Vector3();

  setup() {
    const N = this.heart.verts.length;
    // a random permutation of the globe slots, so heart-neighbours sit far apart on the globe (long arcs)
    const ga = Math.PI * (3 - Math.sqrt(5));
    const slots = Array.from({ length: N }, (_, i) => { const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i; return new THREE.Vector3(Math.cos(th) * r * GR, y * GR, Math.sin(th) * r * GR); });
    const order = slots.map((_, i) => i).sort((a, b) => hash(a, 17) - hash(b, 17));
    this.globe = order.map((k) => slots[k]!);
    // pin the named nodes to their real places
    const used = new Set<number>();
    NODES.forEach((n, i) => { let v = Math.floor(hash(i, 41) * N); while (used.has(v)) v = (v + 7) % N; used.add(v); this.nodeV.push(v); if (!n.img || n.img === 'miku' || n.img === 'luotianyi') this.globe[v] = llv(n.ll[0], n.ll[1]); });
    this.P = this.heart.verts.map((v) => v.clone());
    const used2 = new Set(this.nodeV);
    HEART_COVERS.forEach((_, j) => { let v = Math.floor(hash(j, 83) * N); while (used2.has(v)) v = (v + 11) % N; used2.add(v); this.coverV.push(v); });
  }

  scr(p: THREE.Vector3) {
    const v = this.v3.copy(p).project(this.st.cam);
    return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, z: v.z };
  }

  frame(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const t = f.t, B = (b: number) => this.bt(b), beat = this.ctx.audio.beatAt(t);
    const form = prog(t, B(336), B(340), ease.inOutCubic);      // network → heart
    const lane = prog(t, B(340), B(342.2));
    const build = prog(t, B(360), B(372), ease.inCubic) * (beat < 372 ? 1 : 0);
    const reach = beat >= 350 && beat < 372;
    for (const n of TITLE_LINES) this.ov.lyricHide.add(n);

    this.resetBg();
    this.setBg({ base: [0.003, 0.004, 0.006], glowC: LIN.miku, glowA: 0.04 + form * 0.025 + build * 0.3, glowR: 800 + build * 600, glowP: [960, 470], glow2C: LIN.luo, glow2A: 0.04 * (1 - form), glow2P: [1300, 700], glow2R: 900, vign: 0.45 - build * 0.2 });
    if (beat >= 372) this.setBg({ base: [0, 0, 0], glowA: 0, glow2A: 0, vign: 0.6 });
    this.bg.render(renderer, out);

    // ---- heartbeat ----
    let beatP = 0;
    if (beat >= 339.5) beatP = pulse(t, B(Math.floor(beat)), 0.3) * (beat >= 340 ? 1 : 0.5);

    // ---- positions: globe → heart ----
    const spin = t * 0.18 + build * build * 6;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), spin);
    const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
    const qh = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), lerp(wrap(spin), Math.sin(t * 0.35) * 0.5, form) + build * build * 6);
    const hs = 1 + beatP * 0.07;
    for (let i = 0; i < this.P.length; i++) {
      const g = this.v3.copy(this.globe[i]!).applyQuaternion(q);
      const gx = g.x, gy = g.y, gz = g.z;
      const h = this.heart.verts[i]!.clone().multiplyScalar(hs).applyQuaternion(qh);
      const k = clamp(form * 1.5 - hash(i, 5) * 0.5);
      const kk = ease.inOutCubic(k);
      this.P[i]!.set(lerp(gx, h.x, kk), lerp(gy, h.y, kk) + (reach ? 60 : 0) * form, lerp(gz, h.z, kk));
    }
    const camD = lerp(2700, 2300, form) + prog(t, B(342), B(345), ease.inOutCubic) * 550 + build * 900;
    this.st.lookAt(Math.sin(t * 0.1) * 120, 160, camD, 0, 40, 0, Math.sin(t * 0.2) * 0.03);

    // ---- arcs / edges ----
    const L3 = this.L3; L3.clear();
    const cols: RGB[] = [LIN.miku, LIN.luo, LIN.rin, LIN.luka, LIN.gumi, LIN.kafu, LIN.magenta];
    const nE = this.heart.edges.length;
    const shown = Math.floor(nE * clamp(prog(t, B(326.2), B(334.5)) * 1.0 + form));
    const aNet = prog(t, B(326), B(326.6)) * (1 - prog(t, B(371.6), B(372)));
    const qDim = Math.min(prog(t, B(342.3), B(342.8)), 1 - prog(t, B(350.3), B(350.6)));
    for (let e = 0; e < Math.min(shown, nE); e++) {
      const [ia, ib] = this.heart.edges[e]!;
      const a = this.P[ia]!, b = this.P[ib]!;
      const col = mix3(cols[e % cols.length]!, mul(LIN.ash, 1.2), form * 0.6 * (1 - beatP));
      const bulge = (1 - form) * 0.35;
      const period = 1.4 + hash(e, 3) * 1.6;
      const ph = ((t + hash(e, 4) * period) % period) / period;
      const S = form > 0.98 ? 1 : 18;
      let prev = a.clone();
      for (let s = 1; s <= S; s++) {
        const v = s / S;
        const p = a.clone().lerp(b, v);
        if (bulge > 0) { const len = p.length(); p.normalize().multiplyScalar(len + Math.sin(v * Math.PI) * GR * bulge); }
        const glow = (1 - form) * Math.exp(-Math.pow((v - ph) * 7, 2));
        const g = (1 + glow * 2.5) * (0.55 + form * 0.45) + beatP * 2 + build * 3;
        L3.seg(prev.x, prev.y, prev.z, p.x, p.y, p.z, 1 + glow * 2.5 + beatP * 1.5 + form * 0.4, col[0] * g, col[1] * g, col[2] * g, aNet * (0.16 + glow * 0.5 + form * 0.6) * (1 - qDim * 0.7));
        prev = p;
      }
    }
    // vertices
    for (const p of this.P) { const c = mul(form > 0.5 ? LIN.miku : LIN.bone, 2 + beatP * 3 + build * 3); L3.seg(p.x, p.y, p.z, p.x + 0.5, p.y, p.z, 5 + beatP * 3, c[0], c[1], c[2], aNet * 0.9 * (1 - qDim * 0.7)); }
    // 届け: notes sent out from the heart
    this.fly.length = 0;
    if (reach) {
      const n = beat < 352.5 ? 0 : Math.floor(lerp(60, 260, prog(t, B(352.5), B(366))));
      for (let i = 0; i < n; i++) {
        const per = 1.6 + hash(i, 61) * 1.4;
        const age = ((t - B(352.5)) + hash(i, 62) * per) % per;
        if (t - B(352.5) < age) continue;
        const src = this.P[Math.floor(hash(i, 63) * this.P.length)]!;
        const dir = this.v3.copy(src).normalize();
        const r = age / per;
        const d = 80 + r * (1400 + hash(i, 64) * 1200);
        const x = src.x + dir.x * d, y = src.y + dir.y * d, z = src.z + dir.z * d;
        const col = mul(cols[i % cols.length]!, 4);
        L3.seg(x, y, z, x + dir.x * 40, y + dir.y * 40, z + dir.z * 40, 6, col[0], col[1], col[2], (1 - r) * (1 - build * 0.5));
      }
    }
    // b350: from the tip of the heart a world is built outward — a grid racing across the ground,
    // structures rising behind its front — and then the light goes out of it
    {
      const wb = prog(t, B(350), B(353.2), ease.outCubic);
      const light = 1 - prog(t, B(371), B(372));            // the world stays — and grows — until the build whites out
      const grow = prog(t, B(352.5), B(371));
      const frontA = 1 - prog(t, B(353), B(356)) * 0.6;
      if (wb > 0 && light > 0) {
        const tip = this.P[this.P.length - 1]!;
        const gy = tip.y - 6, R = 5200 * wb;
        const front: RGB = mul(LIN.mikuHi, 3.2), body: RGB = mul(LIN.miku, 1.1), wrm: RGB = [1.6, 1.3, 0.9];
        const NA = 96;
        for (let k = 0; k < NA; k++) {                       // radial lines
          const a0 = (k / NA) * Math.PI * 2, ca = Math.cos(a0), sa = Math.sin(a0);
          const len = R * (0.82 + 0.18 * hash(k, 7));
          let pr = 0;
          for (let s = 1; s <= 24; s++) {
            const r = (s / 24) * len;
            const glow = Math.exp(-Math.pow((len - r) / 260, 2));
            const c = glow > 0.2 ? front : body;
            L3.seg(tip.x + ca * pr, gy, tip.z + sa * pr, tip.x + ca * r, gy, tip.z + sa * r, 1 + glow * 3 * frontA, c[0] * (0.4 + glow * frontA), c[1] * (0.4 + glow * frontA), c[2] * (0.4 + glow * frontA), light * (0.35 + glow * 0.65 * frontA));
            pr = r;
          }
        }
        for (let ri = 1; ri <= 26; ri++) {                   // rings
          const r = ri * 200; if (r > R) break;
          const glow = Math.exp(-Math.pow((R - r) / 300, 2));
          let px = tip.x + r, pz = tip.z;
          for (let k = 1; k <= NA; k++) {
            const a0 = (k / NA) * Math.PI * 2, x = tip.x + Math.cos(a0) * r, z = tip.z + Math.sin(a0) * r;
            L3.seg(px, gy, pz, x, gy, z, 1 + glow * 2.5, body[0] * (0.5 + glow * 2), body[1] * (0.5 + glow * 2), body[2] * (0.5 + glow * 2), light * (0.3 + glow * 0.7));
            px = x; pz = z;
          }
        }
        // structures: the first wave rises behind the front; then the city keeps being built — denser, taller, lit
        const NS = 420 + Math.floor(1500 * grow);
        for (let i = 0; i < NS; i++) {
          const a0 = hash(i, 101) * Math.PI * 2, r = 300 + Math.sqrt(hash(i, 102)) * 4800;
          if (r > R) continue;
          const born = i < 420 ? 0 : clamp((beat - (352.5 + ((i - 420) / 1500) * 18.5)) / 1.0);
          if (born <= 0) continue;
          const rise = ease.outCubic(clamp((R - r) / 700)) * ease.outCubic(born);
          const h = (60 + Math.pow(hash(i, 103), 2.5) * 1300) * rise * (1 + grow * 1.3 * hash(i, 104));
          const x = tip.x + Math.cos(a0) * r, z = tip.z + Math.sin(a0) * r;
          const c = i % 7 === 0 ? wrm : body;
          if (h > 320) {
            // a building: two edges and a roof, facing the heart; lit windows climb it
            const w = 24 + hash(i, 105) * 50, tx = -Math.sin(a0) * w, tz = Math.cos(a0) * w;
            L3.seg(x - tx, gy, z - tz, x - tx, gy + h, z - tz, 1.4, c[0] * 1.2, c[1] * 1.2, c[2] * 1.2, light * 0.8);
            L3.seg(x + tx, gy, z + tz, x + tx, gy + h, z + tz, 1.4, c[0] * 1.2, c[1] * 1.2, c[2] * 1.2, light * 0.8);
            L3.seg(x - tx, gy + h, z - tz, x + tx, gy + h, z + tz, 2.5, front[0], front[1], front[2], light * rise);
            const nw = Math.floor(h / 90);
            for (let k = 0; k < nw; k++) {
              if (hash(i, k, 106) > 0.45 * (0.6 + grow)) continue;
              const wy = gy + 40 + k * 90, wc = WINC[(i + k) % WINC.length]!;
              L3.seg(x - tx * 0.5, wy, z - tz * 0.5, x + tx * 0.5, wy, z + tz * 0.5, 3, wc[0], wc[1], wc[2], light * (0.6 + 0.4 * Math.sin(t * 2 + i + k)));
            }
          } else {
            L3.seg(x, gy, z, x, gy + h, z, 1.6, c[0] * 1.4, c[1] * 1.4, c[2] * 1.4, light * 0.85);
            L3.seg(x - 18, gy + h, z, x + 18, gy + h, z, 3, front[0], front[1], front[2], light * rise);
          }
        }
      }
    }
    L3.render(renderer, out, this.st.cam);

    // ---- 2D ----
    const T = this.T; T.clear();
    const c = T.ctx;
    // nodes: faces and names (fade as they become the heart)
    const nodeA = aNet * (1 - prog(t, B(336.5), B(338.5)));
    const onHeart = 0;   // once it is a heart, nothing hangs on it
    // the heart, made of songs: covers sit on its vertices
    if (onHeart > 0) {
      HEART_COVERS.forEach((id, j) => {
        const p3 = this.P[this.coverV[j]!]!;
        const front = this.v3.copy(p3).sub(this.st.cam.position).dot(p3) < 0;
        const sc = this.scr(p3);
        if (sc.z > 1) return;
        const R = 22 + beatP * 3;
        c.save(); c.globalAlpha = onHeart * (front ? 0.95 : 0.25) * prog(t, B(337.5 + j * 0.08), B(338.2 + j * 0.08));
        c.beginPath(); c.arc(sc.x, sc.y, R, 0, Math.PI * 2); c.save(); c.clip();
        drawCover(c, this.cover(id), sc.x - R, sc.y - R, R * 2, R * 2);
        c.restore(); c.strokeStyle = rgba('mikuHi', 0.9); c.lineWidth = 1.5; c.stroke();
        c.restore();
      });
    }
    if (nodeA > 0 || onHeart > 0) {
      NODES.forEach((n, i) => {
        const born = 326.4 + hash(i, 9) * 5.5;
        const k = prog(t, B(born), B(born + 0.4), ease.outCubic);
        if (k <= 0) return;
        const p3 = this.P[this.nodeV[i]!]!;
        const front = this.v3.copy(p3).sub(this.st.cam.position).dot(p3) < 0;
        const s = this.scr(p3);
        if (s.z > 1) return;
        const a = (n.img ? Math.max(nodeA, onHeart) : nodeA) * k * (front ? 1 : 0.25);
        c.save(); c.globalAlpha = a;
        if (n.img) {
          const R = (n.img && onHeart > nodeA ? 30 : 36) * k;
          c.beginPath(); c.arc(s.x, s.y - R - 8, R, 0, Math.PI * 2); c.save(); c.clip();
          drawCover(c, this.char(n.img), s.x - R, s.y - R * 2 - 8, R * 2, R * 3, { focusY: 0.05 });
          c.restore();
          c.strokeStyle = rgba(n.col as 'miku', 1); c.lineWidth = 2; c.stroke();
          c.font = font(F.jp(900), 18); c.textAlign = 'center'; c.fillStyle = rgba('bone', 1); c.fillText(n.who, s.x, s.y + 22);
        } else if (nodeA > 0) {
          c.font = font(F.jp(900), 22); c.fillStyle = rgba('bone', 0.95); c.fillText(n.who, s.x + 10, s.y - 6);
        }
        if (!n.img && nodeA > 0) label(c, n.city, s.x + 10, s.y + 14, { size: 10, color: rgba('ash', 1) });
        c.restore();
      });
      label(c, 'NETWORK · 创作者 / 歌姬 / 听众', 96, 110, { color: rgba('miku', 1), size: 15, alpha: nodeA });
      const nArc = Math.floor(lerp(0, 1, prog(t, B(326), B(336))) * 12480 + (beat - 326) * 200);
      label(c, `${nArc.toLocaleString('en-US')} CONNECTIONS`, 96, 140, { size: 13, alpha: nodeA });
    }
    // the 心 lane, written at last — by the heart's own beat
    if (lane > 0 && build < 1) {
      const la = lane * (1 - prog(t, B(VQ - 0.3), B(VQ + 0.2)));   // the 心 lane keeps beating under the questions
      const x = 560, y = 930, w = 800, lh = 46;
      c.save(); c.globalAlpha = la;
      c.fillStyle = 'rgba(57,197,187,0.10)'; c.fillRect(x, y, w, lh);
      c.font = font(F.jp(900), 30); c.fillStyle = rgba('miku', 1); c.textAlign = 'right'; c.fillText('心', x - 16, y + 34);
      c.textAlign = 'left';
      c.strokeStyle = rgba('mikuHi', 1); c.lineWidth = 2.4; c.shadowColor = 'rgba(57,197,187,1)'; c.shadowBlur = 12;
      c.beginPath();
      const upto = clamp(prog(t, B(340), B(342)));
      for (let k = 0; k <= 400 * upto; k++) {
        const u = k / 400;
        const bb = beat - (1 - u) * 4;
        const d = (bb - Math.floor(bb)) * 6;
        const v = d < 0.4 ? -d * 1.5 : d < 0.8 ? -0.6 + (d - 0.4) * 5 : d < 1.2 ? 1.4 - (d - 0.8) * 4.5 : d < 1.6 ? -0.4 + (d - 1.2) : 0;
        const px = x + u * w, py = y + lh / 2 - v * lh * 0.4;
        if (k) c.lineTo(px, py); else c.moveTo(px, py);
      }
      c.stroke(); c.shadowBlur = 0;
      label(c, '写入：∞ / 書き込み：∞', x + w + 18, y + 31, { color: rgba('miku', 1), size: 17 });
      c.restore();
    }
    // title lines, huge
    TITLE_LINES.forEach((n) => {
      const ln = this.D.lyrics[n - 1]; if (!ln) return;
      const next = this.D.lyrics[n]?.start ?? ln.start + 4;
      const t0 = Math.max(ln.start, B(326.2)), t1 = next - 0.1;
      if (t < t0 - 0.02 || t > t1) return;
      const a = Math.min(clamp((t - t0) / 0.15), clamp((t1 - t) / 0.2));
      const chars = Array.from(ln.text);
      c.save(); c.globalAlpha = a; c.textAlign = 'left';
      c.font = font(F.jpSerif(), 96);
      const full = c.measureText(ln.text).width;
      let x = W / 2 - full / 2;
      const y = lane > 0 ? 850 : 990;
      c.shadowColor = 'rgba(0,0,0,0.85)'; c.shadowBlur = 26;
      chars.forEach((ch, i) => { const kk = ease.outExpo(clamp((t - (t0 + i * 0.09)) / 0.18)); if (kk > 0) { c.fillStyle = rgba('bone', 1); c.fillText(ch, x, y - (1 - kk) * 40); } x += c.measureText(ch).width; });
      if (ln.zh) { c.font = font(F.sc(700), 30); c.textAlign = 'center'; c.fillStyle = rgba('miku', 1); c.fillText(ln.zh, W / 2, y + 46); }
      c.restore();
    });
    this.ov.clock = false;
    // the question
    const qi = beat >= QB && beat < VQ ? Math.floor((beat - QB) / QS) : -1;
    if (qi >= 0) {
      const [zh, ja] = Q[qi]!;
      const lt = t - B(QB + qi * QS);
      const k = ease.outExpo(clamp(lt / 0.12));
      c.save(); c.textAlign = 'center'; c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 24;
      c.font = font(F.scSerif(), lerp(130, 104, k)); c.fillStyle = rgba('bone', 1); c.fillText(zh, W / 2, 470);
      c.font = font(F.jp(900), 40); c.fillStyle = rgba('ash', 1); c.fillText(ja, W / 2, 545);
      c.restore();
      label(c, `${qi + 1} / 8 · 讲稿 19 页`, W / 2, 640, { align: 'center', color: rgba('ash', 0.8) });
      for (let j = 0; j < qi; j++) label(c, Q[j]![0], 96, 200 + j * 34, { size: 16, color: rgba('graphite', 1), spacing: 1 });
    }
    // the drum: slow → fast with the build, then fast → slow in the silence
    if (beat >= VQ) {
      // VOCALOID = ? lands on the drum's centre line and simply waits there — the build then spins it away
      const s0 = drumPos(beat), sp = drumSpeed(beat);
      const blur = clamp((sp - 4) / 14);
      const a = prog(t, B(D0 - 0.6), B(D0 + 0.3));
      const land = ease.outExpo(clamp((beat - VQ) / 0.3));
      const cy = H / 2 - 10, R = 300;
      c.save();
      // a dark reading band behind the drum, so the names stay legible over the blazing city
      {
        const ba = Math.max(a, land * 0.6) * 0.82;
        const g = c.createLinearGradient(0, cy - 230, 0, cy + 230);
        g.addColorStop(0, 'rgba(2,4,6,0)'); g.addColorStop(0.3, `rgba(2,4,6,${ba * 0.75})`); g.addColorStop(0.5, `rgba(2,4,6,${ba})`); g.addColorStop(0.7, `rgba(2,4,6,${ba * 0.75})`); g.addColorStop(1, 'rgba(2,4,6,0)');
        c.fillStyle = g; c.fillRect(0, cy - 230, W, 460);
      }
      c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let k = Math.floor(s0) - 4; k <= Math.floor(s0) + 5; k++) {
        const d = k - s0, ang = d * 0.36;
        if (Math.abs(ang) > 1.45) continue;
        const first = k === 0;
        if (!first && a <= 0) continue;
        const word = wordAt(k);
        const y = cy + Math.sin(ang) * R, sc = Math.cos(ang);
        const center = Math.max(0, 1 - Math.abs(d) * 1.6);
        const size = VQ_FONT * sc;
        c.font = font(F.jp(900), size);
        const col = (k === TARGET && beat > DS - 0.4) || (first && beat < D0 && frameIdx(t) % 6 < 3) ? rgba('miku', 1) : center > 0.3 ? rgba('bone', 1) : rgba('ash', 1);
        const wa = first ? Math.max(a, land) : a;
        const zs = first && beat < D0 + 0.5 ? lerp(1.3, 1, land) : 1;
        // the motion smear trails behind; the word itself is always drawn solid on top, so it stays readable at speed
        const copies = 1 + Math.floor(blur * 5);
        for (let m = copies - 1; m >= 0; m--) {
          const base = wa * sc * sc * (0.3 + 0.7 * center);
          c.globalAlpha = Math.min(1, m === 0 ? base * (1 + center * 0.4) : base * 0.16 * (1 - m / (copies + 1)));
          c.fillStyle = col; c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = m === 0 ? 28 : 0;
          c.save(); c.translate(W / 2, y - m * blur * 22); c.scale(zs, zs * (1 + blur * 0.12)); c.fillText(word, 0, 0); c.restore();
        }
      }
      // the window of the drum
      c.globalAlpha = a; c.strokeStyle = rgba('bone', 0.25); c.lineWidth = 1;
      c.beginPath(); c.moveTo(W / 2 - 700, cy - 78); c.lineTo(W / 2 + 700, cy - 78); c.moveTo(W / 2 - 700, cy + 78); c.lineTo(W / 2 + 700, cy + 78); c.stroke();
      c.restore();
      if (beat < D1) label(c, 'SPIN · 1961 — 2026', W / 2, cy + 120, { align: 'center', size: 12, color: rgba('ash', 1), alpha: a * (1 - blur) });
    }
    comp.draw(renderer, T.upload(), out);

    this.ov.lyricY = H - 40;
    if (beat >= 371.8) this.ov.lyrics = false;
    const hit = beatP * 0.5 + pulse(t, B(Math.floor(beat)), 0.07) * build;
    return {
      flash: pulse(t, B(326), 0.08) * 0.22 + pulse(t, B(340), 0.1) * 0.15 + build * build * 0.22 + pulse(t, B(VQ), 0.1) * 0.1 + pulse(t, B(DS), 0.06) * 0.03,
      bloom: 0.7 + build * 0.35 + beatP * 0.2, grain: 0.06, vignette: 0.4, ca: 1.2 + hit * 4 + build * 3,
      shake: [hit * 10 * (hash(frameIdx(t), 1) - 0.5), hit * 10 * (hash(frameIdx(t), 2) - 0.5)] as [number, number],
      zoom: 1 + build * 0.08 + hit * 0.02,
    };
  }
}
