"""Lists translation keys referenced in src (static keys and template-literal prefixes)."""
import re, os, sys
static, dynamic = set(), set()
for root, _, files in os.walk('src'):
    if 'mock' in root.split(os.sep) or 'locales' in root: continue
    for f in files:
        if not f.endswith(('.jsx', '.js', '.ts')): continue
        s = open(os.path.join(root, f)).read()
        for m in re.finditer(r"""\bt\(\s*'([a-zA-Z0-9_.]+)'""", s): static.add(m.group(1))
        for m in re.finditer(r"""\bt\(\s*`([^`]+)`""", s): dynamic.add(m.group(1))
        for m in re.finditer(r"""labelKey:\s*'([a-zA-Z0-9_.]+)'""", s): static.add(m.group(1))
mode = sys.argv[1] if len(sys.argv) > 1 else 'all'
if mode in ('all','static'):
    for k in sorted(static): print(k)
if mode in ('all','dynamic'):
    print('--- dynamic'); [print(k) for k in sorted(dynamic)]
