// The edit: which scene plays when. Every boundary is a bar of the analysed beat grid (data/audio.json);
// see docs/PLAN.md §1/§5. Bars are absolute (bar k starts at beat 4k).
import type { TimelineEntry } from './engine/engine';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';
import { SCENES } from './scenes/index';

const scene = (name: string) => () => {
  const m = SCENES[name] ?? SCENES['placeholder'];
  return m ? m() : Promise.reject(new Error(`scene module not found: scenes/${name}.ts (register it in scenes/index.ts)`));
};

export const CHAPTERS: [id: string, bar0: number, bar1: number][] = [
  ['ch0_dawn', 0, 16],
  ['ch1_hatsune', 16, 24],
  ['ch2_ascent', 24, 32],
  ['ch3_bloom', 32, 48],
  ['ch4_world', 48, 58],
  ['ch5_sand', 58, 69],
  ['ch6_wowaka', 69, 76],
  ['ch7_era', 76, 81.5],
  ['ch7_sing', 81.5, 94],
  ['ch8_outro', 94, 104],
];

export function makeTimeline(_ly: Lyrics, au: AudioData): TimelineEntry[] {
  const bar = (i: number) => (i >= 104 ? au.duration : au.timeOfBeat(i * 4));
  return CHAPTERS.map(([id, b0, b1]) => ({ id, load: scene(id), start: b0 === 0 ? 0 : bar(b0), end: bar(b1), params: { title: id } }));
}
