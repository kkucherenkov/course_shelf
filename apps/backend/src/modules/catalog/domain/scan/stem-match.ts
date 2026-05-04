/**
 * WHY this file exists:
 * Derives a canonical stem + file kind for any entry found during a library scan.
 * The stem is used to group sidecar files (.pdf, .md, .srt, etc.) with the
 * adjacent video file that shares the same base name.
 *
 * Problem it solves ("Neovim mass ScanError"):
 *   A course folder may contain:
 *     1.1 Почему Vim.mp4
 *     1.1. Почему Vim.pdf    ← dot-after-ordinal variant emitted by some tools
 *     1.1. Почему Vim.png
 *     1.1. Почему Vim.en.srt
 *   Without normalisation these four files would not share the same stem, causing
 *   the PDF/PNG/SRT to be reported as unsupported-extension ScanErrors.
 *
 * Normalisation rule:
 *   A leading composite prefix of the form `\d+\.\d+\.?\s*` is canonicalised to
 *   `<sectionOrdinal>.<ordinal> ` (one trailing space, no trailing dot) so that
 *   both `1.1 Почему Vim` and `1.1. Почему Vim` collapse to `1.1 Почему Vim`.
 *
 *   A leading single ordinal prefix `\d+\s*[-.]?\s*` (Udemy `01 - Title` form)
 *   is left as `<ordinal> ` so `01 - Intro` and `01. Intro` produce `01 Intro`.
 *
 * Subtitle stem stripping:
 *   For files with `.srt` / `.vtt` extensions, a trailing `.<lang>` suffix
 *   (2–3 lowercase letters) is also stripped so `Intro.en.srt` and `Intro.mp4`
 *   both produce the canonical stem `Intro`.
 *
 * Ignored files (kind: 'ignored'):
 *   Files matching `*.cache.vtt` are generated caches produced by the SRT→VTT
 *   conversion endpoint (E08-F02-S02). They must not be treated as discovered
 *   Subtitle tracks — the scan handler silently skips `ignored` entries without
 *   recording a ScanError. This is distinct from `unsupported` which does
 *   produce a ScanError for unrecognised extensions.
 *
 * Returns:
 *   canonicalStem — the normalised base name with extension (and language suffix
 *                   for subtitles) removed.
 *   kind          — 'video' | 'material' | 'subtitle' | 'unsupported' | 'ignored'.
 */

export type StemKind = 'video' | 'material' | 'subtitle' | 'unsupported' | 'ignored';

export interface StemMatchResult {
  readonly canonicalStem: string;
  readonly kind: StemKind;
}

// ---------------------------------------------------------------------------
// Extension classification
// ---------------------------------------------------------------------------

const VIDEO_EXTS = new Set(['.mp4', '.m4v', '.mkv', '.webm', '.wmv']);
const MATERIAL_EXTS = new Set(['.pdf', '.md', '.txt', '.png', '.jpg', '.jpeg']);
const SUBTITLE_EXTS = new Set(['.srt', '.vtt']);

function classifyExt(ext: string): StemKind {
  const lower = ext.toLowerCase();
  if (VIDEO_EXTS.has(lower)) return 'video';
  if (MATERIAL_EXTS.has(lower)) return 'material';
  if (SUBTITLE_EXTS.has(lower)) return 'subtitle';
  return 'unsupported';
}

// ---------------------------------------------------------------------------
// Normalisation regexes
// ---------------------------------------------------------------------------

/**
 * Composite prefix: `1.1 `, `1.1. `, `2.5 `, `2.5.Title`, `10.3 Title`.
 * Captures sectionOrdinal + ordinal; optional trailing dot + whitespace.
 */
const COMPOSITE_PREFIX_RE = /^(\d+)\.(\d+)\.?\s*/;

/**
 * Single ordinal prefix: `01 - `, `01. `, `01_`, `01 `, `01-`, or just `01`.
 * Captures the ordinal; the separator after the digits is any non-empty mix
 * of whitespace, `-`, `.`, `_` — or the end of the basename (bare numeric,
 * e.g. a folder literally named `07`). The bare-numeric form preserves the
 * digits as their own canonical stem.
 */
