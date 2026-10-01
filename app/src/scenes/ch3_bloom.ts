// CHAPTER 3 · chorus 1 (bars 32–48). 2007 → 2012: the producers answer.
//  A  b128–136  top view of the editor: a breathless flood of notes (初音ミクの消失); BRE = 0 —
//               "それでも僕は歌わなくちゃ" lands as a system message: ERROR → CONTINUE ANYWAY.
//  B  b136–150  THE ANSWERS. The camera lowers onto the roll and travels along it. On it lie the grey
//               blocks of what they said in 2007 (机械音, 没有感情, 只是软件…). The playhead reaches
//               each one, the hand-drawn pitch curve runs through it, and it is overwritten — by a
//               song. Each with its year and the producer's own words. The years advance 2007 → 2011.
//  C  b150–156.6 lyric L17: every grey block left on the roll ignites at once into songs;
//               the camera cranes up over a score that has become all colour.
//  b156.6       百花齐放.
//  D  b158–174  the producers and their songs: a wall in 3D, three rows, flown past fast — wowaka first;
//               bottom-left, the producers' own upload notes, in Japanese and Chinese.
//  E  b174–192  心の夜: a night city (streets of headlights, a train on its viaduct, power lines, neon,
//               a tower) — every lit window is a room where someone writes. On 届け the notes rise out
//               of the windows like lanterns and the camera follows them into the sky.
import * as THREE from 'three';
import type { Frame } from '../engine/scene';
import { Layer2D } from '../engine/gl';
import { LIN, rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { clamp, ease, frameIdx, hash, lerp, prog, pulse } from '../engine/util';
import { Chapter, W, H } from './kit/base';
import { drawCover, hexA, label } from './kit/draw';
import { drawLanes, drawRoll, hashNotes, rowY, beatX, type RNote, type RollView } from './kit/roll';
import { chapterTitle } from './kit/title';
import { CardWall, Stage } from './kit/three3d';
import { LineBatch } from '../engine/lines';
import { mul, type RGB } from './kit/lines';
import { cityCamera, drawLanterns, drawStars, makeCity } from './kit/city';

// what they said → what was written back
const ANSWERS: { said: string; id: string; title: string; p: string; year: string; col: string; ja?: string; zh?: string }[] = [
  { said: '没有感情', id: 'melt', title: 'メルト', p: 'ryo', year: '2007.12', col: '#39C5BB' },
  { said: '机械音', id: 'shoushitsu', title: '初音ミクの消失', p: 'cosMo@暴走P', year: '2008', col: '#7FE3D6', ja: '最高速、最高圧縮の別れの歌。', zh: '最高速、最高压缩的告别之歌。' },
  { said: '只是软件', id: 'akuno', title: '悪ノ娘', p: '悪ノP', year: '2008.04', col: '#FFC400', ja: '幼くして君主となった王女の物語', zh: '年幼即位的王女的故事' },
  { said: '这不是音乐', id: 'roshin', title: '炉心融解', p: 'iroha(sasaki)', year: '2008.12', col: '#FF9A00' },
  { said: '人間が歌えよ', id: 'jishaku', title: 'magnet', p: 'minato', year: '2009.05', col: '#FF8FB1', ja: 'ミクとルカでデュエットさせてみました！', zh: '试着让 Miku 和 Luka 来了段二重唱！' },
  { said: '棒読み', id: 'romeo', title: 'ロミオとシンデレラ', p: 'doriko', year: '2009.04', col: '#B9A8E6', ja: '歌詞は主によい子の昔話とかから。', zh: '歌词大多取材自讲给乖孩子听的老故事。' },
  { said: 'ただの道具', id: 'jbf', title: 'Just Be Friends', p: 'Dixie Flatline', year: '2009.07', col: '#FF6A8A', ja: 'あなたならどうしますか?', zh: '换作是你，会怎么做？' },
  { said: '没有灵魂', id: 'uraomote', title: '裏表ラバーズ', p: 'wowaka', year: '2009.08', col: '#EEE9DF' },
  { said: '一时的流行', id: 'matryoshka', title: 'マトリョシカ', p: 'ハチ', year: '2010.08', col: '#7ED957', ja: '馬鹿っぽくて、どんちゃんしたのを作りました。', zh: '做了首傻乎乎、热热闹闹的曲子。' },
  { said: 'すぐ飽きられる', id: 'senbon', title: '千本桜', p: '黒うさP', year: '2011.09', col: '#FF2E88', ja: '様々な作品と共に千本桜が成長する事を願って', zh: '愿千本樱与各种作品一同成长' },
];
const MORE_SAID = ['棒読み', '音痴', 'ロボット声', '冷冰冰的', '念经', 'NO SOUL', '听不下去', 'ポンコツ', '电子噪音', 'LIFELESS', '所詮プログラム', '素人の遊び', '假唱', 'FAKE SINGER', '毫无起伏', 'キャラ売りだけ'];
const MORE_SONGS = ['ワールドイズマイン', 'ローリンガール', 'モザイクロール', '二息歩行', 'パンダヒーロー', 'トリノコシティ', '東京テディベア', 'カゲロウデイズ', '天ノ弱', 'ワールズエンド・ダンスホール', '桜ノ雨', 'ハロ／ハワユ', '深海少女', 'いろは唄', '右肩の蝶', 'ぽっぴっぽー'];
const EVENTS: [number, string][] = [[137, '2008.03 · UTAU 公开 / UTAU公開'], [140, '2009.07 · Project DIVA 发售 / 発売'], [143, '2009.08 · 初次登台 / 初ステージ'], [146, '2010.03.09 · 首场专场 / ミクの日感謝祭'], [149, '2011.07 · 洛杉矶 MIKUNOPOLIS']];
const AB0 = 136.6, AST = 1.36;               // answer i flips at AB0 + i * AST
const RB = (i: number) => 4 + i * 4;          // roll-beat where answer i sits

// the wall: groups (with covers) + typographic cards for songs without art
type WallItem = { id?: string; key?: string; title?: string; p?: string; year?: string; tag?: string; col?: string };
// 2007 → 2013: every song of these years that later reached 10,000,000 plays on niconico (神话, with the
// month it got there — source: Enpedia「VOCALOID神話入り」), plus the symbolic / most-heard others.
const WALL: [string, WallItem[]][] = [
  ['ika', [{ id: 'mikumiku' }]],
  ['ryo', [{ id: 'melt' }, { id: 'wim' }, { key: 'brs', title: 'ブラック★ロックシューター', p: 'ryo', year: '2008', tag: 'ROCK', col: '#3367D6' }, { key: 'koisen', title: '恋は戦争', p: 'ryo', year: '2008', tag: 'ROCK', col: '#D8322F' }]],
  ['cosMo@暴走P', [{ id: 'shoushitsu' }]], ['iroha(sasaki)', [{ id: 'roshin' }]], ['悪ノP', [{ id: 'akuno' }]],
  ['halyosy', [{ key: 'sakuranoame', title: '桜ノ雨', p: 'halyosy', year: '2008', tag: 'BALLAD', col: '#FFB7C9' }]], ['ラマーズP', [{ key: 'poppippo', title: 'ぽっぴっぽー', p: 'ラマーズP', year: '2008', tag: 'COMIC', col: '#7ED957' }]],
  ['doriko', [{ id: 'romeo' }]], ['wowaka', [{ id: 'uraomote' }, { id: 'worldsend' }, { id: 'rolling' }]], ['DECO*27', [{ id: 'nisoku' }, { id: 'mosaic' }]],
  ['minato', [{ id: 'jishaku' }]], ['Dixie Flatline', [{ id: 'jbf' }]],
  ['のりP / 銀サク', [{ key: 'migikata', title: '右肩の蝶', p: 'のりP', year: '2009', tag: 'ROCK', col: '#FFC400' }, { key: 'irohauta', title: 'いろは唄', p: '銀サク', year: '2009', tag: '和風', col: '#D8322F' }]],
  ['ハチ', [{ id: 'matryoshka' }, { id: 'panda' }, { key: 'donut', title: 'ドーナツホール', p: 'ハチ', year: '2013', tag: 'ROCK', col: '#E0A33B' }]],
  ['40mP', [{ id: 'torinoko' }]], ['ナノウ / ゆうゆ', [{ key: 'harohawayu', title: 'ハロ／ハワユ', p: 'ナノウ', year: '2010', tag: 'BALLAD', col: '#B9E3FF' }, { key: 'shinkai', title: '深海少女', p: 'ゆうゆ', year: '2010', tag: 'SYMPHONIC', col: '#3367D6' }]],
  ['UTAU · 重音テト', [{ key: 'ochame', title: 'おちゃめ機能', p: 'ゴジマジP', year: '2010', tag: 'UTAU', col: '#E0473F' }]],
  ['黒うさP', [{ id: 'senbon' }]], ['164', [{ id: 'amanojaku' }]], ['Neru', [{ id: 'teddy' }, { id: 'lostone' }]], ['じん', [{ id: 'kagerou' }]],
  ['Last Note.', [{ id: 'akatsuki' }]], ['kemu', [{ key: 'rokucho', title: '六兆年と一夜物語', p: 'kemu', year: '2012', tag: 'ROCK', col: '#FF6A2A' }]], ['れるりり', [{ id: 'noushou' }]],
  ['みきとP', [{ key: 'iarufan', title: 'いーあるふぁんくらぶ', p: 'みきとP', year: '2012', tag: 'POP', col: '#FF2E88' }]],
  ['ひとしずくP×やま△', [{ key: 'badend', title: 'Bad∞End∞Night', p: 'ひとしずくP×やま△', year: '2012', tag: 'MUSICAL', col: '#9C5BD8' }]],
  ['H.K.君 / 杉田朗', [{ id: 'shipu' }, { id: '66ccff' }]], ['鸟爷', [{ key: 'ichiban', title: '一半一半', p: '鸟爷', year: '2013', tag: '中V', col: '#66CCFF' }]],
];
const TAGS: Record<string, string> = {
  mikumiku: '神话 · 2012.08', melt: '神话 · 2015.08', senbon: '神话 · 2016.02', matryoshka: '神话 · 2017.12', mosaic: '神话 · 2018.12', worldsend: '神话 · 2019.04',
  shoushitsu: '神话 · 2021.11', rokucho: '神话 · 2021.12', rolling: '神话 · 2023.02', wim: '神话 · 2023.02', donut: '神话 · 2023.04', noushou: '神话 · 2023.05',
  amanojaku: '神话 · 2023.06', uraomote: '神话 · 2023.08', roshin: '神话 · 2023.11', romeo: '神话 · 2023.12', lostone: '神话 · 2024.12',
  kagerou: '小说 · 动画化', shipu: '中V · 发售次日', '66ccff': '中V · 2012',
};
// producers' own notes (from their upload descriptions)
const NOTES: [string, string, string][] = [
  ['2008.12 · wowaka', '"原来，一个人也可以做出这样的音乐。"', 'kz「Last Night, Good Night」を聴いて —— 翌年、初音ミクで曲を書き始める'],
  ['パンダヒーロー · ハチ', 'ヒーローの曲かきました。', '写了一首英雄的歌。'],
  ['トリノコシティ · 40mP', '究極の寂しがり屋の歌。', '终极怕寂寞之人的歌。'],
  ['東京テディベア · Neru', '人生なんて椅子取りゲーム。', '人生不过是一场抢椅子游戏。'],
  ['カゲロウデイズ · じん', '夏といえば、というよくある話。', '说到夏天，就是那种常见的故事。'],
  ['アカツキアライヴァル · Last Note.', 'これは多分、前を向いて進んでいくための歌。', '这大概是一首为了向前迈进的歌。'],
  ['千年食谱颂 · H.K.君（平安夜的噩梦）', '谨以此作品表示支援 Vocaloid 本土化。', 'この作品で、VOCALOIDの中国語化を応援したい。（日訳）'],
  ['66CCFF · 杉田朗', '个人恶趣味满满、绝对不怀好意的卖萌曲。', '個人的な悪趣味たっぷりの、下心しかない萌え曲。（日訳）'],
  ['脳漿炸裂ガール · れるりり', 'ドMな女の子の歌。', '一首关于抖M女孩的歌。'],
  ['ロストワンの号哭 · Neru', 'その号哭は止まらない。', '那号哭不会停止。'],
];
// the wall → film fold: the same cards close up into three strips and start to roll
const F0 = 170.0, F1 = 171.3, FEND0 = 173.8, FEND1 = 174.3;
const FILM_Y = [470, 0, -470], FILM_BASE_H = 440, FILM_STEP = 360, FILM_D = 2400, FILM_ACC = 450;
/** apparent travel of film row r, s beats after F0 (continuous with the camera's speed v at F0) */
function filmTravel(r: number, s: number, v: number) {
  let d = 0;
  const n = Math.ceil(Math.max(0, s) / 0.01);
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * 0.01;
    const sp = (v + FILM_ACC * x) * (1 + r * 0.12);
    d += (r === 1 ? Math.cos(Math.PI * Math.min(x / 1.6, 1)) : 1) * sp * 0.01;   // the middle strip slows, stops, runs the other way
  }
  return d * (s / Math.max(n * 0.01, 1e-6));
}
const NOTES_B0 = 158.3, NOTES_B1 = 182.2;   // from the wall, through the film, into the night city

