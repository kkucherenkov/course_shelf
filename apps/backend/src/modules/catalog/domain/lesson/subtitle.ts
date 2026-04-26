/**
 * WHY this file exists:
 * Subtitle is a value object that lives inside the Lesson aggregate. It represents
 * an SRT or VTT subtitle track attached to a lesson video.
 *
 * Language is extracted from a trailing `.<lang>.{srt,vtt}` suffix where `<lang>`
 * is 2–3 lowercase ASCII letters. When no such suffix is present, the language
 * defaults to `und` (undetermined — per BCP-47 / ISO 639-2).
 *
 * As with Material, the raw `path` is stored internally for persistence but is
 * never exposed in DTOs (NFR-S-01).
 */

/** Matches an optional 2–3 letter language tag before the final extension. */
const LANG_SUFFIX_RE = /\.([a-z]{2,3})\.(srt|vtt)$/i;

export interface SubtitleProps {
  readonly id: string;
  readonly language: string;
  readonly label: string;
  readonly path: string;
}

export class Subtitle {
  readonly id: string;
  readonly language: string;
  readonly label: string;
  /** Relative to library root — stored internally; never exposed in DTOs. */
  readonly path: string;

  private constructor(props: SubtitleProps) {
    this.id = props.id;
    this.language = props.language;
    this.label = props.label;
    this.path = props.path;
  }

  /**
   * Derive a Subtitle value object from a filesystem entry.
   *
   * Language extraction:
   *   `Lesson.en.srt`  → language = `en`
   *   `Lesson.ru.vtt`  → language = `ru`
   *   `Lesson.srt`     → language = `und`
   *
   * Label: basename with the final extension (and language suffix if present) stripped.
   *   `Lesson.en.srt`  → label = `Lesson`
   *   `Lesson.srt`     → label = `Lesson`
   *   `01 - Intro.srt` → label = `01 - Intro`
   */
  static fromFile(props: { id: string; path: string }): Subtitle {
    const basename = props.path.split(/[/\\]/).pop() ?? props.path;

    const langMatch = LANG_SUFFIX_RE.exec(basename);

    let language: string;
    let label: string;

    if (langMatch) {
      // e.g. "Lesson.en.srt" → language="en", label="Lesson"
      // langMatch[1] is guaranteed by the capture group in LANG_SUFFIX_RE.
      language = (langMatch[1] ?? 'und').toLowerCase();
      // Strip the language suffix + extension from the label.
      label = basename.slice(0, basename.length - langMatch[0].length);
    } else {
      // No language tag — strip the plain .srt/.vtt extension.
      language = 'und';
      const lastDot = basename.lastIndexOf('.');
      label = lastDot === -1 ? basename : basename.slice(0, lastDot);
    }

    return new Subtitle({ id: props.id, language, label, path: props.path });
  }

  /** Reconstitute from persisted row (bypasses derivation logic). */
  static reconstitute(props: SubtitleProps): Subtitle {
    return new Subtitle(props);
  }
}
