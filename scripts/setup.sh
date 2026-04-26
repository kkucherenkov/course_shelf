#!/usr/bin/env bash
set -euo pipefail

echo "=== Boilerplate Project Setup ==="
echo ""

read -p "App name (e.g. 'My SaaS'): " APP_NAME
read -p "App slug — lowercase, hyphens only (e.g. 'my-saas'): " APP_SLUG
read -p "Short description: " APP_DESCRIPTION

echo ""
echo "Setting up: $APP_NAME ($APP_SLUG)"
echo ""

# Replace placeholders throughout the repo
find . -type f \( -name "*.json" -o -name "*.yaml" -o -name "*.yml" -o -name "*.md" -o -name "*.ts" -o -name "*.vue" -o -name "*.sh" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/*.generated.*" \
  -exec sed -i '' \
    -e "s|Course Shelf|$APP_NAME|g" \
    -e "s|course-shelf|$APP_SLUG|g" \
    -e "s|Local first coursera|$APP_DESCRIPTION|g" \
    {} \;

# Vue-i18n JSON blocks can't contain `{{...}}` (that's Mustache-style
# interpolation, and vue-i18n errors on a non-identifier inside the braces).
# The template carries a literal sentinel `YourApp` in those blocks — replace
# it only in the two Nuxt files that use it.
sed -i '' "s|YourApp|$APP_NAME|g" \
  apps/web/app/pages/index.vue \
  apps/web/app/layouts/default.vue

echo "✓ Replaced placeholders"
echo ""
echo "Next steps:"
echo "  1. pnpm install"
echo "  2. Add your design tokens to specs/design/tokens/ (see specs/design/README.md)"
echo "  3. pnpm design:build"
echo "  4. docker compose -f docker/compose.yml up -d"
echo "  5. Open a Claude session and say: 'Read CLAUDE.md and help me build [your first feature]'"
echo ""
echo "=== Setup complete! ==="
