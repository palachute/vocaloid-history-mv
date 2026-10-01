// Base class for every chapter: a configurable background shader, one additive line batch, a main
// Canvas2D layer and the shared overlay (bilingual lyrics, chapter captions, the year clock).
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../../engine/scene';
import { FSPass, Layer2D, W, H } from '../../engine/gl';
import { LineBatch } from '../../engine/lines';
import { hexToLinear } from '../../engine/util';
import { loadKit, type KitData, type Song } from './data';
import { caption, clockText, lyric } from './draw';

export const BG_FRAG = /* glsl */ `
  uniform float t, grid, noiseA, sand, burn, scan, vign, horizon;
  uniform vec3 base, glowC, glow2C;
  uniform vec2 glowP, glow2P;
  uniform float glowR, glowA, glow2R, glow2A;
  void main() {
    vec2 p = FRAG_PX;
    vec3 c = base;
    float r1 = length(p - glowP); c += glowC * glowA * exp(-r1 * r1 / (glowR * glowR));
    float r2 = length(p - glow2P); c += glow2C * glow2A * exp(-r2 * r2 / (glow2R * glow2R));
    if (grid > 0.0) {
      vec2 g = abs(fract(p / 48.0 + 0.5) - 0.5) * 48.0;
      float line = 1.0 - smoothstep(0.0, 1.2, min(g.x, g.y));
      float rr = length((p - vec2(960.0, 540.0)) / vec2(960.0, 700.0));
      c += C_GRAPHITE * line * 0.07 * grid * (1.0 - rr);
    }
    if (noiseA > 0.0) c += C_ASH * 0.02 * noiseA * fbm(vec3(p / 520.0, t * 0.07), 4);
    if (sand > 0.0) {
      // dune field below the horizon, dusty sky above
      float y = p.y - horizon;
      vec3 sandC = vec3(0.42, 0.30, 0.19), skyC = vec3(0.10, 0.07, 0.05);
      float dunes = fbm(vec2(p.x / 700.0 + t * 0.01, max(y, 0.0) / 160.0), 5);
      float ridge = smoothstep(0.02, 0.0, abs(fract(p.x / 900.0 + dunes * 0.8 + y / 500.0) - 0.5) - 0.48);
      vec3 ground = sandC * (0.35 + 0.35 * dunes + 0.25 * smoothstep(0.0, 500.0, y)) + ridge * 0.03;
      vec3 sky = mix(skyC * 1.4, skyC * 0.4, smoothstep(-500.0, 0.0, y)) + sandC * 0.12 * exp(-abs(y) / 60.0);
      float haze = fbm(vec3(p / 300.0 + vec2(t * 0.05, 0.0), t * 0.1), 3);
      vec3 s = mix(sky, ground, smoothstep(-2.0, 2.0, y)) + sandC * 0.05 * haze;
      c = mix(c, s, sand);
    }
    if (burn > 0.0) {
      float n = fbm(vec3(p / vec2(260.0, 180.0) + vec2(0.0, t * 0.4), t * 0.3), 5);
      float h = smoothstep(1080.0, 250.0, p.y - n * 180.0);
      c += heat(sat((1.0 - h) * 0.9 + n * 0.25)) * 0.35 * burn * (1.0 - h * 0.6);
    }
    if (scan > 0.0) c *= 1.0 - scan * 0.18 * (0.5 + 0.5 * sin(p.y * 3.14159));
    float v = length((p - vec2(960.0, 540.0)) / vec2(1100.0, 800.0));
    c *= 1.0 - vign * smoothstep(0.4, 1.3, v);
    fragColor = vec4(c, 1.0);
  }`;

export const lin = (hex: string) => hexToLinear(hex);

/** Lyric lines (1-based) that get the big treatment by default. */
const BIG = new Set([7, 8, 9, 10, 11, 12, 17, 26, 27, 30, 31]);

/** The year clock through the film (bar → value). */
const CLOCK: [number, string][] = [
  [16, '2007'], [26, '2007'], [30, '2008'], [31.5, '2009'], [36, '2009'], [38, '2010'], [41, '2011'], [43.5, '2012'], [48, '2012'],
  [50, '2014'], [51.5, '2015'], [53, '2016'], [58, '2017'], [64, '2018'], [65, '2019'], [65.7, '2020'], [66, '2021'], [68, '2026'],
];
export function clockAt(bar: number): string {
  let s = CLOCK[0]![1];
  for (const [b, v] of CLOCK) if (bar >= b) s = v;
  return s;
}

