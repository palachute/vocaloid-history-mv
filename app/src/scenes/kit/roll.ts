// The film's through-line: a VOCALOID-style piano roll (our own generic drawing, no product UI).
// Note blocks with their lyric, the hand-drawn pitch curve (PIT) behind them, a playhead, and the
// parameter lanes — every parameter a voice has… except one: 心.
import { rgba } from '../../engine/palette';
import { F, font } from '../../engine/type';
import { clamp, hash, lerp, noise1, smoothstep } from '../../engine/util';
import { hexA, type Ctx } from './draw';

export interface RNote { b: number; len: number; p: number; ly: string; col?: string; a?: number; glow?: number; off?: number }
export interface RollView { x: number; y: number; w: number; h: number; b0: number; beats: number; p0: number; rows: number }
export interface RollOpts {
  now?: number;            // playhead (beats, same units as notes)
  grid?: number;           // grid alpha
  keys?: boolean;          // piano keys column
  curve?: number;          // pitch-curve alpha (0 = none)
  human?: number;          // hand-drawn wobble amount in rows
  curveCol?: string;
  noteCol?: string;
  textSize?: number;
  ink?: boolean;           // light paper version
  playhead?: boolean;
  labels?: boolean;        // bar numbers
}

export const PARAMS = ['VEL', 'DYN', 'BRE', 'BRI', 'CLE', 'OPE', 'GEN', 'POR', 'PIT', 'PBS'];

export function rowY(v: RollView, p: number) { return v.y + v.h - ((p - v.p0 + 0.5) / v.rows) * v.h; }
export function beatX(v: RollView, b: number) { return v.x + ((b - v.b0) / v.beats) * v.w; }

/** pitch (rows) of the sung line at beat b: portamento between notes, vibrato on long tails, hand wobble */
export function pitchAt(notes: RNote[], b: number, human = 0) {
  let i = notes.findIndex((n) => b < n.b + n.len);
  if (i < 0) i = notes.length - 1;
  const n = notes[i]!, prev = notes[i - 1];
  let p = n.p;
  if (prev && b < n.b + 0.25) p = lerp(prev.p, n.p, smoothstep(n.b - 0.12, n.b + 0.25, b));
  const tail = clamp((b - n.b - 0.6) / Math.max(0.3, n.len - 0.6));
  p += Math.sin(b * 18) * 0.35 * tail * (n.len > 1 ? 1 : 0.3);
  p += noise1(b * 3.1, 11) * human;
  return p;
}

