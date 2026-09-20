#!/usr/bin/env bash
# upgrade.sh — move a running stack to another release, and back.
#
#   upgrade.sh [--to vX.Y.Z|latest] [--no-backup]
#   upgrade.sh --rollback
#
# What it does NOT do: run migrations. The backend image's own command is
# `prisma migrate deploy && node dist/main.js`, so the schema moves when the
# container starts. A second migration runner here would be a third opinion
# about the schema's state, competing with Prisma's `_prisma_migrations`
# table. This script's job around migrations is to take a dump before the
# new container starts, and to read the migration line out of the log after.
set -uo pipefail

STACK_DIR="${CS_STACK_DIR:-$PWD}"
STATE_DIR="${CS_STATE_DIR:-$STACK_DIR/.courseshelf}"
GITHUB_REPO="${CS_GITHUB_REPO:-kkucherenkov/course_shelf}"
TARGET="latest"
DO_BACKUP=true
ROLLBACK=false

info() { printf '[info] %s\n' "$*"; }
ok() { printf '[ok] %s\n' "$*"; }
warn() { printf '[warn] %s\n' "$*" >&2; }
die() {
  printf '[error] %s\n' "$*" >&2
  exit 1
}

while [ $# -gt 0 ]; do
  case "$1" in
    --to)
      TARGET="$2"
      shift
      ;;
    --no-backup) DO_BACKUP=false ;;
    --rollback) ROLLBACK=true ;;
    -h | --help)
      sed -n '2,14p' "$0"
      exit 0
      ;;
    *) die "unknown argument: $1" ;;
  esac
  shift
done

STACK_DIR=$(cd "$STACK_DIR" 2>/dev/null && pwd) || die "no such directory: $STACK_DIR"
[ -f "$STACK_DIR/compose.yml" ] || die "no compose.yml in $STACK_DIR"
[ -f "$STACK_DIR/.env" ] || die "no .env in $STACK_DIR — is this stack installed?"

_env() { sed -n "s/^${1}=//p" "$STACK_DIR/.env" 2>/dev/null | tail -1; }
_compose() { docker compose --env-file "$STACK_DIR/.env" -f "$STACK_DIR/compose.yml" "$@"; }

port=$(_env PROXY_PORT)
[ -n "$port" ] || port=8080
current=$(curl -fsS --max-time 5 "http://127.0.0.1:${port}/api/v1/health" 2>/dev/null |
  sed -n 's/.*"version":[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
[ -n "$current" ] || current="unknown"

_backup_file() {
  local source="$1" dest_dir="$2" backup
  [ -s "$source" ] || return 0
  mkdir -p "$dest_dir" || return 1
  backup=$(mktemp "$dest_dir/$(basename "$source").$(date +%Y%m%d-%H%M%S).XXXXXX") || return 1
  if ! cp -a -- "$source" "$backup" 2>/dev/null ||
    [ ! -s "$backup" ] || ! cmp -s -- "$source" "$backup"; then
    rm -f -- "$backup"
    return 1
  fi
  printf '%s' "$backup"
}

# ── Rollback ────────────────────────────────────────────────────────────────
if [ "$ROLLBACK" = true ]; then
  pointer="$STATE_DIR/.previous-compose"
  [ -s "$pointer" ] || die "nothing to roll back to — no previous compose.yml recorded"
  previous=$(cat "$pointer")
  [ -s "$previous" ] || die "the recorded previous compose.yml is gone: $previous"
  info "restoring $previous over compose.yml (currently running $current)"
  cp -a -- "$previous" "$STACK_DIR/compose.yml" || die "restore failed"
  _compose up -d backend web || die "docker compose up failed"
  info "a rollback undoes the images, never a migration. If the version you left applied one,"
  info "restore the pre-upgrade dump in $STATE_DIR/backups as well."
  exit 0
fi

# ── Resolve the target ──────────────────────────────────────────────────────
tag="$TARGET"
if [ "$tag" = "latest" ]; then
  tag=$(curl -fsS --max-time 10 "https://api.github.com/repos/${GITHUB_REPO}/releases/latest" 2>/dev/null |
    sed -n 's/.*"tag_name":[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
  [ -n "$tag" ] || die "could not resolve the latest release tag from GitHub"
fi
case "$tag" in v*) ;; *) tag="v$tag" ;; esac
case "$tag" in *-release) ;; *) tag="${tag}-release" ;; esac
semver="${tag#v}"
semver="${semver%-release}"

