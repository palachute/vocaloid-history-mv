// Canvas2D building blocks shared by the chapters: covers, song cards, slams, captions, lyrics,
// the year clock, danmaku, archive cards. All are pure functions of their time arguments.
import { W, H } from '../../engine/gl';
import { rgba } from '../../engine/palette';
import { F, font } from '../../engine/type';
import { clamp, ease, frameIdx, hash, lerp, prog, pulse } from '../../engine/util';
import type { Caption, LyricLine, Song } from './data';

export type Ctx = CanvasRenderingContext2D;

export function hexA(hex: string, a = 1) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Draw an image into a box. fit 'cover' crops, 'contain' letterboxes. `reveal` 0..1 slices in scanlines. */
export function drawCover(c: Ctx, img: HTMLImageElement | undefined, x: number, y: number, w: number, h: number,
  o: { fit?: 'cover' | 'contain'; alpha?: number; reveal?: number; seed?: number; focusY?: number; mono?: number } = {}) {
  if (!img) return false;
  const fit = o.fit ?? 'cover';
  const s = fit === 'cover' ? Math.max(w / img.width, h / img.height) : Math.min(w / img.width, h / img.height);
  const dw = img.width * s, dh = img.height * s;
  const dx = x + (w - dw) / 2, dy = y + (h - dh) * (o.focusY ?? 0.5);
  c.save();
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.globalAlpha *= o.alpha ?? 1;
  if (o.mono) c.filter = `grayscale(${o.mono}) contrast(${1 + o.mono * 0.2})`;
  const rv = o.reveal ?? 1;
  if (rv >= 0.999) c.drawImage(img, dx, dy, dw, dh);
  else if (rv > 0) {
    const rows = 40, seed = o.seed ?? 1;
    for (let r = 0; r < rows; r++) {
      const k = clamp((rv * 1.6 - (r / rows) * 0.6 - hash(r, seed) * 0.25) * 2.2);
      if (k <= 0) continue;
      const sy = (r / rows) * img.height, sh = img.height / rows;
      const off = (1 - k) * (hash(r, seed + 3) - 0.5) * 240;
      c.globalAlpha = (o.alpha ?? 1) * k;
      c.drawImage(img, 0, sy, img.width, sh, dx + off, dy + (r / rows) * dh, dw, dh / rows + 1);
    }
  }
  c.restore();
  return true;
}

/** Thin bracket frame (corner marks) around a box. */
export function brackets(c: Ctx, x: number, y: number, w: number, h: number, col: string, len = 18, lw = 2) {
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
  for (const [px, py, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]] as const) {
    c.moveTo(px + sx * len, py); c.lineTo(px, py); c.lineTo(px, py + sy * len);
  }
  c.stroke(); c.restore();
}

/** Stamp-in envelope: 0 before t0, overshoots in over `d`, holds, fades over the last `out` s before t1. */
export function stamp(t: number, t0: number, t1: number, d = 0.14, out = 0.12) {
  if (t < t0 || t > t1) return { a: 0, s: 1 };
  const k = prog(t, t0, t0 + d, ease.outCubic);
  const a = Math.min(clamp(k * 1.4), 1 - prog(t, t1 - out, t1));
  return { a, s: lerp(1.25, 1, k) };
}

