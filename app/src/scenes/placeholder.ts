// Placeholder for chapters not built yet: chapter id + bar counter over the shared overlay.
import type * as THREE from 'three';
import type { Frame } from '../engine/scene';
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { Chapter, W, H } from './kit/base';

export default class Placeholder extends Chapter {
  frame(f: Frame, out: THREE.WebGLRenderTarget) {
    this.resetBg(); this.setBg({ grid: 1 }); this.bg.render(this.ctx.renderer, out);
    const c = this.T.ctx; this.T.clear();
    c.font = font(F.mono(500), 40); c.fillStyle = rgba('ash', 1); c.textAlign = 'center';
    c.fillText(`${this.ctx.params.title}  ·  bar ${this.barAt(f.t).toFixed(2)}`, W / 2, H / 2);
    this.ctx.comp.draw(this.ctx.renderer, this.T.upload(), out);
  }
}
