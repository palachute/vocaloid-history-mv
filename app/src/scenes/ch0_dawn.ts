// CHAPTER 0 · 黎明之前 (bars 0–16). Monochrome.
//  b0–12   a flat line; 声 slowly condenses around it… and shatters on b12 into the phoneme sheet.
//  b12–20  1961: an IBM 7090-series computer at Bell Labs sings Daisy Bell (punch card, a cell dividing by the beat).
//  b20.5   黎明之前 (fast in, held, cut on the b24 downbeat).
//  b24–32  2000: YAMAHA × UPF, codename "Daisy".
//  b32–46  archive cards 2003–2007 (MEIKO, KAITO step out of their cards).
//  b46–54  VOCALOID2: a 3D flight through the parameter lanes, one lane per beat — VEL DYN BRE …
//  b54–58  …the last lane is empty. A hollow 心, drawn in dashes, with a flat ECG through it.
//  b58–62  the hollow 心 implodes; a teal pinprick is born at its centre: CV01.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import { LIN, rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { clamp, ease, frameIdx, hash, lerp, noise1, prog, pulse, smoothstep } from '../engine/util';
import { Chapter, W, H } from './kit/base';
import { archiveCard, clockText, drawCover, label } from './kit/draw';
import { chapterTitle } from './kit/title';
import { BIRTH } from './kit/birth';
import { PARAMS, drawRoll, hashNotes } from './kit/roll';
import { mul, ring, voiceLine, type RGB } from './kit/lines';
import { LineBatch } from '../engine/lines';
import { Stage } from './kit/three3d';

const CARDS = [
  { beat: 32, year: '2003', name: 'VOCALOID', sub: '歌声合成技術 発表', maker: 'YAMAHA', color: '#EEE9DF' },
  { beat: 34, year: '2004', name: 'LEON', sub: '英語 · 男声', maker: 'ZERO-G', color: '#9C978F' },
  { beat: 36, year: '2004', name: 'LOLA', sub: '英語 · 女声', maker: 'ZERO-G', color: '#9C978F' },
  { beat: 38, year: '2004', name: 'MIRIAM', sub: '英語 · 女声', maker: 'ZERO-G', color: '#9C978F' },
  { beat: 40, year: '2004', name: 'MEIKO', sub: '初の日本語ボーカロイド', maker: 'CRYPTON', color: '#D8322F' },
  { beat: 42.5, year: '2006', name: 'KAITO', sub: '日本語 · 男声', maker: 'CRYPTON', color: '#3367D6' },
  { beat: 45, year: '2007', name: 'VOCALOID2', sub: '新エンジン', maker: 'YAMAHA', color: '#EEE9DF' },
];
const KANA = 'あ い う え お か き く け こ さ し す せ そ た ち つ て と な に ぬ ね の は ひ ふ へ ほ ま み む め も や ゆ よ ら り る れ ろ わ を ん'.split(' ');
const ROMA = 'a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo'.split(' ');
const LANE_JA: Record<string, string> = { VEL: 'ベロシティ · 力度', DYN: 'ダイナミクス · 强弱', BRE: 'ブレシネス · 气声', BRI: 'ブライトネス · 明亮', CLE: 'クリアネス · 清晰', OPE: 'オープニング · 开口', GEN: 'ジェンダー · 性别', POR: 'ポルタメント · 滑音', PIT: 'ピッチベンド · 音高', PBS: 'ベンドセンス · 弯音' };