[ "$semver" != "$current" ] || die "already running $current — nothing to do"
info "upgrading $current → $semver"

# ── Dump first ──────────────────────────────────────────────────────────────
# Cheap when there is no migration, and the only way back when there is one.
# Whether this release carries a migration is not knowable from here, so the
# dump is unconditional unless explicitly waived.
if [ "$DO_BACKUP" = true ]; then
  container=$(docker ps --filter "label=com.docker.compose.service=postgres" \
    --filter "label=com.docker.compose.project=$(sed -n 's/^name:[[:space:]]*"\{0,1\}\([^"#]*\)"\{0,1\}.*/\1/p' "$STACK_DIR/compose.yml" | head -1 | tr -d '[:space:]')" \
    --format '{{.Names}}' | head -1)
  [ -n "$container" ] || die "cannot find the running postgres container — start the stack, or pass --no-backup"
  mkdir -p "$STATE_DIR/backups"
  dump="$STATE_DIR/backups/pre-${semver}-$(date +%Y%m%d-%H%M%S).dump"
  db=$(_env POSTGRES_DB)
  [ -n "$db" ] || db=courseshelf
  user=$(_env POSTGRES_USER)
  [ -n "$user" ] || user=courseshelf
  info "dumping $db from $container"
  docker exec "$container" pg_dump -U "$user" -Fc "$db" >"$dump" 2>/dev/null ||
    die "pg_dump failed — refusing to upgrade without a backup (--no-backup to override)"
  [ -s "$dump" ] || die "the dump is empty — refusing to upgrade"
  ok "dumped to $dump ($(wc -c <"$dump" | tr -d ' ') bytes)"
fi

# ── Swap the compose file ───────────────────────────────────────────────────
# The image tags in a released compose.yml are LITERAL — the release workflow
# sed-rewrites ${RELEASE_TAG:-latest} to the version before shipping. Editing
# RELEASE_TAG in .env therefore deploys nothing and reports success, which is
# how an afternoon once went missing. The upgrade is the new compose file.
backup=$(_backup_file "$STACK_DIR/compose.yml" "$STATE_DIR/backups") ||
  die "could not make a verified backup of compose.yml"
mkdir -p "$STATE_DIR"
printf '%s' "$backup" >"$STATE_DIR/.previous-compose"
info "previous compose.yml saved to $backup"

new_compose="$STATE_DIR/compose-${semver}.yml"
url="https://github.com/${GITHUB_REPO}/releases/download/${tag}/compose-release-v${semver}.yml"
curl -fsSL --max-time 60 "$url" -o "$new_compose" || die "download failed: $url"
grep -q "courseshelf-backend:${semver}" "$new_compose" ||
  die "the downloaded compose file does not pin courseshelf-backend:${semver} — refusing to use it"
cp -a -- "$new_compose" "$STACK_DIR/compose.yml" || die "could not replace compose.yml"

_compose config -q || die "the new compose file does not validate against your .env — see above. Roll back with --rollback."

# ── Pull, restart, verify ───────────────────────────────────────────────────
_compose pull backend web || die "pull failed"
_compose up -d backend web || die "up failed"

info "waiting for $semver to answer"
deadline=$((SECONDS + ${CS_HEALTH_TIMEOUT:-180}))
while [ $SECONDS -lt $deadline ]; do
  reported=$(curl -fsS --max-time 3 "http://127.0.0.1:${port}/api/v1/health" 2>/dev/null |
    sed -n 's/.*"version":[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
  [ "$reported" = "$semver" ] && break
  sleep 3
done

backend=$(docker ps --filter "label=com.docker.compose.service=backend" --format '{{.Names}}' | head -1)
if [ -n "$backend" ]; then
  printf '\n--- migration line from the backend log ---\n'
  docker logs "$backend" --since 5m 2>&1 | grep -i 'migrat' | tail -5
  printf -- '-------------------------------------------\n\n'
fi

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
verify="$script_dir/../../shelf-install/scripts/verify-install.sh"
if [ -f "$verify" ]; then
  CS_STACK_DIR="$STACK_DIR" bash "$verify" "$semver"
else
  warn "verify-install.sh not found next to this script; check /api/v1/health by hand"
  exit 1
fi
