/**
 * WHY this file exists:
 * Parses folder and file names in the conventional library tree layout.
 * Priority tiers are tried in order; the first match wins:
 *
 *   1. Numeric prefix:        `01 - Title` / `01. Title` / `01_Title` /
 *                             `01 Title` / `07`                   (Udemy-style
 *                             plus Russian / Skillbox / Stepik conventions
 *                             where the separator is a space, underscore, or
 *                             absent altogether).
 *   2. Word-prefixed numeric: `Модуль 2 - Title` / `Глава 2. Title` /
 *                             `Module 1 Setup` (separator may be absent).
 *      (Russian / "Module N – …" exports — the leading word is dropped, the
 *      numeric ordinal is preserved.)
 *   3. Composite lesson:      `2.5 Title` / `2.6` (no title)
 *      (For lesson files only — the dotted pair is read as
 *      `(sectionOrdinal, ordinal)`. When no title follows, the label falls
 *      back to the original basename so the file remains identifiable.)
 *   4. Trailing digits:       `lesson23` / `Занятие5` (lesson files only)
 *      (No separator between the word and the digits, so there is nothing to
 *      split into a label — the label stays the full basename, same as tier
 *      6. Recovers a stable numeric order for this convention instead of
 *      falling back to alphabetical (`lesson1, lesson10, lesson11, …,
 *      lesson2`) — see E32-F01-S01 / lesson-loss-report.md.)
 *   5. Marker-introduced:     `Лекция #9. Этология` / `Lecture №12`
 *      (Tiers 1–4 all require the ordinal at the very start or the very end
 *      of the name; a title that carries it in the middle, flagged by `#` or
 *      `№`, matches none of them. #499: measured on the maintainer's library
 *      — 46 video files across three courses, one a 25-lecture series that
 *      read 9, 19, 23, 15, 21, … before this tier existed. The label is left
 *      as the full basename rather than splicing the marker out — unlike
 *      tiers 1/2's leading prefix, there is no single safe cut point in the
 *      middle of a sentence.)
 *   6. Bare title:            anything that did not match above.
 *
 * When a numeric prefix matches but no descriptive label follows (e.g. a folder
 * literally named `07` or a file like `07.mp4`), the label falls back to the
 * trimmed basename so we never produce an empty string — section/lesson titles
 * downstream are required to be non-empty.
 *
 * A lesson file whose whole basename is a calendar date (`2022-11-12.mp4`) is
 * exempted from Tier 1: PREFIX_RE would otherwise read the year as the
 * ordinal and split off `MM-DD` as the label (#498). The date has no
 * meaningful ordinal to extract, so it is kept intact as the label instead —
 * `lesson-position.ts` already falls back to sorting by path, which orders an
 * ISO date correctly on its own.
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
const SUPPORTED_EXTENSIONS = new Set(['.mp4', '.m4v', '.mkv', '.webm', '.wmv']);

/**
 * Tier 1 — leading numeric prefix. Separator after the digits is any non-empty
 * mix of whitespace, `-`, `.`, `_` — or absent entirely (bare numeric).
 *   `01 - Title` / `01-Title` / `01.Title` / `01_Title` / `01 Title` → ordinal+label
 *   `07`                                                              → ordinal=7,
 *                                                                       label falls back
 *                                                                       to the trimmed
 *                                                                       input so the
 *                                                                       title is never
 *                                                                       empty.
 */
const PREFIX_RE = /^(\d+)(?:[\s\-._]+(.+))?$/;

/**
 * Tier 2 — leading word(s) before the ordinal. The leading word is dropped;
 * the ordinal is preserved. Separator between the ordinal and the post-label
 * is the same flexible set as Tier 1, so `Module 1 Setup` (no separator
 * character) also matches. When the ordinal is bare (`Часть 1`), the label
 * falls back to the trimmed input so it stays unique across siblings.
 *   "Модуль 2 - Настройки окружения" → ordinal=2, label="Настройки окружения"
 *   "Глава 2. Продвинутые техники"   → ordinal=2, label="Продвинутые техники"
 *   "Module 1 - Setup"               → ordinal=1, label="Setup"
 *   "Module 1 Setup"                 → ordinal=1, label="Setup"
 *   "Часть 1"                         → ordinal=1, label="Часть 1"
 *
 * `\p{L}+` (with the `u` flag) matches any Unicode letter, so Russian / Greek
 * / Latin words all qualify. Without an explicit anchor for digits inside the
 * word, this safely declines to match Tier-1 inputs (`01 - Foo`).
 */
const WORD_PREFIXED_RE = /^(\p{L}+(?:\s+\p{L}+)*)\s+(\d+)(?:[\s\-._]+(.+))?$/u;

