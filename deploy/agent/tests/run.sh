#!/usr/bin/env bash
# run.sh — the agent's scripts, checked against mocked docker and curl.
#
#   bash deploy/agent/tests/run.sh
#
# No framework on purpose: these are three shell scripts, and bats would add
# a host install plus a CI job to test them. Each case builds a throwaway
# stack directory, puts fake `docker`/`curl` at the front of PATH, and
# asserts on stdout or on files. `python3` is used only to parse JSON —
# asserting on JSON with grep is how a probe starts passing for the wrong
# reason.
set -uo pipefail

AGENT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
DETECT="$AGENT_DIR/.claude/skills/shelf-diagnose/scripts/detect-state.sh"
INSTALL="$AGENT_DIR/.claude/skills/shelf-install/scripts/install.sh"
VERIFY="$AGENT_DIR/.claude/skills/shelf-install/scripts/verify-install.sh"
MANAGE="$AGENT_DIR/.claude/skills/shelf-manage/scripts/manage.sh"

TMP_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/cs-agent-tests.XXXXXX")
TMP_ROOT=$(cd "$TMP_ROOT" && pwd)
trap 'rm -rf "$TMP_ROOT"' EXIT

pass=0
fail=0
current=""

it() {
  current="$1"
  printf '\n• %s\n' "$current"
}
assert() { # description, condition-result(0/1)
  if [ "$2" -eq 0 ]; then
    printf '  ok   %s\n' "$1"
    pass=$((pass + 1))
  else
    printf '  FAIL %s\n' "$1"
    fail=$((fail + 1))
  fi
}
assert_eq() { # description, expected, actual
  if [ "$2" = "$3" ]; then
    printf '  ok   %s\n' "$1"
    pass=$((pass + 1))
  else
    printf '  FAIL %s\n    expected: %s\n    actual:   %s\n' "$1" "$2" "$3"
    fail=$((fail + 1))
  fi
}

# --- Fixtures ---------------------------------------------------------------
new_stack() { # -> path to a fresh stack dir with a compose file
  local dir
  dir=$(mktemp -d "$TMP_ROOT/stack.XXXXXX")
  cat >"$dir/compose.yml" <<'YAML'
name: "courseshelf-release"
services:
  backend:
    image: "ghcr.io/kkucherenkov/courseshelf-backend:1.7.0"
    environment:
      BETTER_AUTH_SECRET: "${BETTER_AUTH_SECRET:?BETTER_AUTH_SECRET is required}"
      PUBLIC_BASE_URL: "${PUBLIC_BASE_URL:?PUBLIC_BASE_URL is required}"
    volumes:
      - "${COURSES_PATH:?COURSES_PATH is required}:/data/courses:ro"
      - "${DERIVED_PATH:?DERIVED_PATH is required}:/data/derived"
YAML
  cat >"$dir/.env.example" <<'ENVEOF'
PUBLIC_BASE_URL=http://localhost:8080
PROXY_PORT=8080
COURSES_PATH=/srv/courseshelf/courses
POSTGRES_PASSWORD=change-me-pick-a-strong-one
BETTER_AUTH_SECRET=change-me-32-bytes-hex
CENTRIFUGO_API_KEY=change-me-centrifugo-api-key
CENTRIFUGO_TOKEN_HMAC_SECRET=change-me-centrifugo-hmac-secret
ENVEOF
  # macOS hands out /var/folders/... which is a symlink to /private/var/...,
  # and the scripts under test resolve it. Compare like with like.
  (cd "$dir" && pwd)
}

# A mock bin directory. `docker` and `curl` answer from files the test writes,
# so a case can say "health is down" by emptying one file.
new_mockbin() { # health-json, has-users-json, [ps-output]
  local bin
  bin=$(mktemp -d "$TMP_ROOT/bin.XXXXXX")
  printf '%s' "${1-}" >"$bin/.health"
  printf '%s' "${2-}" >"$bin/.hasusers"
  printf '%s' "${3-}" >"$bin/.ps"
  cat >"$bin/docker" <<'MOCK'
#!/usr/bin/env bash
selfdir=$(cd "$(dirname "$0")" && pwd)
case "$1" in
  info) exit 0 ;;
  version) echo "28.0.0"; exit 0 ;;
  ps) cat "$selfdir/.ps"; exit 0 ;;
  compose)
    shift
    # Skip the global flags install.sh passes before the subcommand.
    while [ $# -gt 0 ]; do
      case "$1" in
        --env-file|-f|-p) shift 2 ;;
        *) break ;;
      esac
    done
    case "${1:-}" in
      version) echo "2.30.0"; exit 0 ;;
      config|pull|up|down|restart|stop|logs) exit 0 ;;
      *) exit 0 ;;
    esac
    ;;
  exec) exit 0 ;;
  *) exit 0 ;;
