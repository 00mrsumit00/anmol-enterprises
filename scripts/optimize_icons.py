import os
from PIL import Image

src_path = r"C:\Users\mrsum\.gemini\antigravity\brain\6d1c7ba6-9e66-4fd1-9275-b9556f8449db\.user_uploaded\media_1791549270529.png"
img = Image.open(src_path).convert("RGBA")

print(f"Source size: {img.size}")

# Target paths
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
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(path, format="PNG", optimize=True)
    print(f"Saved {path} ({size}x{size}) - {os.path.getsize(path)} bytes")

# Maskable 512
mask_bg = Image.new("RGBA", (512, 512), (255, 255, 255, 255))
inner_size = int(512 * 0.8)
inner_img = img.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
offset = (512 - inner_size) // 2
mask_bg.paste(inner_img, (offset, offset), inner_img)
mask_bg.save("public/icons/icon-maskable-512.png", format="PNG", optimize=True)
print(f"Saved public/icons/icon-maskable-512.png - {os.path.getsize('public/icons/icon-maskable-512.png')} bytes")

# Multi-resolution Favicon.ico (16, 32, 48)
ico_sizes = [(16, 16), (32, 32), (48, 48)]
img.save("app/favicon.ico", format="ICO", sizes=ico_sizes)
img.save("public/favicon.ico", format="ICO", sizes=ico_sizes)
print("Saved app/favicon.ico and public/favicon.ico")

# Remove large 1MB temp file if exists
if os.path.exists("public/images/anmol-app-logo.png"):
    os.remove("public/images/anmol-app-logo.png")
if os.path.exists("public/favicon-48.png"):
    os.remove("public/favicon-48.png")
if os.path.exists("public/icons/icon-384.png"):
    os.remove("public/icons/icon-384.png")

print("All icons successfully generated and optimized!")
