# SACCO Logo Icon Setup Guide

This guide explains how to update the favicon and app icons with your SACCO logo.

## Quick Start

1. **Get your SACCO logo**
   - If you have the logo file: Place it in the project root as `sacco-logo.png`
   - If you need to download it: 
     - Save the logo image from your source
     - Name it `sacco-logo.png` (or any name, you'll specify it in the command)
     - Recommended: PNG format, at least 512x512 pixels (larger is better)
     - The logo should work well on both light and dark backgrounds

2. **Generate all icon sizes** - Choose one method:

   **Method A: Using Node.js script (Recommended)**
   ```bash
   npm run generate-icons sacco-logo.png
   ```
   This will automatically install `sharp` if needed and generate all icons.

   **Method B: Using Bash script (requires ImageMagick)**
   ```bash
   npm run generate-icons:bash sacco-logo.png
   ```
   Or directly:
   ```bash
   chmod +x scripts/generate-icons.sh
   ./scripts/generate-icons.sh sacco-logo.png
   ```

   This will automatically generate all required icon sizes in `public/icons/` and create `favicon.ico`.

3. **Verify** that all files are created:
   ```bash
   ls -la public/icons/
   ls -la public/favicon.ico
   ```

4. **Test locally**:
   ```bash
   npm run dev
   ```
   Check the browser tab for the new favicon.

5. **Rebuild and deploy**:
   ```bash
   npm run build
   npm run deploy
   ```

## Manual Setup (Alternative)

If you don't have ImageMagick installed, you can use online tools:

1. **Favicon Generator**: Visit https://favicon.io/favicon-converter/
   - Upload your `sacco-logo.png`
   - Download the generated favicon package
   - Extract to `public/` directory

2. **Icon Generator**: Visit https://www.pwabuilder.com/imageGenerator
   - Upload your logo
   - Generate all PWA icon sizes
   - Download and extract to `public/icons/`

3. **Manual Resize**: Use any image editor to create these sizes:
   - 16x16, 32x32, 48x48, 72x72, 96x96, 128x128
   - 144x144, 152x152, 192x192, 256x256, 384x384, 512x512
   - Save as `icon-{size}.png` in `public/icons/`

## Required Files

After setup, you should have:

```
public/
├── favicon.ico (multi-resolution ICO file)
└── icons/
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-144.png
    ├── icon-152.png
    ├── icon-192.png
    ├── icon-256.png
    ├── icon-384.png
    └── icon-512.png
```

## Where Icons Are Used

- **Favicon** (`favicon.ico`): Browser tab icon
- **App Icons**: PWA manifest for home screen installation
- **Apple Touch Icons**: iOS home screen icons
- **Manifest Icons**: Progressive Web App icons

## Testing

1. **Browser Tab**: Check the favicon appears in browser tabs
2. **PWA**: Install as PWA and verify home screen icon
3. **iOS**: Test on iPhone/iPad - icon should appear on home screen
4. **Android**: Test on Android - icon should appear in app drawer

## Troubleshooting

### Icons not updating?
- Clear browser cache: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Hard refresh the page
- Clear service worker cache (DevTools > Application > Service Workers > Unregister)

### ImageMagick not found?
```bash
# macOS
brew install imagemagick

# Ubuntu/Debian
sudo apt-get install imagemagick

# Windows
# Download from: https://imagemagick.org/script/download.php
```

### Icon looks blurry?
- Ensure source image is at least 512x512 pixels
- Use PNG format with transparency
- Avoid JPEG compression artifacts

## Notes

- The favicon and icons are configured in:
  - `index.html` (favicon links)
  - `public/manifest.webmanifest` (PWA icons)
  - `vite.config.ts` (PWA plugin configuration)

- Icons are cached by browsers - changes may take time to appear
- Service worker may cache icons - unregister it to see changes immediately