export function drawRoll(c: Ctx, v: RollView, notes: RNote[], o: RollOpts = {}) {
  const ink = o.ink ?? false;
  const fg = (a: number) => (ink ? rgba('ink', a) : rgba('bone', a));
  const ga = o.grid ?? 1;
  c.save();
  c.beginPath(); c.rect(v.x, v.y, v.w, v.h); c.clip();
  // rows (black keys darker)
  if (ga > 0) {
    for (let r = 0; r < v.rows; r++) {
      const p = Math.floor(v.p0) + r;
      const black = [1, 3, 6, 8, 10].includes(((p % 12) + 12) % 12);
      const y = rowY(v, p) - v.h / v.rows / 2;
      if (black) { c.fillStyle = ink ? rgba('ink', 0.05 * ga) : `rgba(255,255,255,${0.025 * ga})`; c.fillRect(v.x, y, v.w, v.h / v.rows); }
      c.fillStyle = fg(0.06 * ga); c.fillRect(v.x, y, v.w, 1);
    }
    // beats / bars
    const bs = Math.floor(v.b0), be = Math.ceil(v.b0 + v.beats);
    for (let b = bs; b <= be; b++) {
      const x = beatX(v, b);
      const bar = ((b % 4) + 4) % 4 === 0;
      c.fillStyle = fg((bar ? 0.22 : 0.08) * ga); c.fillRect(x, v.y, 1, v.h);
      if (bar && (o.labels ?? true)) { c.font = font(F.mono(500), 11); c.fillStyle = fg(0.45 * ga); c.fillText(String(Math.floor(b / 4) + 1), x + 4, v.y + 13); }
    }
  }
  // pitch curve (the human line) drawn up to the playhead
  const now = o.now ?? v.b0 + v.beats;
  if ((o.curve ?? 0) > 0 && notes.length) {
    c.strokeStyle = o.curveCol ?? rgba('bone', 0.9); c.lineWidth = 2.2; c.globalAlpha = o.curve!;
    c.beginPath();
    const b0 = Math.max(notes[0]!.b, v.b0), b1 = Math.min(now, notes[notes.length - 1]!.b + notes[notes.length - 1]!.len, v.b0 + v.beats);
    let first = true;
    for (let b = b0; b <= b1; b += v.beats / 600) {
      const x = beatX(v, b), y = rowY(v, pitchAt(notes, b, o.human ?? 0));
      if (first) { c.moveTo(x, y); first = false; } else c.lineTo(x, y);
    }
    c.stroke(); c.globalAlpha = 1;
  }
  // note blocks
  const rh = v.h / v.rows;
  for (const n of notes) {
    const x0 = beatX(v, n.b) + (n.off ?? 0), x1 = beatX(v, n.b + n.len);
    if (x1 < v.x - 10 || x0 > v.x + v.w + 10) continue;
    const y = rowY(v, n.p) - rh * 0.42, hgt = rh * 0.84;
    const a = n.a ?? 1;
    if (a <= 0) continue;
    const on = now >= n.b && now < n.b + n.len;
    const col = n.col ?? o.noteCol ?? '#39C5BB';
    c.globalAlpha = a;
    c.fillStyle = hexA(col, on ? 1 : 0.78);
    c.fillRect(x0, y, Math.max(2, x1 - x0 - 2), hgt);
    if ((n.glow ?? 0) > 0 || on) { c.fillStyle = `rgba(255,255,255,${0.35 * Math.max(n.glow ?? 0, on ? 1 : 0)})`; c.fillRect(x0, y, Math.max(2, x1 - x0 - 2), hgt); }
    c.fillStyle = rgba('ink', 0.9);
    const ts = o.textSize ?? Math.min(hgt * 0.62, 28);
    c.font = font(F.jp(900), ts);
    c.save(); c.beginPath(); c.rect(x0, y, x1 - x0, hgt); c.clip();
    c.fillText(n.ly, x0 + 6, y + hgt / 2 + ts * 0.36);
    c.restore();
  }
  c.globalAlpha = 1;
  if (o.playhead ?? true) {
    const x = beatX(v, now);
    if (x >= v.x && x <= v.x + v.w) { c.fillStyle = rgba('miku', 1); c.fillRect(x, v.y, 2, v.h); }
  }
  c.restore();
  if (o.keys ?? true) {
    // piano keys on the left edge
    const kw = 46;
    c.save();
    c.beginPath(); c.rect(v.x - kw, v.y, kw, v.h); c.clip();
    for (let r = 0; r < v.rows; r++) {
      const p = Math.floor(v.p0) + r;
      const black = [1, 3, 6, 8, 10].includes(((p % 12) + 12) % 12);
      const y = rowY(v, p) - rh / 2;
      c.fillStyle = black ? rgba('ink', 1) : fg(0.85); c.fillRect(v.x - kw, y + 0.5, black ? kw * 0.62 : kw - 2, rh - 1);
      if (((p % 12) + 12) % 12 === 0) { c.font = font(F.mono(500), 9); c.fillStyle = rgba('ink', 0.8); c.fillText(`C${Math.floor(p / 12) - 1}`, v.x - kw + 3, y + rh - 3); }
    }
    c.restore();
  }
}

