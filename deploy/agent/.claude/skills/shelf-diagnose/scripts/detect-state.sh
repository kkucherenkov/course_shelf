#!/usr/bin/env bash
# detect-state.sh — the single source of truth about this host and this stack.
#
# Prints one JSON object to stdout and nothing else. Read-only: it never
# writes a file, never starts or stops a container, never needs root. The
# agent reads the JSON; what to DO about each field lives in SKILL.md, not
# here. Keeping judgement out of this file is what makes it testable.
#
# Exit code is 0 even when everything is broken — "docker is missing" is a
# finding, not a script failure. A non-zero exit means the probe itself
# broke.
#
# Environment:
#   CS_STACK_DIR    directory holding compose.yml and .env (default: the
#                   bundle root this script ships inside, else $PWD)
#   CS_SKIP_NETWORK 1 to skip the GitHub latest-release lookup
#   CS_GITHUB_REPO  override the repo the update check asks about
set -uo pipefail

SCHEMA_VERSION=1
GITHUB_REPO="${CS_GITHUB_REPO:-kkucherenkov/course_shelf}"

# --- JSON helpers -----------------------------------------------------------
# Hand-rolled rather than jq: a NAS with docker on it does not necessarily
# have jq, and a diagnostic that cannot run on a bare host is useless.
_esc() { printf '%s' "${1-}" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/	/\\t/g'; }
_jstr() { printf '"%s"' "$(_esc "${1-}")"; }
_jarr() {
  local first=1 item
  printf '['
  for item in "$@"; do
    [ $first -eq 1 ] || printf ', '
    first=0
    _jstr "$item"
  done
  printf ']'
}

# --- Where is the stack? ----------------------------------------------------
# Shipped layout is <bundle>/.claude/skills/shelf-diagnose/scripts/, so the
# bundle root is four levels up. Fall back to $PWD when that guess holds no
# compose file — which is what happens in the monorepo and in the tests.
_default_stack_dir() {
  local here
  here=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." 2>/dev/null && pwd) || here=""
  if [ -n "$here" ] && [ -f "$here/compose.yml" ]; then printf '%s' "$here"; return; fi
  printf '%s' "$PWD"
}
stack_dir="${CS_STACK_DIR:-$(_default_stack_dir)}"

compose_file=""
for _candidate in compose.yml compose.yaml docker-compose.yml; do
  if [ -f "$stack_dir/$_candidate" ]; then compose_file="$stack_dir/$_candidate"; break; fi
done
env_file=""
[ -f "$stack_dir/.env" ] && env_file="$stack_dir/.env"

# --- Host -------------------------------------------------------------------
os="unknown"
if [ -r /etc/os-release ]; then
  # shellcheck source=/dev/null
  os=$(. /etc/os-release && printf '%s' "${PRETTY_NAME:-$NAME}")
elif [ "$(uname -s)" = "Darwin" ]; then
  os="macOS $(sw_vers -productVersion 2>/dev/null || echo unknown)"
fi
kernel=$(uname -r 2>/dev/null || echo unknown)
arch=$(uname -m 2>/dev/null || echo unknown)

# The release workflow builds on a stock x86_64 runner with no buildx
# platform matrix, so ghcr carries linux/amd64 images only. An aarch64 host
# can run this stack only by building the images itself.
case "$arch" in
  x86_64 | amd64) arch_supported=true ;;
  *) arch_supported=false ;;
esac

memory_mb=0
if [ -r /proc/meminfo ]; then
  memory_mb=$(awk '/^MemTotal:/ {printf "%d", $2 / 1024}' /proc/meminfo 2>/dev/null || echo 0)
elif command -v sysctl >/dev/null 2>&1; then
  memory_mb=$(sysctl -n hw.memsize 2>/dev/null | awk '{printf "%d", $1 / 1048576}' || echo 0)
fi
[ -n "$memory_mb" ] || memory_mb=0

disk_free_mb=$(df -Pm "$stack_dir" 2>/dev/null | awk 'NR==2 {print $4}')
[ -n "${disk_free_mb:-}" ] || disk_free_mb=0

# --- Docker -----------------------------------------------------------------
docker_ok=false
docker_permission_ok=false
docker_version="none"
compose_ok=false
compose_version="none"

if command -v docker >/dev/null 2>&1; then
  docker_version=$(docker version --format '{{.Client.Version}}' 2>/dev/null || echo "unknown")
  # `docker info` is the honest probe: it fails both when the daemon is down
  # and when this user may not talk to the socket, which are different
  # problems with different fixes — separated just below.
  if docker info >/dev/null 2>&1; then
    docker_ok=true
    docker_permission_ok=true
    docker_version=$(docker version --format '{{.Server.Version}}' 2>/dev/null || printf '%s' "$docker_version")
  elif docker info 2>&1 | grep -qi 'permission denied'; then
    docker_permission_ok=false
  fi
  if docker compose version >/dev/null 2>&1; then
    compose_ok=true
    compose_version=$(docker compose version --short 2>/dev/null || echo "unknown")
  fi
fi

