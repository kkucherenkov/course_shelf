/**
 * WHY this file exists:
 * The shape both export query handlers return and the only thing
 * ExportController / the zip writer need to know about — a flat list of
 * text files plus the empty directories to create alongside them (E28-F01-S01
 * ships `images/` empty; a later summary feature populates it without
 * changing this shape).
 */
export interface ExportFile {
  readonly path: string;
  readonly content: string;
}

export interface ExportBundle {
  readonly files: readonly ExportFile[];
  readonly directories: readonly string[];
  /** Content-Disposition filename, e.g. "intro-to-signals.zip" — computed by the handler, which is the layer that knows the title. */
  readonly suggestedFileName: string;
}
