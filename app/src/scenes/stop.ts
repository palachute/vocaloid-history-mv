// STOP (bar 93). The only silent bar of the song: everything vanishes; the flat line from the opening.
import type * as THREE from 'three';
import type { Frame } from '../engine/scene';
import { LIN } from '../engine/palette';
import { Chapter, W, H } from './kit/base';
import { mul } from './kit/lines';

export default class Stop extends Chapter {
  frame(_f: Frame, out: THREE.WebGLRenderTarget) {
    this.resetBg(); this.setBg({ noiseA: 0, vign: 0, base: [0, 0, 0] }); this.bg.render(this.ctx.renderer, out);
    this.ov.lyrics = false; this.ov.captions = false; this.ov.clock = false;
    const L = this.L; L.clear();
    L.seg2(W * 0.2, H / 2, W * 0.8, H / 2, 1.6, mul(LIN.bone, 1.1), 0.9);
    L.render(this.ctx.renderer, out);
    return { grain: 0, bloom: 0.2, vignette: 0, ca: 0, halation: 0 };
  }
}