/** Big song card (S tier): cover + title block. (x, y) is the top-left of the whole card (≈1500×520). */
export function cardS(c: Ctx, song: Song, img: HTMLImageElement | undefined, t: number, t0: number, t1: number, x: number, y: number, o: { reveal?: number } = {}) {
  const st = stamp(t, t0, t1, 0.18, 0.15);
  if (st.a <= 0) return;
  const lt = t - t0;
  c.save();
  c.globalAlpha = st.a;
  c.translate(x, y);
  const CW = 520, CH = 520;
  // cover
  c.fillStyle = hexA(song.color, 0.22); c.fillRect(0, 0, CW, CH);
  if (!drawCover(c, img, 0, 0, CW, CH, { reveal: o.reveal ?? prog(t, t0, t0 + 0.5), seed: song.year })) {
    c.font = font(F.jp(900), 180); c.fillStyle = hexA(song.color, 0.9); c.textAlign = 'center';
    c.fillText(song.title.slice(0, 1), CW / 2, CH / 2 + 64); c.textAlign = 'left';
  }
  brackets(c, -14, -14, CW + 28, CH + 28, hexA(song.color, 0.95), 26, 3);
  c.fillStyle = song.color; c.fillRect(CW + 44, 0, 10, CH);
  // text block, slides in from the right
  const sx = lerp(80, 0, ease.outExpo(clamp(lt / 0.35)));
  const tx = CW + 84 + sx;
  c.font = font(F.mono(500), 22); c.letterSpacing = '6px'; c.fillStyle = rgba('ash', 1);
  c.fillText(`${song.year}  ·  ${song.voice}`, tx, 46);
  c.letterSpacing = '0px';
  const title = song.title;
  let size = 112; c.font = font(F.jp(900), size);
  while (c.measureText(title).width > 900 && size > 56) { size -= 4; c.font = font(F.jp(900), size); }
  c.fillStyle = rgba('bone', 1); c.fillText(title, tx, 70 + size);
  c.font = font(F.jp(900), 52); c.fillStyle = song.color; c.fillText(song.p, tx, 70 + size + 90);
  c.font = font(F.mono(500), 16); c.letterSpacing = '5px'; c.fillStyle = rgba('ash', 0.8);
  c.fillText(`S / ${song.id.toUpperCase()}`, tx, CH - 6);
  c.restore();
}

/** Compact song card (A tier): cover square + title/P/year. Centered at (cx, cy). */
export function cardA(c: Ctx, song: Song, img: HTMLImageElement | undefined, t: number, t0: number, t1: number, cx: number, cy: number, o: { scale?: number; rot?: number } = {}) {
  const st = stamp(t, t0, t1, 0.1, 0.06);
  if (st.a <= 0) return;
  c.save();
  c.globalAlpha = st.a;
  c.translate(cx, cy); c.rotate(o.rot ?? 0); c.scale(st.s * (o.scale ?? 1), st.s * (o.scale ?? 1));
  const S = 300;
  c.fillStyle = 'rgba(10,10,11,0.88)'; c.fillRect(-S - 40, -S / 2 - 30, S + 40 + 760, S + 60);
  c.fillStyle = hexA(song.color, 0.3); c.fillRect(-S - 20, -S / 2, S, S);
  if (!drawCover(c, img, -S - 20, -S / 2, S, S)) {
    c.font = font(F.jp(900), 150); c.fillStyle = song.color; c.textAlign = 'center'; c.fillText(song.title.slice(0, 1), -S / 2 - 20, 52); c.textAlign = 'left';
  }
  c.fillStyle = song.color; c.fillRect(0, -S / 2, 8, S);
  let size = 76; c.font = font(F.jp(900), size);
  while (c.measureText(song.title).width > 680 && size > 36) { size -= 4; c.font = font(F.jp(900), size); }
  c.fillStyle = rgba('bone', 1); c.fillText(song.title, 34, -10);
  c.font = font(F.jp(900), 40); c.fillStyle = song.color; c.fillText(song.p, 34, 52);
  c.font = font(F.mono(500), 20); c.letterSpacing = '5px'; c.fillStyle = rgba('ash', 1);
  c.fillText(`${song.year}  ·  ${song.voice}`, 36, 110);
  c.restore();
}

/** Full-screen kanji slam. Returns nothing; `lt` is local time since the slam. */
export function slam(c: Ctx, ch: string, lt: number, o: { color?: string; size?: number; x?: number; y?: number; fam?: string; drift?: number; alpha?: number } = {}) {
  if (lt < 0) return;
  const z = lerp(1.2, 1, ease.outExpo(clamp(lt / 0.22))) + lt * 0.03;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.translate(o.x ?? W / 2, o.y ?? H / 2); c.scale(z, z);
  c.font = font(o.fam ?? F.jpSerif(), o.size ?? 820);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = o.color ?? rgba('bone', 1);
  c.fillText(ch, (o.drift ?? 0) * lt, 0);
  c.restore();
}

