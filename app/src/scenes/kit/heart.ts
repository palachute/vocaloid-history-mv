// A low-poly heart (after the grey polyhedral heart of アンノウン・マザーグース): vertices on the surface
// of the implicit heart (x² + 9/4 y² + z² − 1)³ − x² z³ − 9/200 y² z³ = 0, sampled on a coarse
// lat/long grid, with grid + diagonal edges so it reads as faceted. World: z_heart → +Y (up).
import * as THREE from 'three';
import type { LineBatch } from '../../engine/lines';
import type { RGB } from './lines';
import { hash } from '../../engine/util';

const f = (x: number, y: number, z: number) => Math.pow(x * x + 2.25 * y * y + z * z - 1, 3) - x * x * z * z * z - 0.045 * y * y * z * z * z;

export interface Heart { verts: THREE.Vector3[]; edges: [number, number][]; nu: number; nv: number }

export function makeHeart(scale = 400, nu = 14, nv = 9): Heart {
  const verts: THREE.Vector3[] = [];
  for (let j = 0; j <= nv; j++) {
    const phi = (j / nv) * Math.PI; // 0 = top … π = bottom
    for (let i = 0; i < nu; i++) {
      const th = (i / nu) * Math.PI * 2 + (j % 2) * (Math.PI / nu);
      const dx = Math.sin(phi) * Math.cos(th), dy = Math.sin(phi) * Math.sin(th), dz = Math.cos(phi);
      let lo = 0, hi = 2;
      for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (f(dx * m, dy * m, dz * m) < 0) lo = m; else hi = m; }
      const r = lo * (1 + (hash(i, j, 3) - 0.5) * 0.04);
      // heart z up → world y; heart x → world x; heart y (thin axis) → world z
      verts.push(new THREE.Vector3(dx * r * scale, dz * r * scale + scale * 0.12, dy * r * scale));
      if (j === 0 || j === nv) break; // poles: one vertex
    }
  }
  // index helpers
  const ring = (j: number) => (j === 0 ? 0 : 1 + (j - 1) * nu);
  const at = (j: number, i: number) => (j === 0 ? 0 : j === nv ? 1 + (nv - 1) * nu : ring(j) + (((i % nu) + nu) % nu));
  const edges: [number, number][] = [];
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = at(j, i), b = at(j + 1, i);
      if (j > 0) edges.push([a, at(j, i + 1)]);
      edges.push([a, b]);
      if (j > 0 && j < nv - 1) edges.push([a, at(j + 1, i + 1)]);
    }
  }
  return { verts, edges, nu, nv };
}

/** Draw a heart (positions already transformed) as lines. glow 0..: brightness; a: alpha */
export function drawHeart(L: LineBatch, P: THREE.Vector3[], edges: [number, number][], col: RGB, o: { width?: number; alpha?: number; k?: number } = {}) {
  const k = o.k ?? 1; // how many edges are drawn (0..1) — the heart being written
  const n = Math.floor(edges.length * k);
  for (let e = 0; e < n; e++) {
    const [ia, ib] = edges[e]!;
    const a = P[ia]!, b = P[ib]!;
    L.seg(a.x, a.y, a.z, b.x, b.y, b.z, o.width ?? 1.6, col[0], col[1], col[2], o.alpha ?? 1);
  }
}
