#!/bin/sh
# WHY this exists:
# Centrifugo's official image ships the `centrifugo` binary but no shell
# templating. The shipped JSON config supports limited env var lookup
# (`CENTRIFUGO_*`) but does NOT cover `client.allowed_origins`, which
# we need to drive from the deploy's PUBLIC_BASE_URL. This wrapper
# expands `${VAR}` placeholders in `/etc/centrifugo/config.template.json`
# via envsubst (BusyBox-provided in the alpine base) and execs centrifugo.
#
# Required env (from compose.{prod,release}.yml):
#   CENTRIFUGO_ALLOWED_ORIGINS  JSON array literal, e.g. ["https://example.com"]
#   CENTRIFUGO_API_KEY          shared secret for backend → centrifugo publish
#   CENTRIFUGO_TOKEN_HMAC_SECRET HMAC key for client connection tokens
#
# Optional:
#   CENTRIFUGO_LOG_LEVEL        defaults to "info" inside the template

set -eu

TEMPLATE_PATH="${CENTRIFUGO_TEMPLATE_PATH:-/etc/centrifugo/config.template.json}"
RENDERED_PATH="${CENTRIFUGO_CONFIG_PATH:-/tmp/centrifugo.json}"

if [ ! -f "$TEMPLATE_PATH" ]; then
  echo "centrifugo entrypoint: template not found at $TEMPLATE_PATH" >&2
  exit 1
fi

: "${CENTRIFUGO_ALLOWED_ORIGINS:?CENTRIFUGO_ALLOWED_ORIGINS is required}"
: "${CENTRIFUGO_API_KEY:?CENTRIFUGO_API_KEY is required}"
: "${CENTRIFUGO_TOKEN_HMAC_SECRET:?CENTRIFUGO_TOKEN_HMAC_SECRET is required}"

# envsubst with an explicit allowlist so unrelated `${...}` literals in the
# template aren't expanded.
envsubst '${CENTRIFUGO_ALLOWED_ORIGINS} ${CENTRIFUGO_API_KEY} ${CENTRIFUGO_TOKEN_HMAC_SECRET} ${CENTRIFUGO_LOG_LEVEL}' \
  < "$TEMPLATE_PATH" > "$RENDERED_PATH"

exec centrifugo -c "$RENDERED_PATH"
