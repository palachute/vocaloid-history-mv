// Shared data for every chapter: songs, captions, lyrics (with zh), asset images. Loaded once.
export interface Song { id: string; title: string; p: string; year: number; voice: string; color: string; tier: 'S' | 'A' | 'B'; ch: number }
export interface Caption { id: string; bar0: number; bar1: number; zh: string; ja: string; tag?: string }
export interface LyricLine { text: string; zh?: string; start: number; end: number }
export interface KitData {
  songs: Song[];
  byId: Record<string, Song>;
  colors: Record<string, string>;
  captions: Caption[];
  lyrics: LyricLine[];
  img: Record<string, HTMLImageElement>; // 'covers/<id>' | 'chars/<id>'
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } catch { return null; }
}

let P: Promise<KitData> | null = null;
export function loadKit(): Promise<KitData> {
  if (P) return P;
  P = (async () => {
    const j = (u: string) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const [s, caps, ly, assets] = await Promise.all([j('data/songs.json'), j('data/captions.json'), j('data/lyrics.json'), j('data/assets.json')]);
    const songs: Song[] = s?.songs ?? [];
    const img: Record<string, HTMLImageElement> = {};
    const list: [string, string][] = [];
    for (const kind of ['covers', 'chars'] as const) for (const [id, path] of Object.entries((assets?.[kind] ?? {}) as Record<string, string>)) list.push([`${kind}/${id}`, path]);
    await Promise.all(list.map(async ([k, path]) => { const im = await loadImage(path); if (im) img[k] = im; }));
    return {
      songs,
      byId: Object.fromEntries(songs.map((x) => [x.id, x])),
      colors: s?.colors ?? {},
      captions: caps ?? [],
      lyrics: (ly?.lines ?? []).map((l: any) => ({ text: l.text, zh: l.zh, start: l.start, end: l.end })),
      img,
    };
  })();
  return P;
}
