"""Package the generated website, editable source and review captures."""
from pathlib import Path
import json
import zipfile

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'site-manifest.json').read_text(encoding='utf-8'))
files = [root / page for page in manifest['pages']]
files += [root / name for name in ['README.md', 'site-manifest.json', 'build-site.cjs', 'qa-site.cjs', 'qa-chat.cjs', 'qa-workspace.cjs', 'server.cjs', '.env.example', '.gitignore']]
files += [p for p in (root / 'source').rglob('*') if p.is_file() and '__pycache__' not in p.parts]
files += list((root / 'previews').glob('*.png'))
component = root / 'components' / 'office-training-3d'
files += [component / name for name in ['office-training.js', 'model-viewer.min.js', 'office-training.glb', 'office-training-poster.png']]
bundle = root / 'titanium-complete-site.zip'
with zipfile.ZipFile(bundle, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for file in files:
        archive.write(file, file.relative_to(root))
with zipfile.ZipFile(bundle) as archive:
    assert archive.testzip() is None
    assert sum(name.endswith('.html') and '/' not in name for name in archive.namelist()) == len(manifest['pages'])
print(f'Packaged {len(manifest["pages"])} pages; {len(files)} files; {bundle.stat().st_size / 1048576:.1f} MB. Archive integrity verified.')
