/**
 * WHY this file exists:
 * Parses folder and file names in the conventional library tree layout. Three
 * priority tiers are tried in order; the first match wins:
 *
 *   1. Numeric prefix:        `01 - Title` / `01. Title`         (Udemy-style)
 *   2. Word-prefixed numeric: `Модуль 2 - Title` / `Глава 2. Title`
 *      (Russian / "Module N – …" exports — the leading word is dropped, the
 *      numeric ordinal is preserved.)
 *   3. Composite lesson:      `2.5 Title` / `2.6` (no title)
 *      (For lesson files only — the dotted pair is read as
 *      `(sectionOrdinal, ordinal)`. When no title follows, the label falls
 *      back to the original basename so the file remains identifiable.)
 *   4. Bare title:            anything that did not match above.
 *
 * Returns `unsupportedExtension: true` for lesson files whose extension is
 * not in `SUPPORTED_EXTENSIONS`. Callers record a ScanError and skip; nothing
 * throws here.
 */

/** Result of parsing a folder name. */
export interface ParsedFolderName {
  readonly ordinal?: number;
  readonly label: string;
}

/** Result of parsing a lesson file name. */
export interface ParsedLessonFileName {
  readonly ordinal?: number;
  readonly label: string;
  readonly extension: string;
  /** Set when the basename matched the `N.M …` composite pattern. */
  readonly sectionOrdinal?: number;
  /** Populated when the extension is not in SUPPORTED_EXTENSIONS. */
  readonly unsupportedExtension?: true;
}

/** Extensions recognised as lesson video files. Lower-case only. */
const SUPPORTED_EXTENSIONS = new Set(['.mp4', '.m4v', '.mkv', '.webm']);

/**
 * Tier 1 — `01 - Title` / `01. Title` prefix. The ordinal is at the very
 * start of the string.
 */
const PREFIX_RE = /^(\d+)\s*[-.]\s*(.+)$/;

/**
 * Tier 2 — leading word(s) before the ordinal. The leading word is dropped;
 * the ordinal and the post-separator label are kept.
 *   "Модуль 2 - Настройки окружения" → ordinal=2, label="Настройки окружения"
 *   "Глава 2. Продвинутые техники"   → ordinal=2, label="Продвинутые техники"
 *   "Module 1 - Setup"               → ordinal=1, label="Setup"
 *
 * `\p{L}+` (with the `u` flag) matches any Unicode letter, so Russian / Greek
 * / Latin words all qualify. Without an explicit anchor for digits inside the
 * word, this safely declines to match Tier-1 inputs (`01 - Foo`).
 */
const WORD_PREFIXED_RE = /^(\p{L}+(?:\s+\p{L}+)*)\s+(\d+)\s*[-.]\s*(.+)$/u;

/**
 * Tier 3 — composite `N.M` lesson pattern. Used for *file* names only, not
 * folder names (folders never carry composite ordinals in any layout we have
 * seen). The optional title group lets `2.6.mp4` (no title) survive — the
 * caller falls back to the bare basename.
 */
const COMPOSITE_LESSON_RE = /^(\d+)\.(\d+)(?:\s+(.+))?$/;

function applyPrefix(match: RegExpExecArray): { ordinal: number; label: string } {
  return {
    ordinal: Number.parseInt(match[1] ?? '', 10),
    label: (match[2] ?? '').trim(),
  };
}

/** Parse a directory name and return an optional numeric ordinal + label. */
export function parseFolderName(name: string): ParsedFolderName {
  const trimmed = name.trim();

  const direct = PREFIX_RE.exec(trimmed);
  if (direct) return applyPrefix(direct);

  const word = WORD_PREFIXED_RE.exec(trimmed);
  if (word) {
    return {
      ordinal: Number.parseInt(word[2] ?? '', 10),
      label: (word[3] ?? '').trim(),
    };
  }

  return { label: trimmed };
}

/**
 * Parse a lesson file name. Tries composite (`N.M …`) first, then numeric
 * prefix (`NN -`/`NN.`), then bare. Strips and reports the extension; sets
 * `unsupportedExtension: true` when it is not in SUPPORTED_EXTENSIONS.
 */
export function parseLessonFileName(name: string): ParsedLessonFileName {
  const trimmed = name.trim();

  const lastDot = trimmed.lastIndexOf('.');
  if (lastDot === -1) {
    return { label: trimmed, extension: '', unsupportedExtension: true };
  }

  const extension = trimmed.slice(lastDot).toLowerCase();
  const fileBasename = trimmed.slice(0, lastDot);
  const supported = SUPPORTED_EXTENSIONS.has(extension);

  // Tier 3 — composite first so `2.5 Установка на Windows` does not get
  // mis-parsed by Tier 1 as `ordinal=2, label="5 Установка на Windows"`.
  const composite = COMPOSITE_LESSON_RE.exec(fileBasename);
  if (composite) {
    const sectionOrdinal = Number.parseInt(composite[1] ?? '', 10);
    const ordinal = Number.parseInt(composite[2] ?? '', 10);
    const inlineTitle = (composite[3] ?? '').trim();
    const label = inlineTitle === '' ? fileBasename : inlineTitle;
    if (supported) {
      return { sectionOrdinal, ordinal, label, extension };
    }
    return { sectionOrdinal, ordinal, label, extension, unsupportedExtension: true };
  }

  // Tier 1 — numeric prefix.
  const prefixed = PREFIX_RE.exec(fileBasename);
  if (prefixed) {
    if (supported) return { ...applyPrefix(prefixed), extension };
    return { ...applyPrefix(prefixed), extension, unsupportedExtension: true };
  }

  // Tier 4 — bare title.
  if (supported) return { label: fileBasename.trim(), extension };
  return { label: fileBasename.trim(), extension, unsupportedExtension: true };
}
