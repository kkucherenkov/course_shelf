#!/usr/bin/env sh
# Registers the task-stack merge driver named by .gitattributes.
#
# A repository can declare *which* driver a path uses (.gitattributes, which is
# versioned) but not *what that driver runs* — that is local git config, by
# design, since it executes a command. So this runs from `pnpm prepare`,
# alongside husky, and is idempotent.
#
# Without it, git falls back to the default driver and the conflict comes back
# by hand; nothing breaks, it is just the old behaviour.
set -e
git rev-parse --git-dir >/dev/null 2>&1 || exit 0
git config merge.taskstack.name 'task stack (whole-entry union, honours deliberate removals)'
git config merge.taskstack.driver 'python3 scripts/merge-task-stack.py %O %A %B %P'
