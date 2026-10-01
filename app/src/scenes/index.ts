// Scene registry (explicit, so the app bundles with vite or with plain `bun build`).
import type { SceneClass } from '../engine/scene';

export const SCENES: Record<string, () => Promise<{ default: SceneClass }>> = {
  placeholder: () => import('./placeholder'),
  ch0_dawn: () => import('./ch0_dawn'),
  ch1_hatsune: () => import('./ch1_hatsune'),
  ch2_ascent: () => import('./ch2_ascent'),
  ch3_bloom: () => import('./ch3_bloom'),
  ch4_world: () => import('./ch4_world'),
  ch5_sand: () => import('./ch5_sand'),
  ch6_wowaka: () => import('./ch6_wowaka'),
  ch7_era: () => import('./ch7_era'),
  ch7_sing: () => import('./ch7_sing'),
  stop: () => import('./stop'),
  ch8_outro: () => import('./ch8_outro'),
};