function textCard(it: WallItem): HTMLCanvasElement {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
  const c = cv.getContext('2d')!;
  const col = it.col ?? '#EEE9DF';
  c.fillStyle = '#0d0d0f'; c.fillRect(0, 0, 512, 512);
  c.fillStyle = hexA(col, 0.18); c.fillRect(0, 0, 512, 512);
  c.fillStyle = col; c.fillRect(0, 0, 14, 512);
  c.font = font(F.mono(500), 22); c.fillStyle = hexA(col, 1); c.fillText(`${it.year ?? ''}  ·  ${it.tag ?? ''}`, 44, 60);
  let size = 92; c.font = font(F.jp(900), size);
  while (c.measureText(it.title ?? '').width > 430 && size > 40) { size -= 4; c.font = font(F.jp(900), size); }
  c.fillStyle = '#EEE9DF'; c.fillText(it.title ?? '', 44, 270);
  c.font = font(F.jp(900), 36); c.fillStyle = hexA(col, 1); c.fillText(it.p ?? '', 44, 340);
  c.strokeStyle = hexA(col, 0.6); c.lineWidth = 3; c.strokeRect(26, 26, 460, 460);
  return cv;
}

export default class Ch3Bloom extends Chapter {
  st = new Stage();
  roll = new Layer2D();
  plane!: THREE.Mesh;
  wall!: CardWall;
  wallSt = new Stage();
  wallPos: { x: number; y: number; group: string; id?: string; first: boolean }[] = [];
  cardImgs: (HTMLImageElement | HTMLCanvasElement)[] = [];
  wallZ: number[] = [];
  filmBase: THREE.Mesh[] = [];
  city = new Stage();
  L3 = new LineBatch(80000, { screen2D: false, blend: 'add' });
  bld: { x: number; z: number; w: number; d: number; h: number }[] = [];
  win: { x: number; y: number; z: number; nx: number; nz: number; c: number }[] = [];
  signs: { x: number; y: number; z: number; s: string; c: number }[] = [];
  v3 = new THREE.Vector3();