# --- Compose contract vs .env ----------------------------------------------
# Required variables are read out of the compose file's own `${VAR:?}`
# markers rather than from a list kept here. A newly-required variable then
# shows up in env_missing the day it is added, with no edit to this probe —
# which is exactly how DERIVED_PATH stayed absent from .env.release.example
# long enough to break every fresh install that followed the bundle README.
required_vars=()
if [ -n "$compose_file" ]; then
  while IFS= read -r _var; do
    [ -n "$_var" ] && required_vars+=("$_var")
  done < <(grep -oE '\$\{[A-Z_][A-Z0-9_]*:\?' "$compose_file" 2>/dev/null |
    sed -e 's/^\${//' -e 's/:?$//' | sort -u)
fi

_env_value() {
  [ -n "$env_file" ] || return 1
  sed -n "s/^${1}=//p" "$env_file" 2>/dev/null | tail -1
}

env_missing=()
env_placeholders=()
for _var in ${required_vars[@]+"${required_vars[@]}"}; do
  _val=$(_env_value "$_var" || true)
  if [ -z "${_val:-}" ]; then
    env_missing+=("$_var")
  fi
done
if [ -n "$env_file" ]; then
  while IFS= read -r _key; do
    [ -n "$_key" ] && env_placeholders+=("$_key")
  done < <(grep -nE '^[A-Z_][A-Z0-9_]*=.*change-me' "$env_file" 2>/dev/null |
    sed -e 's/^[0-9]*://' -e 's/=.*//')
fi

# Project name: compose's own `name:` wins, COMPOSE_PROJECT_NAME overrides it,
# and the directory name is the last resort — same precedence docker uses.
project="courseshelf-release"
if [ -n "$compose_file" ]; then
  _declared=$(sed -n 's/^name:[[:space:]]*"\{0,1\}\([^"#]*\)"\{0,1\}.*/\1/p' "$compose_file" 2>/dev/null |
    head -1 | tr -d '[:space:]')
  # The dev compose file writes `name: ${COMPOSE_PROJECT_NAME:-course-shelf}`.
  # Take the default out of the interpolation rather than filtering on a
  # container named after a literal dollar sign.
  case "$_declared" in
    *'${'*) _declared=$(printf '%s' "$_declared" | sed -n 's/.*:-\([^}]*\)}.*/\1/p') ;;
  esac
  [ -n "$_declared" ] && project="$_declared"
fi
_override=$(_env_value COMPOSE_PROJECT_NAME || true)
[ -n "${_override:-}" ] && project="$_override"

# --- What is running --------------------------------------------------------
# `docker ps --filter label=` instead of `docker compose ps`: the latter
# interpolates the compose file and dies on a missing required variable, so
# it cannot answer "what is running" on exactly the broken install this probe
# exists to describe.
services_running=()
if [ "$docker_ok" = true ]; then
  while IFS= read -r _svc; do
    [ -n "$_svc" ] && services_running+=("$_svc")
  done < <(docker ps --filter "label=com.docker.compose.project=$project" \
    --format '{{.Label "com.docker.compose.service"}}' 2>/dev/null | sort -u)