/** Bilingual chapter caption (top-left). a = 0..1 visibility, n = chars typed (typewriter). */
export function caption(c: Ctx, cap: Caption, t: number, t0: number, t1: number, o: { x?: number; y?: number; ink?: boolean } = {}) {
  const a = Math.min(prog(t, t0, t0 + 0.35), 1 - prog(t, t1 - 0.4, t1));
  if (a <= 0) return;
  const x = o.x ?? 96, y = o.y ?? 118;
  const ink = o.ink ?? false;
  c.save();
  c.globalAlpha *= a;
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  if (cap.tag) {
    c.font = font(F.mono(500), 15); c.letterSpacing = '5px';
    c.fillStyle = ink ? rgba('ink', 0.8) : rgba('miku', 1);
    c.fillText(cap.tag.toUpperCase(), x, y - 46); c.letterSpacing = '0px';
  }
  const n = Math.ceil(cap.zh.length * prog(t, t0, t0 + 0.6));
  c.font = font(F.scSerif(), 46); c.fillStyle = ink ? rgba('ink', 1) : rgba('bone', 1);
  c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = ink ? 0 : 14;
  c.fillText(cap.zh.slice(0, n), x, y + 8);
  c.font = font(F.jp(300), 24); c.fillStyle = ink ? rgba('ink', 0.75) : rgba('ash', 1);
  c.fillText(cap.ja, x + 2, y + 50);
  c.restore();
}

/** One lyric line (ja large, zh small), bottom centre. style 'big' is the emphasised treatment. */
export function lyric(c: Ctx, ln: LyricLine, t: number, o: { big?: boolean; y?: number; x?: number; color?: string; ink?: boolean } = {}) {
  const hold = ln.end;
  if (t < ln.start - 0.05 || t > hold + 0.25) return;
  const a = Math.min(prog(t, ln.start - 0.05, ln.start + 0.2), 1 - prog(t, hold, hold + 0.25));
  const big = o.big ?? false;
  const y = o.y ?? (big ? H - 250 : H - 128);
  const size = big ? 84 : 46;
  const chars = Array.from(ln.text);
  const typed = Math.ceil(chars.length * prog(t, ln.start, ln.start + Math.min(1.1, (ln.end - ln.start) * 0.5)));
  c.save();
  c.globalAlpha *= a;
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.font = font(F.jp(900), size);
  const full = c.measureText(ln.text).width;
  const cxl = o.x ?? W / 2;
  let x = cxl - full / 2;
  c.shadowColor = o.ink ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.75)'; c.shadowBlur = o.ink ? 0 : 18;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    const w = c.measureText(ch).width;
    const on = i < typed;
    const k = on ? 1 : 0;
    if (k > 0) {
      const pop = big ? pulse(t, ln.start + (i / chars.length) * 0.5, 0.08) : 0;
      c.fillStyle = o.color ?? (o.ink ? rgba('ink', 1) : rgba('bone', 1));
      c.fillText(ch, x, y - pop * 10);
    }
    x += w;
  }
  if (ln.zh) {
    c.font = font(F.sc(400), big ? 34 : 24);
    c.fillStyle = o.ink ? rgba('ink', 0.8) : rgba('ash', 1);
    c.textAlign = 'center';
    c.fillText(ln.zh, cxl, y + (big ? 62 : 42));
  }
  c.restore();
}

/** The year clock. text like '2011' or '2007.08.31'. */
export function clockText(c: Ctx, s: string, x: number, y: number, size: number, a: number, o: { align?: CanvasTextAlign; color?: string; label?: boolean } = {}) {
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha *= a;
  c.textAlign = o.align ?? 'right'; c.textBaseline = 'alphabetic';
  c.font = font(F.archivo(62, 900), size);
  c.fillStyle = o.color ?? rgba('bone', 0.9);
  c.fillText(s, x, y);
  if (o.label ?? true) {
    c.font = font(F.mono(500), Math.max(11, size * 0.12)); c.letterSpacing = '4px';
    c.fillStyle = rgba('ash', 0.85);
    c.fillText('YEAR / 年', x, y - size * 0.8);
  }
  c.restore();
}

