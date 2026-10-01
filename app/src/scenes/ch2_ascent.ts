// CHAPTER 2 · B1 (bars 24–32). "ポンコツ紛い" — no more slow introductions; the pre-chorus hits.
//  b96–106  THE BARRAGE. She stands in the dark as a body of light; criticism (≈40 different lines,
//           zh / ja / en) flies at her from every direction in 3D. Each hit knocks particles loose;
//           the camera circles low and fast. By "嘲笑と罵声" she is half scattered.
//  b106–110 MELT. The words stop in the air, melt and fall to the floor — the floor lights up: a
//           piano roll. メルト (ryo, 2007.12): someone wrote her a song. The pitch curve RISES.
//  b110–118 New voices rise out of the roll as columns of light: 鏡音リン・レン, 巡音ルカ, GUMI —
//           whip-pans between them.
//  b118–128 lyric L12: the four stand in a row; the camera pulls back, then pushes into the
//           editor's top view while their bodies fall onto the roll as notes → chorus 1.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import { Layer2D } from '../engine/gl';
import { LIN, rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { clamp, ease, frameIdx, hash, lerp, prog, pulse } from '../engine/util';
import { Chapter, W, H } from './kit/base';
import { drawCover, label } from './kit/draw';
import { drawRoll, type RNote } from './kit/roll';
import { PointFigure, Stage } from './kit/three3d';

// what they said (2007–2009): no line repeats
const MOCK: [string, number][] = [
  ['机械音', 0], ['棒読み', 1], ['ロボット声', 1], ['只是软件', 0], ['人間が歌えよ', 1], ['没有感情', 0], ['ただの道具', 1], ['这不是音乐', 0],
  ['听不下去', 0], ['所詮プログラム', 1], ['没有灵魂', 0], ['ポンコツ', 1], ['音痴', 1], ['オタク向け', 1], ['声が気持ち悪い', 1], ['电子噪音', 0],
  ['歌手の仕事を奪う', 1], ['ただのおもちゃ', 1], ['宅男的玩具', 0], ['一时的流行而已', 0], ['すぐ飽きられる', 1], ['调教再好也是假的', 0], ['这也叫唱歌？', 0], ['冷冰冰的', 0],
  ['聞くに堪えない', 1], ['人声的劣质替代品', 0], ['不自然すぎる', 1], ['萌え豚御用達', 1], ['NO SOUL', 2], ['ROBOT VOICE', 2], ['NOT REAL MUSIC', 2], ['JUST A TOY', 2],
  ['FAKE SINGER', 2], ['IT\'S JUST SOFTWARE', 2], ['LIFELESS', 2], ['UNCANNY', 2], ['キャラ売りだけ', 1], ['谁会听机器唱歌', 0], ['素人の遊び', 1], ['音楽への冒涜', 1],
  ['念经', 0], ['毫无起伏', 0],
];
const FLOOR_Y = -450, FLOOR_Z = -700;
const VOICES: { id: string; name: string; date: string; col: string; x: number; b: number; n: number }[] = [
  { id: 'kagamine', name: '鏡音リン・レン', date: '2007.12.27', col: 'rin', x: -820, b: 110.5, n: 40000 },
  { id: 'luka', name: '巡音ルカ', date: '2009.01.30', col: 'luka', x: 820, b: 112.5, n: 36000 },
  { id: 'gumi', name: 'GUMI', date: '2009.06.26', col: 'gumi', x: -1640, b: 114.5, n: 32000 },
];

export default class Ch2Ascent extends Chapter {
  st = new Stage();
  miku!: PointFigure;
  voices: PointFigure[] = [];
  roll = new Layer2D();
  floor!: THREE.Mesh;
  v3 = new THREE.Vector3();

  setup() {
    const mat = new THREE.MeshBasicMaterial({ map: this.roll.texture, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(4200, 2362), mat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.set(0, FLOOR_Y, FLOOR_Z);
    this.st.scene.add(this.floor);
    this.miku = new PointFigure(this.char('miku_v2'), { n: 60000, height: 1000 });
    this.miku.points.position.set(0, FLOOR_Y + 500, FLOOR_Z);
    this.st.scene.add(this.miku.points);
    for (const v of VOICES) {
      const fg = new PointFigure(this.char(v.id), { n: v.n, height: 1000 });
      fg.points.position.set(v.x, FLOOR_Y + 500, FLOOR_Z);
      fg.target('beam', (_i, x, y, z, r, ri) => [x * 0.03 + (r[ri]! - 0.5) * 20, y * 1.6 - 300, z * 0.03]);
      this.st.scene.add(fg.points);
      this.voices.push(fg);
    }
  }

  /** world → screen */
  scr(x: number, y: number, z: number) {
    const v = this.v3.set(x, y, z).project(this.st.cam);
    return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, z: v.z, d: this.st.cam.position.distanceTo(this.v3.set(x, y, z)) };
  }

  frame(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const t = f.t, B = (b: number) => this.bt(b), beat = this.ctx.audio.beatAt(t);
    const melt = prog(t, B(105.6), B(108), ease.inCubic);
    const rollOn = prog(t, B(106.2), B(107.5));
    const wide = prog(t, B(116.8), B(119), ease.inOutCubic);
    const push = prog(t, B(124), B(128), ease.inOutCubic);
    const fall = prog(t, B(126), B(127.7), ease.inCubic);
    const whole = Math.min(prog(t, B(123.5), B(125)), 1 - prog(t, B(126), B(126.6)));   // all four fully condensed before they fall
    const MC: [number, number, number] = [0, FLOOR_Y + 560, FLOOR_Z];

    // ---- hits: each word that arrives knocks particles loose ----
    const words = MOCK.map(([s, lang], i) => {
      const born = 96 + 9.2 * Math.sqrt(hash(i, 1)) - 0.4;
      const fly = 1.5 - hash(i, 2) * 0.4;
      const arrive = born + fly;
      return { s, lang, i, born, arrive, fly };
    });
    let damage = 0, hitP = 0;
    for (const w of words) if (beat >= w.arrive && w.arrive < 106) { damage += 1; hitP = Math.max(hitP, pulse(t, B(w.arrive), 0.12)); }
    const dmg = clamp(damage / MOCK.length) * (1 - prog(t, B(107), B(110), ease.inOutCubic));

    this.resetBg();
    this.setBg({ glowC: rollOn > 0 ? LIN.miku : LIN.ember, glowA: 0.012 + rollOn * 0.08 + hitP * 0.03, glowR: 800, glowP: [960, 620], grid: 0, vign: 0.55, noiseA: 0.5 });
    this.bg.render(renderer, out);
    this.ov.clock = false;

    // ---- camera ----
    let cp: number[], tp: number[], roll = 0;
    if (beat < 106) {
      const k = prog(t, B(96), B(106));
      const ang = -0.6 + t * 0.55 + hitP * 0.04;
      const r = lerp(2500, 1500, ease.inOutCubic(k));
      cp = [MC[0] + Math.sin(ang) * r, lerp(-260, 260, k) + MC[1] - 300, MC[2] + Math.cos(ang) * r];
      tp = [MC[0], MC[1] - 80, MC[2]];
      roll = Math.sin(t * 1.3) * 0.06 + (hash(frameIdx(t), 3) - 0.5) * hitP * 0.05;
    } else if (beat < 110) {
      const k = ease.inOutCubic(prog(t, B(105.6), B(108.5)));
      const ang = -0.6 + B(106) * 0.55;
      const r0 = 1500;
      const a = [MC[0] + Math.sin(ang) * r0, 260 + MC[1] - 300, MC[2] + Math.cos(ang) * r0];
      cp = [lerp(a[0]!, 0, k), lerp(a[1]!, 1000, k), lerp(a[2]!, FLOOR_Z + 1900, k)];
      tp = [0, lerp(MC[1] - 80, FLOOR_Y + 150, k), FLOOR_Z];
    } else {
      // whip-pans between the new voices, then wide
      const keys: [number, number][] = [[110, 0], [111, -820], [112.6, 820], [114.6, -1640], [116.8, 0]];
      let x = 0;
      for (let i = 0; i < keys.length; i++) {
        const [b0, x0] = keys[i]!, nx = keys[i + 1];
        if (beat >= b0) x = nx ? lerp(x0, nx[1], ease.inOutQuart(prog(beat, nx[0] - 0.45, nx[0]))) : x0;
      }
      const near = [x, FLOOR_Y + 700, FLOOR_Z + 1700];
      const far = [-200, FLOOR_Y + 1100, FLOOR_Z + 3600];
      const end = [0, 260, 1500];
      cp = near.map((v, i) => lerp(lerp(v, far[i]!, wide), end[i]!, push));
      tp = [lerp(lerp(x * 0.92, -200, wide), 0, push), lerp(lerp(FLOOR_Y + 520, FLOOR_Y + 380, wide), -300, push), lerp(FLOOR_Z, -600, push)];
      roll = (1 - wide) * Math.sin(t * 0.8) * 0.02;
    }
    this.st.lookAt(cp[0]!, cp[1]!, cp[2]!, tp[0]!, tp[1]!, tp[2]!, roll);

    // ---- the floor: a roll whose pitch curve rises ----
    const R = this.roll; R.clear();
    if (rollOn > 0) {
      const rc = R.ctx;
      const notes: RNote[] = MOCK.slice(0, 28).map(([s], i) => ({ b: i * 1.0, len: 0.92, p: 2 + i * 0.85 + (i % 3 === 1 ? 1.5 : 0), ly: Array.from(s)[0]!, col: '#39C5BB', a: clamp((rollOn * 30 - i) / 2) }));
      const now = (beat - 106.5) * 1.6;
      drawRoll(rc, { x: 80, y: 20, w: 1820, h: 1040, b0: -1, beats: 30, p0: 0, rows: 30 }, notes, { now, curve: 1, human: 0.12, curveCol: rgba('mikuHi', 1), textSize: 20, labels: true, grid: 0.9 });
      // the rising line, extra bright
      rc.save(); rc.globalAlpha = rollOn * 0.9; rc.strokeStyle = 'rgba(180,255,245,1)'; rc.lineWidth = 6; rc.shadowColor = 'rgba(57,197,187,1)'; rc.shadowBlur = 24;
      rc.beginPath();
      const steps = 200, upto = clamp((now + 1) / 30);
      for (let k = 0; k <= steps * upto; k++) {
        const u = k / steps, x = 80 + u * 1820;
        const p = 2 + (u * 30 - 1) * 0.85 + Math.sin(u * 40) * 0.25;
        const y = 20 + 1040 - ((p + 0.5) / 30) * 1040;
        if (k) rc.lineTo(x, y); else rc.moveTo(x, y);
      }
      rc.stroke(); rc.restore();
      (this.floor.material as THREE.MeshBasicMaterial).opacity = rollOn;
    } else (this.floor.material as THREE.MeshBasicMaterial).opacity = 0;
    R.upload();

    // ---- figures ----
    {
      const u = this.miku.u;
      u.uTime!.value = t; u.uFlat!.value = 0; u.uRect!.value = fall > 0.05 ? 1 : 0;
      this.miku.target('floor', (_i, x, y, _z, r, ri) => [x * 1.5 + (r[ri]! - 0.5) * 500, -500 + 4, -y * 0.9 + (r[ri + 1]! - 0.5) * 200]);
      u.uMorph!.value = fall; u.uStagger!.value = 1.2;
      u.uNoise!.value = (3 + dmg * 14 + hitP * 22) * (1 - whole * 0.8);
      u.uScatter!.value = dmg * 110 + hitP * 70;
      u.uTint!.value = dmg * 0.75; (u.uTintC!.value as THREE.Color).setRGB(0.25, 0.24, 0.23);
      u.uSize!.value = fall > 0.05 ? lerp(2.4, 3.2, fall) : 2.3; u.uBright!.value = (1.15 + rollOn * 0.2 + whole * 0.35 + pulse(t, B(125), 0.3) * 0.5) * (1 - fall * 0.55);
      u.uOpacity!.value = prog(t, B(95.8), B(96.6)) * (1 - prog(t, B(127.2), B(128)));
      u.uPaint!.value = 0;
    }
    VOICES.forEach((v, i) => {
      const fg = this.voices[i]!, u = fg.u;
      const rise = prog(t, B(v.b), B(v.b + 1.6), ease.outCubic);
      fg.points.visible = beat >= v.b - 0.1;
      if (fall > 0.01) fg.target('floor', (_i, x, y, _z, r, ri) => [x * 1.5 + (r[ri]! - 0.5) * 400, -500 + 4, -y * 0.9 + (r[ri + 1]! - 0.5) * 200]);
      else fg.target('beam', () => [0, 0, 0]);
      u.uMorph!.value = fall > 0.01 ? fall : 1 - rise;
      u.uStagger!.value = 1.4; u.uTime!.value = t; u.uFlat!.value = 0;
      u.uNoise!.value = (3 + (1 - rise) * 30) * (1 - whole * 0.8); u.uScatter!.value = 0; u.uRect!.value = fall > 0.05 ? 1 : 0;
      u.uSize!.value = fall > 0.05 ? lerp(2.4, 3.2, fall) : 2.4; u.uBright!.value = (1.2 + (1 - rise) * 2 + whole * 0.35 + pulse(t, B(125), 0.3) * 0.5) * (1 - fall * 0.55);
      u.uOpacity!.value = prog(t, B(v.b - 0.1), B(v.b + 0.3)) * (1 - prog(t, B(127.2), B(128)));
      u.uTint!.value = 0; u.uPaint!.value = 0;
    });
    this.st.render(renderer, out);

    // ---- beams of light where a new voice rises ----
    const L = this.L; L.clear();
    VOICES.forEach((v) => {
      const k = Math.min(prog(t, B(v.b - 0.1), B(v.b + 0.15)), 1 - prog(t, B(v.b + 0.6), B(v.b + 2)));
      if (k <= 0) return;
      const a = this.scr(v.x, FLOOR_Y, FLOOR_Z), b = this.scr(v.x, FLOOR_Y + 2600, FLOOR_Z);
      if (a.z > 1 || b.z > 1) return;
      const c = LIN[v.col as 'rin'];
      L.seg2(a.x, a.y, b.x, b.y, 40 * k, mul3(c, 1.5), 0.35 * k);
      L.seg2(a.x, a.y, b.x, b.y, 6 * k, mul3(c, 6), k);
    });
    L.render(renderer, out);

    // ---- 2D ----
    const T = this.T; T.clear();
    const c = T.ctx;
    // the barrage, projected from 3D
    if (beat < 109) {
      for (const w of words) {
        if (beat < w.born) continue;
        const i = w.i;
        const th = hash(i, 3) * Math.PI * 2, el = (hash(i, 4) - 0.35) * 1.2;
        const R0 = 2800, R1 = 170 + hash(i, 5) * 120;
        const k = clamp((beat - w.born) / w.fly);
        const arrived = beat >= w.arrive && w.arrive < 106;
        // after 106 the words in flight freeze, melt and fall
        const frozen = beat >= 105.6 && w.arrive >= 105.6;
        if (arrived && beat > w.arrive + 0.35) continue;
        const kk = frozen ? clamp((105.6 - w.born) / w.fly) : ease.inQuad(k);
        const r = lerp(R0, R1, kk);
        let x = MC[0] + Math.cos(th) * Math.cos(el) * r, y = MC[1] + Math.sin(el) * r * 0.8 - 150, z = MC[2] + Math.sin(th) * Math.cos(el) * r;
        let stretch = 1;
        if (frozen) { const fk = ease.inCubic(clamp((beat - 106 - hash(i, 6) * 0.8) / 1.6)); y = lerp(y, FLOOR_Y, fk); stretch = 1 + fk * 3; }
        const p = this.scr(x, y, z);
        if (p.z > 1) continue;
        const size = clamp(130000 / p.d, 26, 180);
        const a = clamp((beat - w.born) / 0.3) * (arrived ? 1 - (beat - w.arrive) / 0.35 : 1) * (frozen ? 1 - clamp((beat - 107.2 - hash(i, 6) * 0.8) / 0.6) : 1);
        if (a <= 0) continue;
        c.save();
        c.translate(p.x, p.y); c.scale(1, stretch);
        c.globalAlpha = a;
        c.font = w.lang === 2 ? font(F.archivo(112, 900), size * 0.9) : w.lang === 1 ? font(F.jp(900), size) : font(F.sc(700), size);
        c.textAlign = 'center';
        c.fillStyle = frozen && stretch > 1.3 ? rgba('miku', 1) : i % 5 === 0 ? rgba('ember', 1) : rgba('bone', 0.92);
        c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 10;
        c.fillText(w.s, 0, 0);
        c.restore();
        if (arrived) { // impact flash
          const ip = pulse(t, B(w.arrive), 0.12);
          if (ip > 0.05) { c.save(); c.globalAlpha = ip; c.strokeStyle = rgba('bone', 1); c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, 20 + (1 - ip) * 60, 0, Math.PI * 2); c.stroke(); c.restore(); }
        }
      }
      const ca = Math.min(prog(t, B(96.5), B(97)), 1 - prog(t, B(105.6), B(106.2)));
      if (ca > 0) {
        label(c, '2007 — 2008 · 嘲笑与批评 / 嘲笑と批判', 96, 110, { color: rgba('ember', 1), size: 15, alpha: ca });
        c.save(); c.globalAlpha = ca; c.font = font(F.archivo(62, 900), 110); c.fillStyle = rgba('bone', 1);
        c.fillText(String(damage).padStart(2, '0'), 96, 230); c.restore();
        label(c, 'HITS / 被击中', 100, 262, { size: 13, alpha: ca });
      }
    }
    // メルト: someone wrote her a song
    const mc = Math.min(prog(t, B(106.4), B(106.8)), 1 - prog(t, B(110), B(110.6)));
    if (mc > 0) {
      c.save(); c.globalAlpha = mc;
      drawCover(c, this.cover('melt'), 96, 90, 220, 220);
      c.fillStyle = rgba('miku', 1); c.fillRect(330, 90, 4, 220);
      label(c, '2007.12.07', 352, 116, { color: rgba('miku', 1), size: 14 });
      c.font = font(F.jp(900), 64); c.fillStyle = rgba('bone', 1); c.fillText('メルト', 350, 190);
      label(c, 'ryo (supercell)', 354, 226, { color: rgba('bone', 0.9), size: 15 });
      c.font = font(F.scSerif(), 40); c.fillStyle = rgba('bone', 1); c.fillText('有人开始，为她写歌。', 352, 290);
      c.font = font(F.jp(300), 20); c.fillStyle = rgba('ash', 1); c.fillText('誰かが、彼女のために歌を書き始めた。', 354, 322);
      c.restore();
    }
    // new voices: name stamps at their feet
    VOICES.forEach((v) => {
      const a = Math.min(prog(t, B(v.b + 0.3), B(v.b + 0.6)), 1 - prog(t, B(123.5), B(124.5)));
      if (a <= 0) return;
      const p = this.scr(v.x + 300, FLOOR_Y + 980, FLOOR_Z);
      if (p.z > 1) return;
      const s = clamp(2400 / p.d, 0.5, 1.4);
      c.save(); c.globalAlpha = a;
      c.font = font(F.jp(900), 54 * s); c.fillStyle = rgba(v.col as 'rin', 1); c.fillText(v.name, p.x, p.y);
      label(c, v.date, p.x + 2, p.y + 30 * s, { size: 13 * s, color: rgba('bone', 0.9) });
      c.restore();
    });
    const nm = Math.min(prog(t, B(117), B(117.5)), 1 - prog(t, B(123.5), B(124.5)));
    if (nm > 0) {
      const p = this.scr(260, FLOOR_Y + 1020, FLOOR_Z);
      c.save(); c.globalAlpha = nm;
      c.font = font(F.jp(900), 40); c.fillStyle = rgba('miku', 1); c.fillText('初音ミク', p.x, p.y);
      c.restore();
      label(c, '2007 — 2009 · 新的声音 / 新しい声たち', 96, 110, { color: rgba('bone', 0.9), size: 15, alpha: nm });
    }
    comp.draw(renderer, T.upload(), out);

    this.ov.lyricY = 0;
    const hit = hitP * (beat < 106 ? 1 : 0) + pulse(t, B(Math.floor(beat)), 0.06) * push * 0.6;
    const whip = beat >= 110 && beat < 117 ? [111, 112.6, 114.6, 116.8].reduce((m, b) => Math.max(m, pulse(t, B(b), 0.1)), 0) : 0;
    return {
      bloom: 0.6 + rollOn * 0.2, grain: 0.065, vignette: 0.5, ca: 1.2 + hit * 4 + whip * 4,
      shake: [hit * 12 * (hash(frameIdx(t), 1) - 0.5), hit * 12 * (hash(frameIdx(t), 2) - 0.5)] as [number, number],
      flash: pulse(t, B(106.2), 0.1) * 0.18 + VOICES.reduce((m, v) => Math.max(m, pulse(t, B(v.b), 0.08)), 0) * 0.35, zoom: 1 + hit * 0.015,
    };
  }
}

const mul3 = (c: [number, number, number], k: number): [number, number, number] => [c[0] * k, c[1] * k, c[2] * k];