fi
stack_running=false
[ ${#services_running[@]} -gt 0 ] && stack_running=true

# --- Health -----------------------------------------------------------------
proxy_port=$(_env_value PROXY_PORT || true)
[ -n "${proxy_port:-}" ] || proxy_port=8080

health_reachable=false
health_status="unknown"
installed_version="none"
db_status="unknown"
centrifugo_status="unknown"
has_users="unknown"

_health_json=""
if command -v curl >/dev/null 2>&1; then
  _health_json=$(curl -fsS --max-time 3 "http://127.0.0.1:${proxy_port}/api/v1/health" 2>/dev/null || echo "")
fi
if [ -n "$_health_json" ]; then
  health_reachable=true
  _pick() { printf '%s' "$_health_json" | sed -n "s/.*\"$1\":[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -1; }
  health_status=$(_pick status); [ -n "$health_status" ] || health_status="unknown"
  installed_version=$(_pick version); [ -n "$installed_version" ] || installed_version="unknown"
  db_status=$(_pick db); [ -n "$db_status" ] || db_status="unknown"
  centrifugo_status=$(_pick centrifugo); [ -n "$centrifugo_status" ] || centrifugo_status="unknown"

  # First-run probe, public by design (openapi: /api/v1/admin/has-users).
  # A stack that is healthy but has no account yet is not finished: the
  # SPA funnels every route to /sign-up until one exists, and that first
  # account is the one promoted to admin.
  _users_json=$(curl -fsS --max-time 3 "http://127.0.0.1:${proxy_port}/api/v1/admin/has-users" 2>/dev/null || echo "")
  case "$_users_json" in
    *'"hasUsers":true'* | *'"hasUsers": true'*) has_users=true ;;
    *'"hasUsers":false'* | *'"hasUsers": false'*) has_users=false ;;
  esac
fi

# Is the port free? Only interesting when the stack is NOT the one holding it:
# "8080 is taken" reads as a blocker during install and as normal afterwards,
# so the field names the owner rather than a bare boolean.
_port_listening=false
if command -v ss >/dev/null 2>&1; then
  ss -ltnH 2>/dev/null | awk '{print $4}' | grep -qE "[:.]${proxy_port}\$" && _port_listening=true
elif command -v lsof >/dev/null 2>&1; then
  lsof -nP -iTCP:"$proxy_port" -sTCP:LISTEN >/dev/null 2>&1 && _port_listening=true
elif command -v nc >/dev/null 2>&1; then
  nc -z 127.0.0.1 "$proxy_port" >/dev/null 2>&1 && _port_listening=true
fi
if [ "$health_reachable" = true ]; then
  port_owner="stack"
elif [ "$_port_listening" = true ]; then
  port_owner="other"
else
  port_owner="free"
fi

# --- Data paths -------------------------------------------------------------
courses_path=$(_env_value COURSES_PATH || true)
derived_path=$(_env_value DERIVED_PATH || true)
model_dir=$(_env_value WHISPER_MODEL_DIR || true)

courses_exists=false; courses_readable=false
if [ -n "${courses_path:-}" ] && [ -d "$courses_path" ]; then
  courses_exists=true
  [ -r "$courses_path" ] && courses_readable=true
fi
derived_exists=false; derived_writable=false
if [ -n "${derived_path:-}" ] && [ -d "$derived_path" ]; then
  derived_exists=true
  [ -w "$derived_path" ] && derived_writable=true
fi
model_files=0
if [ -n "${model_dir:-}" ] && [ -d "$model_dir" ]; then
  model_files=$(find "$model_dir" -maxdepth 1 -type f \( -name '*.bin' -o -name '*.gguf' \) 2>/dev/null | wc -l | tr -d ' ')
fi

# --- Updates ----------------------------------------------------------------
latest_version="unknown"
update_available=false
if [ "${CS_SKIP_NETWORK:-0}" != "1" ] && command -v curl >/dev/null 2>&1; then
  # Release tags are vMAJOR.MINOR.PATCH-release; the version the health
  # endpoint reports is the bare semver, so strip both ends before comparing.
  _tag=$(curl -fsS --max-time 4 "https://api.github.com/repos/${GITHUB_REPO}/releases/latest" 2>/dev/null |
    sed -n 's/.*"tag_name":[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
  if [ -n "${_tag:-}" ]; then
    latest_version="${_tag#v}"
    latest_version="${latest_version%-release}"
  fi
fi
if [ "$latest_version" != "unknown" ] && [ "$installed_version" != "none" ] &&
  [ "$installed_version" != "unknown" ] && [ "$installed_version" != "$latest_version" ]; then
  # sort -V puts the older version first; if that is the installed one, an
  # upgrade exists. A plain string compare would call 1.10.0 older than 1.9.0.
  _oldest=$(printf '%s\n%s\n' "$installed_version" "$latest_version" | sort -V | head -1)
  [ "$_oldest" = "$installed_version" ] && update_available=true
fi

# --- Output -----------------------------------------------------------------
cat <<EOF
{
  "schema_version": $SCHEMA_VERSION,
  "os": $(_jstr "$os"),
  "arch": $(_jstr "$arch"),
  "arch_supported": $arch_supported,
  "kernel": $(_jstr "$kernel"),
  "memory_mb": $memory_mb,
  "disk_free_mb": $disk_free_mb,
  "docker_ok": $docker_ok,
  "docker_permission_ok": $docker_permission_ok,
  "docker_version": $(_jstr "$docker_version"),
  "compose_ok": $compose_ok,
  "compose_version": $(_jstr "$compose_version"),
  "stack_dir": $(_jstr "$stack_dir"),
  "compose_file": $(_jstr "$compose_file"),
  "env_file": $(_jstr "$env_file"),
  "env_missing": $(_jarr ${env_missing[@]+"${env_missing[@]}"}),
  "env_placeholders": $(_jarr ${env_placeholders[@]+"${env_placeholders[@]}"}),
  "project": $(_jstr "$project"),
  "stack_running": $stack_running,
  "services_running": $(_jarr ${services_running[@]+"${services_running[@]}"}),
  "proxy_port": $(_jstr "$proxy_port"),
  "port_owner": $(_jstr "$port_owner"),
  "health_reachable": $health_reachable,
  "health_status": $(_jstr "$health_status"),
  "installed_version": $(_jstr "$installed_version"),
  "db_status": $(_jstr "$db_status"),
  "centrifugo_status": $(_jstr "$centrifugo_status"),
  "has_users": $(_jstr "$has_users"),
  "courses_path": $(_jstr "${courses_path:-}"),
  "courses_exists": $courses_exists,
  "courses_readable": $courses_readable,
  "derived_path": $(_jstr "${derived_path:-}"),
  "derived_exists": $derived_exists,
  "derived_writable": $derived_writable,
  "model_dir": $(_jstr "${model_dir:-}"),
  "model_files": $model_files,
  "latest_version": $(_jstr "$latest_version"),
  "update_available": $update_available
}
EOF