esac
MOCK
  cat >"$bin/curl" <<'MOCK'
#!/usr/bin/env bash
selfdir=$(cd "$(dirname "$0")" && pwd)
url=""
for arg in "$@"; do case "$arg" in http*) url="$arg" ;; esac; done
case "$url" in
  *"/admin/has-users") body=$(cat "$selfdir/.hasusers") ;;
  *"/health")          body=$(cat "$selfdir/.health") ;;
  *)                   body="" ;;
esac
[ -n "$body" ] || exit 22   # curl's own "HTTP error" code, as -f would give
printf '%s' "$body"
MOCK
  chmod +x "$bin/docker" "$bin/curl"
  printf '%s' "$bin"
}

HEALTH_OK='{"status":"ok","version":"1.7.0","uptimeSeconds":12,"dependencies":{"db":"ok","centrifugo":"ok"}}'

# ── detect-state ────────────────────────────────────────────────────────────

# A PATH holding only the coreutils the probe uses, so `docker` and `curl`
# are absent by construction. Trimming PATH to /usr/bin:/bin is not enough —
# that is exactly where docker lives on a CI runner, and the case then
# silently tests the opposite of what it claims.
bare_path() {
  local dir cmd p
  dir=$(mktemp -d "$TMP_ROOT/barebin.XXXXXX")
  for cmd in bash sh sed awk grep uname df tr sort find od cat head tail cut wc date mktemp cmp; do
    p=$(command -v "$cmd" 2>/dev/null) && ln -sf "$p" "$dir/$cmd"
  done
  printf '%s' "$dir"
}

it "detect-state prints valid JSON on a bare host with no docker"
bare=$(bare_path)
out=$(PATH="$bare" CS_SKIP_NETWORK=1 CS_STACK_DIR="$TMP_ROOT" bash "$DETECT" 2>/dev/null)
rc=$?
assert_eq "exit code is 0 even with nothing installed" "0" "$rc"
python3 -c "import json,sys; json.loads(sys.argv[1])" "$out" 2>/dev/null
assert "output parses as JSON" $?
docker_ok=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['docker_ok'])" "$out")
assert_eq "docker_ok is False without docker on PATH" "False" "$docker_ok"

it "detect-state derives env_missing from the compose file's own \${VAR:?} markers"
stack=$(new_stack)
cat >"$stack/.env" <<'ENVEOF'
PUBLIC_BASE_URL=http://localhost:8080
COURSES_PATH=/tmp
BETTER_AUTH_SECRET=change-me-32-bytes-hex
ENVEOF
out=$(CS_SKIP_NETWORK=1 CS_STACK_DIR="$stack" bash "$DETECT")
missing=$(python3 -c "import json,sys; print(','.join(json.loads(sys.argv[1])['env_missing']))" "$out")
assert_eq "DERIVED_PATH is reported missing, nothing else" "DERIVED_PATH" "$missing"
placeholders=$(python3 -c "import json,sys; print(','.join(json.loads(sys.argv[1])['env_placeholders']))" "$out")
assert_eq "the unfilled change-me secret is reported" "BETTER_AUTH_SECRET" "$placeholders"

it "detect-state resolves a compose project name written as an interpolation"
stack=$(new_stack)
printf 'name: ${COMPOSE_PROJECT_NAME:-course-shelf}\nservices: {}\n' >"$stack/compose.yml"
out=$(CS_SKIP_NETWORK=1 CS_STACK_DIR="$stack" bash "$DETECT")
project=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['project'])" "$out")
assert_eq "falls back to the interpolation's default" "course-shelf" "$project"

it "detect-state reads version and first-run state off the health endpoints"
stack=$(new_stack)
bin=$(new_mockbin "$HEALTH_OK" '{"hasUsers":false}')
printf 'PROXY_PORT=8080\n' >"$stack/.env"
out=$(PATH="$bin:$PATH" CS_SKIP_NETWORK=1 CS_STACK_DIR="$stack" bash "$DETECT")
version=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['installed_version'])" "$out")
users=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['has_users'])" "$out")
owner=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['port_owner'])" "$out")
assert_eq "installed_version comes from /health" "1.7.0" "$version"
assert_eq "has_users is false before the first sign-up" "false" "$users"
assert_eq "the port is owned by the stack, not a stranger" "stack" "$owner"

