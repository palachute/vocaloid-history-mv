// 3D building blocks rendered straight into the scene's HDR target with a perspective camera:
//  - PointFigure: a portrait image turned into a particle body (flat like the picture at first, then
//    given volume; can morph into any target shape: a stream, a sphere, noise, a globe of notes).
//  - GlyphPlanet: a planet whose surface is made of ASCII glyphs (the sand planet).
//  - CardWall: textured planes (covers) arranged in space.
//  - Stage: a scene + camera helper.
import * as THREE from 'three';
import { SCALE } from '../../engine/gl';
import { hash } from '../../engine/util';

export class Stage {
  scene = new THREE.Scene();
  cam = new THREE.PerspectiveCamera(38, 16 / 9, 1, 50000);
  lookAt(x: number, y: number, z: number, tx = 0, ty = 0, tz = 0, roll = 0) {
    this.cam.position.set(x, y, z);
    this.cam.up.set(Math.sin(roll), Math.cos(roll), 0);
    this.cam.lookAt(tx, ty, tz);
    this.cam.updateMatrixWorld();
  }
  render(renderer: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget) {
    renderer.setRenderTarget(out);
    renderer.clearDepth();
    renderer.render(this.scene, this.cam);
  }
}

const srgb2lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

const FIG_VERT = /* glsl */ `
precision highp float;
in vec3 position; in vec3 aT; in vec3 aCol; in vec4 aRnd;
uniform mat4 projectionMatrix; uniform mat4 modelViewMatrix;
uniform float uMorph, uStagger, uFlat, uNoise, uTime, uSize, uPx, uBright, uScatter, uTint, uPaint;
uniform vec3 uTintC;
out vec3 vCol; out float vA;
void main() {
  vec3 base = position; base.z *= (1.0 - uFlat);
  float k = clamp((uMorph * (1.0 + uStagger) - aRnd.x * uStagger), 0.0, 1.0);
  k = k * k * (3.0 - 2.0 * k);
  vec3 p = mix(base, aT, k);
  // drifting noise (dust) and a radial scatter
  vec3 n = vec3(sin(uTime * 1.3 + aRnd.y * 40.0), sin(uTime * 1.1 + aRnd.z * 40.0), sin(uTime * 0.9 + aRnd.w * 40.0));
  p += n * uNoise * (0.4 + aRnd.w);
  p += normalize(p + vec3(0.001)) * uScatter * (0.3 + aRnd.y);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.6 + aRnd.z * 0.8) * projectionMatrix[1][1] * 540.0 * uPx / max(1.0, -mv.z);
  vec3 col = mix(aCol, uTintC, uTint);
  if (aRnd.y < uPaint) { // painted by everyone: the voicebanks' colours
    float h = fract(aRnd.z * 7.0);
    vec3 pc = h < 0.2 ? vec3(0.04, 0.56, 0.5) : h < 0.35 ? vec3(1.0, 0.27, 0.42) : h < 0.5 ? vec3(1.0, 0.55, 0.0) : h < 0.65 ? vec3(0.21, 0.7, 0.1) : h < 0.8 ? vec3(0.13, 0.6, 1.0) : vec3(1.0, 0.03, 0.25);
    col = mix(col, pc, 0.85);
  }
  vCol = col * uBright;
  vA = 1.0;
}`;
const FIG_FRAG = /* glsl */ `
precision highp float;
in vec3 vCol; in float vA;
uniform float uOpacity, uRect;
out vec4 fragColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a;
  if (uRect > 0.5) { // note block: a wide rounded rectangle
    vec2 q = abs(c) - vec2(0.45, 0.18);
    a = 1.0 - smoothstep(0.0, 0.06, max(q.x, q.y));
  } else a = 1.0 - smoothstep(0.25, 0.5, length(c));
  a *= uOpacity * vA;
  if (a <= 0.003) discard;
  fragColor = vec4(vCol * a, a);
}`;

export interface FigureOpts { n?: number; height?: number; depth?: number; bgTol?: number }

