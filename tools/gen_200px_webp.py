from pathlib import Path
from PIL import Image

SRC  = Path('src/assets/images/inspirations')
WEBP = SRC / '_webp'
generated = 0

for png in SRC.glob('*.png'):
    slug   = png.stem
    target = WEBP / f'{slug}-200.webp'
    if target.exists():
        continue
    img  = Image.open(png).convert('RGB')
    w, h = img.size
    new_h = int(h * 200 / w)
    img.resize((200, new_h), Image.LANCZOS).save(target, 'WEBP', quality=80)
    generated += 1
    print(f'  {slug}-200.webp')

total = len(list(WEBP.glob('*-200.webp')))
print(f'\nGenerated {generated} new files. Total 200px: {total}')
