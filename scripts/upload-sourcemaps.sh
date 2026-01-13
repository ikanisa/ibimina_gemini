#!/bin/bash
# Upload source maps to Sentry
# Run this after building the application

set -e

# Check if Sentry is configured
if [ -z "$SENTRY_AUTH_TOKEN" ]; then
  echo "⚠️  SENTRY_AUTH_TOKEN not set. Skipping source map upload."
  exit 0
fi

if [ -z "$VITE_SENTRY_DSN" ]; then
  echo "⚠️  VITE_SENTRY_DSN not set. Skipping source map upload."
  exit 0
fi

# Install Sentry CLI if not available
if ! command -v sentry-cli &> /dev/null; then
  echo "Installing Sentry CLI..."
  curl -sL https://sentry.io/get-cli/ | sh
fi

# Get version from package.json or use git commit
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || git rev-parse --short HEAD)

echo "Uploading source maps for version: $VERSION"

# Upload source maps
sentry-cli sourcemaps inject dist/
sentry-cli sourcemaps upload \
  --org sacco-admin-portal \
  --project sacco-admin-portal \
  --release "$VERSION" \
  dist/

echo "✅ Source maps uploaded successfully"
