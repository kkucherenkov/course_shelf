# Active tasks

## T-2026-08-30-001 — mobile hygiene: fvm pin, dead cached-catalog dao, storage caption fix

- Created: 2026-08-30
- Owner: claude (flutter-engineer, lane L7)
- Spec: —
- Goal: three independent hygiene fixes in apps/mobile — pin local Flutter to CI's 3.44.4 via fvm (#281), remove the unused CachedCatalogDao (#277), fix storage_bar.dart's misleading "of {total} free" caption by renaming to {free} and dropping the dead deviceTotalBytes field (#305).
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] fvm use 3.44.4, commit .fvmrc, confirm `dart format` under 3.44.4 doesn't rewrite unrelated files
  - [x] grep CachedCatalogDao / cached_courses / cached_lessons for a live writer — found one: `CourseDetailRepositoryImpl` is wired to it in `injector.dart:110` and writes/reads through it on outline fetch. #277's premise is stale (it's true only for `downloaded_lessons`' own denormalised columns). NOT deleting; fixed the stale comment in `downloaded_lessons.dart` that claimed "no callers"; flagged to maintainer instead of closing the issue.
  - [x] storage_bar.dart: {total} → {free} placeholder in en/ru intl ("{used} used, {free} free"), dropped StorageSnapshot.deviceTotalBytes end to end — hasDeviceTotals → hasDeviceFree, otherUsedBytes() gone, DeviceStorage.read() now returns a plain `int?`, DiskSpaceDeviceStorage stops calling getTotalDiskSpace, the bar collapses to a two-segment (app/free) proportional track, legendOther dropped from both locales
  - [x] flutter analyze && flutter test green (460 tests); pnpm check:i18n green; found dart-format drift under 3.44.4 in one untouched file (`test/features/downloads/downloads_repository_impl_test.dart`) — did not mass-reformat, scoped `dart format` to only the files this task touched, flagged the drift to the maintainer
- Status: PR open, awaiting review — see PR description for #281/#277/#305 disposition (#277 not closed, see sub-step above)
- Blockers: —
