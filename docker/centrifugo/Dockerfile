# Bake config.json into the Centrifugo image.
#
# Why this instead of a bind mount: the act_runner on Forgejo runs the
# workflow inside a container that issues `docker compose` against the
# host docker daemon via socket mount. Relative bind-mount paths get
# interpreted from the host daemon's perspective — where the workspace
# does NOT exist at the runner's `/workspace/...` path — and Docker
# silently creates an EMPTY directory at the mount target instead of
# mounting the file. Centrifugo then reads `/centrifugo/config.json` as
# a directory, prints `config file not found, continue using environment
# and flag options`, and starts with `health.enabled=false` (its default).
# Healthcheck `wget -qO- http://localhost:8000/health` returns 404, the
# container never goes healthy, the backend's `depends_on:
# service_healthy: centrifugo` blocks startup, the e2e job dies.
#
# Baking the config into the image dodges the DinD path-mismatch entirely
# — the file lives inside the image, no host filesystem involved.

FROM centrifugo/centrifugo:v6

COPY config.json /centrifugo/config.json

# The upstream base image already runs as the non-root `centrifugo` user,
# but Trivy's misconfig scan only sees the Dockerfile and flags missing
# explicit USER directives (DS-0002). Restate the inherited user so the
# scanner is satisfied and intent is explicit at the Dockerfile level.
USER centrifugo
