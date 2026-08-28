# Active tasks

## T-2026-08-28-001 — fix three critical audit findings (auth recovery, offline playback, realtime grant)

- Created: 2026-08-28
- Owner: claude
- Spec: audit of 2026-08-28 (dnote `course_shelf` #5–#11); tuxedo +course_shelf #1, #2, #6
- Goal: three shipped-but-non-functional surfaces start doing what they claim.
- Spec diff: none — `/api/v1/auth/*` is a Better Auth catch-all deliberately
  absent from `openapi.yaml`, and the Centrifugo change only _removes_ a grant.
- Codegen impact: no
- Sub-steps:
  - [x] backend: drop the `notifications:user:{userId}` grant — no such channel
        in `asyncapi/centrifugo.yaml`, no publisher; push goes through FCM
  - [x] backend: pin the class of bug with a test that reads `centrifugo.yaml`
        and fails on any granted channel the spec does not declare
  - [x] backend: register `emailOTP({ overrideDefaultEmailVerification: true })` + `requireEmailVerification` / `sendOnSignUp` off `AUTH_EMAIL_VERIFICATION`
  - [x] web: replace the `forgotPassword` / `resetPassword` / `verifyEmail`
        stubs (all three resolved `{ ok: true }` without a request) with the
        real Better Auth calls; add `resendVerificationCode`
  - [x] web: rewrite the forgot-password e2e, which was written against the stub
  - [x] mobile: serve a `ready` download through `LoopbackDecryptServer`
        instead of handing `video_player` raw AES-GCM ciphertext
  - [x] mobile: plaintext-length integrity check before playing offline, with
        a fallback that re-marks the row `failed`
  - [x] review follow-ups: Android loopback cleartext allowance, `disableSignUp`
        on the OTP plugin, idempotent `LoopbackDecryptServer.start()`,
        code-based (translated) auth error messages
- Status: in-progress (PR https://github.com/kkucherenkov/course_shelf/pull/187)
- Blockers: —
- Review findings addressed (`/code-review high`):
  - **HIGH** Android had no cleartext allowance for `127.0.0.1`, so every
    offline play would have thrown `CLEARTEXT communication ... not permitted`
    (targetSdk ≥ 28 defaults to `cleartextTrafficPermitted="false"` for all
    hosts). Added a loopback-scoped `network_security_config.xml`; iOS already
    had `NSAllowsLocalNetworking`.
  - **MEDIUM (security)** `emailOTP()` registers public routes as soon as it
    exists, and `POST /sign-in/email-otp` _creates_ a user with
    `emailVerified: true` when none matches — bypassing the wizard, the
    password policy and `requireEmailVerification`, and taking ADMIN from the
    first-user hook on a fresh instance. Closed with `disableSignUp: true`,
    pinned by a test.
  - **LOW** `LoopbackDecryptServer.start()` was check-then-act; two overlapping
    lesson opens bound two sockets and orphaned the first. Memoised the bind
    future (cleared on failure and on `stop()`), with a concurrency test.
  - **LOW** Raw Better Auth English messages were rendered to users. Now mapped
    from `result.code` to translated keys (en + ru), matching `onAccountSubmit`.
- Notes:
  - Backend 1549 ✅ / web 183 ✅ / mobile 376 ✅ / e2e 28 ✅. The two failing e2e
    specs (`smoke`, `csp`) need the backend on :3000 — the Docker stack is down
    on this machine, and both failures predate this work.
  - Local Flutter was 3.41.9 against a `>=3.44.0` pubspec; upgraded to 3.47.2
    to run the mobile suite at all.
