import os
import cv2
import numpy as np
from PIL import Image

# 1. Load source image uploaded by user
src_jpg = r"C:\Users\mrsum\.gemini\antigravity\brain\6d1c7ba6-9e66-4fd1-9275-b9556f8449db\.user_uploaded\media_1791552803106.jpg"
bgr = cv2.imread(src_jpg)
h, w = bgr.shape[:2]

# 2. Extract outer white background connected only to the 4 corners
is_white = ((bgr[:,:,0] > 220) & (bgr[:,:,1] > 220) & (bgr[:,:,2] > 220)).astype(np.uint8)
num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(is_white, connectivity=8)
corner_labels = set([labels[0, 0], labels[0, w-1], labels[h-1, 0], labels[h-1, w-1]])

outer_bg_mask = np.isin(labels, list(corner_labels)).astype(np.uint8)
fg_mask = (1 - outer_bg_mask).astype(np.uint8) * 255

# Clean edge anti-aliasing without white halo
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
fg_mask_eroded = cv2.erode(fg_mask, kernel, iterations=1)
smooth_mask = cv2.GaussianBlur(fg_mask_eroded, (3, 3), 0)

# Build RGBA
rgba = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGBA)
rgba[:, :, 3] = smooth_mask

# Center in 1024x1024 square canvas
square_img = np.zeros((1024, 1024, 4), dtype=np.uint8)
y_offset = (1024 - h) // 2
square_img[y_offset:y_offset+h, :, :] = rgba

# Convert to PIL Image for high quality resampling
master_img = Image.fromarray(square_img)
print(f"Master transparent icon created: {master_img.size}")

# 3. Generate all app icons and assets
icons = {
    "public/icons/emblem.png": 256,
    "public/icons/icon-512.png": 512,
    "public/icons/icon-192.png": 192,
    "public/icons/icon-128.png": 128,
    "app/apple-icon.png": 180,
    "public/apple-touch-icon.png": 180,
    "app/icon.png": 32,
    "public/favicon.png": 32,
}

for path, size in icons.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    resized = master_img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(path, format="PNG", optimize=True)
    print(f"Saved {path} ({size}x{size}) - {os.path.getsize(path)} bytes")

# 4. Maskable 512 (Safe-zone padded for Android adaptive icons)
mask_bg = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
# The squircle itself can fill the maskable container nicely, or have a tiny 5% breathing room
inner_size = int(512 * 0.88)
inner_img = master_img.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
offset = (512 - inner_size) // 2
mask_bg.paste(inner_img, (offset, offset), inner_img)
mask_bg.save("public/icons/icon-maskable-512.png", format="PNG", optimize=True)
print(f"Saved public/icons/icon-maskable-512.png - {os.path.getsize('public/icons/icon-maskable-512.png')} bytes")

# 5. Multi-resolution Favicon.ico (16, 32, 48)
ico_sizes = [(16, 16), (32, 32), (48, 48)]
master_img.save("app/favicon.ico", format="ICO", sizes=ico_sizes)
master_img.save("public/favicon.ico", format="ICO", sizes=ico_sizes)
print("Saved app/favicon.ico and public/favicon.ico")

print("All icons successfully updated with user's transparent green logo!")
