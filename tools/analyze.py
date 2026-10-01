"""Music analysis for the renderer -> data/audio.json (same schema as pdoom-video's).
Dependency-light (numpy + scipy + ffmpeg): no stem separation, so 'vocal/drums/bass/other' are
band-based proxies. Constant-tempo grid fitted over the whole song.
Usage: python tools/analyze.py audio/song.mp3 data/audio.json [--bpm-range 70 200] [--downbeat-offset K]
"""
import json, subprocess, sys, numpy as np
from scipy.signal import stft, find_peaks

src = sys.argv[1]; dst = sys.argv[2]
args = sys.argv[3:]
def opt(name, default):
    return float(args[args.index(name) + 1]) if name in args else default
SR = 22050
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
y = np.frombuffer(pcm, '<i2').astype(np.float32) / 32768
# decoder delay: ffmpeg drops the LAME priming already, keep timeline = gapless decode (as browsers)
dur = len(y) / SR
HOP = 220  # 100 fps
f, t, Z = stft(y, SR, nperseg=2048, noverlap=2048 - HOP, boundary=None, padded=False)
t = t  # frame centres
M = np.abs(Z)
L = np.log1p(100 * M)
def band(lo, hi): return (f >= lo) & (f < hi)
def flux(mask):
    d = np.maximum(0, np.diff(L[mask], axis=1)).sum(0)
    d = np.concatenate([[0], d])
    d -= np.convolve(d, np.ones(21) / 21, 'same')
    return np.maximum(d, 0)
fps = SR / HOP
on_all = flux(band(30, 11000)); on_low = flux(band(30, 150)); on_mid = flux(band(1500, 5000)); on_high = flux(band(7000, 11000))
# ---- tempo: autocorrelation of the onset envelope, parabolic refine
o = on_all / (on_all.std() + 1e-9)
ac = np.correlate(o, o, 'full')[len(o) - 1:]
lo_bpm, hi_bpm = opt('--bpm-lo', 70), opt('--bpm-hi', 200)
cands = []
for bpm in np.arange(lo_bpm, hi_bpm, 0.05):
    lag = 60 / bpm * fps
    s = sum(np.interp(k * lag, np.arange(len(ac)), ac) / k ** 0.5 for k in (1, 2, 4))
    cands.append((s, bpm))
cands.sort(reverse=True)
bpm = cands[0][1]
if 'bpm' in ' '.join(args): bpm = opt('--bpm', bpm)
per = 60 / bpm
# ---- phase: maximise onset energy on the grid; refine tempo by fitting (period, phase) jointly
def grid_score(p, ph):
    ts = np.arange(ph, dur, p)
    return np.interp(ts * fps, np.arange(len(o)), o).sum()
best = (-1, per, 0)
for p in per * (1 + np.linspace(-0.004, 0.004, 41)):
    for ph in np.linspace(0, p, 120, endpoint=False):
        sc = grid_score(p, ph)
        if sc > best[0]: best = (sc, p, ph)
_, per, ph = best
bpm = 60 / per
beats = list(np.round(np.arange(ph, dur, per), 4))
# ---- downbeat: which beat mod 4 carries the most low-band (kick) + overall onset energy
lowe = np.interp(np.array(beats) * fps, np.arange(len(on_low)), on_low / (on_low.std() + 1e-9))
alle = np.interp(np.array(beats) * fps, np.arange(len(o)), o)
score = [lowe[k::4].mean() + 0.5 * alle[k::4].mean() for k in range(4)]
k0 = int(np.argmax(score))
if '--downbeat-offset' in args: k0 = int(opt('--downbeat-offset', 0))
downbeats = beats[k0::4]
# ---- envelopes (100 fps, 99th-percentile normalised)
def env(mask):
    e = np.sqrt((M[mask] ** 2).mean(0))
    e = np.convolve(e, np.ones(5) / 5, 'same')
    return np.clip(e / (np.percentile(e, 99) + 1e-9), 0, 1)
n = int(dur * 100)
def res(e): return np.interp(np.arange(n) / 100, t, e)
rms = res(env(band(20, 11000))); low = res(env(band(20, 150))); mid = res(env(band(150, 2000))); high = res(env(band(4000, 11000)))
vocal = res(env(band(300, 3400)))  # proxy
# ---- onsets
def peaks(e, thr, dist=0.09):
    en = e / (np.percentile(e, 99) + 1e-9)
    idx, pr = find_peaks(en, height=thr, distance=int(dist * fps))
    return [[round(float(t[i]), 3), round(float(min(1, en[i])), 3)] for i in idx]
kick = peaks(on_low, 0.35); snare = peaks(on_mid, 0.4); hat = peaks(on_high, 0.3, 0.06)
# ---- sections: novelty on bar-level loudness + timbre, snapped to downbeats (8-bar hints)
bars = np.array(downbeats + [dur])
feat = []
for a, b in zip(bars[:-1], bars[1:]):
    i0, i1 = int(a * 100), max(int(a * 100) + 1, int(b * 100))
    feat.append([rms[i0:i1].mean(), low[i0:i1].mean(), mid[i0:i1].mean(), high[i0:i1].mean()])
feat = np.array(feat)
nov = np.r_[0, np.linalg.norm(np.diff(feat, axis=0), axis=1)]
out = {
    'duration': round(dur, 3), 'bpm': round(bpm, 3), 'beat_period': round(per, 5), 'time_signature': 4, 'fps': 100,
    'beats': [float(b) for b in beats], 'downbeats': [float(d) for d in downbeats],
    'sections': [], 'bar_novelty': [round(float(x), 3) for x in nov],
    'rms': np.round(rms, 3).tolist(), 'low': np.round(low, 3).tolist(), 'mid': np.round(mid, 3).tolist(), 'high': np.round(high, 3).tolist(),
    'vocal': np.round(vocal, 3).tolist(), 'drums': np.round(high, 3).tolist(), 'bass': np.round(low, 3).tolist(), 'other': np.round(mid, 3).tolist(),
    'onsets': {'kick': kick, 'snare': snare, 'hat': hat, 'vocal': []},
    'notes': f'tools/analyze.py: constant tempo {bpm:.3f} BPM, first beat {ph:.3f}s, downbeat phase {k0}. Band proxies, no stems. Sections filled by tools/sections.json.',
}
json.dump(out, open(dst, 'w'))
print(f'duration {dur:.2f}s  bpm {bpm:.3f}  first beat {ph:.3f}  downbeat phase {k0}  bars {len(downbeats)}')
print('top tempo candidates', [round(b, 2) for s, b in cands[:6]])
print('bar loudness/novelty:')
for i, (d, fe, nv) in enumerate(zip(downbeats, feat, nov)):
    print(f'{i:3d} {d:7.2f}s rms {fe[0]:.2f} low {fe[1]:.2f} hi {fe[3]:.2f} nov {nv:.2f}' + ('  <<' if nv > np.percentile(nov, 85) else ''))
