## T-2026-09-16-player-chrome — player chrome controls: dead settings, fullscreen, overlay, settings button

- Created: 2026-09-16
- Owner: claude
- Goal: wire the five dead settings controls into the lesson player, fix
  fullscreen (targets `<video>` instead of the chrome root, so controls vanish),
  make the overlay auto-hide on idle, and give the settings gear a handler.
- Issues: #565 (dead settings), #566 (fullscreen strips controls), #567
  (overlay never hides), #574 (settings button has no handler). Plus two
  "Отдельно" defects: disabled state in `error` doesn't cover mute/speed/
  subtitles/fullscreen/pip, and the CC button stays enabled with zero tracks.
- Sub-steps:
  - [x] #565: `useLessonPlayer.attach` seeds initial speed from
        `prefs.defaultSpeed`; `[lessonId].vue` gates `startCountdown()` on
        `prefs.autoplayNext`; unify the two speed ladders into one exported
        const; wire `completionThreshold` into `PlayerSectionsTab.vue` via a
        small pure helper in `preferences.ts`; drop the non-functional `cozy`
        density tier (comfortable/compact only) and fix the help copy
  - [x] #566: `AppPlayerChrome` exposes its root element; the page attaches it
        to `useLessonPlayer`; fullscreen is requested on that root, not the
        `<video>`
  - [x] #567: idle-hide the overlay while playing (timer), restore on
        pointermove/focusin/pause, never hide while `:focus-within`, respect
        `prefers-reduced-motion`
  - [x] #574: wire the settings gear to a keyboard-shortcuts dialog
        (`AppDialog`, existing keymap, translated lines from the page)
  - [x] extra: disable mute/speed/subtitles/fullscreen/pip when `isInert`
  - [x] extra: disable the CC button when the lesson has zero subtitle tracks
  - [x] tests for every fix above (failing before, green after); i18n keys in
        both locales; gates (lint/stylelint/format, turbo lint/test/typecheck)
- Notes: `completionThreshold` is wired only into `PlayerSectionsTab.vue`
  (this lane's file) — `CourseSectionsList.vue` (edit-guard's) renders the
  same outline data unthreshold-ed; parity there is that lane's call, not
  filed as a defect here since it renders server-truth correctly today. The
  `density` tier was reduced to comfortable/compact (not removed outright):
  `compact` already had a real, working consumer in `AppInput`/`AppSelect`,
  only `cozy` was the dead duplicate.
- Status: done
- Completed: 2026-09-16
- Result: https://github.com/kkucherenkov/course_shelf/pull/585