/** A portrait as a particle body. World units: the figure is `height` tall, centred at the origin. */
export class PointFigure {
  points: THREE.Points;
  geo = new THREE.BufferGeometry();
  mat: THREE.RawShaderMaterial;
  base!: Float32Array;
  rnd!: Float32Array;
  n = 0;
  aspect = 1;
  private targets = new Map<string, Float32Array>();
  private current = '';

  constructor(img: HTMLImageElement | undefined, o: FigureOpts = {}) {
    const N = o.n ?? 70000, Hh = o.height ?? 1000, depth = o.depth ?? 70;
    const pos: number[] = [], col: number[] = [];
    if (img) {
      const cw = 360, ch = Math.round((img.height / img.width) * cw);
      this.aspect = cw / ch;
      const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
      const cx = cv.getContext('2d', { willReadFrequently: true })!;
      cx.drawImage(img, 0, 0, cw, ch);
      const d = cx.getImageData(0, 0, cw, ch).data;
      // mask: alpha if present, else distance from the corner colour (white/flat backgrounds)
      const br = d[0]!, bg = d[1]!, bb = d[2]!;
      let hasAlpha = false;
      for (let i = 3; i < d.length; i += 4 * 97) if (d[i]! < 250) { hasAlpha = true; break; }
      const mask = new Float32Array(cw * ch);
      for (let i = 0; i < cw * ch; i++) {
        const a = d[i * 4 + 3]! / 255;
        const dist = Math.abs(d[i * 4]! - br) + Math.abs(d[i * 4 + 1]! - bg) + Math.abs(d[i * 4 + 2]! - bb);
        mask[i] = hasAlpha ? a : dist > (o.bgTol ?? 60) ? 1 : 0;
      }
      // chamfer distance to the silhouette edge → body thickness
      const dist = new Float32Array(cw * ch).fill(1e6);
      for (let i = 0; i < cw * ch; i++) if (mask[i]! < 0.5) dist[i] = 0;
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const i = y * cw + x; if (!dist[i]) continue;
        let v = dist[i]!;
        if (x > 0) v = Math.min(v, dist[i - 1]! + 1); if (y > 0) v = Math.min(v, dist[i - cw]! + 1);
        if (x > 0 && y > 0) v = Math.min(v, dist[i - cw - 1]! + 1.4); if (x < cw - 1 && y > 0) v = Math.min(v, dist[i - cw + 1]! + 1.4);
        dist[i] = v;
      }
      for (let y = ch - 1; y >= 0; y--) for (let x = cw - 1; x >= 0; x--) {
        const i = y * cw + x; if (!dist[i]) continue;
        let v = dist[i]!;
        if (x < cw - 1) v = Math.min(v, dist[i + 1]! + 1); if (y < ch - 1) v = Math.min(v, dist[i + cw]! + 1);
        if (x < cw - 1 && y < ch - 1) v = Math.min(v, dist[i + cw + 1]! + 1.4); if (x > 0 && y < ch - 1) v = Math.min(v, dist[i + cw - 1]! + 1.4);
        dist[i] = v;
      }
      const inside: number[] = [];
      for (let i = 0; i < cw * ch; i++) if (mask[i]! > 0.5) inside.push(i);
      const s = Hh / ch;
      for (let k = 0; k < N && inside.length; k++) {
        const i = inside[Math.floor(hash(k, 3) * inside.length)]!;
        const x = (i % cw) + hash(k, 4) - 0.5, y = Math.floor(i / cw) + hash(k, 5) - 0.5;
        const th = Math.sqrt(dist[i]!) * depth * 0.12 * s * 4;
        const side = hash(k, 6) < 0.5 ? -1 : 1;
        pos.push((x - cw / 2) * s, -(y - ch / 2) * s, side * th * (0.3 + 0.7 * hash(k, 7)));
        col.push(srgb2lin(d[i * 4]! / 255), srgb2lin(d[i * 4 + 1]! / 255), srgb2lin(d[i * 4 + 2]! / 255));
      }
    }
    if (!pos.length) { // no image: an abstract column of light
      for (let k = 0; k < N; k++) {
        const a = hash(k, 1) * Math.PI * 2, r = Math.sqrt(hash(k, 2)) * Hh * 0.18 * (1 - Math.abs(hash(k, 3) - 0.5));
        pos.push(Math.cos(a) * r, (hash(k, 3) - 0.5) * Hh, Math.sin(a) * r);
        col.push(0.04, 0.55, 0.5);
      }
    }
    this.n = pos.length / 3;
    this.base = new Float32Array(pos);
    this.rnd = new Float32Array(this.n * 4);
    for (let i = 0; i < this.n * 4; i++) this.rnd[i] = hash(i, 77);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.base, 3));
    this.geo.setAttribute('aT', new THREE.BufferAttribute(new Float32Array(this.base), 3));
    this.geo.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(col), 3));
    this.geo.setAttribute('aRnd', new THREE.BufferAttribute(this.rnd, 4));
    this.mat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: FIG_VERT, fragmentShader: FIG_FRAG,
      uniforms: {
        uMorph: { value: 0 }, uStagger: { value: 0.6 }, uFlat: { value: 0 }, uNoise: { value: 0 }, uTime: { value: 0 }, uSize: { value: 2.2 },
        uPx: { value: SCALE }, uBright: { value: 1.3 }, uScatter: { value: 0 }, uOpacity: { value: 1 }, uRect: { value: 0 }, uTint: { value: 0 }, uPaint: { value: 0 }, uTintC: { value: new THREE.Color(0, 0, 0) },
      },
      transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
  }
  get u() { return this.mat.uniforms as Record<string, THREE.IUniform>; }

  /** Set (and cache) the morph target. fn gets the particle index, its base position and 4 randoms. */
  target(key: string, fn: (i: number, x: number, y: number, z: number, r: Float32Array, ri: number) => [number, number, number]) {
    if (this.current === key) return;
    let a = this.targets.get(key);
    if (!a) {
      a = new Float32Array(this.n * 3);
      for (let i = 0; i < this.n; i++) {
        const v = fn(i, this.base[i * 3]!, this.base[i * 3 + 1]!, this.base[i * 3 + 2]!, this.rnd, i * 4);
        a[i * 3] = v[0]; a[i * 3 + 1] = v[1]; a[i * 3 + 2] = v[2];
      }
      this.targets.set(key, a);
    }
    const attr = this.geo.getAttribute('aT') as THREE.BufferAttribute;
    (attr.array as Float32Array).set(a); attr.needsUpdate = true;
    this.current = key;
  }
  /** Use a target as the new base (so the next morph starts from it). */
  rebase(key: string) {
    const a = this.targets.get(key); if (!a) return;
    const attr = this.geo.getAttribute('position') as THREE.BufferAttribute;
    (attr.array as Float32Array).set(a); attr.needsUpdate = true;
  }
  restoreBase() {
    const attr = this.geo.getAttribute('position') as THREE.BufferAttribute;
    (attr.array as Float32Array).set(this.base); attr.needsUpdate = true;
  }
}

