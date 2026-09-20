#!/usr/bin/env bash
# manage.sh — day-to-day operations on an installed stack.
#
#   manage.sh status              what is running, and what version
#   manage.sh start | stop
#   manage.sh restart [service]   default: backend + web only
#   manage.sh logs [service] [n]  default: backend, last 100 lines
#   manage.sh backup              pg_dump -Fc into the state directory
#   manage.sh uninstall [--yes]   remove ONLY what the installer created
#
# One file rather than five, because every subcommand here is the same two
# facts — where the stack is and which env file it uses — wrapped around one
# docker command. The value is in not having to remember them, not in the
# wrapping.
set -uo pipefail

STACK_DIR="${CS_STACK_DIR:-$PWD}"
STATE_DIR="${CS_STATE_DIR:-$STACK_DIR/.courseshelf}"

info() { printf '[info] %s\n' "$*"; }
ok() { printf '[ok] %s\n' "$*"; }
die() {
  printf '[error] %s\n' "$*" >&2
  exit 1
}

cmd="${1:-status}"
[ $# -gt 0 ] && shift

STACK_DIR=$(cd "$STACK_DIR" 2>/dev/null && pwd) || die "no such directory: $STACK_DIR"
[ -f "$STACK_DIR/compose.yml" ] || die "no compose.yml in $STACK_DIR"

_env() { sed -n "s/^${1}=//p" "$STACK_DIR/.env" 2>/dev/null | tail -1; }
_compose() { docker compose --env-file "$STACK_DIR/.env" -f "$STACK_DIR/compose.yml" "$@"; }
_project() {
  sed -n 's/^name:[[:space:]]*"\{0,1\}\([^"#]*\)"\{0,1\}.*/\1/p' "$STACK_DIR/compose.yml" |
    head -1 | tr -d '[:space:]'
}

case "$cmd" in
  status)
    port=$(_env PROXY_PORT)
    [ -n "$port" ] || port=8080
    printf '=== %s ===\n' "$(_project)"
    docker ps --filter "label=com.docker.compose.project=$(_project)" \
      --format '  {{.Label "com.docker.compose.service"}}\t{{.Status}}\t{{.Image}}'
    printf '\n'
    health=$(curl -fsS --max-time 5 "http://127.0.0.1:${port}/api/v1/health" 2>/dev/null || echo "")
    if [ -n "$health" ]; then
      printf '  health: %s\n' "$health"
    else
      printf '  health: no answer on port %s\n' "$port"
    fi
    ;;

  start)
    _compose up -d || die "up failed"
    ok "started"
    ;;

  stop)
    _compose stop || die "stop failed"
    ok 'stopped (containers kept; "manage.sh start" brings them back)'
    ;;

  restart)
    # Only backend and web by default: postgres, centrifugo and the proxy
    # are unchanged by an application restart, and bouncing them costs
    # uptime for nothing.
    if [ $# -gt 0 ]; then
      _compose restart "$@" || die "restart failed"
      ok "restarted: $*"
    else
      _compose restart backend web || die "restart failed"
      ok "restarted backend and web"
    fi
    ;;

  logs)
    service="${1:-backend}"
    lines="${2:-100}"
    _compose logs "$service" --tail "$lines"
    ;;

  backup)
    container=$(docker ps --filter "label=com.docker.compose.project=$(_project)" \
      --filter "label=com.docker.compose.service=postgres" --format '{{.Names}}' | head -1)
    [ -n "$container" ] || die "postgres is not running — start the stack first"
    db=$(_env POSTGRES_DB)
    [ -n "$db" ] || db=courseshelf
    user=$(_env POSTGRES_USER)
    [ -n "$user" ] || user=courseshelf
    mkdir -p "$STATE_DIR/backups"
    dump="$STATE_DIR/backups/$(date +%Y%m%d-%H%M%S).dump"
    docker exec "$container" pg_dump -U "$user" -Fc "$db" >"$dump" 2>/dev/null ||
      die "pg_dump failed"
    [ -s "$dump" ] || die "the dump came out empty"
    ok "dumped $db to $dump ($(wc -c <"$dump" | tr -d ' ') bytes)"
    printf 'Restore with:\n  docker exec -i %s pg_restore -U %s -d %s --clean < %s\n' \
      "$container" "$user" "$db" "$dump"
    ;;

  uninstall)
    # The manifest is the whole authority. A path that is not in it is not
    # removed, however obviously CourseShelf-shaped it looks — COURSES_PATH
    # is never recorded precisely because it is the user's own library and
    # the one thing here that cannot be downloaded again.
    manifest="$STATE_DIR/.courseshelf_owned"
    [ -f "$manifest" ] || die "no ownership manifest at $manifest — refusing to guess what to delete"
    confirm=false
    [ "${1:-}" = "--yes" ] && confirm=true

    printf 'The installer recorded these as its own:\n\n'
    while IFS= read -r entry; do
      case "$entry" in
        dir:*) printf '  directory  %s\n' "${entry#dir:}" ;;
        file:*) printf '  file       %s\n' "${entry#file:}" ;;
        project:*) printf '  project    %s (containers + volumes)\n' "${entry#project:}" ;;
      esac
    done <"$manifest"
    courses=$(_env COURSES_PATH)
    [ -n "$courses" ] && printf '\nNOT touched: %s (your library)\n' "$courses"

    if [ "$confirm" != true ]; then
      printf '\nNothing was removed. Re-run with --yes to go ahead.\n'
      exit 0
    fi

    _compose down -v || die "docker compose down failed — stopping here rather than deleting files under a running stack"
    while IFS= read -r entry; do
      case "$entry" in
        dir:*)
          d="${entry#dir:}"
          [ -d "$d" ] && rm -rf -- "$d" && info "removed directory $d"
          ;;
        file:*)
          f="${entry#file:}"
          [ -f "$f" ] && rm -f -- "$f" && info "removed file $f"
          ;;
      esac
    done <"$manifest"
    ok "uninstalled. The state directory $STATE_DIR (backups, secrets) was kept — delete it by hand when you are sure."
    ;;

  *) die "unknown command: $cmd (status|start|stop|restart|logs|backup|uninstall)" ;;
esac
