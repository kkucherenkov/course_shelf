# Active tasks

## T-2026-07-18-004 — Persist + honor device prefs & recents

- **Status:** in progress
- **Branch:** `feat/mobile-persist-honor-prefs`
- **Spec:** `docs/superpowers/specs/2026-07-18-persist-honor-device-prefs-design.md`
- **Plan:** `docs/superpowers/plans/2026-07-18-persist-honor-device-prefs.md`

Persist Settings device prefs + Search recents via `shared_preferences`, and
honor theme / text size / reduce-motion / playback speed / autoplay-next
app-wide. `subtitles` + `wifiOnlyDownloads` stay persisted-but-inert (no
consumer yet / E19).

- [ ] Task 1 — `shared_preferences` stores
- [ ] Task 2 — persist `SettingsCubit`
- [ ] Task 3 — persist `SearchCubit` recents
- [ ] Task 4 — DI bootstrap + honor chrome prefs app-wide
- [ ] Task 5 — player saved-speed + autoplay-next
- [ ] Task 6 — full-suite gate + archive

_Remaining follow-up (not carded): per-lesson download state + tap-to-enqueue
once **E19** `DownloadsBloc` lands (#101)._