# ── install step machine ────────────────────────────────────────────────────

it "install --check lists every step as TODO on a fresh directory"
stack=$(new_stack)
out=$(CS_STACK_DIR="$stack" bash "$INSTALL" --check)
assert_eq "eight steps are pending" "8" "$(printf '%s' "$out" | grep -c '\[TODO\]')"
printf '%s' "$out" | grep -q 'Next step: 1 '
assert "it names step 1 as next" $?

it "install --check resumes after the markers that already exist"
stack=$(new_stack)
mkdir -p "$stack/.courseshelf"
touch "$stack/.courseshelf/.install_step_1_ok" "$stack/.courseshelf/.install_step_2_ok" \
  "$stack/.courseshelf/.install_step_3_ok"
out=$(CS_STACK_DIR="$stack" bash "$INSTALL" --check)
assert_eq "three steps are done" "3" "$(printf '%s' "$out" | grep -c '\[OK\]')"
printf '%s' "$out" | grep -q 'Next step: 4 '
assert "the next step is 4" $?

it "install --fresh backs the old .env up before clearing markers"
stack=$(new_stack)
mkdir -p "$stack/.courseshelf"
touch "$stack/.courseshelf/.install_step_1_ok"
printf 'PUBLIC_BASE_URL=http://old.example\n' >"$stack/.env"
bin=$(new_mockbin "$HEALTH_OK" '{"hasUsers":true}')
out=$(PATH="$bin:$PATH" CS_STACK_DIR="$stack" CS_HEALTH_TIMEOUT=6 bash "$INSTALL" --fresh --courses /tmp \
  --public-url http://x.example --force 2>&1)
assert_eq "the old marker is gone" "0" "$(ls "$stack/.courseshelf" | grep -c 'install_step_1_ok')"
backup=$(find "$stack/.courseshelf/backups" -name '.env.*' 2>/dev/null | head -1)
assert "a backup of the old .env exists" "$([ -n "$backup" ] && echo 0 || echo 1)"
if [ -n "$backup" ]; then
  grep -q 'old.example' "$backup"
  assert "the backup holds the old content" $?
fi

it "a full install with mocked docker reaches step 8 and renders a valid .env"
stack=$(new_stack)
courses=$(mktemp -d "$TMP_ROOT/courses.XXXXXX")
courses=$(cd "$courses" && pwd)
bin=$(new_mockbin "$HEALTH_OK" '{"hasUsers":true}')
out=$(PATH="$bin:$PATH" CS_STACK_DIR="$stack" CS_HEALTH_TIMEOUT=6 bash "$INSTALL" \
  --public-url http://nas.local:8080 --courses "$courses" --force 2>&1)
rc=$?
assert_eq "install exits 0" "0" "$rc"
check=$(CS_STACK_DIR="$stack" bash "$INSTALL" --check)
assert_eq "all eight markers are set" "8" "$(printf '%s' "$check" | grep -c '\[OK\]')"
grep -q "COURSES_PATH=$courses" "$stack/.env"
assert ".env points at the courses directory that was passed in" $?
grep -qE '^BETTER_AUTH_SECRET=[0-9a-f]{64}$' "$stack/.env"
assert "a 32-byte hex secret was generated, not left as change-me" $?
grep -q "DERIVED_PATH=$stack/derived" "$stack/.env"
assert "DERIVED_PATH defaulted next to the stack" $?
assert "the derived directory was created" "$([ -d "$stack/derived" ] && echo 0 || echo 1)"

it "the ownership manifest records what was created and never the library"
manifest="$stack/.courseshelf/.courseshelf_owned"
assert "a manifest exists" "$([ -f "$manifest" ] && echo 0 || echo 1)"
grep -q "^dir:$stack/derived$" "$manifest"
assert "the derived directory it created is recorded" $?
grep -q "^file:$stack/.env$" "$manifest"
assert "the .env it wrote is recorded" $?
grep -qF "$courses" "$manifest"
assert "COURSES_PATH is NOT in the manifest" "$([ $? -ne 0 ] && echo 0 || echo 1)"
grep -q "^file:$stack/compose.yml$" "$manifest"
assert "a compose.yml it did not download is NOT recorded" "$([ $? -ne 0 ] && echo 0 || echo 1)"

it "secrets survive a resume instead of being regenerated"
before=$(grep '^BETTER_AUTH_SECRET=' "$stack/.env")
rm -f "$stack/.courseshelf/.install_step_5_ok" "$stack/.courseshelf/.install_step_6_ok" \
  "$stack/.courseshelf/.install_step_7_ok" "$stack/.courseshelf/.install_step_8_ok"
PATH="$bin:$PATH" CS_STACK_DIR="$stack" CS_HEALTH_TIMEOUT=6 bash "$INSTALL" --resume --force >/dev/null 2>&1
after=$(grep '^BETTER_AUTH_SECRET=' "$stack/.env")
assert_eq "the secret postgres already has is not rotated by a resume" "$before" "$after"

it "install refuses an unpublished architecture without --force"
stack=$(new_stack)
bin=$(new_mockbin "" "")
fake_uname="$bin/uname"
printf '#!/usr/bin/env bash\n[ "$1" = "-m" ] && echo aarch64 || /usr/bin/uname "$@"\n' >"$fake_uname"
chmod +x "$fake_uname"
out=$(PATH="$bin:$PATH" CS_STACK_DIR="$stack" CS_HEALTH_TIMEOUT=6 bash "$INSTALL" \
  --public-url http://x.example --courses /tmp 2>&1)
rc=$?
assert "it exits non-zero" "$([ "$rc" -ne 0 ] && echo 0 || echo 1)"
printf '%s' "$out" | grep -q 'linux/amd64 only'
assert "it says why, naming the published platform" $?

# ── verify-install ──────────────────────────────────────────────────────────

it "verify-install fails while the instance still has no account"
stack=$(new_stack)
printf 'PROXY_PORT=8080\nPUBLIC_BASE_URL=http://nas.local:8080\n' >"$stack/.env"
bin=$(new_mockbin "$HEALTH_OK" '{"hasUsers":false}')
out=$(PATH="$bin:$PATH" CS_STACK_DIR="$stack" bash "$VERIFY" 2>&1)
rc=$?
assert_eq "exit code is 1" "1" "$rc"
printf '%s' "$out" | grep -q 'http://nas.local:8080 and register'
assert "it tells the user where to go rather than only failing" $?

it "verify-install fails when the running version is not the one deployed"
bin=$(new_mockbin "$HEALTH_OK" '{"hasUsers":true}')
out=$(PATH="$bin:$PATH" CS_STACK_DIR="$stack" bash "$VERIFY" 1.8.0 2>&1)
rc=$?
assert_eq "a stale image is a failure, not a pass" "1" "$rc"
printf '%s' "$out" | grep -q 'reports 1.7.0, expected 1.8.0'
assert "it names both versions" $?

it "verify-install passes on a finished install"
out=$(PATH="$bin:$PATH" CS_STACK_DIR="$stack" bash "$VERIFY" 1.7.0 2>&1)
assert_eq "exit code is 0" "0" "$?"

# ── manage ──────────────────────────────────────────────────────────────────

it "uninstall refuses to guess when there is no manifest"
stack=$(new_stack)
bin=$(new_mockbin "" "")
out=$(PATH="$bin:$PATH" CS_STACK_DIR="$stack" bash "$MANAGE" uninstall --yes 2>&1)
rc=$?
assert "it exits non-zero" "$([ "$rc" -ne 0 ] && echo 0 || echo 1)"
printf '%s' "$out" | grep -q 'refusing to guess'
assert "it says it will not guess" $?

it "uninstall without --yes deletes nothing and names the library it will not touch"
stack=$(new_stack)
mkdir -p "$stack/.courseshelf" "$stack/derived"
printf 'COURSES_PATH=/srv/my-library\n' >"$stack/.env"
printf 'dir:%s/derived\n' "$stack" >"$stack/.courseshelf/.courseshelf_owned"
out=$(PATH="$bin:$PATH" CS_STACK_DIR="$stack" bash "$MANAGE" uninstall 2>&1)
assert "the directory is still there" "$([ -d "$stack/derived" ] && echo 0 || echo 1)"
printf '%s' "$out" | grep -q 'NOT touched: /srv/my-library'
assert "it names the library as out of scope" $?

# ── Result ──────────────────────────────────────────────────────────────────
printf '\n─────────────────────────\n%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
