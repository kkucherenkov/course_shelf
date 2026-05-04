# Reverse-proxy image for courseshelf releases.
#
# Bakes `prod.conf` into the official nginx:1.27-alpine image so the
# release compose file doesn't have to bind-mount any host files. The
# config folds the SPA + API + Centrifugo onto a single origin.
#
# Built and pushed by .forgejo/workflows/release.yml as
#   code.homelab.local/kkucherenkov/courseshelf-proxy:<tag>
#
# Build context: repo root.
FROM nginx:1.27-alpine

COPY docker/nginx/prod.conf /etc/nginx/conf.d/default.conf

# nginx:1.27-alpine already exposes :80 and runs as root by default
# (privileged port 80). Operators usually front this with TLS upstream
# (Caddy / load balancer) so privilege isn't a hardening regression.
