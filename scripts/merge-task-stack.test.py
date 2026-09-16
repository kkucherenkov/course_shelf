#!/usr/bin/env python3
"""Checks for the task-stack merge driver. Run: python3 scripts/merge-task-stack.test.py"""

import pathlib
import subprocess
import sys
import tempfile

DRIVER = pathlib.Path(__file__).with_name("merge-task-stack.py")


def run(base, ours, theirs):
    d = pathlib.Path(tempfile.mkdtemp())
    (d / "b").write_text(base)
    (d / "o").write_text(ours)
    (d / "t").write_text(theirs)
    p = subprocess.run(
        [sys.executable, str(DRIVER), str(d / "b"), str(d / "o"), str(d / "t"), "x.md"],
        capture_output=True,
        text=True,
    )
    return p.returncode, (d / "o").read_text()


H = "# Active tasks\n\n"
FAILURES = []


def check(name, cond):
    print(("ok   " if cond else "FAIL ") + name)
    if not cond:
        FAILURES.append(name)


# An entry whose heading carries no title at all. Lanes write these, and an
# earlier regex required a space after the id — so these entries were invisible
# to the driver and silently dropped. That is the exact loss this driver exists
# to prevent, and it reached main before a real conflict caught it.
code, out = run(
    H + "## T-2026-01-01-base\n\n- a\n",
    H + "## T-2026-01-01-ours\n\n- b\n\n## T-2026-01-01-base\n\n- a\n",
    H + "## T-2026-01-01-theirs\n\n- c\n\n## T-2026-01-01-base\n\n- a\n",
)
check("untitled headings survive", out.count("## T-") == 3 and code == 0)
check("untitled: ours kept", "T-2026-01-01-ours" in out)
check("untitled: theirs kept", "T-2026-01-01-theirs" in out)

# An entry the other side moved to done.md must not come back.
code, out = run(
    H + "## T-2026-01-01-alpha — a\n\n- x\n\n## T-2026-01-01-beta — b\n\n- y\n",
    H + "## T-2026-01-01-new — n\n\n- z\n\n## T-2026-01-01-alpha — a\n\n- x\n\n## T-2026-01-01-beta — b\n\n- y\n",
    H + "## T-2026-01-01-beta — b\n\n- y\n",
)
check("deliberate removal is not resurrected", "T-2026-01-01-alpha" not in out and code == 0)
check("removal: new entry kept", "T-2026-01-01-new" in out)

# Both sides editing one body differently is the one case worth a human.
code, out = run(
    H + "## T-2026-01-01-a — t\n\n- base\n",
    H + "## T-2026-01-01-a — t\n\n- ours\n",
    H + "## T-2026-01-01-a — t\n\n- theirs\n",
)
check("real conflict exits 1", code == 1)
check("real conflict writes markers", "<<<<<<<" in out and ">>>>>>>" in out)

# Blank line before every heading, or `pnpm format:check` goes red.
code, out = run(H + "## T-2026-01-01-a — t\n\n- x\n", H + "## T-2026-01-01-b — u\n\n- y\n\n## T-2026-01-01-a — t\n\n- x\n", H + "## T-2026-01-01-a — t\n\n- x\n")
check("no heading glued to a previous line", "\n## " in out and "x\n## " not in out)

print()
if FAILURES:
    print(f"{len(FAILURES)} failed: {', '.join(FAILURES)}")
    sys.exit(1)
print("all checks passed")