export abstract class Chapter extends Scene {
  bg = new FSPass(BG_FRAG, {
    t: { value: 0 }, grid: { value: 0 }, noiseA: { value: 0.5 }, sand: { value: 0 }, burn: { value: 0 }, scan: { value: 0 }, vign: { value: 0.3 }, horizon: { value: 620 },
    base: { value: [0.003, 0.003, 0.0035] }, glowC: { value: [0, 0, 0] }, glow2C: { value: [0, 0, 0] },
    glowP: { value: [960, 540] }, glow2P: { value: [960, 540] }, glowR: { value: 600 }, glowA: { value: 0 }, glow2R: { value: 600 }, glow2A: { value: 0 },
  });
  L = new LineBatch(60000, { blend: 'add' });
  T = new Layer2D();
  O = new Layer2D();
  D!: KitData;
  /** per-frame overlay switches (reset before each frame) */
  ov = { lyrics: true, captions: true, clock: true, ink: false, lyricX: 960, lyricY: 0, lyricBig: new Set<number>(), lyricHide: new Set<number>(), clockOverride: '' as string };

  async init() { this.D = await loadKit(); await this.setup(); }
  setup(): void | Promise<void> {}

  // ---- time helpers (absolute bar / beat indices of the song) ----
  bar(i: number) { return this.ctx.audio.timeOfBeat(i * 4); }
  bt(b: number) { return this.ctx.audio.timeOfBeat(b); }
  barAt(t: number) { return this.ctx.audio.beatAt(t) / 4; }
  song(id: string): Song { return this.D.byId[id]!; }
  cover(id: string) { return this.D.img[`covers/${id}`]; }
  char(id: string) { return this.D.img[`chars/${id}`]; }

  /** set background uniforms (only the ones given) */
  setBg(o: Record<string, number | number[]>) { for (const [k, v] of Object.entries(o)) this.bg.u[k]!.value = v; }
  resetBg() {
    this.setBg({ grid: 0, noiseA: 0.5, sand: 0, burn: 0, scan: 0, vign: 0.3, glowA: 0, glow2A: 0, base: [0.003, 0.003, 0.0035] });
  }

  abstract frame(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides | void;

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides | void {
    this.ov.lyrics = true; this.ov.captions = true; this.ov.clock = true; this.ov.ink = false; this.ov.lyricX = 960; this.ov.lyricY = 0;
    this.ov.lyricBig = new Set(BIG); this.ov.lyricHide = new Set(); this.ov.clockOverride = '';
    this.bg.u.t!.value = f.t;
    const post = this.frame(f, out);
    this.overlay(f, out);
    return post;
  }

  private overlay(f: Frame, out: THREE.WebGLRenderTarget) {
    const O = this.O; O.clear();
    const c = O.ctx, t = f.t, bar = this.barAt(t);
    if (this.ov.captions) for (const cap of this.D.captions) {
      const t0 = this.bar(cap.bar0), t1 = this.bar(cap.bar1);
      if (t >= t0 && t <= t1) caption(c, cap, t, t0, t1, { ink: this.ov.ink });
    }
    if (this.ov.lyrics) this.D.lyrics.forEach((ln, i) => {
      const n = i + 1;
      if (this.ov.lyricHide.has(n)) return;
      const nxt = this.D.lyrics[i + 1]?.start ?? 1e9;
      const hold = Math.min(Math.max(ln.end, ln.start + 2.2), nxt - 0.25);
      if (t >= ln.start - 0.1 && t <= hold + 0.3) lyric(c, { ...ln, end: hold }, t, { big: this.ov.lyricBig.has(n), ink: this.ov.ink, x: this.ov.lyricX, y: this.ov.lyricY || undefined });
    });
    if (this.ov.clock) {
      const s = this.ov.clockOverride || clockAt(bar);
      clockText(c, s, W - 96, 150, 84, 0.9, { color: this.ov.ink ? 'rgba(10,10,11,0.9)' : undefined });
    }
    this.ctx.comp.draw(this.ctx.renderer, O.upload(), out);
  }
}

export { W, H };
