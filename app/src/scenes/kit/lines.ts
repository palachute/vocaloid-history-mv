// GPU line motifs: the voice line, rings, spectrum rings, particles. Colours are linear RGB.
import type { LineBatch } from '../../engine/lines';
import { hash, noise1, lerp } from '../../engine/util';

export type RGB = [number, number, number];
export const mul = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];
export const mix3 = (a: RGB, b: RGB, k: number): RGB => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

/**
 * The voice line: a horizontal waveform from x0 to x1 at y.
 * amp in px; freq = number of main cycles; jag 0..1 adds high-frequency teeth; env shapes the ends.
 */
export function voiceLine(L: LineBatch, t: number, o: {
  x0?: number; x1?: number; y?: number; amp: number; color: RGB; width?: number; alpha?: number;
  freq?: number; seed?: number; jag?: number; speed?: number; n?: number; env?: boolean; offset?: number;
}) {
  const x0 = o.x0 ?? 0, x1 = o.x1 ?? 1920, y = o.y ?? 540, n = o.n ?? 600;
  const f1 = o.freq ?? 5, seed = o.seed ?? 1, jag = o.jag ?? 0, sp = o.speed ?? 4;
  let px = 0, py = 0;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = lerp(x0, x1, u);
    const e = o.env === false ? 1 : Math.pow(Math.sin(Math.PI * u), 1.3);
    let v = Math.sin(u * f1 * 6.283 + t * sp + seed) * 0.55
      + Math.sin(u * f1 * 2.7 * 6.283 - t * sp * 1.6 + seed * 2) * 0.28
      + noise1(u * 30 + t * 2.5, seed) * 0.35;
    if (jag > 0) v = lerp(v, (hash(Math.floor(u * 220), Math.floor(t * 30) + seed) - 0.5) * 2.2, jag);
    const yy = y + (o.offset ?? 0) + v * o.amp * e;
    if (i > 0) L.seg2(px, py, x, yy, o.width ?? 2, o.color, o.alpha ?? 1);
    px = x; py = yy;
  }
}

export function ring(L: LineBatch, cx: number, cy: number, r: number, color: RGB, o: { width?: number; alpha?: number; seg?: number; a0?: number; a1?: number; wobble?: number; t?: number } = {}) {
  const seg = o.seg ?? 180, a0 = o.a0 ?? 0, a1 = o.a1 ?? Math.PI * 2;
  let px = 0, py = 0;
  for (let i = 0; i <= seg; i++) {
    const a = lerp(a0, a1, i / seg);
    const rr = r + (o.wobble ? noise1(i * 0.2 + (o.t ?? 0) * 3, 4) * o.wobble : 0);
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    if (i) L.seg2(px, py, x, y, o.width ?? 2, color, o.alpha ?? 1);
    px = x; py = y;
  }
}

/** Radial spectrum bars around a circle. level 0..1 overall, kick adds a pulse. */
export function spectrumRing(L: LineBatch, t: number, cx: number, cy: number, r: number, color: RGB, hot: RGB, o: { n?: number; len?: number; alpha?: number; kick?: number; seed?: number } = {}) {
  const n = o.n ?? 180;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const sym = Math.min(i, n - i) / n;
    const e = 0.25 + 0.75 * Math.abs(noise1(sym * 9 + t * 2.3, o.seed ?? 5)) + (o.kick ?? 0) * 0.6 * (1 - sym);
    const len = (10 + e * (o.len ?? 90));
    const x0 = cx + Math.cos(a) * (r + 8), y0 = cy + Math.sin(a) * (r + 8);
    const x1 = cx + Math.cos(a) * (r + 8 + len), y1 = cy + Math.sin(a) * (r + 8 + len);
    const g = 1.3 + e * 2.3;
    L.seg2(x0, y0, x1, y1, 3.2, mul(mix3(color, hot, e), g), o.alpha ?? 1);
  }
}

/**
 * Deterministic particle field: particle i is born at a hashed time inside [t0, t1) and lives `life` s.
 * pos(i, age, u) returns {x, y, a} for age seconds and a per-particle random u (0..1).
 */
export function particles(L: LineBatch, t: number, n: number, t0: number, t1: number, life: number,
  pos: (i: number, age: number, u: number) => { x: number; y: number; vx: number; vy: number; a: number; w: number; c: RGB } | null, seed = 1) {
  for (let i = 0; i < n; i++) {
    const born = t0 + hash(i, seed) * Math.max(0.001, t1 - t0 - life * 0.2);
    const age = t - born;
    if (age < 0 || age > life) continue;
    const p = pos(i, age, hash(i, seed + 7));
    if (!p || p.a <= 0) continue;
    L.seg2(p.x, p.y, p.x + p.vx, p.y + p.vy, p.w, p.c, p.a);
  }
}
