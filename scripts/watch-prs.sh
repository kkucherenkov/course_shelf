#!/usr/bin/env sh
# Wait for pull requests to finish CI, printing one line each as it settles.
#
#   scripts/watch-prs.sh 649 650 651
#
# Exits 0 once every listed PR has settled or merged, 1 if any settled red.
# Prints nothing while checks run, so it is quiet enough to leave in the
# background and noisy exactly when something changed.
#
# Why a script rather than the same loop typed again: one day of parallel
# waves needed this fifteen times, and each retyping is a chance to reproduce
# one of the three traps below.
#
# Trap 1 — arguments, not a variable. This runs under whatever shell the
# caller has, and zsh does not word-split unquoted parameters: `for n in
# $LIST` iterates once with the whole string, then every lookup silently
# misses. Taking PR numbers as real arguments removes the shape entirely.
#
# Trap 2 — `gh` reports a pending check's conclusion as "", not null, so
# jq's `//` never substitutes and "is it still running?" quietly answers no.
# This gates on `.state` against the three running values instead.
#
# Trap 3 — a PR can sit with no checks at all, forever. A push made by
# github-actions[bot] with GITHUB_TOKEN does not trigger workflows, by
# design, so a branch whose last commit came from a workflow (regenerated
# snapshots, for one) shows the run from before it. That looks exactly like
# a slow queue. This says so instead of waiting.
set -u

[ "$#" -gt 0 ] || { echo "usage: $0 <pr-number>..." >&2; exit 2; }

interval="${WATCH_INTERVAL:-40}"
remaining="$*"
failed=0

# One counter per PR, not one shared: a single quiet PR must not make the
# script say the same about the others. Files keep it per-PR without needing
# associative arrays, which POSIX sh does not have.
quiet_dir=$(mktemp -d)
trap 'rm -rf "$quiet_dir"' EXIT INT TERM

while [ -n "$remaining" ]; do
  still=""

  for n in $remaining; do
    state=$(gh pr view "$n" --json state --jq .state 2>/dev/null || echo "")

    if [ "$state" = "MERGED" ] || [ "$state" = "CLOSED" ]; then
      printf 'PR%s %s\n' "$n" "$(echo "$state" | tr '[:upper:]' '[:lower:]')"
      continue
    fi

    checks=$(gh pr checks "$n" --json name,state 2>/dev/null || echo '[]')

    if [ "$(echo "$checks" | jq 'length')" = "0" ]; then
      quiet=$(cat "$quiet_dir/$n" 2>/dev/null || echo 0)
      quiet=$((quiet + 1))
      echo "$quiet" > "$quiet_dir/$n"
      # Three rounds with no check at all is not a slow queue (trap 3).
      if [ "$quiet" -ge 3 ]; then
        printf 'PR%s no checks on the head commit — a workflow push does not trigger CI; push or update the branch\n' "$n"
        continue
      fi
      still="$still $n"
      continue
    fi
    rm -f "$quiet_dir/$n"

    pending=$(echo "$checks" | jq '[.[] | select(.state == "PENDING" or .state == "QUEUED" or .state == "IN_PROGRESS")] | length')
    if [ "$pending" != "0" ]; then
      still="$still $n"
      continue
    fi

    bad=$(echo "$checks" | jq -r '[.[] | select(.state != "SUCCESS" and .state != "SKIPPED") | "\(.name)=\(.state)"] | join(", ")')
    if [ -n "$bad" ]; then
      printf 'PR%s RED: %s\n' "$n" "$bad"
      failed=1
    else
      printf 'PR%s green\n' "$n"
    fi
  done

  remaining=$(echo "$still" | sed 's/^ *//')
  [ -n "$remaining" ] || break
  sleep "$interval"
done

exit "$failed"