/** Parameter lanes under a roll. `vals[name]` overrides a lane with a constant (e.g. BRE = 0). heart: 0 empty … 1 filled */
export function drawLanes(c: Ctx, x: number, y: number, w: number, t: number, o: { names?: string[]; vals?: Record<string, number>; heart?: number; heartLabel?: boolean; alpha?: number; laneH?: number; hi?: string } = {}) {
  const names = o.names ?? PARAMS;
  const lh = o.laneH ?? 26;
  c.save();
  c.globalAlpha = o.alpha ?? 1;
  names.forEach((nm, i) => {
    const ly = y + i * lh;
    c.fillStyle = 'rgba(255,255,255,0.04)'; c.fillRect(x, ly, w, lh - 3);
    c.font = font(F.mono(500), 12); c.fillStyle = nm === o.hi ? rgba('miku', 1) : rgba('ash', 1);
    c.fillText(nm, x - 46, ly + lh / 2 + 4);
    c.strokeStyle = nm === o.hi ? rgba('miku', 1) : rgba('bone', 0.55); c.lineWidth = 1.4;
    c.beginPath();
    for (let k = 0; k <= 120; k++) {
      const u = k / 120;
      const fixed = o.vals?.[nm];
      const val = fixed !== undefined ? fixed : 0.5 + 0.35 * noise1(u * 6 + i * 3.7 + t * 0.4, i);
      const px = x + u * w, py = ly + (lh - 6) * (1 - clamp(val)) + 2;
      if (k) c.lineTo(px, py); else c.moveTo(px, py);
    }
    c.stroke();
    if (o.vals?.[nm] !== undefined) { c.font = font(F.mono(500), 12); c.fillStyle = rgba('miku', 1); c.fillText(String(Math.round(o.vals[nm]! * 127)), x + w + 10, ly + lh / 2 + 4); }
  });
  if (o.heart !== undefined) {
    const ly = y + names.length * lh + 6;
    const hk = o.heart;
    c.fillStyle = hk > 0 ? `rgba(57,197,187,${0.08 + hk * 0.1})` : 'rgba(255,255,255,0.02)'; c.fillRect(x, ly, w, lh + 6);
    c.font = font(F.jp(900), 18); c.fillStyle = hk > 0 ? rgba('miku', 1) : rgba('ember', 1);
    c.fillText('心', x - 40, ly + lh / 2 + 9);
    if (hk <= 0.001) {
      c.setLineDash([6, 6]); c.strokeStyle = rgba('graphite', 1); c.beginPath(); c.moveTo(x, ly + lh / 2 + 3); c.lineTo(x + w, ly + lh / 2 + 3); c.stroke(); c.setLineDash([]);
      if (o.heartLabel ?? true) { c.font = font(F.mono(500), 12); c.fillStyle = rgba('ember', 1); c.fillText('PARAMETER NOT FOUND / 未定义的参数', x + w * 0.5 - 150, ly + lh / 2 + 7); }
    } else {
      c.strokeStyle = rgba('miku', 1); c.lineWidth = 2.2; c.beginPath();
      for (let k = 0; k <= 200 * hk; k++) {
        const u = k / 200;
        const val = 0.5 + 0.4 * Math.sin(u * 40 + t * 3) * noise1(u * 8 + t, 3) + 0.2 * noise1(u * 30, 5);
        const px = x + u * w, py = ly + (lh + 2) * (1 - clamp(val)) + 2;
        if (k) c.lineTo(px, py); else c.moveTo(px, py);
      }
      c.stroke();
      if (o.heartLabel ?? true) { c.font = font(F.mono(500), 12); c.fillStyle = rgba('miku', 1); c.fillText('由人手写入 / 人の手で描かれた', x + w + 10, ly + lh / 2 + 7); }
    }
  }
  c.restore();
}

/** Make a run of notes for a lyric string (one note per char), on a melodic contour. */
export function notesFor(text: string, b0: number, step: number, p0: number, contour: number[] = [0, 2, 4, 2, 5, 4, 2, 0], col?: string): RNote[] {
  return Array.from(text).map((ch, i) => ({ b: b0 + i * step, len: step * 0.92, p: p0 + contour[i % contour.length]!, ly: ch, col }));
}

export function hashNotes(n: number, b0: number, beats: number, p0: number, range: number, seed = 1, col?: string): RNote[] {
  const out: RNote[] = [];
  let b = b0;
  for (let i = 0; i < n && b < b0 + beats; i++) {
    const len = [0.25, 0.5, 0.5, 1, 0.75][Math.floor(hash(i, seed) * 5)]!;
    out.push({ b, len: len * 0.95, p: p0 + Math.floor(hash(i, seed + 1) * range), ly: 'あいうえおらりるれろ'[Math.floor(hash(i, seed + 2) * 10)]!, col });
    b += len;
  }
  return out;
}
