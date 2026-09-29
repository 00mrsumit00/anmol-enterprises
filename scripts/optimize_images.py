import os
import shutil
from PIL import Image

src_dir = 'public/images'
backup_dir = 'public/images_backup'

if not os.path.exists(backup_dir):
    shutil.copytree(src_dir, backup_dir)
    print(f'Backed up {src_dir} to {backup_dir}')

total_before = 0
total_after = 0

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.lower().endswith(('.jpg', '.jpeg', '.png')) and not f.endswith('.webp'):
            p = os.path.join(root, f)
            size_before = os.path.getsize(p)
            total_before += size_before
            
            try:
                with Image.open(p) as img:
                    # Resize if unreasonably large (> 900px)
                    max_dim = 900
                    if f == 'logo.png':
                        max_dim = 600
                    
                    w, h = img.size
                    if max(w, h) > max_dim:
                        scale = max_dim / float(max(w, h))
                        new_w = int(w * scale)
                        new_h = int(h * scale)
                        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                    
                    # Save WebP version alongside
                    base, ext = os.path.splitext(p)
                    webp_path = base + '.webp'
                    img.save(webp_path, 'WEBP', quality=85, method=6)
                    
                    # Optimize the original file in place (so any existing URL/tag instantly loads fast)
                    if ext.lower() == '.png':
                        img.save(p, 'PNG', optimize=True)
                    else:
                        if img.mode in ('RGBA', 'LA', 'P'):
                            bg = Image.new('RGB', img.size, (255, 255, 255))
                            if img.mode == 'RGBA':
                                bg.paste(img, mask=img.split()[3])
                            else:
                                bg.paste(img.convert('RGB'))
                            bg.save(p, 'JPEG', quality=82, optimize=True)
                        else:
                            img.save(p, 'JPEG', quality=82, optimize=True)
                    
                    size_after = os.path.getsize(p)
                    total_after += size_after
                    print(f'Optimized {f}: {size_before/1024:.1f}KB -> {size_after/1024:.1f}KB (WebP: {os.path.getsize(webp_path)/1024:.1f}KB)')
            except Exception as e:
                print(f'Error on {f}: {e}')

print('=====================================')
if total_before > 0:
    print(f'TOTAL: {total_before/1024/1024:.2f} MB -> {total_after/1024/1024:.2f} MB ({((total_before - total_after)/total_before)*100:.1f}% reduction!)')
