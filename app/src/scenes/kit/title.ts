// Chapter titles from the lecture notes ("LECTURE NOTES / 0N"). v3: the four characters arrive FAST
// (all four inside `appear` beats), then HOLD, and are cut away exactly on the downbeat that ends the
// span — so the title always sits in front of a strong beat and the new section starts on the hit.
// `overlay` titles have no dark field / roll strip: they sit on top of the running picture.
import { W, H } from '../../engine/gl';
import { rgba } from '../../engine/palette';
import { F, font } from '../../engine/type';
import { clamp, ease, hash, lerp, prog } from '../../engine/util';
import { label, type Ctx } from './draw';
import { drawRoll, type RNote } from './roll';

export type TitleKind = 'type' | 'rise' | 'bloom' | 'fly' | 'thunder' | 'denoise';
export interface TitleOpts { col?: string; appear?: number; field?: number; overlay?: boolean; y?: number; size?: number; exit?: number }

/**
 * beat: continuous beat index now; b0: beat the first character lands; span: beats until the cut.
 * Returns 0..1 coverage so the caller can dim what's behind.
 */
export function chapterTitle(c: Ctx, kind: TitleKind, chars: string, ja: string, num: string, beat: number, b0: number, span = 4, o: TitleOpts = {}) {
  const lb = beat - b0;
  if (lb < -0.12 || lb > span + 0.02) return 0;
  const col = o.col ?? rgba('bone', 1);
  const appear = o.appear ?? 0.9;
  const exitB = o.exit ?? 0.14;
  const out = prog(lb, span - exitB, span);
  const inA = prog(lb, -0.12, 0.02);
  const A = Math.min(inA, 1 - out);
  const ch = Array.from(chars);
  const step = appear / 4;
  const size = o.size ?? 300, gap = size * 1.13, x0 = W / 2 - gap * 1.5, y = o.y ?? 470;
  c.save();
  c.globalAlpha = A;
  if (!o.overlay) {
    c.fillStyle = `rgba(4,4,5,${o.field ?? 0.9})`; c.fillRect(0, 0, W, H);
    // the roll strip the title is sung on (one note per character, the playhead runs over the hold)
    const notes: RNote[] = ch.map((k, i) => ({ b: i * step, len: i === 3 ? span - 3 * step : step * 0.9, p: [3, 5, 7, 10][i]! + (kind === 'rise' ? i * 2 : 0), ly: k, col: '#39C5BB' }));
    const v = { x: 160, y: H - 210, w: W - 320, h: 120, b0: -0.3, beats: span + 0.4, p0: 0, rows: 16 };
    drawRoll(c, v, notes, { now: lb, curve: 0.9, human: 0.2, grid: 0.6, textSize: 20, labels: false });
    label(c, `CHAPTER ${num}`, 160, 120, { color: rgba('miku', 1), size: 16, spacing: 7 });
    label(c, '现世妍术组 · 术力口杂谈', W - 160, 120, { align: 'right', size: 14 });
  }
  // exit: the characters punch forward and are gone on the downbeat
  const ex = ease.inCubic(out);
  ch.forEach((k, i) => {
    const lt = lb - i * step;
    if (kind !== 'thunder' && lt < 0) return;
    const e = ease.outExpo(clamp(lt / Math.max(0.12, step * 1.4)));
    let x = x0 + i * gap, yy = y, sc = 1, a = 1, rot = 0;
    if (kind === 'type') { a = clamp(lt / 0.08); sc = lerp(0.82, 1, e) + lb * 0.006; }
    if (kind === 'rise') { yy = lerp(y + 260, y, e) - lb * 5; sc = lerp(0.86, 1, e); a = clamp(lt / 0.2); }
    if (kind === 'fly') { const a0 = hash(i, 4) * Math.PI * 2; x = lerp(W / 2 + Math.cos(a0) * 1400, x, e); yy = lerp(y + Math.sin(a0) * 900, y, e); rot = (1 - e) * (hash(i, 5) - 0.5) * 3; }
    if (kind === 'thunder') { a = lb >= 0 ? 1 : 0; sc = lerp(1.3, 1, ease.outExpo(clamp(lb / 0.25))); x += (hash(i, Math.floor(lb * 12)) - 0.5) * 10 * (1 - clamp(lb / 1.2)); }
    if (kind === 'bloom') {
      sc = lerp(1.5, 1, e);
      for (let j = 0; j < 10; j++) { // petals: copies flung outward
        const ang = (j / 10) * Math.PI * 2 + i * 0.7, r = e * 220 + lt * 60;
        c.save(); c.globalAlpha = A * (1 - e) * 0.55; c.font = font(F.jpSerif(), size * 0.55);
        c.fillStyle = rgba(['luka', 'miku', 'rin', 'gumi', 'luo'][j % 5]!, 1); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(k, x + Math.cos(ang) * r, y + Math.sin(ang) * r); c.restore();
      }
    }
    sc *= 1 + ex * 0.6;
    c.save();
    c.globalAlpha = A * a;
    c.translate(x + (x - W / 2) * ex * 0.5, yy); c.rotate(rot); c.scale(sc, sc);
    c.font = font(F.jpSerif(), size); c.textAlign = 'center'; c.textBaseline = 'middle';
    if (o.overlay) { c.shadowColor = 'rgba(0,0,0,0.85)'; c.shadowBlur = 40; }
    if (kind === 'denoise') {
      // emerges from blocky noise: cells resolve quickly, a few stragglers flicker through the hold
      const k2 = clamp(lt / 0.5);
      c.fillStyle = col; c.fillText(k, 0, 0);
      c.globalCompositeOperation = 'source-atop';
      const cell = size * 0.073;
      for (let gy = -6; gy < 6; gy++) for (let gx = -6; gx < 6; gx++) {
        if (hash(gx, gy, i) < k2 * 0.97) continue;
        c.fillStyle = hash(gx, gy, Math.floor(beat * 8)) > 0.5 ? rgba('kafu', 1) : rgba('ink', 1);
        c.fillRect(gx * cell, gy * cell, cell, cell);
      }
      c.globalCompositeOperation = 'source-over';
    } else {
      c.fillStyle = col; c.fillText(k, 0, 0);
    }
    c.restore();
  });
  if (kind === 'thunder' && lb >= 0 && lb < 1.0) {
    // lightning: jagged cracks from the top
    c.save(); c.globalAlpha = A * (1 - lb / 1.0); c.strokeStyle = rgba('bone', 1); c.lineWidth = 4;
    for (let s = 0; s < 3; s++) {
      c.beginPath(); let x = 300 + s * 650 + hash(s, 1) * 200, yy = 0; c.moveTo(x, yy);
      while (yy < H) { x += (hash(s, Math.floor(yy)) - 0.5) * 140; yy += 40 + hash(s, Math.floor(yy) + 1) * 60; c.lineTo(x, yy); }
      c.stroke();
    }
    c.restore();
  }
  // Japanese gloss under the title (arrives with the last character)
  c.globalAlpha = A * prog(lb, appear, appear + 0.4) * (1 - ex);
  c.font = font(F.jp(300), Math.round(size * 0.1)); c.fillStyle = rgba('ash', 1); c.textAlign = 'center';
  if (o.overlay) { c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 16; }
  c.fillText(ja, W / 2, y + size * 0.76);
  if (o.overlay) label(c, `CHAPTER ${num}`, W / 2, y - size * 0.68, { align: 'center', color: rgba('miku', 1), size: 15, spacing: 7 });
  c.restore();
  return A;
}