// ---------------------------------------------------------------- the glyph planet
const GLYPHS = ' .`:-=+*ox%#@';
function glyphAtlas() {
  const n = GLYPHS.length, S = 64;
  const cv = document.createElement('canvas'); cv.width = S * n; cv.height = S;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#fff'; c.font = `bold ${S * 0.82}px "Plex-500", monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let i = 0; i < n; i++) c.fillText(GLYPHS[i]!, i * S + S / 2, S / 2 + 2);
  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.flipY = false;
  return tex;
}
const PLANET_VERT = /* glsl */ `
precision highp float;
in vec3 position; in vec2 aR;
uniform mat4 projectionMatrix; uniform mat4 modelViewMatrix;
uniform vec3 uLight; uniform float uSize, uPx, uT, uGlyphs;
out float vG; out float vShade; out float vFog;
void main() {
  vec3 nrm = normalize(position);
  // dune relief: lit by a low sun
  float dune = sin(dot(nrm, vec3(9.0, 3.0, 5.0)) * 6.0 + aR.x * 2.0) * 0.5 + 0.5;
  float lam = clamp(dot(nrm, uLight) * 0.85 + 0.15 + (dune - 0.5) * 0.5, 0.0, 1.0);
  vShade = lam;
  vG = floor(clamp(lam * (uGlyphs - 1.0) + aR.y * 0.8, 0.0, uGlyphs - 1.0));
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * projectionMatrix[1][1] * 540.0 * uPx / max(1.0, -mv.z);
  vFog = clamp(-mv.z / 30000.0, 0.0, 1.0);
}`;
const PLANET_FRAG = /* glsl */ `
precision highp float;
in float vG; in float vShade; in float vFog;
uniform sampler2D uAtlas; uniform float uGlyphs, uOpacity; uniform vec3 uCol, uShadow;
out vec4 fragColor;
void main() {
  vec2 uv = vec2((vG + gl_PointCoord.x) / uGlyphs, gl_PointCoord.y);
  float a = texture(uAtlas, uv).r * uOpacity;
  if (a < 0.02) discard;
  vec3 c = mix(uShadow, uCol, vShade);
  fragColor = vec4(c * a, a);
}`;

