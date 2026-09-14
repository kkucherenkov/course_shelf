/**
 * WHY this file exists:
 * whisper.cpp's `-l auto` run logs `auto-detected language: <tag> (p = ...)` —
 * `LocalWhisperAdapter` parses that line and hands the raw tag here. This is
 * the single place that decides whether to trust it (#501).
 *
 * Constrained to `en`/`ru`: those are the only two languages this library's
 * courses are actually in, and a short or noisy clip can misdetect Russian as
 * Ukrainian or Bulgarian among whisper's ninety-nine languages — a wrong tag
 * from a rare misdetection is worse than falling back to the deployment's own
 * default.
 *
 * Pure function, no I/O.
 */

const SUPPORTED_LANGUAGES: ReadonlySet<string> = new Set(['en', 'ru']);

/**
 * `detected` is whisper's raw, case-insensitive tag (or undefined — no
 * detection line, or an explicit language that never needed one). `fallback`
 * is what to use when `detected` is absent or not one of the two supported
 * languages.
 */
export function resolveDetectedLanguage(detected: string | undefined, fallback: string): string {
  const normalised = detected?.trim().toLowerCase();
  return normalised !== undefined && SUPPORTED_LANGUAGES.has(normalised) ? normalised : fallback;
}
