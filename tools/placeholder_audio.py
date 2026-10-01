"""Placeholder soundtrack + matching analysis (data/audio.json) until the real song is in audio/song.mp3.
A 4/4 click-and-pad sketch at a placeholder tempo so every scene can already be cut to a beat grid.
Run tools/analyze.py on the real song to replace data/audio.json (scenes anchor to bars, not seconds)."""
import json, numpy as np, wave, sys
BPM = float(sys.argv[1]) if len(sys.argv) > 1 else 140.0
DUR = 200.0
SR = 44100
per = 60 / BPM
beats = [round(i * per, 4) for i in range(int(DUR / per))]
downbeats = beats[::4]
n = int(DUR * SR)
t = np.arange(n) / SR
y = np.zeros(n)
rng = np.random.default_rng(1)
kicks, snares, hats = [], [], []
bar = 4 * per
def add(at, sig):
    i = int(at * SR); j = min(n, i + len(sig)); y[i:j] += sig[: j - i]
def kick():
    k = np.arange(int(0.35 * SR)) / SR
    return np.sin(2 * np.pi * (48 + 110 * np.exp(-k * 28)) * k) * np.exp(-k * 9) * 0.9
def snare():
    k = np.arange(int(0.25 * SR)) / SR
    return (rng.standard_normal(len(k)) * 0.5 + np.sin(2 * np.pi * 190 * k) * 0.4) * np.exp(-k * 16) * 0.5
def hat():
    k = np.arange(int(0.05 * SR)) / SR
    x = rng.standard_normal(len(k)); x = np.diff(np.concatenate([[0], x]))
    return x * np.exp(-k * 90) * 0.12
KS, SN, HT = kick(), snare(), hat()
IMPACT_BAR = 5  # the "birth" hit: bar index 5 (demo: 2007.08.31)
for bi, b in enumerate(beats):
    barI, beatI = divmod(bi, 4)
    if barI >= IMPACT_BAR:
        add(b, KS); kicks.append([b, 1.0])
        if beatI in (1, 3): add(b, SN); snares.append([b, 0.9])
        add(b + per / 2, HT); hats.append([round(b + per / 2, 4), 0.6])
    elif barI >= 2:
        add(b + per / 2, HT * 0.7); hats.append([round(b + per / 2, 4), 0.4])
        if barI == IMPACT_BAR - 1 and beatI >= 2:  # fill into the impact
            for s in range(4): add(b + s * per / 4, SN * (0.3 + 0.2 * s)); snares.append([round(b + s * per / 4, 4), 0.4 + 0.15 * s])
# pad: slow chord bed (Ab - Bb - Cm - Eb), louder from the impact
chords = [[207.65, 261.63, 311.13], [233.08, 293.66, 349.23], [261.63, 311.13, 392.0], [311.13, 392.0, 466.16]]
env = np.clip(t / (2 * bar), 0, 1) * (0.35 + 0.65 * (t >= IMPACT_BAR * bar))
pad = np.zeros(n)
for ci in range(int(DUR / (2 * bar)) + 1):
    a, b_ = int(ci * 2 * bar * SR), min(n, int((ci + 1) * 2 * bar * SR))
    tt = t[a:b_]
    for f in chords[ci % 4]:
        pad[a:b_] += np.sin(2 * np.pi * f * tt) * 0.05 + np.sin(2 * np.pi * f * 1.003 * tt) * 0.04
y += pad * env
# riser before impact
r0, r1 = (IMPACT_BAR - 2) * bar, IMPACT_BAR * bar
m = (t >= r0) & (t < r1)
y[m] += rng.standard_normal(m.sum()) * ((t[m] - r0) / (r1 - r0)) ** 3 * 0.25
y = y / np.max(np.abs(y)) * 0.9
with wave.open('audio/placeholder.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype('<i2').tobytes())
# envelopes at 100 fps
fps = 100; hop = SR // fps
fr = len(y) // hop
rms = np.sqrt(np.mean(y[: fr * hop].reshape(fr, hop) ** 2, axis=1))
rms = np.clip(rms / np.percentile(rms, 99), 0, 1)
pade = np.interp(np.arange(fr) / fps, t[::hop][:fr], env[::hop][:fr])
drums = np.clip(rms * (np.arange(fr) / fps >= IMPACT_BAR * bar), 0, 1)
r = lambda a: [round(float(x), 3) for x in a]
json.dump({
    'duration': DUR, 'bpm': BPM, 'beat_period': per, 'time_signature': 4, 'fps': fps,
    'beats': beats, 'downbeats': downbeats,
    'sections': [{'name': 'intro', 'start': 0.0, 'end': IMPACT_BAR * bar}, {'name': 'placeholder', 'start': IMPACT_BAR * bar, 'end': DUR}],
    'rms': r(rms), 'low': r(drums * 0.9), 'mid': r(pade), 'high': r(rms * 0.5), 'vocal': r(np.zeros(fr)),
    'drums': r(drums), 'bass': r(drums * 0.8), 'other': r(pade),
    'onsets': {'kick': kicks, 'snare': snares, 'hat': hats, 'vocal': []},
    'notes': f'PLACEHOLDER analysis at {BPM} BPM. Replace with tools/analyze.py output for audio/song.mp3.',
}, open('data/audio.json', 'w'))
print('bar =', round(bar, 3), 's; impact at', round(IMPACT_BAR * bar, 3), 's')
