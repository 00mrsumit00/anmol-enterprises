Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path (Get-Location) "public\images_backup\logo.png"
if (-not (Test-Path $srcPath)) {
    $srcPath = Join-Path (Get-Location) "public\images\logo.png"
}

$rawBmp = [System.Drawing.Bitmap]::FromFile($srcPath)

# Clean source bitmap: paint over lower badges on the left so scooty and banner remain 100% complete
$srcBmp = New-Object System.Drawing.Bitmap($rawBmp.Width, $rawBmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$cleanG = [System.Drawing.Graphics]::FromImage($srcBmp)
$cleanG.DrawImage($rawBmp, 0, 0, $rawBmp.Width, $rawBmp.Height)
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$cleanG.FillRectangle($whiteBrush, 0, 770, 1060, 260)
$whiteBrush.Dispose()
$cleanG.Dispose()
$rawBmp.Dispose()

function Generate-Icon {
    param(
        [int]$size,
        [string]$outPath,
        [float]$pad = 0.12
    )

    $destBmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Clean white background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)
    $bgBrush.Dispose()

    # The prominent emblem + Anmol + scooty section:
    $cropX = 20
    $cropY = 40
    $cropW = 1475
    $cropH = 760

    $safeSize = $size * (1.0 - (2.0 * $pad))
    $scale = [Math]::Min(($safeSize / $cropW), ($safeSize / $cropH))

    $drawW = $cropW * $scale
    $drawH = $cropH * $scale
    $drawX = ($size - $drawW) / 2.0
    $drawY = ($size - $drawH) / 2.0

    $destRect = New-Object System.Drawing.RectangleF($drawX, $drawY, $drawW, $drawH)
    $srcRect = New-Object System.Drawing.RectangleF($cropX, $cropY, $cropW, $cropH)

    $g.DrawImage($srcBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $destBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    Write-Output "Successfully generated: $outPath ($size x $size)"
}

# 1. 512x512 standard icon (10% padding)
Generate-Icon -size 512 -outPath "public\icons\icon-512.png" -pad 0.10

# 2. 512x512 maskable icon (18% safe padding for Android circular/squircle mask)
Generate-Icon -size 512 -outPath "public\icons\icon-maskable-512.png" -pad 0.18

# 3. 192x192 icon
Generate-Icon -size 192 -outPath "public\icons\icon-192.png" -pad 0.10

# 4. 180x180 Apple touch icon
Generate-Icon -size 180 -outPath "public\apple-touch-icon.png" -pad 0.10

# 5. Favicon 64x64
Generate-Icon -size 64 -outPath "public\favicon.png" -pad 0.08

$srcBmp.Dispose()
Write-Output "All icons generated successfully with clean edges!"