/**
 * Tier 3 — composite `N.M` lesson pattern. Used for *file* names only, not
 * folder names (folders never carry composite ordinals in any layout we have
 * seen). The optional title group lets `2.6.mp4` (no title) survive — the
 * caller falls back to the bare basename.
 */
const COMPOSITE_LESSON_RE = /^(\d+)\.(\d+)(?:\s+(.+))?$/;

/**
 * Tier 4 — trailing digits, no separator (`lesson23`, `Занятие5`). Lesson
 * files only. Requires at least one non-digit character before the digits so
 * a purely-numeric basename (already handled by Tier 1/PREFIX_RE) is never
 * double-matched here.
 */
const TRAILING_DIGITS_RE = /^(.*\D)(\d+)$/;

/**
 * Tier 5 — marker-introduced ordinal: `#` or `№` anywhere in the name,
 * immediately followed by digits (`Лекция #9`, `Lecture №12`). Unlike
 * Tiers 1–4, not anchored to either end — `#`/`№` is itself the marker, so
 * there is no ambiguity about which digits are the ordinal. See #499.
 */
const MARKER_ORDINAL_RE = /[#№]\s*(\d+)/;

/**
 * A whole basename that reads as a calendar date (`2022-11-12`) is not a
 * numeric-ordinal-prefixed name — see the file-level WHY comment (#498).
 * Lesson files only; folder names have not shown this convention.
 */
const CALENDAR_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function applyPrefix(
  match: RegExpExecArray,
  fallbackLabel: string,
): { ordinal: number; label: string } {
  const label = (match[2] ?? '').trim();
  return {
    ordinal: Number.parseInt(match[1] ?? '', 10),
    label: label === '' ? fallbackLabel : label,
  };
}

/** Parse a directory name and return an optional numeric ordinal + label. */
export function parseFolderName(name: string): ParsedFolderName {
  const trimmed = name.trim();

  const direct = PREFIX_RE.exec(trimmed);
  if (direct) return applyPrefix(direct, trimmed);

  const word = WORD_PREFIXED_RE.exec(trimmed);
  if (word) {
    const restLabel = (word[3] ?? '').trim();
    return {
      ordinal: Number.parseInt(word[2] ?? '', 10),
      label: restLabel === '' ? trimmed : restLabel,
    };
  }

  // Tier 5 — marker-introduced ordinal (`#`/`№`), anywhere in the name.
  const marker = MARKER_ORDINAL_RE.exec(trimmed);
  if (marker) {
    return { ordinal: Number.parseInt(marker[1] ?? '', 10), label: trimmed };
  }

  return { label: trimmed };
}

/**
 * Parse a lesson file name. Tries the calendar-date exemption, then composite
 * (`N.M …`), then numeric prefix (`NN -`/`NN.`), then trailing digits, then
 * marker-introduced (`#`/`№`), then bare. Strips and reports the extension;
 * sets `unsupportedExtension: true` when it is not in SUPPORTED_EXTENSIONS.
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

  // Calendar-date basename (`2022-11-12`) — see the file-level WHY (#498).
  // Checked first so PREFIX_RE never gets a chance to read the year as an
  // ordinal and split the rest off as a bogus label.
  if (CALENDAR_DATE_RE.test(fileBasename)) {
    const label = fileBasename.trim();
    if (supported) return { label, extension };
    return { label, extension, unsupportedExtension: true };
  }

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
    const fallback = fileBasename.trim();
    if (supported) return { ...applyPrefix(prefixed, fallback), extension };
    return { ...applyPrefix(prefixed, fallback), extension, unsupportedExtension: true };
  }

  // Tier 4 — trailing digits, no separator. Label stays the full basename —
  // there is no separator to split a title out of, unlike Tier 1.
  const trailing = TRAILING_DIGITS_RE.exec(fileBasename);
  if (trailing) {
    const ordinal = Number.parseInt(trailing[2] ?? '', 10);
    const label = fileBasename.trim();
    if (supported) return { ordinal, label, extension };
    return { ordinal, label, extension, unsupportedExtension: true };
  }

  // Tier 5 — marker-introduced ordinal (`#`/`№`), anywhere in the name. Label
  // stays the full basename — see the file-level WHY (#499).
  const marker = MARKER_ORDINAL_RE.exec(fileBasename);
  if (marker) {
    const ordinal = Number.parseInt(marker[1] ?? '', 10);
    const label = fileBasename.trim();
    if (supported) return { ordinal, label, extension };
    return { ordinal, label, extension, unsupportedExtension: true };
  }

  // Tier 6 — bare title.
  if (supported) return { label: fileBasename.trim(), extension };
  return { label: fileBasename.trim(), extension, unsupportedExtension: true };
}
