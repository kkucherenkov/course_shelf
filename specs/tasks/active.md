# Active tasks

## T-2026-09-16-course-covers

Closes #569. One course showing four different covers: `cover-map.ts`'s
`initials()` (length-based word filter) and `search.vue`'s inline duplicate
(first-two-raw-words) disagree on ~30/68 real courses, and search always
paints the flat `--brand-accent` while the catalog hashes per-course from
`COVER`. Also detokenizing two private hex palettes (`cover-map.ts`'s
`COVER`, and `AVATAR_PALETTES` duplicated in `AdminUserRow.vue` +
`admin/permissions/[userId].vue`) per DESIGN.md's no-private-hex rule —
`coral` (`#D26B5C`) has no token at all today. Issue `#267` / tuxedo 24 is
the same ask, resolved onto this PR.

- [x] One `initials()` in `@app/ui`, stopword/punctuation-filtered, single-word
      fallback — used by `CourseCard` and `search.vue` alike.
- [x] Search course/lesson thumbs get the same per-course `COVER[accentFromId]`
      colour as the catalog, not a flat accent.
- [x] `COVER` hexes + `AVATAR_PALETTES` hexes moved into
      `docs/design/shared/tokens.json` (`media.cover*`, new `avatar.*` group),
      darkened where needed so `--media-fg-secondary`/`--media-fg` clears
      4.5:1 on every swatch.
- [x] `pnpm design:build` regenerated; tests updated/added; gates green.
