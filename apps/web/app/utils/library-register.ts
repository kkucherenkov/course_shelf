/**
 * Shared rules for registering a library, used by every surface that POSTs
 * `RegisterLibraryRequest`: `pages/libraries.vue`, `pages/sign-up.vue` (step 3
 * of the first-run wizard) and `components/admin/AdminAddLibrarySheet.vue`.
 *
 * The backend enforces exactly two invariants on a registration — a non-empty
 * name and an **absolute** root path (`Library.register`). It never touches the
 * filesystem, so nothing here may claim the path was looked up.
 */

/**
 * Client-side mirror of `RegisterLibraryRequest.rootPath.pattern` in
 * `packages/specs/openapi/openapi.yaml` — **the spec is the source of truth**.
 * Change it there first, run `pnpm spec:validate && pnpm spec:bundle`, then copy
 * the pattern here (YAML `[^\x00]` is JS `[^\u0000]`; everything else is
 * literal). `library-register.spec.ts` asserts the two stay identical by
 * reading the pattern back out of `openapi.yaml`, so a drift fails the test.
 *
 * This guard exists to name the rule *before* the round trip, not to replace the
 * server's check: `express-openapi-validator` still rejects a bad path with a
 * 400 problem document, and that document is what the user is shown.
 *
 * The NUL in the character class is the spec's, not ours — dropping it to
 * appease `no-control-regex` would let the client wave through a path the
 * server rejects, which is the class of surprise this module exists to close.
 */
// eslint-disable-next-line no-control-regex -- deliberate: see above.
export const ROOT_PATH_PATTERN = /^(?:\/|[A-Za-z]:\\)[^\u0000]*$/;

/**
 * `String.trim()` strips ECMA-262 whitespace only, so a path pasted out of a
 * wrapped terminal line or a web page keeps its zero-width characters and BOM
 * and then fails the leading-`/` anchor for a reason nobody can see on screen.
 * Strip those at the edges as well — there they are paste noise, never part of a
 * path anyone meant to type.
 *
 * Interior ones are deliberately left alone: the spec allows every byte but NUL,
 * and rewriting the middle of a path would silently register a different
 * directory than the one the form is showing.
 */
const EDGE_NOISE = /^[\s\u200B-\u200D\u2060\uFEFF]+|[\s\u200B-\u200D\u2060\uFEFF]+$/g;

/** Trims a pasted path, invisible characters included. */
export function normalizeRootPath(raw: string): string {
  return raw.replaceAll(EDGE_NOISE, '');
}

/** Whether `path` satisfies the spec's absolute-path rule. */
export function isAbsoluteRootPath(path: string): boolean {
  return ROOT_PATH_PATTERN.test(path);
}

/**
 * The server's own explanation for a failed request, or `null` when it did not
 * send one (a network-level failure). RFC 9457 `detail` is the field that names
 * the offending value; `title` is the coarse fallback.
 */
export function problemDetail(raw: unknown): string | null {
  if (raw === null || typeof raw !== 'object') return null;
  const p = raw as { detail?: string | null; title?: string | null };
  return p.detail ?? p.title ?? null;
}