const dayOf = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d) / 86400000;
const fmt = (day: number) => { const d = new Date(Math.floor(day) * 86400000); return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`; };

// tunnel geometry
const LANE_GAP = 900, LW = 2200, LH = 460;
const laneZ = (i: number) => (i < 10 ? -i * LANE_GAP : -9 * LANE_GAP - 2600);
/** beat at which the camera reaches lane i — accelerating (quarters, then eighths); lane 10 = 心, where it stops */
const PASS = [49, 50, 51, 51.75, 52.5, 53, 53.5, 54, 54.5, 55];
const passBeat = (i: number) => PASS[Math.min(i, 9)]!;

export default class Ch0Dawn extends Chapter {
  st = new Stage();
  L3 = new LineBatch(60000, { screen2D: false, blend: 'add' });

  /** camera z along the tunnel at beat */
  camZ(beat: number) {
    if (beat < passBeat(0) - 1.2) return 2400;
    const stopZ = laneZ(10) + 1950;
    const b = beat;
    // piecewise: approach, constant flight through lanes, decelerate to a stop in front of lane 10
    const zAt = (i: number) => laneZ(i) + 180; // just in front of the sheet when its beat hits
    if (b < passBeat(0)) return lerp(2400, zAt(0), ease.inQuad(prog(b, passBeat(0) - 1.2, passBeat(0))));
    if (b < passBeat(9)) { let i = 0; while (i < 8 && b >= passBeat(i + 1)) i++; const k = (b - passBeat(i)) / (passBeat(i + 1) - passBeat(i)); return lerp(zAt(i), zAt(i + 1), k); }
    return lerp(zAt(9), stopZ, ease.outCubic(prog(b, passBeat(9), passBeat(9) + 1.4)));
  }

  frame(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp, audio: au } = this.ctx;
    const t = f.t, beat = au.beatAt(t), B = (b: number) => this.bt(b);
    const bone = LIN.bone;
    const tunnel = beat >= 48.3 && beat < 62;
    const tin = prog(t, B(48.3), B(48.9));
    const implode = prog(t, B(58.4), B(61.2), ease.inQuart);
    const dark = prog(t, B(58.5), B(61.8), ease.inCubic);
    this.ov.clock = false;
    this.ov.lyricX = beat < 46 ? 1340 : 960;

    this.resetBg();
    this.setBg({ grid: smoothstep(B(12), B(20), t) * (1 - prog(t, B(44), B(46))), noiseA: 0.6, vign: 0.45 + dark * 0.4,
      scan: prog(t, 0, B(12)) * (1 - prog(t, B(12), B(16))) * 0.8,
      glowC: LIN.ember, glowA: tunnel ? 0.05 * prog(t, B(56), B(57)) * (1 - implode) : 0, glowR: 500,
      base: [0.003 * (1 - dark), 0.003 * (1 - dark), 0.0035 * (1 - dark)] });
    this.bg.render(renderer, out);

    // ---- lines (2D) -------------------------------------------------------------------
    const L = this.L; L.clear();
    const cx = W / 2, cy = H / 2;
    const reach = prog(t, 0.2, B(4), ease.outCubic);
    const cellK = Math.min(prog(t, B(13), B(14), ease.outCubic), 1 - prog(t, B(19), B(20.5)));
    const portrait = Math.min(prog(t, B(40), B(41)), 1 - prog(t, B(44.4), B(45.2)));
    const lineA = 0.9 * (1 - prog(t, B(45), B(46.5))) * (1 - portrait * 0.75);
    if (lineA > 0.01) {
      const sh = beat < 12 ? 4 + prog(t, B(4), B(12)) * 18 * (1 + pulse(t, B(11.5), 0.3) * 2) : beat < 24 ? 22 : lerp(26, 70, prog(t, B(24), B(32)));
      const fr = beat < 24 ? 2.5 : 5 + Math.floor(beat) % 3;
      voiceLine(L, t, { x0: cx - W * 0.5 * reach, x1: cx + W * 0.5 * reach, y: cy, amp: sh * (1 - cellK * 0.8), color: mul(bone, 1.15), width: 1.8, alpha: lineA, freq: fr, speed: beat < 24 ? 1.6 : 4.5, seed: Math.floor(beat / 2) });
    }
    if (cellK > 0) {
      const nb = beat - 14;
      const gen = clamp(Math.floor(nb), 0, 4);
      const n = 1 << gen;
      const split = ease.outCubic(clamp(nb - gen));
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + gen * 0.4;
        const dist = gen === 0 ? 0 : 60 * Math.sqrt(n) * lerp(0.6, 1, split);
        const r = (90 / Math.sqrt(n)) * (0.9 + 0.1 * Math.sin(t * 3 + i));
        ring(L, cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, r * cellK, mul(bone, 1.2), { width: 2, alpha: cellK * 0.9, seg: 90, wobble: 5, t: t + i });
      }
    }
    // the teal pinprick, born at the centre of the hollow 心
    const pin = prog(t, B(60), B(62), ease.inExpo);
    if (pin > 0) {
      const m = LIN.miku, r = 2 + pin * 7;
      ring(L, cx, cy, r, mul(m, 8), { width: 2.5, alpha: pin, seg: 32 });
      L.seg2(cx - 0.1, cy, cx + 0.1, cy, r * 1.4, mul(m, 12 * pin), 1);
    }
    L.render(renderer, out);

    // ---- 3D: the parameter tunnel ------------------------------------------------------
    const camZ = this.camZ(beat);
    if (tunnel && implode < 1) {
      const L3 = this.L3; L3.clear();
      const sway = Math.sin(t * 0.9) * 60;
      for (let i = 0; i <= 10; i++) {
        const z = laneZ(i);
        if (z > camZ + 50 || z < camZ - 9000) continue;
        const empty = i === 10;
        const lit = empty ? 0 : pulse(t, B(i ? passBeat(i - 1) : passBeat(0) - 1), 0.25);
        const near = clamp(1 - (camZ - z) / 6000);
        const a = (0.25 + 0.75 * near) * (1 - implode) * tin;
        const fc: RGB = empty ? mul(LIN.ember, 1.6) : mul(bone, 0.5 + lit * 2);
        // frame
        const x0 = -LW / 2, x1 = LW / 2, y0 = -LH / 2, y1 = LH / 2;
        if (!empty) {
          L3.seg(x0, y0, z, x1, y0, z, 1.2, fc[0], fc[1], fc[2], a * 0.6); L3.seg(x0, y1, z, x1, y1, z, 1.2, fc[0], fc[1], fc[2], a * 0.6);
          L3.seg(x0, y0, z, x0, y1, z, 1.2, fc[0], fc[1], fc[2], a * 0.6); L3.seg(x1, y0, z, x1, y1, z, 1.2, fc[0], fc[1], fc[2], a * 0.6);
          // the lane's waveform (each parameter its own character)
          let px = 0, py = 0;
          const wc: RGB = mul(i % 3 === 2 ? LIN.mikuHi : bone, 1.2 + lit * 4);
          for (let k = 0; k <= 160; k++) {
            const u = k / 160;
            const v = i === 0 ? (hash(Math.floor(u * 24), i) - 0.5) * 1.4 // velocity: stepped
              : i === 8 ? Math.sin(u * 9 + t * 2) * 0.6 + noise1(u * 20 + t, i) * 0.3 // pitch: sung curve
                : noise1(u * (4 + i) + t * 0.5, i) * 0.9 + Math.sin(u * (6 + i * 2) + t * (1 + i * 0.2)) * 0.25;
            const x = lerp(x0 + 60, x1 - 60, u), y = v * LH * 0.38;
            if (k) L3.seg(px, py, z, x, y, z, 2.2 + lit * 2, wc[0], wc[1], wc[2], a);
            px = x; py = y;
          }
        } else {
          // the empty lane: a dashed baseline — nothing written
          const dash = 40, gap = 34;
          for (let x = x0; x < x1; x += dash + gap) L3.seg(x, 0, z, Math.min(x + dash, x1), 0, z, 2.4, fc[0], fc[1], fc[2], a * (0.7 + 0.3 * Math.sin(t * 6)));
          for (let x = x0; x < x1; x += 18) { L3.seg(x, y0, z, Math.min(x + 8, x1), y0, z, 1, fc[0], fc[1], fc[2], a * 0.5); L3.seg(x, y1, z, Math.min(x + 8, x1), y1, z, 1, fc[0], fc[1], fc[2], a * 0.5); }
        }
      }
      // rails: the lane edges run away into the distance
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) L3.seg(sx * LW / 2, sy * LH / 2, 600, sx * LW / 2, sy * LH / 2, laneZ(10), 1, bone[0] * 0.4, bone[1] * 0.4, bone[2] * 0.4, 0.35 * (1 - implode));
      const roll = Math.sin(t * 0.6) * 0.04 + (beat < passBeat(9) ? (hash(Math.floor(beat)) - 0.5) * 0.02 : 0);
      this.st.lookAt(sway, 40, camZ + implode * -1200, sway * 0.3, 0, camZ - 2000, roll);
      L3.render(renderer, out, this.st.cam);
    }

    // ---- 2D ------------------------------------------------------------------------------
    const T = this.T; T.clear();
    const c = T.ctx;
    c.textBaseline = 'alphabetic';

    // 声 condenses out of the quiet, then shatters on b12
    if (beat < 13.5) {
      const form = prog(t, B(2), B(11), ease.inOutCubic);
      const shatter = prog(t, B(12), B(13.5), ease.outCubic);
      const tremble = prog(t, B(10.5), B(12));
      c.save();
      c.font = font(F.jpSerif(), 760); c.textAlign = 'center'; c.textBaseline = 'middle';
      const slices = 18;
      for (let s = 0; s < slices; s++) {
        c.save();
        const sy = 140 + (s * 800) / slices;
        c.beginPath(); c.rect(0, sy, W, 800 / slices + 1); c.clip();
        const dx = (hash(s, 3) - 0.5) * 1400 * shatter + (hash(s, frameIdx(t)) - 0.5) * 10 * tremble;
        const dy = (hash(s, 4) - 0.5) * 120 * shatter;
        c.translate(cx + dx, cy + 20 + dy);
        // outline first (drawn by the line), fill follows
        c.globalAlpha = (1 - shatter) * clamp(form * 1.5);
        c.lineWidth = 1.5; c.strokeStyle = rgba('bone', 0.7);
        c.setLineDash([2000 * form, 4000]); c.strokeText('声', 0, 0); c.setLineDash([]);
        c.globalAlpha = (1 - shatter) * ease.inCubic(form) * 0.95;
        c.fillStyle = rgba('bone', 1); c.fillText('声', 0, 0);
        c.restore();
      }
      c.restore();
      const la = Math.min(prog(t, B(5), B(7)), 1 - prog(t, B(11.5), B(12)));
      if (la > 0) {
        label(c, '声 / こえ / VOICE', 96, H - 96, { alpha: la, color: rgba('bone', 0.8), spacing: 8 });
        label(c, '一切从一个声音开始 · すべては一つの声から', 96, H - 66, { alpha: la, size: 13 });
      }
    }
    // punched-card texture (1961)
    const card = Math.min(prog(t, B(12), B(14)), 1 - prog(t, B(19.5), B(20.5))) * 0.16;
    if (card > 0) {
      c.fillStyle = rgba('bone', card);
      for (let col = 0; col < 80; col++) for (let row = 0; row < 12; row++) {
        if (hash(col, row, 1961) < 0.72) continue;
        c.fillRect(160 + col * 20, 700 + row * 22, 8, 14);
      }
      c.fillStyle = rgba('bone', card * 0.5);
      c.font = font(F.mono(500), 12);
      for (let col = 0; col < 80; col += 10) c.fillText(String(col), 160 + col * 20, 690);
    }
    const d61 = Math.min(prog(t, B(13), B(14)), 1 - prog(t, B(19.5), B(20.5)));
    if (d61 > 0) {
      label(c, 'DAISY BELL', cx + 30, cy - 40, { alpha: d61, color: rgba('bone', 0.8), spacing: 8 });
      // the machine itself: an IBM 7090-series mainframe in line drawing — tape drives turning, console blinking
      const mk = ease.outCubic(prog(t, B(13), B(14.2)));
      c.save(); c.globalAlpha = d61; c.translate(1110 + (1 - mk) * 60, 196);
      c.strokeStyle = rgba('bone', 0.75); c.lineWidth = 1.5;
      const cw = 104, chh = 290;
      for (let k = 0; k < 6; k++) {
        const x = k * (cw + 8);
        c.strokeRect(x + 0.5, 0.5, cw, chh);
        c.fillStyle = 'rgba(10,10,11,0.9)'; c.fillRect(x + 1, 1, cw - 1, chh - 1);
        if (k < 2) { // tape drives
          c.strokeRect(x + 10.5, 16.5, cw - 20, 190);
          for (const ry of [66, 156]) {
            const rot = t * (k ? 2.6 : 3.4) * (ry > 100 ? -1 : 1);
            c.beginPath(); c.arc(x + cw / 2, ry, 34, 0, Math.PI * 2); c.stroke();
            c.beginPath(); c.arc(x + cw / 2, ry, 8, 0, Math.PI * 2); c.stroke();
            for (let sp = 0; sp < 3; sp++) { const a2 = rot + sp * 2.094; c.beginPath(); c.moveTo(x + cw / 2 + Math.cos(a2) * 8, ry + Math.sin(a2) * 8); c.lineTo(x + cw / 2 + Math.cos(a2) * 32, ry + Math.sin(a2) * 32); c.stroke(); }
          }
        } else if (k === 3) { // console lights
          for (let gy = 0; gy < 9; gy++) for (let gx = 0; gx < 6; gx++) {
            const on = hash(gx, gy, Math.floor(t * 9)) > 0.55;
            c.fillStyle = on ? (hash(gx, gy) > 0.7 ? rgba('ember', 1) : rgba('bone', 0.95)) : 'rgba(238,233,223,0.12)';
            c.fillRect(x + 14 + gx * 14, 24 + gy * 16, 6, 6);
          }
          c.strokeRect(x + 10.5, 190.5, cw - 20, 40);
        } else { // vents
          for (let v = 0; v < 10; v++) { c.beginPath(); c.moveTo(x + 14, 220 + v * 7); c.lineTo(x + cw - 14, 220 + v * 7); c.stroke(); }
        }
      }
      c.font = font(F.archivo(112, 900), 76); c.fillStyle = rgba('bone', 1); c.textAlign = 'left';
      c.fillText('IBM 7090 / 7094', 0, -40);
      label(c, '1961 · BELL LABS · 计算机第一次唱歌 / コンピュータが初めて歌った', 2, -12, { size: 15, color: rgba('bone', 0.85), spacing: 3 });
      c.restore();
    }
    // 2000: YAMAHA × UPF, codename Daisy
    const y2k = Math.min(prog(t, B(24), B(24.5)), 1 - prog(t, B(31), B(32)));
    if (y2k > 0) {
      c.save(); c.globalAlpha = y2k;
      label(c, '2000.03 · YAMAHA × UNIVERSITAT POMPEU FABRA', 96, 236, { color: rgba('bone', 0.9), size: 17, spacing: 5 });
      label(c, 'CODENAME: "DAISY"', 96, 268, { color: rgba('ash', 1), size: 15, spacing: 6 });
      label(c, '四十年后，同一个名字 / 四十年後、同じ名前', 96, 296, { size: 13, spacing: 3 });
      c.restore();
    }
    // phoneme specimen sheet: what 声 broke into
    const sheetA = Math.min(prog(t, B(12), B(13.5)), 1 - prog(t, B(32), B(34))) * (beat < 24 ? 0.4 : 0.55);
    if (sheetA > 0.01) {
      for (let r = 0; r < 18; r++) {
        const y = 80 + r * 52;
        if (Math.abs(y - cy) < 110) continue;
        const src = r % 2 ? ROMA : KANA;
        c.font = r % 2 ? font(F.mono(300), 15) : font(F.jp(300), 17);
        const off = ((t * (18 + (r % 5) * 7) * (r % 2 ? 1 : -1)) % 600) - 300;
        const lit = Math.floor(beat * 2 + r * 3) % 17;
        let x = -200 + off;
        for (let j = 0; j < 40; j++) {
          const s = src[(j + r * 3) % src.length]!;
          c.fillStyle = j % 17 === lit ? rgba('bone', sheetA * 1.6) : rgba('graphite', sheetA);
          c.fillText(s, x, y);
          x += c.measureText(s).width + 26;
          if (x > W + 50) break;
        }
      }
    }
    // the first voices step out of their cards
    if (portrait > 0) {
      const id = beat < 42.5 ? 'meiko' : 'kaito';
      const t0 = beat < 42.5 ? B(40) : B(42.5);
      const k = prog(t, t0, t0 + 0.5, ease.outCubic);
      c.save(); c.globalAlpha = portrait * k;
      drawCover(c, this.char(id), 230 + (1 - k) * 60, 80, 620, 920, { fit: 'contain', reveal: prog(t, t0, t0 + 0.8), seed: id.length, mono: lerp(1, 0.15, prog(t, t0 + 0.2, t0 + 1.4)) });
      c.restore();
    }
    // archive cards (fly off into the tunnel at b45–46)
    const fly = prog(t, B(44.6), B(45.6), ease.inCubic);
    CARDS.forEach((cd, i) => {
      const t0 = B(cd.beat);
      if (t < t0 - 0.02 || fly >= 1) return;
      const st = prog(t, t0, t0 + 0.16, ease.outCubic);
      const fl = pulse(t, t0, 0.07);
      const bx = 1180 + (i % 2) * 60, by = 110 + i * 100;
      const x = lerp(bx, 700, fly), y = lerp(by, 330, fly);
      const sc = lerp(1.35, 1, st) * (1 - fly * 0.9);
      const a = clamp(st * 1.5) * (1 - fly);
      if (a <= 0.005) return;
      c.save(); c.translate(x, y); c.scale(sc, sc); c.globalAlpha = a;
      archiveCard(c, 0, 0, { ...cd, flash: fl });
      c.restore();
    });

    // VOCALOID2's editor (2007): the archive is loaded into it — then we push into its parameter panel
    const edA = Math.min(prog(t, B(45), B(45.6), ease.outCubic), 1 - prog(t, B(48.4), B(48.95)));
    if (edA > 0) {
      const push = prog(t, B(47.4), B(48.95), ease.inCubic);
      const px = 960, py = 752;
      c.save();
      c.globalAlpha = edA;
      c.translate(px, py); c.scale(1 + push * 7, 1 + push * 7); c.translate(-px, -py);
      this.editor(c, t, beat);
      c.restore();
      const la = edA * (1 - push);
      label(c, '2007.01 · VOCALOID2', 96, H - 60, { color: rgba('bone', 0.85), size: 15, alpha: la });
    }
    // tunnel labels: each lane names itself as we pass it
    if (tunnel && implode < 1) {
      for (let i = 0; i < 10; i++) {
        const pb = passBeat(i);
        const pp = i ? passBeat(i - 1) : pb - 1;
        const a = Math.min(prog(beat, pp - 0.05, pp + 0.05), 1 - prog(beat, pb - 0.04, pb + 0.02));
        if (a <= 0) continue;
        const k = ease.outExpo(prog(beat, pp, pp + 0.3));
        c.save(); c.globalAlpha = a;
        c.font = font(F.archivo(112, 900), 150); c.fillStyle = rgba(i === 8 ? 'mikuHi' : 'bone', 1);
        c.fillText(PARAMS[i]!, 96 + (1 - k) * 40, cy + 60);
        c.font = font(F.jp(300), 24); c.fillStyle = rgba('ash', 1); c.fillText(LANE_JA[PARAMS[i]!]!, 100, cy + 104);
        c.restore();
      }
      // the count, top-left (all of them… but one)
      const n = PASS.filter((b) => beat >= b - 1).length + (beat >= 56 ? 1 : 0);
      const ca = prog(t, B(48.6), B(49)) * (1 - prog(t, B(56.2), B(56.6)));
      if (ca > 0) {
        label(c, 'VOCALOID2 · 2007 · VOICE PARAMETERS', 96, 110, { color: rgba('bone', 0.9), size: 15, alpha: ca });
        c.save(); c.globalAlpha = ca; c.font = font(F.archivo(62, 900), 120); c.fillStyle = rgba('bone', 1);
        c.fillText(`${String(n).padStart(2, '0')} / 11`, 96, 240); c.restore();
      }
      // the empty lane: the one thing it cannot be told
      const ea = prog(t, B(56), B(56.4)) * (1 - implode);
      if (ea > 0) {
        const p = this.project(-LW / 2, 0, laneZ(10))!;
        c.save(); c.globalAlpha = ea;
        c.font = font(F.jpSerif(), 72); c.fillStyle = rgba('ember', 1); c.textAlign = 'right'; c.fillText('心', p.x - 24, p.y + 26);
        c.restore();
        const blink = frameIdx(t) % 20 < 13 ? 1 : 0.25;
        label(c, 'PARAMETER NOT FOUND', cx, cy + 150, { align: 'center', color: rgba('ember', 1), size: 18, spacing: 10, alpha: ea * blink });
      }
    }
    // the hollow 心: drawn in dashes; a flat ECG passes through it; then it implodes into the pinprick
    const hk = prog(t, B(56.5), B(57.6), ease.outCubic);
    if (hk > 0 && implode < 1) {
      const sc = lerp(1.15, 1, hk) * (1 - implode) + 0.001;
      c.save();
      c.translate(cx, cy - 10); c.scale(sc, sc); c.rotate(implode * 1.4);
      c.font = font(F.jpSerif(), 820); c.textAlign = 'center'; c.textBaseline = 'middle';
      // echoes: the same absence, receding into the tunnel
      for (let e = 5; e >= 1; e--) {
        const es = 1 - e * 0.11 - Math.sin(t * 1.3 + e) * 0.01;
        c.save(); c.scale(es, es); c.globalAlpha = hk * (1 - implode) * (0.35 - e * 0.055);
        c.setLineDash([10, 22]); c.lineDashOffset = t * 30 * (e % 2 ? 1 : -1);
        c.lineWidth = 2 / es; c.strokeStyle = rgba('ember', 1); c.strokeText('心', 0, 0);
        c.restore();
      }
      c.globalAlpha = hk * (1 - implode * 0.5);
      c.setLineDash([22, 18]); c.lineDashOffset = -t * 40;
      c.lineWidth = 3; c.strokeStyle = rgba('ember', 1); c.strokeText('心', 0, 0);
      c.setLineDash([]);
      c.restore();
      // flat line through the hollow (no heartbeat), one faint attempt per bar
      const ecg = hk * (1 - implode);
      c.save(); c.globalAlpha = ecg; c.strokeStyle = rgba('bone', 0.85); c.lineWidth = 2; c.beginPath();
      for (let x = 0; x <= W; x += 6) {
        const tryBeat = pulse(t, B(58), 0.25) * Math.exp(-Math.pow((x - cx) / 40, 2)) * 40;
        const y = cy + 40 - tryBeat * Math.sin((x - cx) / 9);
        if (x) c.lineTo(x, y); else c.moveTo(x, y);
      }
      c.stroke(); c.restore();
      // the editor answers like an editor: a system dialog, nothing more
      const ta = Math.min(prog(t, B(57.2), B(57.35)), 1 - implode * 2.5);
      if (ta > 0) {
        const dx = 1220, dy = 120, dw = 600, dh = 210;
        c.save(); c.globalAlpha = ta;
        c.fillStyle = 'rgba(18,18,20,0.96)'; c.fillRect(dx, dy, dw, dh);
        c.strokeStyle = rgba('bone', 0.5); c.lineWidth = 1; c.strokeRect(dx + 0.5, dy + 0.5, dw, dh);
        c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(dx, dy, dw, 34);
        label(c, 'VOCALOID2 Editor', dx + 14, dy + 23, { size: 13, color: rgba('bone', 0.85), spacing: 2 });
        label(c, '×', dx + dw - 22, dy + 23, { size: 14, color: rgba('ash', 1), spacing: 0 });
        c.strokeStyle = rgba('ember', 1); c.lineWidth = 3; c.beginPath(); c.moveTo(dx + 48, dy + 64); c.lineTo(dx + 74, dy + 110); c.lineTo(dx + 22, dy + 110); c.closePath(); c.stroke();
        c.font = font(F.mono(500), 22); c.fillStyle = rgba('ember', 1); c.textAlign = 'center'; c.fillText('!', dx + 48, dy + 104); c.textAlign = 'left';
        c.font = font(F.jp(900), 26); c.fillStyle = rgba('bone', 1); c.fillText('パラメータ「心」が見つかりません。', dx + 96, dy + 84);
        c.font = font(F.sc(400), 22); c.fillStyle = rgba('ash', 1); c.fillText('找不到参数「心」。', dx + 96, dy + 118);
        const blink = frameIdx(t) % 30 < 18;
        c.strokeStyle = rgba('bone', blink ? 0.9 : 0.4); c.strokeRect(dx + dw - 132.5, dy + dh - 56.5, 110, 38);
        c.font = font(F.mono(500), 16); c.fillStyle = rgba('bone', 1); c.textAlign = 'center'; c.fillText('OK', dx + dw - 77, dy + dh - 31);
        c.restore();
      }
    }
    // the big clock: 1961 → 2000 → 2003…2007 → full date slowing toward 08.30
    const K: [number, number][] = [
      [12, dayOf(1961, 1, 1)], [20, dayOf(1961, 1, 1)], [24, dayOf(2000, 3, 1)], [32, dayOf(2003, 3, 5)], [35, dayOf(2004, 1, 15)], [41, dayOf(2004, 11, 5)],
      [43, dayOf(2006, 2, 17)], [46, dayOf(2007, 1, 20)], [56, dayOf(2007, 8, 25)], [57, dayOf(2007, 8, 26)], [58, dayOf(2007, 8, 27)], [59, dayOf(2007, 8, 28)], [60, dayOf(2007, 8, 29)], [61, dayOf(2007, 8, 30)],
    ];
    let day = K[0]![1];
    for (let i = 1; i < K.length; i++) {
      const [b0, d0] = K[i - 1]!, [b1, d1] = K[i]!;
      if (beat >= b0) day = beat >= b1 ? d1 : i >= 9 ? d0 : lerp(d0, d1, ease.inOutCubic((beat - b0) / (b1 - b0)));
    }
    const full = smoothstep(B(57), B(58), t);
    const shake = pulse(t, B(Math.floor(beat)), 0.05) * (beat >= 56 ? 1 : 0.25);
    const cA = prog(t, B(12), B(13)) * (1 - prog(t, B(20.3), B(20.6)) * (beat < 24 ? 1 : 0)) * (1 - dark * 0.85) * (1 - Math.min(prog(t, B(44.8), B(45.5)), 1 - prog(t, B(57), B(58))) * 0.92);
    const ds = fmt(day);
    const s = full > 0.5 ? ds : ds.slice(0, 4);
    const jx = shake * 6 * (hash(frameIdx(t)) - 0.5);
    clockText(c, s, 96 + jx, H - 110, lerp(230, 150, full), cA, { align: 'left' });

    // CV01 READY
    const cv = Math.min(prog(t, B(60.3), B(60.6), ease.outCubic), 1 - prog(t, B(61.4), B(61.9))) * (frameIdx(t) % 3 === 0 && t > B(61) ? 0.3 : 1);
    if (cv > 0) {
      label(c, 'CV01', cx + 28, cy + 5, { color: rgba('miku', 1), size: 14, spacing: 5, alpha: cv });
      label(c, 'READY', cx + 28, cy + 27, { color: rgba('ash', 0.8), size: 14, spacing: 5, alpha: cv });
    }
    chapterTitle(c, 'type', '黎明之前', '夜明け前', '01', beat, 20.6, 3.4, { appear: 0.8 });
    // 初音诞生 — arrives before the downbeat; on the b64 hit her portrait opens (continued in ch1)
    chapterTitle(c, 'rise', '初音诞生', '初音の誕生', '02', beat, 62.2, 3.8, BIRTH);
    comp.draw(renderer, T.upload(), out);

    if (t > B(59.5) && t < B(61.7)) this.ov.lyrics = false;
    if (hk > 0) this.ov.lyricY = H - 70;
    const hit = tunnel ? PASS.reduce((m, b) => Math.max(m, pulse(t, B(b), 0.06)), 0) : 0;
    return {
      bloom: 0.5 + pin * 0.6 + (tunnel ? 0.2 : 0), grain: 0.07, vignette: 0.45 + dark * 0.3,
      shake: [(shake * 3 + hit * 6) * (hash(frameIdx(t), 1) - 0.5), (shake * 3 + hit * 6) * (hash(frameIdx(t), 2) - 0.5)] as [number, number],
      zoom: 1 + implode * 0.06, ca: 1.2 + implode * 3 + hit * 3 + pulse(t, B(12), 0.15) * 5,
      flash: pulse(t, B(12), 0.1) * 0.6 + pulse(t, B(24), 0.08) * 0.7 + pulse(t, B(56), 0.06) * 0.3 + pulse(t, B(48.9), 0.08) * 0.35,
    };
  }

  /** a generic singing-synth editor of the VOCALOID2 era (our own drawing): roll on top, control track below */
  editor(c: CanvasRenderingContext2D, t: number, beat: number) {
    const x = 160, y = 90, w = 1600, h = 860;
    c.fillStyle = 'rgba(14,14,16,0.97)'; c.fillRect(x, y, w, h);
    c.strokeStyle = rgba('bone', 0.35); c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w, h);
    c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(x, y, w, 30);
    label(c, 'VOCALOID2 Editor — untitled.vsq', x + 14, y + 21, { size: 13, color: rgba('bone', 0.85), spacing: 2 });
    label(c, 'File   Edit   View   Job   Track   Lyrics   Setting   Help', x + 14, y + 52, { size: 12, color: rgba('ash', 1), spacing: 2 });
    c.fillStyle = 'rgba(255,255,255,0.04)'; c.fillRect(x, y + 64, w, 26);
    label(c, 'Track 1 · Miku', x + 14, y + 82, { size: 11, color: rgba('miku', 1), spacing: 2 });
    const notes = hashNotes(60, 0, 40, 60, 10, 3, '#9C978F');
    drawRoll(c, { x: x + 60, y: y + 100, w: w - 80, h: 380, b0: (beat - 45) * 0.9, beats: 12, p0: 56, rows: 18 }, notes, { now: (beat - 45) * 0.9 + 6, curve: 0.8, human: 0, curveCol: rgba('ash', 1), textSize: 15 });
    // control track
    const cy = y + 500;
    c.fillStyle = 'rgba(255,255,255,0.03)'; c.fillRect(x + 14, cy, w - 28, h - 514);
    label(c, 'CONTROL TRACK', x + 28, cy + 24, { size: 11, color: rgba('ash', 1) });
    const sel = Math.floor(clamp((beat - 45.8) * 3, 0, 9.99));
    PARAMS.forEach((p, i) => {
      const tx = x + 180 + i * 96;
      const on = i === sel;
      c.fillStyle = on ? 'rgba(57,197,187,0.25)' : 'rgba(255,255,255,0.05)'; c.fillRect(tx, cy + 8, 88, 24);
      label(c, p, tx + 44, cy + 25, { size: 12, align: 'center', color: on ? rgba('mikuHi', 1) : rgba('bone', 0.7), spacing: 2 });
    });
    // the selected parameter's curve
    c.strokeStyle = rgba('mikuHi', 0.9); c.lineWidth = 2; c.beginPath();
    for (let k = 0; k <= 300; k++) {
      const u = k / 300, px = x + 40 + u * (w - 80);
      const v = noise1(u * (5 + sel) + t * 0.6, sel) * 0.8 + Math.sin(u * 18 + sel) * 0.15;
      const py = cy + 200 - v * 110;
      if (k) c.lineTo(px, py); else c.moveTo(px, py);
    }
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.08)';
    for (let g = 0; g <= 4; g++) c.fillRect(x + 40, cy + 90 + g * 55, w - 80, 1);
  }

  /** project a world point of the tunnel stage to screen px (null if behind the camera) */
  project(x: number, y: number, z: number) {
    const v = this.tmp.set(x, y, z).project(this.st.cam);
    if (v.z > 1) return null;
    return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
  }
  private tmp = new THREE.Vector3();
}
