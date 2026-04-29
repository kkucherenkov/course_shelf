#!/bin/sh
# Generate /_app-config.js from environment variables before nginx starts.
#
# The SPA's `00.runtime-config.client.ts` plugin reads
# `window.__APP_CONFIG__` and patches Nuxt's runtimeConfig.public so
# api/auth base URLs can change per deployment without a rebuild.
#
# Required env vars:
#   APP_API_BASE_URL  — e.g. http://courseshelf.example.com/api/v1
#   APP_AUTH_BASE_URL — e.g. http://courseshelf.example.com
#
# Both are required. We don't fall back silently because shipping the
# SPA with the build-time `__RUNTIME__` placeholder would break every
# API call with a confusing error in the browser console.

set -eu

: "${APP_API_BASE_URL:?APP_API_BASE_URL is required}"
: "${APP_AUTH_BASE_URL:?APP_AUTH_BASE_URL is required}"

cat > /usr/share/nginx/html/_app-config.js <<EOF
window.__APP_CONFIG__ = {
  apiBaseUrl: "${APP_API_BASE_URL}",
  authBaseUrl: "${APP_AUTH_BASE_URL}"
};
EOF

exec "$@"
