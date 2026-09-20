#!/usr/bin/env bash
# verify-install.sh — is this a working CourseShelf, or just running containers?
#
# Exits 0 only when the instance is usable: the health endpoint answers `ok`,
# both dependencies are up, and an account exists. "Up (healthy)" is the
# container's opinion of its own process; it says nothing about which build
# is running or whether anyone can sign in.
#
# Prints one line per check, then a verdict. Exit 1 on any failure, and the
# caller (install.sh step 8) leaves its marker unset so --resume comes back.
set -uo pipefail

STACK_DIR="${CS_STACK_DIR:-$PWD}"
EXPECT_VERSION="${1:-}"

_env() { sed -n "s/^${1}=//p" "$STACK_DIR/.env" 2>/dev/null | tail -1; }
port=$(_env PROXY_PORT)
[ -n "$port" ] || port=8080
base="http://127.0.0.1:${port}/api/v1"
public=$(_env PUBLIC_BASE_URL)
[ -n "$public" ] || public="http://localhost:${port}"

fail=0
_check() { # label, ok?, detail
  if [ "$2" = true ]; then
    printf '  OK    %-22s %s\n' "$1" "$3"
  else
    printf '  FAIL  %-22s %s\n' "$1" "$3"
    fail=1
  fi
}

printf '=== CourseShelf verification ===\n'

health=$(curl -fsS --max-time 5 "$base/health" 2>/dev/null || echo "")
if [ -z "$health" ]; then
  _check "health endpoint" false "no answer on $base/health"
  printf '\nVERDICT: not reachable. Check: docker compose -f %s/compose.yml logs backend\n' "$STACK_DIR"
  exit 1
fi

_pick() { printf '%s' "$health" | sed -n "s/.*\"$1\":[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -1; }
status=$(_pick status)
version=$(_pick version)
db=$(_pick db)
centrifugo=$(_pick centrifugo)

[ "$status" = ok ] && _check "overall status" true "$status" || _check "overall status" false "$status"
[ "$db" = ok ] && _check "database" true "$db" || _check "database" false "$db"
[ "$centrifugo" = ok ] && _check "centrifugo" true "$centrifugo" || _check "centrifugo" false "$centrifugo"

if [ -n "$EXPECT_VERSION" ]; then
  # The version the process reports is the only honest answer to "did the
  # deploy land": a pull that silently kept the old image still comes up
  # healthy.
  [ "$version" = "$EXPECT_VERSION" ] &&
    _check "version" true "$version" ||
    _check "version" false "reports $version, expected $EXPECT_VERSION"
else
  _check "version" true "$version"
fi

users=$(curl -fsS --max-time 5 "$base/admin/has-users" 2>/dev/null || echo "")
case "$users" in
  *'"hasUsers":true'* | *'"hasUsers": true'*)
    _check "admin account" true "exists"
    ;;
  *'"hasUsers":false'* | *'"hasUsers": false'*)
    # While no account exists, apps/web's global auth middleware funnels
    # every route to /sign-up, and the backend lets that one sign-up
    # through even with AUTH_SELF_REGISTRATION=false. So the instruction is
    # simply "open the URL" — the wizard is what the user lands on.
    _check "admin account" false "none yet — open ${public%/} and register; the first account becomes the admin"
    ;;
  *)
    _check "admin account" false "could not read $base/admin/has-users"
    ;;
esac

printf '\n'
if [ "$fail" -eq 0 ]; then
  printf 'VERDICT: ready. Sign in at %s\n' "${public%/}"
else
  printf 'VERDICT: not finished — see the FAIL lines above.\n'
fi
exit "$fail"
