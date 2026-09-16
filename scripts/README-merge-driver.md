# Task-stack merge driver

`specs/tasks/active.md` and `done.md` are append-at-the-top stacks. Every
parallel lane writes at line ~3, so every lane after the first conflicts there.
One day of parallel waves produced **eighteen** of these by hand, each resolved
identically.

## Why not a line-level union

`merge=union` concatenates conflicting _lines_, which interleaves two entries
into nonsense — a heading from one lane above a body from another.

This driver merges whole `## T-<date>-<slug>` entries. Because git hands a
merge driver the ancestor, it can also tell apart the two cases a post-hoc
resolver cannot:

| case                                                   | result                   |
| ------------------------------------------------------ | ------------------------ |
| entry is new on one side                               | keep it, newest first    |
| entry was **removed** on one side (moved to `done.md`) | drop it                  |
| both sides changed the same entry's body               | conflict markers, exit 1 |

That middle row is the failure the working agreement documents: a blind union
resurrects a finished task, and the same entry then sits in both files.

## Setup

`.gitattributes` names the driver; the command it runs is per-clone git config,
which a repository cannot ship — by design, since it executes a command.
`pnpm prepare` runs `scripts/setup-merge-driver.sh`, which sets it, and the
script is idempotent.

Without that config git falls back to the default driver: the conflict returns
and you resolve it by hand. Nothing breaks.

## When it exits 1

Both sides edited one entry's body differently. That is the single case where
picking a side would lose work, so it writes markers and stops.