  setup() {
    const mat = new THREE.MeshBasicMaterial({ map: this.roll.texture, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
    this.plane = new THREE.Mesh(new THREE.PlaneGeometry(4200, 2362), mat);
    this.plane.rotation.x = -Math.PI / 2;
    this.plane.position.set(0, -450, -700);
    this.st.scene.add(this.plane);
    // the wall: three rows, groups left → right
    const items: { img?: HTMLImageElement | HTMLCanvasElement; x: number; y: number; z: number; w: number; h: number }[] = [];
    let x = 0;
    for (const [g, its] of WALL) {
      its.forEach((it, k) => {
        const row = k % 3, col = Math.floor(k / 3);
        const yy = [330, -10, -350][row]!, xx = x + col * 360 + (hash(k, g.length) - 0.5) * 30;
        const img = (it.id && this.cover(it.id)) || (it.key && this.cover(it.key)) || textCard(it);
        this.cardImgs.push(img as HTMLImageElement);
        items.push({ img: img as HTMLImageElement, x: xx, y: yy, z: (hash(k, 7, g.length) - 0.5) * 120, w: 330, h: 330 });
        this.wallPos.push({ x: xx, y: yy, group: g, id: it.id ?? it.key, first: k === 0 });
      });
      x += Math.ceil(its.length / 3) * 360 + 180;
    }
    this.wall = new CardWall(items as any);
    this.wallSt.scene.add(this.wall.group);
    this.wallZ = items.map((it) => it.z);
    // the film base the wall folds into: three dark strips behind the rows
    for (let r = 0; r < 3; r++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(14000, FILM_BASE_H), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.012, 0.012, 0.014), transparent: true, opacity: 0, depthWrite: false }));
      m.position.set(0, FILM_Y[r]!, -90); m.visible = false;
      this.wallSt.scene.add(m); this.filmBase.push(m);
    }
    // the night city
    const city = makeCity();
    this.bld = city.bld; this.win = city.win; this.signs = city.signs;
  }

  scr(st: Stage, x: number, y: number, z: number) {
    const v = this.v3.set(x, y, z).project(st.cam);
    return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, z: v.z, d: st.cam.position.distanceTo(this.v3.set(x, y, z)) };
  }

  /** the answer roll: grey blocks of what was said, overwritten as the playhead passes */
  drawAnswerRoll(rc: CanvasRenderingContext2D, beat: number, ignite: number) {
    const head = 2 + (beat - 136) * (4 / AST);       // roll beats under the playhead
    const v: RollView = { x: 40, y: 20, w: 1840, h: 1040, b0: head - 14, beats: 22, p0: 0, rows: 24 };
    // background flood of small notes
    const bg: RNote[] = hashNotes(300, -10, 120, 0, 24, 21, '#1d2a2a');
    drawRoll(rc, v, bg, { now: head, curve: 0, grid: 0.35, textSize: 14, labels: true, playhead: true });
    const blocks: RNote[] = [];
    ANSWERS.forEach((a, i) => {
      const done = beat >= AB0 + i * AST;
      blocks.push({ b: RB(i), len: 3.4, p: 4 + (i % 4) * 4 + (i % 2) * 2, ly: done ? a.title : a.said, col: done ? a.col : '#55524E', glow: done ? pulse(beat, AB0 + i * AST, 0.6) : 0 });
    });
    // the rest of what was said — ignite all at once on lyric L17
    MORE_SAID.forEach((s, i) => {
      const k = clamp(ignite * 1.6 - hash(i, 3) * 0.6);
      blocks.push({ b: RB(10) + 1 + i * 1.6, len: 1.5, p: 2 + Math.floor(hash(i, 4) * 20), ly: k > 0.5 ? MORE_SONGS[i]! : s, col: k > 0.5 ? ['#39C5BB', '#FF8FB1', '#FFC400', '#7ED957', '#66CCFF', '#FF6A2A', '#B9A8E6'][i % 7]! : '#55524E', glow: k > 0.5 ? 0.5 : 0 });
    });
    drawRoll(rc, v, blocks, { now: head, curve: 0, grid: 0, keys: false, textSize: 30, labels: false, playhead: false });
    // the hand-drawn pitch curve: through every block it has answered
    rc.save(); rc.strokeStyle = 'rgba(190,255,248,1)'; rc.lineWidth = 5; rc.shadowColor = 'rgba(57,197,187,1)'; rc.shadowBlur = 18; rc.beginPath();
    let first = true;
    for (let b = v.b0; b <= Math.min(head, v.b0 + v.beats); b += 0.05) {
      const i = clamp(Math.floor((b - 4) / 4), 0, ANSWERS.length - 1);
      const p0 = 4 + (i % 4) * 4 + (i % 2) * 2, p1 = 4 + ((i + 1) % 4) * 4 + ((i + 1) % 2) * 2;
      const u = clamp((b - RB(i) - 3.2) / 0.8);
      const p = lerp(p0, p1, u * u * (3 - 2 * u)) + Math.sin(b * 7) * 0.25 * (1 - u);
      const x = beatX(v, b), y = rowY(v, p);
      if (first) { rc.moveTo(x, y); first = false; } else rc.lineTo(x, y);
    }
    rc.stroke(); rc.restore();
  }

  frame(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp } = this.ctx;
    const t = f.t, B = (b: number) => this.bt(b), beat = this.ctx.audio.beatAt(t);
    const phA = beat < 136, phB = beat >= 136 && beat < 158.6, phD = beat >= 158 && beat < 174.3, phE = beat >= 174;
    if (beat < 136.5) { this.ov.lyricHide.add(13); this.ov.lyricHide.add(14); }
    for (const n of [15, 16, 18, 19]) this.ov.lyricBig.add(n);
    this.ov.clock = beat >= 136.4 && beat < 158;
    if (phB) this.ov.clockOverride = beat < AB0 + AST ? '2007' : beat < AB0 + 3 * AST ? '2008' : beat < AB0 + 7 * AST ? '2009' : beat < AB0 + 9 * AST ? '2010' : '2011';

    const lower = prog(t, B(135.6), B(138), ease.inOutCubic);
    const ignite = prog(t, B(150.4), B(154.5), ease.inOutQuad);
    const crane = prog(t, B(150.4), B(156.6), ease.inOutCubic);
    const burst = prog(t, B(156.6), B(158.4), ease.outCubic);

    this.resetBg();
    this.setBg({ base: phE ? [0.002, 0.003, 0.006] : [0.003, 0.006, 0.006], glowC: LIN.miku, glowA: phA ? 0.12 : phE ? 0.03 : 0.03 + ignite * 0.05, glowR: 900, glowP: [960, 380], vign: 0.5, scan: phA ? 0.5 : 0 });
    this.bg.render(renderer, out);

    // ---------- A/B/C: the roll ----------
    if (beat < 158.6) {
      const R = this.roll; R.clear();
      const rc = R.ctx;
      if (phA) {
        const head = (beat - 128) * 14;
        const flood: RNote[] = hashNotes(400, -8, 300, 40, 24, 9, '#39C5BB');
        drawRoll(rc, { x: 60, y: 0, w: 1860, h: 1080, b0: head - 4, beats: 40, p0: 38, rows: 30 }, flood, { now: head + 6, curve: 1, human: 0.4, curveCol: rgba('mikuHi', 1), textSize: 20, labels: true });
      } else this.drawAnswerRoll(rc, beat, ignite);
      R.upload();
      (this.plane.material as THREE.MeshBasicMaterial).opacity = 1 - burst;
      let cp: number[], tp: number[], roll = 0;
      if (phA) {
        const shake = pulse(t, B(Math.floor(beat)), 0.06) * 10;
        cp = [shake, 260, 1500]; tp = [0, -300, -600]; roll = Math.sin(t * 2) * 0.03;
      } else {
        // lower onto the roll and travel with the playhead, then crane up over the whole score
        const low = [-700, -230, 650], lowT = [500, -440, -1300];
        const high = [0, 2600, 900], highT = [0, -450, -800];
        const sway = Math.sin(t * 0.5) * 60;
        cp = [lerp(lerp(0, low[0]!, lower), high[0]!, crane) + sway, lerp(lerp(260, low[1]!, lower), high[1]!, crane), lerp(lerp(1500, low[2]!, lower), high[2]!, crane) + burst * 1200];
        tp = [lerp(lerp(0, lowT[0]!, lower), highT[0]!, crane), lerp(lerp(-300, lowT[1]!, lower), highT[1]!, crane), lerp(lerp(-600, lowT[2]!, lower), highT[2]!, crane)];
        roll = (1 - crane) * lower * -0.06;
      }
      this.st.lookAt(cp[0]!, cp[1]!, cp[2]!, tp[0]!, tp[1]!, tp[2]!, roll);
      this.st.render(renderer, out);
    }
    // sparks: each answer, and the ignition
    const L = this.L; L.clear();
    if (phB) {
      ANSWERS.forEach((_, i) => {
        const tb = AB0 + i * AST, age = beat - tb;
        if (age < 0 || age > 1.2) return;
        for (let k = 0; k < 40; k++) {
          const a = hash(i, k) * Math.PI * 2, r = age * (200 + hash(k, i) * 500);
          const x = W * 0.62 + Math.cos(a) * r, y = H * 0.56 + Math.sin(a) * r * 0.6;
          L.seg2(x, y, x + Math.cos(a) * 12, y + Math.sin(a) * 8, 3, mul(LIN.mikuHi, 4), (1 - age / 1.2) * 0.8);
        }
      });
      if (ignite > 0) for (let i = 0; i < 300; i++) {
        const per = 1.2 + hash(i, 2), age = ((t - B(150.4)) + hash(i, 1) * per) % per;
        const x = hash(i, 3) * W, y = H + 20 - age * (500 + hash(i, 4) * 600);
        const cols: RGB[] = [LIN.miku, LIN.luka, LIN.rin, LIN.gumi, LIN.luo, LIN.ember];
        L.seg2(x, y, x, y - 18, 3, mul(cols[i % 6]!, 4), ignite * (1 - age / per) * (1 - burst));
      }
    }
    L.render(renderer, out);

    // ---------- D: the wall ----------
    if (phD) {
      const wx = this.wallPos[this.wallPos.length - 1]!.x;
      const camXf = (b: number) => lerp(-600, wx + 600, clamp((b - 158.2) / 16) * 0.8);
      const camX = camXf(Math.min(beat, F0));
      const v = (camXf(F0 + 0.01) - camXf(F0 - 0.01)) / 0.02;         // the camera's speed when the fold begins
      const fs = beat - F0, camC = camXf(F0) + 300;
      const fk = ease.inOutCubic(prog(beat, F0, F1));
      const fade = 1 - prog(t, B(FEND0), B(FEND1));
      this.wall.setOpacity(Math.min(prog(t, B(158), B(158.8)), fade));
      // the fold: each card leaves its place on the wall for a frame on one of three strips
      const N = this.wallPos.length;
      let ic = 0; for (let i = 0; i < N; i++) if (Math.abs(this.wallPos[i]!.x - camC) < Math.abs(this.wallPos[ic]!.x - camC)) ic = i;
      const travel = [0, 1, 2].map((r) => (fs > 0 ? filmTravel(r, fs, v) : 0));
      for (let i = 0; i < N; i++) {
        const w = this.wallPos[i]!, m = this.wall.meshes[i]!;
        if (fs <= 0) { m.position.set(w.x, w.y, this.wallZ[i]!); continue; }
        const r = i % 3, Lr = Math.ceil((N - r) / 3) * FILM_STEP;     // each strip loops on its own length — no empty frames
        let rel = (Math.floor(i / 3) - Math.floor(ic / 3)) * FILM_STEP - travel[r]!;
        rel = (((rel + Lr / 2) % Lr) + Lr) % Lr - Lr / 2;
        const k = ease.inOutCubic(clamp((fs - hash(i, 41) * 0.45) / 0.85));
        m.position.set(lerp(w.x, camC + rel, k), lerp(w.y, FILM_Y[r]!, k), lerp(this.wallZ[i]!, 0, k));
      }
      this.filmBase.forEach((m, r) => {
        m.visible = fs > 0; m.position.x = camC;
        (m.material as THREE.MeshBasicMaterial).opacity = 0.94 * prog(beat, F0 + 0.4, F1) * fade;
        void r;
      });
      if (fs <= 0) this.wallSt.lookAt(camX - 700, 40 + Math.sin(t * 0.8) * 40, 1750, camX + 300, 0, 0, Math.sin(t * 0.5) * 0.03);
      else {
        // swing from the oblique pass to a frontal view of the three strips, with a slight tilt
        const cy = lerp(40 + Math.sin(t * 0.8) * 40, 0, fk);
        this.wallSt.lookAt(lerp(camX - 700, camC, fk), cy, lerp(1750, FILM_D, fk), camC, 0, 0, lerp(Math.sin(t * 0.5) * 0.03, 0.065, fk));
      }
      this.wallSt.render(renderer, out);
    }
    // ---------- E: the night city ----------
    if (phE) this.drawCity(t, beat, B, out);

    // ---------- 2D ----------
    const T = this.T; T.clear();
    const c = T.ctx;
    if (beat < 136.5) {
      const a = prog(t, B(127.5), B(128));
      c.save(); c.globalAlpha = a * (1 - prog(t, B(135.8), B(136.4)));
      drawLanes(c, 200, 70, 520, t, { names: ['DYN', 'BRE', 'PIT'], vals: { BRE: 0 }, hi: 'BRE', laneH: 24 });
      drawCover(c, this.cover('shoushitsu'), W - 400, 60, 300, 188);
      label(c, '初音ミクの消失 · cosMo@暴走P · 2008', W - 96, 278, { align: 'right', color: rgba('miku', 1), size: 14 });
      label(c, '人类无法换气的速度 / 人には歌えない速さ', W - 96, 304, { align: 'right', size: 13 });
      c.restore();
      const lines = [this.D.lyrics[12], this.D.lyrics[13]];
      lines.forEach((ln, i) => {
        if (!ln) return;
        const t0 = Math.max(ln.start, this.ctx.start), t1 = (i === 0 ? lines[1]?.start ?? ln.end : B(136.5)) - 0.05;
        if (t < t0 || t > t1) return;
        const lt = t - t0;
        c.save();
        c.textAlign = 'center';
        const n = Array.from(ln.text).length;
        const shown = Array.from(ln.text).slice(0, Math.ceil(n * clamp(lt / 1.4))).join('');
        c.font = font(F.jp(900), 128); c.fillStyle = rgba('bone', 1);
        c.shadowColor = 'rgba(0,0,0,0.8)'; c.shadowBlur = 30;
        c.fillText(shown, W / 2, 560);
        if (ln.zh) { c.font = font(F.sc(700), 46); c.fillStyle = rgba('miku', 1); c.fillText(ln.zh, W / 2, 640); }
        c.shadowBlur = 0;
        const blink = frameIdx(t) % 30 < 18 ? '▶' : ' ';
        c.font = font(F.mono(500), 22); c.fillStyle = i ? rgba('miku', 1) : rgba('ember', 1);
        c.fillText(i === 0 ? 'ERROR · BREATH = 0 · 呼吸パラメータが見つかりません' : `CONTINUE ANYWAY ${blink}  /  それでも、続行する`, W / 2, 720);
        c.restore();
      });
    }
    if (phB && beat < 156.6) {
      // the current answer: what was said (struck through) → the song, its year, its producer's own words
      const i = clamp(Math.floor((beat - AB0) / AST), -1, ANSWERS.length - 1);
      const lead = beat >= AB0 - 0.9 && beat < AB0 + ANSWERS.length * AST + 0.6;
      if (lead) {
        const k = beat < AB0 ? 0 : beat - (AB0 + i * AST);
        const nx = clamp(Math.floor((beat - AB0 + 0.9) / AST), 0, ANSWERS.length - 1);
        const a = ANSWERS[nx]!;
        const flipped = beat >= AB0 + nx * AST;
        const local = beat - (AB0 + nx * AST);
        const pre = clamp((beat - (AB0 + nx * AST - 0.9)) / 0.25);
        const out_ = nx === ANSWERS.length - 1 ? prog(beat, AB0 + ANSWERS.length * AST, AB0 + ANSWERS.length * AST + 0.6) : 0;
        c.save(); c.globalAlpha = Math.min(pre, 1 - out_);
        const x = 96, y = 210;
        // what was said
        c.font = font(/[ぁ-んァ-ン]/.test(a.said) ? F.jp(900) : F.sc(700), 66); c.fillStyle = rgba('ash', flipped ? 0.55 : 0.95); c.fillText(a.said, x, y);
        const sw = c.measureText(a.said).width;
        if (flipped) { const sk = clamp(local / 0.18); c.fillStyle = rgba('ember', 1); c.fillRect(x - 6, y - 20, (sw + 12) * sk, 5); }
        label(c, '— 2007, 他们说 / そう言われた', x, y - 62, { size: 13, color: rgba('ash', 1) });
        if (flipped) {
          const e = ease.outExpo(clamp(local / 0.3));
          c.globalAlpha *= e;
          drawCover(c, this.cover(a.id), x, y + 40, 190, 190);
          let ts = 112; c.font = font(F.jp(900), ts); while (c.measureText(a.title).width > 1100 && ts > 60) { ts -= 6; c.font = font(F.jp(900), ts); }
          c.fillStyle = a.col; c.shadowColor = 'rgba(0,0,0,0.8)'; c.shadowBlur = 20; c.fillText(a.title, x + 220 + (1 - e) * 50, y + 150); c.shadowBlur = 0;
          c.font = font(F.jp(900), 34); c.fillStyle = rgba('bone', 1); c.fillText(`${a.p} · ${a.year}`, x + 224, y + 206);
          if (a.ja) {
            c.font = font(F.jp(300), 28); c.fillStyle = rgba('bone', 0.95); c.fillText(`「${a.ja}」`, x, y + 300);
            c.font = font(F.sc(400), 24); c.fillStyle = rgba('ash', 1); c.fillText(`"${a.zh}" —— ${a.p}`, x + 14, y + 338);
          }
        }
        c.restore();
        void k;
      }
      // the history, ticking along the top
      EVENTS.forEach(([b0, s], j) => {
        const a = Math.min(prog(t, B(b0), B(b0 + 0.3)), 1 - prog(t, B(b0 + 2.6), B(b0 + 3)));
        if (a > 0) label(c, s, W - 96, 230 + (j % 2) * 0, { align: 'right', color: rgba('miku', 1), size: 15, alpha: a });
      });
      const mass = Math.min(prog(t, B(151), B(151.5)), 1 - prog(t, B(156.2), B(156.6)));
      if (mass > 0) {
        c.save(); c.globalAlpha = mass;
        c.font = font(F.archivo(62, 900), 120); c.fillStyle = rgba('bone', 1); c.fillText('2007 — 2011', 96, 220);
        c.font = font(F.sc(700), 34); c.fillStyle = rgba('miku', 1); c.fillText('写给她的歌，多到数不清。', 100, 280);
        c.font = font(F.jp(300), 22); c.fillStyle = rgba('ash', 1); c.fillText('彼女のために書かれた歌は、数えきれなくなった。', 102, 318);
        c.restore();
      }
    }
    if (phD) {
      const reveal = prog(t, B(F0), B(F0 + 0.6));
      const seen = new Set<string>();
      if (reveal < 1) for (const w of this.wallPos) {
        if (!w.first) continue;
        const p = this.scr(this.wallSt, w.x - 165, 530, 30);
        if (p.z > 1 || p.x < -300 || p.x > W + 100) continue;
        if (seen.has(w.group)) continue;
        seen.add(w.group);
        c.save(); c.globalAlpha = 1 - reveal; c.font = font(F.jp(900), 44); c.fillStyle = rgba('bone', 1); c.fillText(w.group, p.x, p.y); c.restore();
      }
      for (let wi = 0; wi < this.wallPos.length; wi++) {
        const w = this.wallPos[wi]!, mp = this.wall.meshes[wi]!.position;
        const tag = w.id ? TAGS[w.id] : undefined;
        if (!tag) continue;
        const q = this.scr(this.wallSt, mp.x - 165, mp.y - 190, mp.z);
        if (q.z > 1 || q.x < -300 || q.x > W + 100) continue;
        if (reveal >= 1) continue;
        const myth = tag.startsWith('神话');
        c.save(); c.globalAlpha = 1 - reveal;
        c.fillStyle = myth ? rgba('miku', 1) : rgba('bone', 0.85); c.fillRect(q.x, q.y - 22, 200, 30);
        c.font = font(F.sc(700), 18); c.fillStyle = rgba('ink', 1); c.fillText(tag, q.x + 10, q.y);
        c.restore();
      }
      // the sprocket holes of the strips the wall has folded into
      const ha = prog(beat, F0 + 0.5, F1) * (1 - prog(t, B(FEND0), B(FEND1)));
      if (ha > 0) {
        const wx = this.wallPos[this.wallPos.length - 1]!.x;
        const camC = lerp(-600, wx + 600, clamp((F0 - 158.2) / 16) * 0.8) + 300;
        const camXf = (b: number) => lerp(-600, wx + 600, clamp((b - 158.2) / 16) * 0.8);
        const v = (camXf(F0 + 0.01) - camXf(F0 - 0.01)) / 0.02;
        c.save(); c.fillStyle = 'rgba(238,233,223,0.5)'; c.globalAlpha = ha;
        for (let r = 0; r < 3; r++) {
          const tr = filmTravel(r, beat - F0, v);
          for (const side of [1, -1]) {
            const hy = FILM_Y[r]! + side * (FILM_BASE_H / 2 - 24);
            const j0 = Math.floor((tr - 1900) / 60);
            for (let j = j0; j < j0 + 64; j++) {
              const hx = camC + j * 60 - tr;
              const p = this.scr(this.wallSt, hx, hy, -80);
              if (p.z > 1 || p.x < -40 || p.x > W + 40) continue;
              const ppu = H / (2 * Math.tan((19 * Math.PI) / 180) * p.d);
              c.fillRect(p.x - 11 * ppu, p.y - 8 * ppu, 22 * ppu, 16 * ppu);
            }
          }
        }
        c.restore();
      }
      label(c, '2007 — 2013 · 名字比声音更响亮 / 声より名前が先に聞こえる時代', W - 96, 110, { align: 'right', size: 14, color: rgba('bone', 0.8), alpha: prog(t, B(159), B(160)) * (1 - reveal) });
    }
    if (phE) this.drawCity2D(c, t, beat, B);
    // producers' own notes, bottom-left — from the wall, through the film strips, into the night city
    if (beat >= NOTES_B0 && beat < NOTES_B1) {
      const per = (NOTES_B1 - NOTES_B0) / NOTES.length;
      const ni = clamp(Math.floor((beat - NOTES_B0) / per), 0, NOTES.length - 1);
      const b0 = NOTES_B0 + ni * per;
      const qa = Math.min(prog(t, B(b0), B(b0 + 0.25)), 1 - prog(t, B(b0 + per - 0.25), B(b0 + per)));
      if (qa > 0) {
        const [who, big, small] = NOTES[ni]!;
        const jpBig = /[ぁ-んァ-ン]/.test(big) && !big.startsWith('"');
        c.save(); c.globalAlpha = qa;
        c.fillStyle = 'rgba(6,8,9,0.85)'; c.fillRect(70, 790, 1000, 160);
        label(c, who, 96, 830, { color: rgba('miku', 1), size: 15 });
        c.font = font(jpBig ? F.jp(900) : F.sc(700), 36); c.fillStyle = rgba('bone', 1); c.fillText(ni === 0 ? big : jpBig ? `「${big}」` : `"${big}"`, 96, 884);
        c.font = font(jpBig ? F.sc(400) : F.jp(300), 20); c.fillStyle = rgba('ash', 1); c.fillText(ni === 0 ? small : jpBig ? `"${small}"` : `「${small}」`, 98, 922);
        c.restore();
      }
    }
    chapterTitle(c, 'bloom', '百花齐放', '百花繚乱', '03', beat, 156.6, 2.5, { overlay: true, appear: 0.5, size: 230, y: 420 });
    comp.draw(renderer, T.upload(), out);

    if (phD || (phE && beat < NOTES_B1)) this.ov.lyricY = H - 120;
    const flipHit = phB ? ANSWERS.reduce((m, _, i) => Math.max(m, pulse(t, B(AB0 + i * AST), 0.08)), 0) : 0;
    const hit = pulse(t, B(Math.floor(beat)), 0.07) * (phA ? 1 : 0.4) + flipHit * 0.6;
    return {
      bloom: 0.6 + (phA ? 0.3 : 0) + ignite * 0.15 * (1 - burst), grain: 0.065, vignette: 0.45, ca: 1.2 + hit * 4,
      shake: [hit * 8 * (hash(frameIdx(t), 1) - 0.5), hit * 8 * (hash(frameIdx(t), 2) - 0.5)] as [number, number],
      flash: pulse(t, B(128), 0.1) * 0.7 + pulse(t, B(156.6), 0.1) * 0.3 + pulse(t, B(182.4), 0.1) * 0.25 + flipHit * 0.12, zoom: 1 + (phA ? hit * 0.03 : flipHit * 0.012),
    };
  }

  // ---------------------------------------------------------------- the night city
  cityCam(t: number, _beat: number, B: (b: number) => number) { return cityCamera(this.city, t, B); }

  drawCity(t: number, beat: number, B: (b: number) => number, out: THREE.WebGLRenderTarget) {
    const { renderer } = this.ctx;
    const L3 = this.L3; L3.clear();
    const { camZ } = this.cityCam(t, beat, B);
    const fade = prog(t, B(174), B(175)) * (1 - prog(t, B(191.6), B(192)));
    const ed = mul(LIN.bone, 0.22);
    for (const b of this.bld) {
      if (b.z > camZ - 100) continue;
      const x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2;
      const A = 0.5 * fade;
      for (const [ax, az, bx, bz] of [[x0, z0, x1, z0], [x1, z0, x1, z1], [x1, z1, x0, z1], [x0, z1, x0, z0]] as const) {
        L3.seg(ax, b.h, az, bx, b.h, bz, 1, ed[0], ed[1], ed[2], A);
        L3.seg(ax, 0, az, ax, b.h, az, 1, ed[0], ed[1], ed[2], A * 0.7);
      }
    }
    const WC: RGB[] = [LIN.miku, [1.0, 0.75, 0.4], LIN.luka, LIN.rin, LIN.luo, [1.0, 0.85, 0.6]];
    this.win.forEach((w, i) => {
      if (w.z > camZ - 100) return;
      const on = clamp((t - B(174 + hash(i, 1) * 6)) / 0.4);
      if (on <= 0) return;
      const col = mul(WC[w.c]!, 1.6 + 0.6 * Math.sin(t * 2 + i));
      L3.seg(w.x - w.nz * 22, w.y, w.z - w.nx * 22, w.x + w.nz * 22, w.y, w.z + w.nx * 22, 3, col[0] * 0.7, col[1] * 0.7, col[2] * 0.7, on * fade * 0.8);
    });
    // the main street: headlights coming, tail lights going
    for (let i = 0; i < 70; i++) {
      const dir = i % 2 ? 1 : -1, lane = dir * (90 + (i % 4 < 2 ? 0 : 120));
      const per = 9000, z = ((hash(i, 51) * per + t * (900 + hash(i, 52) * 500) * dir) % per + per) % per - 8400;
      if (z > camZ - 100) continue;
      const col: RGB = dir > 0 ? [1.8, 1.7, 1.5] : [2.2, 0.15, 0.1];
      L3.seg(lane, 12, z, lane, 12, z - 90 * dir, 5, col[0], col[1], col[2], fade * 0.9);
    }
    // cross streets: light trails across
    for (let i = 0; i < 30; i++) {
      const zc = -1200 - Math.floor(hash(i, 61) * 3) * 2400, per = 9000;
      const x = ((hash(i, 62) * per + t * 1100 * (i % 2 ? 1 : -1)) % per + per) % per - 4500;
      if (zc > camZ - 100) continue;
      L3.seg(x, 12, zc + (i % 2 ? 60 : -60), x + 80 * (i % 2 ? -1 : 1), 12, zc + (i % 2 ? 60 : -60), 4, 1.6, 1.4, 1.1, fade * 0.7);
    }
    // the viaduct and its train
    const vy = 340, vz = -2600;
    if (vz < camZ - 100) {
      L3.seg(-6000, vy, vz, 6000, vy, vz, 2, ed[0] * 2, ed[1] * 2, ed[2] * 2, fade); L3.seg(-6000, vy, vz - 60, 6000, vy, vz - 60, 2, ed[0] * 2, ed[1] * 2, ed[2] * 2, fade);
      for (let x = -6000; x <= 6000; x += 600) L3.seg(x, 0, vz - 30, x, vy, vz - 30, 2, ed[0] * 1.5, ed[1] * 1.5, ed[2] * 1.5, fade);
      const tx = ((t * 1400) % 16000) - 9000;
      for (let k = 0; k < 6; k++) for (let wi = 0; wi < 8; wi++) {
        const x = tx + k * 330 + wi * 38;
        L3.seg(x, vy + 50, vz - 30, x + 24, vy + 50, vz - 30, 6, 2.2, 2.0, 1.4, fade);
      }
    }
    // power lines along the main street
    for (const sx of [-470, 470]) {
      for (let z = 1600; z > -8000; z -= 700) {
        if (z > camZ - 100) continue;
        L3.seg(sx, 0, z, sx, 520, z, 1.5, ed[0] * 1.6, ed[1] * 1.6, ed[2] * 1.6, fade);
        L3.seg(sx - 60, 480, z, sx + 60, 480, z, 1.2, ed[0] * 1.6, ed[1] * 1.6, ed[2] * 1.6, fade);
        const zn = z - 700;
        for (const wy of [480, 500]) {
          let px = sx, py = wy, pz = z;
          for (let s = 1; s <= 8; s++) { const u = s / 8, nz = lerp(z, zn, u), ny = wy - Math.sin(u * Math.PI) * 50; L3.seg(px, py, pz, sx, ny, nz, 1, ed[0] * 1.3, ed[1] * 1.3, ed[2] * 1.3, fade * 0.8); px = sx; py = ny; pz = nz; }
        }
      }
    }
    // the tower: a lattice with a blinking red light
    {
      const tx = 2600, tz = -7600, th = 3300;
      for (let k = 0; k < 16; k++) {
        const y0 = (k / 16) * th, y1 = ((k + 1) / 16) * th, w0 = lerp(420, 30, Math.pow(k / 16, 0.7)), w1 = lerp(420, 30, Math.pow((k + 1) / 16, 0.7));
        const c: RGB = k % 2 ? [1.4, 0.35, 0.15] : [1.4, 1.3, 1.2];
        L3.seg(tx - w0, y0, tz, tx - w1, y1, tz, 1.5, c[0], c[1], c[2], fade * 0.8); L3.seg(tx + w0, y0, tz, tx + w1, y1, tz, 1.5, c[0], c[1], c[2], fade * 0.8);
        L3.seg(tx - w0, y0, tz, tx + w1, y1, tz, 1, c[0], c[1], c[2], fade * 0.5); L3.seg(tx + w0, y0, tz, tx - w1, y1, tz, 1, c[0], c[1], c[2], fade * 0.5);
      }
      const blink = (Math.floor(t * 1.2) % 2) ? 1 : 0.15;
      L3.seg(tx, th + 30, tz, tx + 1, th + 30, tz, 14, 4, 0.2, 0.1, fade * blink);
    }
    drawLanterns(L3, t, beat, B, this.win, prog(t, B(174), B(175)));   // no fade at the cut: they keep rising in the next chapter
    // the ground: a faint grid; stars
    for (let g = -9000; g <= 9000; g += 600) L3.seg(g, 0, 2000, g, 0, -10000, 1, ed[0] * 0.6, ed[1] * 0.6, ed[2] * 0.6, fade * 0.5);
    for (let g = 2000; g >= -10000; g -= 600) { if (g > camZ - 100) continue; L3.seg(-9000, 0, g, 9000, 0, g, 1, ed[0] * 0.6, ed[1] * 0.6, ed[2] * 0.6, fade * 0.5); }
    drawStars(L3, t, prog(t, B(174), B(175)));
    L3.render(renderer, out, this.city.cam);
  }

  drawCity2D(c: CanvasRenderingContext2D, t: number, beat: number, B: (b: number) => number) {
    const fade = prog(t, B(174), B(175)) * (1 - prog(t, B(191.6), B(192)));
    const NEON = ['#FF2E88', '#39C5BB', '#FFC400', '#66CCFF', '#FF6A2A'];
    // vertical neon signs on the buildings
    for (const s of this.signs) {
      const p = this.scr(this.city, s.x, s.y, s.z);
      if (p.z > 1 || p.x < -100 || p.x > W + 100 || p.y < -200 || p.y > H + 100) continue;
      const size = clamp(70000 / p.d, 8, 64);
      if (size < 10) continue;
      const flick = hash(Math.floor(t * 8), s.x) > 0.06 ? 1 : 0.3;
      c.save(); c.globalAlpha = fade * 0.9 * flick;
      c.font = font(F.jp(900), size); c.fillStyle = NEON[s.c]!; c.shadowColor = NEON[s.c]!; c.shadowBlur = size * 0.6; c.textAlign = 'center';
      Array.from(s.s).forEach((ch, i) => c.fillText(ch, p.x, p.y + i * size * 1.02));
      c.restore();
    }
    const a = Math.min(prog(t, B(175.5), B(176.5)), 1 - prog(t, B(181.5), B(182.4)));
    if (a > 0) {
      c.save(); c.globalAlpha = a;
      c.font = font(F.scSerif(), 52); c.fillStyle = rgba('bone', 1); c.fillText('每一扇亮着的窗里，', 96, 190); c.fillText('都有人在写歌。', 96, 256);
      c.font = font(F.jp(300), 22); c.fillStyle = rgba('ash', 1); c.fillText('灯りのともる窓の数だけ、歌を書く人がいた。', 98, 300);
      c.restore();
    }
    void beat;
  }
}
