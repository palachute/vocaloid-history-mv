"""Merge the Chinese translation (audio/song.bilingual.txt: Japanese and Chinese lines alternating)
into data/lyrics.json by line order, checking each Japanese line against the LRC text.
Prints only counts / mismatch indices, never lyric text."""
import json, re, sys, unicodedata
norm = lambda s: re.sub(r'[\s　·・,，.。!！?？、「」]', '', unicodedata.normalize('NFKC', s))
raw = [l.strip() for l in open('audio/song.bilingual.txt', encoding='utf-8-sig').read().splitlines() if l.strip()]
has_kana = lambda s: re.search(r'[぀-ヿ]', s) is not None
pairs = []
i = 0
while i < len(raw):
    ja = raw[i]; zh = raw[i + 1] if i + 1 < len(raw) and not has_kana(raw[i + 1]) else ''
    pairs.append((ja, zh)); i += 2 if zh else 1
L = json.load(open('data/lyrics.json', encoding='utf-8'))
lines = L['lines']
print('lrc lines', len(lines), 'bilingual pairs', len(pairs))
bad = []
for k, (ln, (ja, zh)) in enumerate(zip(lines, pairs), 1):
    if norm(ln['text']) != norm(ja): bad.append(k)
    ln['zh'] = zh.replace('·', '').strip()
print('mismatched japanese lines:', bad or 'none', ' missing zh:', [k for k, (_, z) in enumerate(pairs, 1) if not z] or 'none')
L['source'] = 'audio/song.lrc (line-level) + audio/song.bilingual.txt (zh)'
json.dump(L, open('data/lyrics.json', 'w', encoding='utf-8'), ensure_ascii=False)
