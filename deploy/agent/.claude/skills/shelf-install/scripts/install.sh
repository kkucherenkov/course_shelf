#!/usr/bin/env bash
# install.sh — stands up a CourseShelf stack, one resumable step at a time.
#
# The agent drives this script; the script never prompts. Every answer it
# needs is a flag, and a missing one is an error naming it rather than a
# question nobody is there to read.
#
#   install.sh --check                 print [OK]/[TODO] per step, name the next
#   install.sh --resume                continue from the first unfinished step
#   install.sh --fresh                 clear the markers and start over
#   install.sh --public-url URL --courses PATH [...]   run (auto-resumes)
#
# Steps are marked done by a file in the state directory, so a pull that
# dies half way through a 2 GB image does not repeat the seven steps before
# it. A step is marked ONLY after its own verification passes — step 8 in
# particular refuses to mark itself while the instance still has no account.
set -uo pipefail

STACK_DIR="${CS_STACK_DIR:-$PWD}"
STATE_DIR=""
PUBLIC_URL=""
COURSES_PATH=""
DERIVED_PATH=""
MODEL_DIR=""
PROXY_PORT=""
RELEASE_TAG=""
FORCE=false
MODE="auto"
RESUME_FROM=""
GITHUB_REPO="${CS_GITHUB_REPO:-kkucherenkov/course_shelf}"
MIN_DISK_MB="${CS_MIN_DISK_MB:-4096}"

# The order is the array; the numbers are only keys. A step inserted later
# goes in the middle of STEP_ORDER under a number of its own, and nothing
# renumbers. Labels come from a case rather than an associative array so the
# script still runs under bash 3.2 — which is what /bin/bash is on macOS, and
# what some NAS firmwares ship.
STEP_ORDER=(1 2 3 4 5 6 7 8)
_step_label() {
  case "$1" in
    1) printf 'Preflight (docker, disk, port)' ;;
    2) printf 'Release bundle (compose.yml + .env.example)' ;;
    3) printf 'Secrets' ;;
    4) printf 'Data directories' ;;
    5) printf 'Write and validate .env' ;;
    6) printf 'Pull images' ;;
    7) printf 'Start the stack' ;;
    8) printf 'Verify (health, version, first admin)' ;;
    *) printf 'unknown step' ;;
  esac
}

# --- Output -----------------------------------------------------------------
info() { printf '[info] %s\n' "$*"; }
ok() { printf '[ok] %s\n' "$*"; }
warn() { printf '[warn] %s\n' "$*" >&2; }
die() {
  printf '[error] %s\n' "$*" >&2
  exit 1
}

# --- Markers ----------------------------------------------------------------
_marker() { printf '%s/.install_step_%s_ok' "$STATE_DIR" "$1"; }
_step_done() { [ -f "$(_marker "$1")" ]; }
_step_mark() {
  mkdir -p "$STATE_DIR" 2>/dev/null || true
  : >"$(_marker "$1")"
}
_first_pending() {
  local s
  for s in "${STEP_ORDER[@]}"; do
    _step_done "$s" || {
      printf '%s' "$s"
      return 0
    }
  done
  return 1
}
# A resume runs the target step and everything after it, in STEP_ORDER's
# order rather than in numeric order — so a step inserted later can sit
# between two existing ones without renumbering anything.
_should_run() {
  [ -z "$RESUME_FROM" ] && return 0
  local target=-1 me=-1 i
  for i in "${!STEP_ORDER[@]}"; do
    [ "${STEP_ORDER[i]}" = "$RESUME_FROM" ] && target=$i
    [ "${STEP_ORDER[i]}" = "$1" ] && me=$i
  done
  [ "$me" -ge 0 ] && [ "$target" -ge 0 ] || return 0
  [ "$me" -ge "$target" ]
}

