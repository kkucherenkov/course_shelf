/**
 * WHY this file exists:
 * Parses folder and file names in the conventional library tree layout:
 *   01 - Title      (NN hyphen)
 *   01. Title       (NN dot)
 *   Title           (bare, no numeric prefix)
 *
 * For lesson file names the function also strips the supported video extension
 * and returns it. Unsupported extensions return a ScanError-compatible result
 * (no throw — callers are expected to record errors and continue the walk).
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
  /** Populated when the extension is not in SUPPORTED_EXTENSIONS. */
  readonly unsupportedExtension?: true;
}

/** Extensions recognised as lesson video files. Lower-case only. */
const SUPPORTED_EXTENSIONS = new Set(['.mp4', '.m4v', '.mkv', '.webm']);

/**
 * `01 - Title` or `01. Title` prefix pattern.
 * Group 1: numeric ordinal. Group 2: title after the separator.
 * The character class [-.] matches both separator forms without escaping the dot.
 */
const PREFIX_RE = /^(\d+)\s*[-.]\s*(.+)$/;

function applyPrefix(match: RegExpExecArray): { ordinal: number; label: string } {
  // Groups 1 and 2 are always defined when PREFIX_RE matches.
  return {
    ordinal: Number.parseInt(match[1] ?? '', 10),
    label: (match[2] ?? '').trim(),
  };
}

/**
 * Parse a directory name and return an optional numeric ordinal + label.
 * Trims whitespace from the label.
 */
export function parseFolderName(name: string): ParsedFolderName {
  const trimmed = name.trim();
  const match = PREFIX_RE.exec(trimmed);
  if (match) {
    return applyPrefix(match);
  }
  return { label: trimmed };
}

/**
 * Parse a lesson file name. Handles both `01 - Title.ext` and `Title.ext`.
 * Returns `unsupportedExtension: true` when the extension is not in the
 * SUPPORTED_EXTENSIONS set — callers should record a ScanError and skip.
 */
export function parseLessonFileName(name: string): ParsedLessonFileName {
  const trimmed = name.trim();

  // Find the last dot to split extension from the base name.
  const lastDot = trimmed.lastIndexOf('.');
  if (lastDot === -1) {
    // No extension at all — treat the whole name as unsupported.
    return { label: trimmed, extension: '', unsupportedExtension: true };
  }

  const extension = trimmed.slice(lastDot).toLowerCase();
  const fileBasename = trimmed.slice(0, lastDot);

  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    const match = PREFIX_RE.exec(fileBasename);
    if (match) {
      return { ...applyPrefix(match), extension, unsupportedExtension: true };
    }
    return { label: fileBasename.trim(), extension, unsupportedExtension: true };
  }

  const match = PREFIX_RE.exec(fileBasename);
  if (match) {
    return { ...applyPrefix(match), extension };
  }

  return { label: fileBasename.trim(), extension };
}
