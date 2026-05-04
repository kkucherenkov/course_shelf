# Reverse-proxy image for courseshelf releases.
#
# Bakes `prod.conf` into the nginx-unprivileged image so the release
# compose file doesn't have to bind-mount any host files AND the
# container runs as the non-root `nginx` user (uid 101) — Trivy's
# DS-0002 was firing because the plain `nginx:` image runs as root.
# The config folds the SPA + API + Centrifugo onto a single origin.
#
# Built and pushed by .forgejo/workflows/release.yml as
#   code.homelab.local/kkucherenkov/courseshelf-proxy:<tag>
#
# Build context: repo root.
FROM nginxinc/nginx-unprivileged:1.27-alpine

# nginx-unprivileged listens on 8080 by default (the unprivileged user
# can't bind to :80). prod.conf already declares `listen 8080`. Compose
# port-maps `${PROXY_PORT}:8080` so the public-facing port stays
# whatever operators configured.
COPY docker/nginx/prod.conf /etc/nginx/conf.d/default.conf
