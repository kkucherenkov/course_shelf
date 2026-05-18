# Bake init.sql into the Postgres image.
#
# Same DinD path-mismatch story as docker/centrifugo/Dockerfile: in
# act_runner's CI environment, the compose bind mount
# `./postgres/init.sql:/docker-entrypoint-initdb.d/10-init.sql:ro` silently
# becomes an empty *directory* at the mount target on the host docker
# daemon (because the runner-container's workspace path doesn't exist on
# the host). Postgres's docker-entrypoint then runs `psql -f <dir>` and
# fails with `could not read from input file: Is a directory`. The
# database completes bootstrap of the cluster (so the next start sees
# "Database directory appears to contain a database; Skipping
# initialization") but the citext + pgcrypto extensions never get
# created, and any subsequent app migration that depends on them fails.
#
# Baking the file into the image sidesteps the bind mount entirely.

FROM postgres:18.1-alpine

COPY init.sql /docker-entrypoint-initdb.d/10-init.sql