const SINGLE_PREFIX_RE = /^(\d+)(?:[\s\-._]+|$)/;

/**
 * Language suffix for subtitle files: `.en`, `.ru`, `.eng`, etc.
 * Matched against the stem (after the main extension has been stripped).
 */
const LANG_SUFFIX_RE = /\.([a-z]{2,3})$/i;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Derive the canonical stem and kind for a file path.
 *
 * Only the path basename is used — sizeBytes is reserved for callers that want
 * to pass it through unmodified (e.g. to build ScannedMaterial records).
 */
export function stemMatch(filePath: string): StemMatchResult {
  const basename = filePath.split(/[/\\]/).pop() ?? filePath;

  // Early-exit for generated SRT→VTT cache files so they are never mistaken
  // for real subtitle tracks. The scan handler silently skips 'ignored' kind.
  if (basename.toLowerCase().endsWith('.cache.vtt')) {
    return {
      canonicalStem: normalise(basename.slice(0, basename.lastIndexOf('.'))),
      kind: 'ignored',
    };
  }

  // Early-exit for generated poster thumbnails written by LocalFfmpegAdapter
  // (E06-F02-S02). They must not be picked up as image Material entries on
  // subsequent scans. The scan handler silently skips 'ignored' kind.
  if (basename.toLowerCase().endsWith('.thumb.jpg')) {
    return {
      canonicalStem: normalise(basename.slice(0, basename.toLowerCase().lastIndexOf('.thumb.jpg'))),
      kind: 'ignored',
    };
  }

  // Strip the final extension.
  const lastDot = basename.lastIndexOf('.');
  if (lastDot === -1) {
    return { canonicalStem: normalise(basename), kind: 'unsupported' };
  }

  const ext = basename.slice(lastDot).toLowerCase();
  const kind = classifyExt(ext);

  // The raw stem is everything before the extension.
  let rawStem = basename.slice(0, lastDot);

  // For subtitle files, also strip a trailing language tag (`.<lang>`) so that
  // `Intro.en.srt` and `Intro.mp4` share the same canonical stem.
  if (kind === 'subtitle') {
    const langMatch = LANG_SUFFIX_RE.exec(rawStem);
    if (langMatch) {
      rawStem = rawStem.slice(0, rawStem.length - langMatch[0].length);
    }
  }

  return { canonicalStem: normalise(rawStem), kind };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalise the stem so that dot-vs-space ordinal variants collapse to a
 * single canonical form:
 *   `1.1 Почему Vim`  → `1.1 Почему Vim`  (already normalised)
 *   `1.1. Почему Vim` → `1.1 Почему Vim`  (trailing dot removed)
 *   `01 - Intro`      → `01 Intro`
 *   `01. Intro`       → `01 Intro`
 *   `plain title`     → `plain title`      (unchanged)
 */
function normalise(stem: string): string {
  const trimmed = stem.trim();

  // Composite prefix wins over single prefix (try it first).
  const compositeMatch = COMPOSITE_PREFIX_RE.exec(trimmed);
  if (compositeMatch) {
    const sectionOrdinal = compositeMatch[1] ?? '';
    const ordinal = compositeMatch[2] ?? '';
    const rest = trimmed.slice(compositeMatch[0].length);
    // Rebuild as `<sectionOrdinal>.<ordinal> <rest>` or just `<sectionOrdinal>.<ordinal>`
    // when there is no title component.
    const canonical = rest
      ? `${sectionOrdinal}.${ordinal} ${rest}`
      : `${sectionOrdinal}.${ordinal}`;
    return canonical;
  }

  // Single ordinal prefix: `01 - Title` / `01. Title` → `01 Title`.
  const singleMatch = SINGLE_PREFIX_RE.exec(trimmed);
  if (singleMatch) {
    const ordinal = singleMatch[1] ?? '';
    const rest = trimmed.slice(singleMatch[0].length);
    return rest ? `${ordinal} ${rest}` : ordinal;
  }

  // No prefix — return as-is.
  return trimmed;
}