/** Danmaku: comments drifting right→left, born deterministically in [t0, t1). */
export function danmaku(c: Ctx, t: number, words: string[], t0: number, t1: number, o: { n?: number; seed?: number; color?: string; accent?: string; size?: number; speed?: number; alpha?: number; rows?: [number, number] } = {}) {
  const n = o.n ?? 30, seed = o.seed ?? 1;
  const [r0, r1] = o.rows ?? [70, 900];
  c.save();
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  for (let i = 0; i < n; i++) {
    const born = t0 + hash(i, seed) * (t1 - t0);
    if (t < born) continue;
    const s = words[Math.floor(hash(i, seed + 1) * words.length)]!;
    const size = (o.size ?? 38) * (0.8 + hash(i, seed + 2) * 0.5);
    c.font = font(F.sc(700), size);
    const w = c.measureText(s).width;
    const sp = (o.speed ?? 520) * (0.8 + hash(i, seed + 3) * 0.5);
    const x = W + 20 - (t - born) * sp;
    if (x < -w - 20) continue;
    const y = r0 + Math.floor(hash(i, seed + 4) * ((r1 - r0) / 58)) * 58;
    c.globalAlpha = o.alpha ?? 0.95;
    c.fillStyle = i % 6 === 0 && o.accent ? o.accent : (o.color ?? rgba('bone', 1));
    c.shadowColor = 'rgba(0,0,0,0.85)'; c.shadowOffsetX = 2; c.shadowOffsetY = 2;
    c.fillText(s, x, y);
  }
  c.restore();
}

/** Archive card (ch0 style). */
export function archiveCard(c: Ctx, x: number, y: number, o: { year: string; name: string; sub: string; maker: string; color: string; flash?: number; w?: number }) {
  const w = o.w ?? 600, h = 110;
  c.save();
  c.translate(x, y);
  c.fillStyle = rgba('ink2', 0.94); c.fillRect(0, 0, w, h);
  c.strokeStyle = rgba('bone', 0.35 + (o.flash ?? 0) * 0.6); c.lineWidth = 1; c.strokeRect(0.5, 0.5, w - 1, h - 1);
  c.fillStyle = o.color; c.fillRect(0, 0, 10, h);
  c.font = font(F.mono(500), 15); c.letterSpacing = '3px'; c.fillStyle = rgba('ash', 1);
  c.fillText(`${o.year}   ${o.maker}`, 30, 32); c.letterSpacing = '0px';
  c.font = font(F.archivo(112, 900), 46); c.fillStyle = rgba('bone', 1); c.fillText(o.name, 30, 86);
  const nw = c.measureText(o.name).width;
  c.font = font(F.jp(300), 19); c.fillStyle = rgba('ash', 1); c.fillText(o.sub, 30 + nw + 22, 84);
  if ((o.flash ?? 0) > 0.02) { c.fillStyle = `rgba(255,255,255,${(o.flash ?? 0) * 0.45})`; c.fillRect(0, 0, w, h); }
  c.restore();
}

/** Small mono label. */
export function label(c: Ctx, s: string, x: number, y: number, o: { size?: number; color?: string; align?: CanvasTextAlign; spacing?: number; alpha?: number } = {}) {
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.font = font(F.mono(500), o.size ?? 15); c.letterSpacing = `${o.spacing ?? 4}px`;
  c.fillStyle = o.color ?? rgba('ash', 1); c.textAlign = o.align ?? 'left';
  c.fillText(s, x, y);
  c.restore();
}

export const jitter = (t: number, amt: number, seed = 0) => [(hash(frameIdx(t), seed + 1) - 0.5) * amt, (hash(frameIdx(t), seed + 2) - 0.5) * amt] as [number, number];
