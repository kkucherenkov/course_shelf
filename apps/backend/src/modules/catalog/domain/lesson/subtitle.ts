/**
 * WHY this file exists:
 * Subtitle is a value object that lives inside the Lesson aggregate. It represents
 * an SRT or VTT subtitle track attached to a lesson video.
 *
 * Language is extracted from a trailing `.<lang>.{srt,vtt}` suffix where `<lang>`
 * is 2–3 lowercase ASCII letters. When no such suffix is present, the language
 * defaults to `und` (undetermined — per BCP-47 / ISO 639-2).
 *
 * `label` is derived from the language, not from the file name: a track is
 * addressed by language and shown in the player's native CC menu, where
 * "01 - Intro" (the video's stem, which is what the file name gives you) is the
 * same string for every track of the same lesson and tells the viewer nothing.
 *
 * As with Material, the raw `path` is stored internally for persistence but is
 * never exposed in DTOs (NFR-S-01).
 */

/** Matches an optional 2–3 letter language tag before the final extension. */
const LANG_SUFFIX_RE = /\.([a-z]{2,3})\.(srt|vtt)$/i;

/**
 * ponytail: labels are English-only. Making them follow the request locale
 * means resolving them per request rather than at scan time — worth doing when
 * a non-English UI actually ships.
 */
const LANGUAGE_NAMES = new Intl.DisplayNames(['en'], { type: 'language', fallback: 'none' });

/** `en` → `English`, `ru` → `Russian`, `und`/garbage → `Unknown`. */
export function languageLabel(language: string): string {
  try {
    return LANGUAGE_NAMES.of(language) ?? 'Unknown';
  } catch {
    // `Intl.DisplayNames.of` throws RangeError on a structurally invalid tag.
    return 'Unknown';
  }
}

/** `Lesson.en.srt` → `en`; anything without a language suffix → `und`. */
export function languageOf(filePath: string): string {
  const basename = filePath.split(/[/\\]/).pop() ?? filePath;
  return LANG_SUFFIX_RE.exec(basename)?.[1]?.toLowerCase() ?? 'und';
}

/**
 * Collapse a lesson's subtitle files to one per language.
 *
 * `Lesson.en.srt` and `Lesson.en.vtt` are the same track in two containers, but
 * they produced two rows: two identical `en` entries in the CC menu, and an
 * ambiguous `/stream/lessons/{id}/subtitles/{language}` that served whichever
 * row the walk happened to insert first.
 *
 * `.vtt` wins — it is streamed as-is, with no SRT→VTT conversion and no
 * `*.cache.vtt` sibling written next to the source. Ties break on the sorted
 * path so a rescan of unchanged files keeps choosing the same file.
 */
export function dedupeSubtitlePathsByLanguage(paths: readonly string[]): string[] {
  const byLanguage = new Map<string, string>();
  for (const filePath of paths.toSorted()) {
    const language = languageOf(filePath);
    const incumbent = byLanguage.get(language);
    if (incumbent === undefined || (isVtt(filePath) && !isVtt(incumbent))) {
      byLanguage.set(language, filePath);
    }
  }
  return [...byLanguage.values()];
}

function isVtt(filePath: string): boolean {
  return filePath.toLowerCase().endsWith('.vtt');
}

export interface SubtitleProps {
  readonly id: string;
  readonly language: string;
  readonly path: string;
}

export class Subtitle {
  readonly id: string;
  readonly language: string;
  /** Relative to library root — stored internally; never exposed in DTOs. */
  readonly path: string;

  private constructor(props: SubtitleProps) {
    this.id = props.id;
    this.language = props.language;
    this.path = props.path;
  }

  /**
   * Human-readable track name for the player's CC menu. Derived rather than
   * stored so rows written before the derivation changed do not stay stale;
   * the `subtitle.label` column is still written from it by the repository.
   */
  get label(): string {
    return languageLabel(this.language);
  }

  /**
   * Derive a Subtitle value object from a filesystem entry.
   *
   *   `Lesson.en.srt`  → language = `en`,  label = `English`
   *   `Lesson.ru.vtt`  → language = `ru`,  label = `Russian`
   *   `Lesson.srt`     → language = `und`, label = `Unknown`
   */
  static fromFile(props: { id: string; path: string }): Subtitle {
    return new Subtitle({ id: props.id, language: languageOf(props.path), path: props.path });
  }

  /** Reconstitute from a persisted row. */
  static reconstitute(props: SubtitleProps): Subtitle {
    return new Subtitle(props);
  }
}
