# Thin wrapper over the official Centrifugo image that adds `envsubst`
# (from gettext) and a small entrypoint that renders config.template.json
# from environment variables before exec'ing centrifugo.
#
# Built and pushed by .forgejo/workflows/release.yml as
#   code.homelab.local/kkucherenkov/courseshelf-centrifugo:<tag>
#
# Build context: repo root.
FROM centrifugo/centrifugo:v6

USER root

# `envsubst` lives in the gettext package on Alpine.
RUN apk add --no-cache gettext

COPY docker/centrifugo/config.template.json /etc/centrifugo/config.template.json
COPY docker/centrifugo/entrypoint.sh /usr/local/bin/courseshelf-centrifugo-entrypoint

RUN chmod +x /usr/local/bin/courseshelf-centrifugo-entrypoint

# Centrifugo's image normally runs as `centrifugo` (uid 1000). We added
# the template + script as root above; switch back so the container
# itself doesn't run privileged.
USER centrifugo

ENTRYPOINT ["/usr/local/bin/courseshelf-centrifugo-entrypoint"]
