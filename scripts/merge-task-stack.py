#!/usr/bin/env python3
"""git merge driver for specs/tasks/{active,done}.md.

Both files are append-at-the-top stacks of `## T-<date>-<slug>` entries, so
every parallel lane writes at line ~3 and every lane after the first conflicts
there. Resolving that by hand is mechanical and was done eighteen times in a
single day of parallel waves.

Line-level union is the wrong tool: it interleaves two entries into nonsense.
This driver works on whole entries instead, and because a merge driver is given
the ancestor it can tell the two cases apart that a post-hoc marker resolver
cannot:

  - an entry that is new on one side          → keep it
  - an entry the other side deliberately      → drop it, do not resurrect
    REMOVED (moved from active.md to done.md)

That second case is the one the working agreement calls out: a blind union
resurrects a finished task and the same entry then sits in both files.

Exits 0 when it resolved everything, 1 when it left conflict markers for a
human — which happens only when both sides edited the same entry's body
differently, the one case where guessing would lose work.

Registered by .gitattributes; the driver command itself is set up by
`scripts/setup-merge-driver.sh`, which `pnpm prepare` runs.

Usage (git calls it this way): merge-task-stack.py %O %A %B %P
"""

import pathlib
import re
import sys

ENTRY = re.compile(r"^## (T-[0-9a-z][0-9a-z-]*)(?=[ \t]|$)", re.M)


def split(text):
    """-> (header, [(id, body)]) where body includes the `## ` heading line."""
    starts = [m.start() for m in ENTRY.finditer(text)]
    if not starts:
        return text, []
    header = text[: starts[0]]
    entries = []
    for i, start in enumerate(starts):
        end = starts[i + 1] if i + 1 < len(starts) else len(text)
        chunk = text[start:end]
        entries.append((ENTRY.match(chunk).group(1), chunk))
    return header, entries


def main(base_path, ours_path, theirs_path, display_path="specs/tasks/*.md"):
    base_h, base_e = split(pathlib.Path(base_path).read_text())
    ours_h, ours_e = split(pathlib.Path(ours_path).read_text())
    _, theirs_e = split(pathlib.Path(theirs_path).read_text())

    base = dict(base_e)
    ours = dict(ours_e)
    theirs = dict(theirs_e)

    # Deliberate removals: present in the ancestor, gone on one side. The
    # usual cause is a lane moving its entry from active.md into done.md.
    removed = {i for i in base if i not in ours} | {i for i in base if i not in theirs}

    conflicts = []
    merged = []

    def body(entry_id):
        """Pick the side that changed the entry; flag it if both did, differently."""
        o, t, b = ours.get(entry_id), theirs.get(entry_id), base.get(entry_id)
        if o is not None and t is not None and o != t:
            if b is not None and o != b and t != b:
                conflicts.append(entry_id)
                return (
                    f"<<<<<<< ours\n{o.rstrip()}\n"
                    f"=======\n{t.rstrip()}\n"
                    f">>>>>>> theirs\n\n"
                )
            return o if b is not None and o != b else t
        return o if o is not None else t

    # Newest first: entries new on either side go above what the ancestor had.
    # Ours before theirs is arbitrary but deterministic, which is what matters
    # for a driver two people run on two machines.
    for entry_id, _ in ours_e:
        if entry_id not in base:
            merged.append(body(entry_id))
    for entry_id, _ in theirs_e:
        if entry_id not in base and entry_id not in ours:
            merged.append(body(entry_id))
    for entry_id, _ in base_e:
        if entry_id not in removed:
            merged.append(body(entry_id))

    # Exactly one blank line between entries and before the first heading.
    # Markdown wants it and `pnpm format:check` enforces it; a driver that
    # produced a correct merge and a red pipeline would be no better than
    # resolving by hand.
    header = (ours_h or base_h).rstrip("\n")
    parts = [header] + [chunk.strip("\n") for chunk in merged]
    out = "\n\n".join(p for p in parts if p) + "\n"

    pathlib.Path(ours_path).write_text(out)

    kept = len(merged)
    if conflicts:
        print(
            f"{display_path}: {kept} entries merged, "
            f"{len(conflicts)} need a human: {', '.join(conflicts)}",
            file=sys.stderr,
        )
        return 1

    dropped = f", {len(removed)} already moved to done.md" if removed else ""
    print(f"{display_path}: merged {kept} entries{dropped}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:5]))
