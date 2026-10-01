# Extract the JP faces of Noto Sans/Serif CJK (SIL OFL) into standalone OTFs, subset to
# ASCII + kana + CJK unified ideographs + punctuation so the project is portable (Windows too).
from fontTools.ttLib import TTCollection
from fontTools import subset
import sys, os
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
src = '/usr/share/fonts/opentype/noto/'
jobs = [(a,b) for a,b in [('NotoSansCJK-Black.ttc','NotoSansJP-Black.otf'),('NotoSansCJK-Light.ttc','NotoSansJP-Light.otf'),('NotoSerifCJK-Black.ttc','NotoSerifJP-Black.otf')] if not os.path.exists(os.path.join(out,b))]
uni = list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + list(range(0x2000, 0x2070)) + list(range(0x2190, 0x2200)) \
    + list(range(0x2460, 0x2500)) + list(range(0x25A0, 0x2600)) + list(range(0x3000, 0x3100)) + list(range(0x4E00, 0x9FB0)) + list(range(0xFF00, 0xFFF0))
for ttc, name in jobs:
    col = TTCollection(src + ttc)
    f = next(x for x in col.fonts if 'JP' in x['name'].getDebugName(1))
    opts = subset.Options(); opts.layout_features = ['*']; opts.name_IDs = ['*']
    s = subset.Subsetter(opts); s.populate(unicodes=uni); s.subset(f)
    f.save(os.path.join(out, name)); print(name, os.path.getsize(os.path.join(out, name)) // 1024, 'KB')
