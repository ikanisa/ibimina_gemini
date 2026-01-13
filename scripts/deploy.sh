#!/bin/bash
# Deployment script for Cloudflare Pages
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="ibimina-gemini"

echo "🚀 Deploying to Cloudflare Pages ($ENVIRONMENT)..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo "❌ Wrangler CLI not found. Installing..."
  npm install -g wrangler
fi

# Check if authenticated
if ! wrangler whoami &> /dev/null; then
  echo "❌ Not authenticated with Cloudflare. Please run: wrangler login"
  exit 1
fi

# Build the project
echo "📦 Building project..."
npm ci
npm run build

# Verify build output
if [ ! -d "dist" ]; then
  echo "❌ Build failed: dist directory not found"
  exit 1
fi

# Deploy to Cloudflare Pages
echo "☁️  Deploying to Cloudflare Pages..."
if [ "$ENVIRONMENT" == "production" ]; then
  wrangler pages deploy dist --project-name="$PROJECT_NAME" --env=production
else
  wrangler pages deploy dist --project-name="$PROJECT_NAME" --env="$ENVIRONMENT"
fi

echo "✅ Deployment complete!"
echo "🌐 View deployment at: https://$PROJECT_NAME.pages.dev"