export class GlyphPlanet {
  points: THREE.Points;
  mat: THREE.RawShaderMaterial;
  constructor(public R = 3000, n = 140000) {
    const pos = new Float32Array(n * 3), r = new Float32Array(n * 2);
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2, rr = Math.sqrt(1 - y * y), th = ga * i;
      const h = 1 + (hash(i, 9) - 0.5) * 0.004;
      pos[i * 3] = Math.cos(th) * rr * R * h; pos[i * 3 + 1] = y * R * h; pos[i * 3 + 2] = Math.sin(th) * rr * R * h;
      r[i * 2] = hash(i, 1); r[i * 2 + 1] = hash(i, 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aR', new THREE.BufferAttribute(r, 2));
    this.mat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: PLANET_VERT, fragmentShader: PLANET_FRAG,
      uniforms: { uLight: { value: new THREE.Vector3(0.6, 0.35, 0.7).normalize() }, uSize: { value: 26 }, uPx: { value: SCALE }, uT: { value: 0 }, uGlyphs: { value: GLYPHS.length },
        uAtlas: { value: glyphAtlas() }, uOpacity: { value: 1 }, uCol: { value: new THREE.Color(0.75, 0.5, 0.28) }, uShadow: { value: new THREE.Color(0.05, 0.03, 0.02) } },
      transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
  }
}

// ---------------------------------------------------------------- textured cards in space
export class CardWall {
  group = new THREE.Group();
  meshes: THREE.Mesh[] = [];
  constructor(items: { img?: HTMLImageElement; x: number; y: number; z: number; w: number; h: number; ry?: number }[]) {
    for (const it of items) {
      let mat: THREE.Material;
      if (it.img) {
        const tex = new THREE.Texture(it.img); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
        // cover-fit crop via UV offset
        const ia = it.img.width / it.img.height, ba = it.w / it.h;
        if (ia > ba) { tex.repeat.set(ba / ia, 1); tex.offset.set((1 - ba / ia) / 2, 0); } else { tex.repeat.set(1, ia / ba); tex.offset.set(0, (1 - ia / ba) / 2); }
        mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: true, depthWrite: true });
      } else mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.02, 0.02, 0.025), transparent: true });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(it.w, it.h), mat);
      m.position.set(it.x, it.y, it.z); m.rotation.y = it.ry ?? 0;
      this.group.add(m); this.meshes.push(m);
    }
  }
  setOpacity(a: number) { for (const m of this.meshes) (m.material as THREE.MeshBasicMaterial).opacity = a; }
}
