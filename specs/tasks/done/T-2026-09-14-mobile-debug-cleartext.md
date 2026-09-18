## T-2026-09-14-mobile-debug-cleartext — plain HTTP for debug and profile builds

- Created: 2026-09-14
- Completed: 2026-09-14
- Result: https://github.com/kkucherenkov/course_shelf/pull/466
- Owner: claude
- Spec: none — unblocks testing a build against the self-hosted NAS instance
- Goal: let a debug or profile APK reach a self-hosted instance over plain
  HTTP, without committing a personal LAN address to the repository.
- Result summary: new `network_security_config.xml` under `src/debug` and
  `src/profile` permitting cleartext for the whole variant; resource merging
  makes them override the strict `src/main` config, which keeps denying
  cleartext to everything but 127.0.0.1 in a release APK. `domain-config`
  matches hosts, not CIDR ranges, so a per-variant allowance is the only way
  to express "any address on my LAN" without hard-coding one.
- Sub-steps:
  - [x] debug + profile variant configs
  - [x] build command documented in `apps/mobile/README.md`
  - [x] CI parses Android resource XML in the analyze job
- Notes: the first push failed the emulator job with
  `The string "--" is not permitted within comments` — a `--dart-define`
  example pasted into the XML comment. XML forbids a double hyphen inside a
  comment and every Flutter flag opens with one, so the command lives in the
  README instead. Android resource XML is otherwise parsed only by
  `:app:parseDebugLocalResources`, deep inside the 27-minute emulator job;
  the new analyze-job step catches the same class in seconds.
