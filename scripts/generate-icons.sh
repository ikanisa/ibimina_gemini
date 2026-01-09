#!/bin/bash
# Generate all required icon sizes from a source SACCO logo image
# Usage: ./scripts/generate-icons.sh path/to/sacco-logo.png

set -e

SOURCE_IMAGE="$1"
ICONS_DIR="public/icons"

if [ -z "$SOURCE_IMAGE" ]; then
    echo "Usage: ./scripts/generate-icons.sh path/to/sacco-logo.png"
    echo ""
    echo "This script generates all required icon sizes from your SACCO logo."
    echo "The source image should be at least 512x512 pixels for best results."
    exit 1
fi

if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "Error: Source image not found: $SOURCE_IMAGE"
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is required but not installed."
    echo "Install it with: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)"
    exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p "$ICONS_DIR"

echo "Generating icons from: $SOURCE_IMAGE"
echo "Output directory: $ICONS_DIR"
echo ""

# Generate all required sizes
sizes=(16 32 48 72 96 128 144 152 192 256 384 512)

for size in "${sizes[@]}"; do
    output="$ICONS_DIR/icon-${size}.png"
    echo "Generating ${size}x${size} -> $output"
    convert "$SOURCE_IMAGE" -resize "${size}x${size}" -background transparent -gravity center -extent "${size}x${size}" "$output"
done

# Generate favicon.ico (16x16 and 32x32 combined)
echo "Generating favicon.ico"
convert "$ICONS_DIR/icon-16.png" "$ICONS_DIR/icon-32.png" "$ICONS_DIR/icon-48.png" public/favicon.ico

echo ""
echo "✅ All icons generated successfully!"
echo ""
echo "Icons created in: $ICONS_DIR"
echo "Favicon created: public/favicon.ico"
echo ""
echo "Required sizes:"
echo "  - favicon.ico (multi-resolution)"
for size in 16 32 72 96 128 144 152 192 384 512; do
    echo "  - icon-${size}.png"
done