# --- Ownership manifest -----------------------------------------------------
# Only what THIS script created is recorded, and uninstall reads nothing else.
# "The path is in .env" is not proof of ownership: COURSES_PATH normally
# points at a library that existed long before CourseShelf did, and deleting
# it on uninstall would destroy the one thing the user cannot re-download.
_own() {
  local entry="$1"
  case "$entry" in
    dir:/* | file:/* | project:?*) ;;
    *)
      warn "refusing to record malformed ownership entry: $entry"
      return 1
      ;;
  esac
  mkdir -p "$STATE_DIR" 2>/dev/null || return 1
  local manifest="$STATE_DIR/.courseshelf_owned"
  grep -qxF "$entry" "$manifest" 2>/dev/null || printf '%s\n' "$entry" >>"$manifest"
}

# --- Verified backup --------------------------------------------------------
# A backup that silently failed is worse than none: it is the reason the next
# step feels safe. Copy, then prove the copy is byte-identical, and treat a
# failure as a failure.
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

# --- Small helpers ----------------------------------------------------------
_rand_hex() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    od -An -tx1 -N32 /dev/urandom | tr -d ' \n'
  fi
}

# awk, not sed: the values here are URLs and absolute paths, and sed's
# delimiter would have to be escaped out of every one of them.
_set_env() {
  local key="$1" value="$2" file="$3" tmp
  tmp=$(mktemp "${file}.XXXXXX") || return 1
  awk -v k="$key" -v v="$value" '
    $0 ~ "^" k "=" { print k "=" v; found = 1; next }
    { print }
    END { if (!found) print k "=" v }
  ' "$file" >"$tmp" && mv "$tmp" "$file"
}

_compose() { docker compose --env-file "$STACK_DIR/.env" -f "$STACK_DIR/compose.yml" "$@"; }

_health_url() { printf 'http://127.0.0.1:%s/api/v1%s' "${PROXY_PORT:-8080}" "$1"; }

# --- Arguments --------------------------------------------------------------
while [ $# -gt 0 ]; do
  case "$1" in
    --check) MODE="check" ;;
    --resume) MODE="resume" ;;
    --fresh) MODE="fresh" ;;
    --force) FORCE=true ;;
    --stack-dir)
      STACK_DIR="$2"
      shift
      ;;
    --public-url)
      PUBLIC_URL="$2"
      shift
      ;;
    --courses)
      COURSES_PATH="$2"
      shift
      ;;
    --derived)
      DERIVED_PATH="$2"
      shift
      ;;
    --models)
      MODEL_DIR="$2"
      shift
      ;;
    --port)
      PROXY_PORT="$2"
      shift
      ;;
    --tag)
      RELEASE_TAG="$2"
      shift
      ;;
    -h | --help)
      sed -n '2,14p' "$0"
      exit 0
      ;;
    *) die "unknown argument: $1" ;;
  esac
  shift
done

STACK_DIR=$(cd "$STACK_DIR" 2>/dev/null && pwd) || die "stack directory does not exist: $STACK_DIR"
STATE_DIR="${CS_STATE_DIR:-$STACK_DIR/.courseshelf}"

# Answers already written to .env win over the flags on a resume: the point
# of resuming is to continue the install that is already half-built, not to
# quietly repoint it somewhere else.
if [ -f "$STACK_DIR/.env" ]; then
  _from_env() { sed -n "s/^${1}=//p" "$STACK_DIR/.env" 2>/dev/null | tail -1; }
  [ -z "$PROXY_PORT" ] && PROXY_PORT=$(_from_env PROXY_PORT)
  [ -z "$PUBLIC_URL" ] && PUBLIC_URL=$(_from_env PUBLIC_BASE_URL)
  [ -z "$COURSES_PATH" ] && COURSES_PATH=$(_from_env COURSES_PATH)
  [ -z "$DERIVED_PATH" ] && DERIVED_PATH=$(_from_env DERIVED_PATH)
  [ -z "$MODEL_DIR" ] && MODEL_DIR=$(_from_env WHISPER_MODEL_DIR)
fi
[ -n "$PROXY_PORT" ] || PROXY_PORT=8080
[ -n "$RELEASE_TAG" ] || RELEASE_TAG=latest

case "$MODE" in
  check)
    printf '=== CourseShelf install status ===\n'
    printf '    stack dir: %s\n\n' "$STACK_DIR"
    for s in "${STEP_ORDER[@]}"; do
      if _step_done "$s"; then
        printf '  [OK]   [%s] %s\n' "$s" "$(_step_label "$s")"
      else
        printf '  [TODO] [%s] %s\n' "$s" "$(_step_label "$s")"
      fi
    done
    next=$(_first_pending || true)
    if [ -n "$next" ]; then
      printf '\nNext step: %s (%s)\n' "$next" "$(_step_label "$next")"
    else
      printf '\nAll steps done.\n'
    fi
    exit 0
    ;;
  fresh)
    if [ -f "$STACK_DIR/.env" ]; then
      backup=$(_backup_file "$STACK_DIR/.env" "$STATE_DIR/backups") ||
        die "could not make a verified backup of .env — refusing to start over"
      [ -n "$backup" ] && info "backed up existing .env to $backup"
    fi
    rm -f "$STATE_DIR"/.install_step_*_ok 2>/dev/null || true
    info "markers cleared, installing from scratch"
    ;;
  resume | auto)
    next=$(_first_pending || true)
    if [ -z "$next" ]; then
      [ "$MODE" = "resume" ] && die "nothing to resume — all steps are done"
      info "all steps are already done; use --fresh to reinstall"
      exit 0
    fi
    if [ "$next" != "1" ]; then
      RESUME_FROM="$next"
      info "resuming from step $next ($(_step_label "$next"))"
    fi
    ;;
esac

# ── Step 1 — preflight ──────────────────────────────────────────────────────
if _should_run 1 && ! _step_done 1; then
  info "step 1: preflight"
  command -v docker >/dev/null 2>&1 || die "docker is not installed"
  docker info >/dev/null 2>&1 ||
    die "cannot talk to the docker daemon — it is either stopped, or this user is not in the docker group"
  docker compose version >/dev/null 2>&1 ||
    die "docker compose v2 is missing (the 'docker compose' subcommand, not the old docker-compose binary)"

  arch=$(uname -m)
  case "$arch" in
    x86_64 | amd64) ;;
    *)
      # ghcr carries linux/amd64 only — the release workflow builds on a
      # stock runner with no platform matrix. Emulation would "work" right
      # up to whisper-cli, which is compiled for the build host's CPU.
      if [ "$FORCE" = true ]; then
        warn "architecture $arch has no published images; continuing because --force was given"
      else
        die "architecture $arch has no published images (linux/amd64 only). Build the images yourself, or pass --force to try anyway."
      fi
      ;;
  esac

  free_mb=$(df -Pm "$STACK_DIR" 2>/dev/null | awk 'NR==2 {print $4}')
  if [ -n "${free_mb:-}" ] && [ "$free_mb" -lt "$MIN_DISK_MB" ]; then
    [ "$FORCE" = true ] ||
      die "only ${free_mb} MB free under $STACK_DIR; the images alone need about ${MIN_DISK_MB} MB (--force to ignore)"
  fi

  # A port held by something else is a blocker; a port held by a stack that
  # is already up is just this script being run twice.
  if curl -fsS --max-time 3 "$(_health_url /health)" >/dev/null 2>&1; then
    info "something already answers /api/v1/health on port $PROXY_PORT — assuming it is this stack"
  elif command -v ss >/dev/null 2>&1 && ss -ltnH 2>/dev/null | awk '{print $4}' | grep -qE "[:.]${PROXY_PORT}\$"; then
    die "port $PROXY_PORT is already taken by another service — pick another with --port"
  fi

  _step_mark 1
  ok "step 1 done"
fi

# ── Step 2 — release bundle ─────────────────────────────────────────────────
if _should_run 2 && ! _step_done 2; then
  info "step 2: release bundle"
  if [ -f "$STACK_DIR/compose.yml" ]; then
    info "compose.yml is already here — using it (this is the normal case when running from an unpacked bundle)"
  else
    command -v curl >/dev/null 2>&1 || die "curl is needed to download the release bundle"
    tag="$RELEASE_TAG"
    if [ "$tag" = "latest" ]; then
      tag=$(curl -fsS --max-time 10 "https://api.github.com/repos/${GITHUB_REPO}/releases/latest" |
        sed -n 's/.*"tag_name":[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
      [ -n "$tag" ] || die "could not resolve the latest release tag from GitHub"
    fi
    semver="${tag#v}"
    semver="${semver%-release}"
    base="https://github.com/${GITHUB_REPO}/releases/download/${tag}"
    info "downloading compose-release-v${semver}.yml and .env.release.example from $tag"
    curl -fsSL --max-time 60 "$base/compose-release-v${semver}.yml" -o "$STACK_DIR/compose.yml" ||
      die "download failed: $base/compose-release-v${semver}.yml"
    curl -fsSL --max-time 60 "$base/.env.release.example" -o "$STACK_DIR/.env.example" ||
      die "download failed: $base/.env.release.example"
    _own "file:$STACK_DIR/compose.yml"
    _own "file:$STACK_DIR/.env.example"
    RELEASE_TAG="$semver"
  fi
  [ -f "$STACK_DIR/.env.example" ] || die "no .env.example next to compose.yml — cannot render an .env without the template"
  _step_mark 2
  ok "step 2 done"
fi

# ── Step 3 — secrets ────────────────────────────────────────────────────────
# Generated once and kept in the state directory. A resume that regenerated
# them would hand Postgres a password that no longer matches its volume.
if _should_run 3 && ! _step_done 3; then
  info "step 3: secrets"
  mkdir -p "$STATE_DIR" || die "cannot create $STATE_DIR"
  secrets_file="$STATE_DIR/secrets.env"
  if [ ! -s "$secrets_file" ]; then
    umask 077
    {
      printf 'POSTGRES_PASSWORD=%s\n' "$(_rand_hex)"
      printf 'BETTER_AUTH_SECRET=%s\n' "$(_rand_hex)"
      printf 'CENTRIFUGO_API_KEY=%s\n' "$(_rand_hex)"
      printf 'CENTRIFUGO_TOKEN_HMAC_SECRET=%s\n' "$(_rand_hex)"
    } >"$secrets_file" || die "cannot write $secrets_file"
    _own "file:$secrets_file"
    ok "generated four secrets into $secrets_file (chmod 600)"
  else
    info "secrets already generated — keeping them"
  fi
  chmod 600 "$secrets_file" 2>/dev/null || true
  _step_mark 3
  ok "step 3 done"
fi

# ── Step 4 — data directories ───────────────────────────────────────────────
if _should_run 4 && ! _step_done 4; then
  info "step 4: data directories"
  [ -n "$COURSES_PATH" ] || die "--courses is required: the absolute host path holding your course folders"
  case "$COURSES_PATH" in /*) ;; *) die "--courses must be an absolute path, got: $COURSES_PATH" ;; esac
  # Never created here. An absent library path is almost always a typo, and
  # creating an empty one turns that typo into a stack that starts, scans
  # nothing, and looks broken for a reason nobody can see.
  [ -d "$COURSES_PATH" ] || die "courses directory does not exist: $COURSES_PATH"
  [ -r "$COURSES_PATH" ] || die "courses directory is not readable: $COURSES_PATH"

  [ -n "$DERIVED_PATH" ] || DERIVED_PATH="$STACK_DIR/derived"
  [ -n "$MODEL_DIR" ] || MODEL_DIR="$STACK_DIR/models"
  for d in "$DERIVED_PATH" "$MODEL_DIR"; do
    if [ ! -d "$d" ]; then
      mkdir -p "$d" || die "cannot create $d"
      _own "dir:$d"
      ok "created $d"
    fi
  done
  [ -w "$DERIVED_PATH" ] || die "derived directory is not writable: $DERIVED_PATH"
  _step_mark 4
  ok "step 4 done"
fi

# ── Step 5 — .env ───────────────────────────────────────────────────────────
if _should_run 5 && ! _step_done 5; then
  info "step 5: .env"
  [ -n "$PUBLIC_URL" ] || die "--public-url is required: the URL browsers will hit, e.g. http://nas.local:8080"
  env_file="$STACK_DIR/.env"
  if [ -f "$env_file" ]; then
    backup=$(_backup_file "$env_file" "$STATE_DIR/backups") ||
      die "could not make a verified backup of the existing .env"
    [ -n "$backup" ] && info "backed up .env to $backup"
  else
    cp "$STACK_DIR/.env.example" "$env_file" || die "cannot create $env_file"
    _own "file:$env_file"
  fi
  chmod 600 "$env_file" 2>/dev/null || true

  _set_env PUBLIC_BASE_URL "$PUBLIC_URL" "$env_file"
  _set_env PROXY_PORT "$PROXY_PORT" "$env_file"
  _set_env COURSES_PATH "$COURSES_PATH" "$env_file"
  _set_env DERIVED_PATH "$DERIVED_PATH" "$env_file"
  _set_env WHISPER_MODEL_DIR "$MODEL_DIR" "$env_file"
  # Only meaningful when the compose file still interpolates it. The release
  # workflow sed-rewrites `${RELEASE_TAG:-latest}` to a literal version
  # before shipping, so writing this into the bundle's .env would look like
  # it pins the version while changing nothing at all.
  if [ "$RELEASE_TAG" != "latest" ] && grep -q 'RELEASE_TAG' "$STACK_DIR/compose.yml"; then
    _set_env RELEASE_TAG "$RELEASE_TAG" "$env_file"
  fi
  while IFS='=' read -r k v; do
    [ -n "$k" ] && _set_env "$k" "$v" "$env_file"
  done <"$STATE_DIR/secrets.env"

  # compose's own interpolation is the validator: every variable the file
  # marks `${VAR:?}` has to resolve, so this catches a missing answer here
  # rather than half way through `up -d`.
  _compose config -q || die "docker compose rejected the rendered .env — see the error above"
  ok "rendered and validated $env_file"
  _step_mark 5
  ok "step 5 done"
fi

# ── Step 6 — pull ───────────────────────────────────────────────────────────
if _should_run 6 && ! _step_done 6; then
  info "step 6: pulling images (this is the slow one)"
  _compose pull || die "pull failed — check the tag exists and the host can reach ghcr.io"
  _step_mark 6
  ok "step 6 done"
fi

# ── Step 7 — start ──────────────────────────────────────────────────────────
if _should_run 7 && ! _step_done 7; then
  info "step 7: starting the stack"
  _compose up -d || die "docker compose up failed"
  _own "project:$(sed -n 's/^name:[[:space:]]*"\{0,1\}\([^"#]*\)"\{0,1\}.*/\1/p' "$STACK_DIR/compose.yml" | head -1 | tr -d '[:space:]')"
  wait_for="${CS_HEALTH_TIMEOUT:-180}"
  info "waiting for the backend to report healthy (up to ${wait_for}s; it runs its migrations first)"
  deadline=$((SECONDS + wait_for))
  healthy=false
  while [ $SECONDS -lt $deadline ]; do
    if curl -fsS --max-time 3 "$(_health_url /health)" 2>/dev/null | grep -q '"status":"ok"'; then
      healthy=true
      break
    fi
    sleep 3
  done
  [ "$healthy" = true ] ||
    die "the stack did not become healthy within ${wait_for}s — check: docker compose -f $STACK_DIR/compose.yml logs backend"
  _step_mark 7
  ok "step 7 done"
fi

# ── Step 8 — verify ─────────────────────────────────────────────────────────
# Deliberately the last marker and deliberately fallible: an instance with no
# account is not an installed product, and marking this step on "the
# containers came up" is exactly the lie the whole script exists to avoid.
if _should_run 8 && ! _step_done 8; then
  info "step 8: verifying"
  script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
  if CS_STACK_DIR="$STACK_DIR" bash "$script_dir/verify-install.sh"; then
    _step_mark 8
    ok "step 8 done"
  else
    warn "verification is not complete yet — the step stays [TODO]. Re-run with --resume once it is."
    exit 1
  fi
fi

printf '\n'
ok "install complete — $PUBLIC_URL"
