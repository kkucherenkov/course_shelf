## T-2026-09-13-mobile-decrypt-flake — deterministic corrupt-block decrypt test

- Created: 2026-09-13
- Completed: 2026-09-13
- Result: https://github.com/kkucherenkov/course_shelf/pull/458
- Owner: claude
- Spec: none (tuxedo 37, no roadmap card)
- Goal: root-cause and fix the flaky `loopback_decrypt_server_test.dart` case
  ("a corrupt block mid-stream truncates the response instead of hanging")
  blocking the required `Flutter (analyze · test · goldens)` CI check.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Outcome: **test race, not a decrypt-path defect.** `ChunkedGcmWriter.create()`
  mints a fresh random per-file nonce every run, so the ciphertext byte the
  test forced to a fixed `0xFF` was effectively random per run — a 1-in-256
  no-op whenever it already happened to be `0xFF`, leaving the block's
  AES-GCM tag genuinely valid and decrypt genuinely, correctly succeeding.
  Cross-verified the crypto path is sound (verify-before-decrypt in
  `package:cryptography`'s pure-Dart `AesGcm`, socket teardown on truncated
  `Content-Length`, client-side premature-EOF detection in `dart:io`) and
  independently validated a reproduced failure's dumped tag against Python's
  OpenSSL-backed `AESGCM` — it legitimately validates.
- Fix: XOR the byte with `0xFF` instead of overwriting it, so the corruption
  write can never be a no-op. Assertion unchanged.
- Tests: reproduced the flake in-process at ~0.4% across 1500–5000 iterations
  (HTTP layer, direct reader, raw cipher call); 5000/5000 clean against the
  fix; 25/25 `flutter test` runs of the file; full suite 462/462; `flutter
analyze` clean.
- Sub-steps:
  - [x] read test + `LoopbackDecryptServer`/`ChunkedGcmReader`/`ChunkedGcmWriter`
  - [x] verify crypto/socket/client layers are correct (not the defect)
  - [x] reproduce the flake in-process, isolate to the corruption write
  - [x] cross-verify against OpenSSL (Python) that the tag genuinely validates
  - [x] fix the test (XOR-flip), prove with 5000 clean iterations + 25 `flutter test` runs
  - [x] PR
- Status: done
- Blockers: —
