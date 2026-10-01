// The night city of chorus 1's last verse, shared with the interlude so the rising lanterns are ONE
// continuous system across the cut (same windows, same particles, same camera).
import type { LineBatch } from '../../engine/lines';
import { LIN } from '../../engine/palette';
import { ease, hash, lerp, prog } from '../../engine/util';
import type { Stage } from './three3d';
import { mul, type RGB } from './lines';

export interface Win { x: number; y: number; z: number; nx: number; nz: number; c: number }
export interface Bld { x: number; z: number; w: number; d: number; h: number }
export interface Sign { x: number; y: number; z: number; s: string; c: number }
const SIGNS = ['カラオケ', 'コンビニ', '24H', '喫茶', 'ゲーム', 'ラーメン', '薬', 'ネットカフェ', 'CD', '書店'];
export const WC: RGB[] = [LIN.miku, [1.0, 0.75, 0.4], LIN.luka, LIN.rin, LIN.luo, [1.0, 0.85, 0.6]];

export function makeCity() {
  const bld: Bld[] = [], win: Win[] = [], signs: Sign[] = [];
  for (let i = 0; i < 110; i++) {
    const gx = (hash(i, 1) - 0.5) * 9000, gz = -hash(i, 2) * 9000 + 600;
    if (Math.abs(gx) < 520) continue; // the main street
    if (Math.abs(((gz % 2400) + 2400) % 2400 - 1200) < 220) continue; // cross streets
    const w = 300 + hash(i, 3) * 500, d = 300 + hash(i, 4) * 400, h = 400 + Math.pow(hash(i, 5), 2) * 2600;
    bld.push({ x: gx, z: gz, w, d, h });
    const nw = Math.floor(h / 120);
    for (let k = 0; k < nw * 3; k++) {
      if (hash(i, k, 7) > 0.32) continue;
      const face = Math.floor(hash(i, k, 8) * 2);
      const fy = 60 + Math.floor(hash(i, k, 9) * nw) * 120;
      const fx = (hash(i, k, 10) - 0.5) * (face ? d : w) * 0.8;
      if (face === 0) win.push({ x: gx + fx, y: fy, z: gz + d / 2 + 2, nx: 0, nz: 1, c: Math.floor(hash(i, k, 11) * 6) });
      else win.push({ x: gx + (gx < 0 ? w / 2 : -w / 2) + (gx < 0 ? 2 : -2), y: fy, z: gz + fx, nx: gx < 0 ? 1 : -1, nz: 0, c: Math.floor(hash(i, k, 11) * 6) });
    }
    if (hash(i, 40) < 0.45 && Math.abs(gx) < 2600) signs.push({ x: gx + (gx < 0 ? w / 2 + 6 : -w / 2 - 6), y: 160 + hash(i, 41) * Math.min(h - 200, 700), z: gz + d * 0.3, s: SIGNS[i % SIGNS.length]!, c: i % 5 });
  }
  return { bld, win, signs };
}

/** the city camera: dolly down the street, then tilt up after the lanterns (holds the upward view after b191.8) */
export function cityCamera(st: Stage, t: number, B: (b: number) => number) {
  const rise = prog(t, B(182.4), B(191.8), ease.inCubic);
  const dolly = prog(t, B(174), B(192));
  const camZ = lerp(2600, -600, ease.inOutCubic(dolly)), camY = lerp(1500, 1100, dolly) + rise * 600;
  const lookY = lerp(200, 9000, ease.inCubic(rise)), lookZ = camZ - lerp(4200, 500, rise);
  st.lookAt(Math.sin(t * 0.3) * 80, camY, camZ, 0, lookY, lookZ, Math.sin(t * 0.4) * 0.02);
  return { camZ, rise };
}

/** notes rising out of the windows like lanterns — a trickle, then a flood on each 届け */
export function drawLanterns(L3: LineBatch, t: number, beat: number, B: (b: number) => number, win: Win[], fade: number) {
  if (fade <= 0) return;
  const surge = beat >= 182.4 ? 1 : prog(t, B(176), B(182.4)) * 0.3;
  const n = Math.floor(lerp(60, 900, surge * (0.3 + 0.7 * prog(t, B(182.4), B(190)))));
  for (let i = 0; i < n; i++) {
    const w = win[Math.floor(hash(i, 21) * win.length)]!;
    const per = 5 + hash(i, 22) * 4;
    const age = ((t - B(175)) + hash(i, 23) * per) % per;
    if (t - B(175) < age) continue;
    const sp = 260 + hash(i, 24) * 300 + (beat > 182.4 ? 500 : 0);
    const x = w.x + w.nx * 60 * Math.min(age, 1) + Math.sin(age * 1.3 + i) * 50, y = w.y + age * sp, z = w.z + w.nz * 60 * Math.min(age, 1) + Math.cos(age + i) * 40;
    const col = mul(WC[i % 6]!, 5);
    const a = Math.min(age * 2, 1) * (1 - age / per) * fade;
    L3.seg(x, y, z, x, y + 26, z, 11, col[0], col[1], col[2], a);
    L3.seg(x, y - sp * 0.35, z, x, y, z, 3, col[0] * 0.5, col[1] * 0.5, col[2] * 0.5, a * 0.6);
  }
}

export function drawStars(L3: LineBatch, t: number, fade: number) {
  for (let i = 0; i < 400; i++) { const x = (hash(i, 31) - 0.5) * 30000, z = -hash(i, 32) * 20000 - 2000, y = 4000 + hash(i, 33) * 9000; L3.seg(x, y, z, x + 1, y, z, 2, 1.5, 1.5, 1.6, fade * 0.6 * (0.5 + 0.5 * Math.sin(t * 2 + i))); }
}
