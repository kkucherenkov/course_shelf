/**
 * WHY this file exists:
 * Material is a value object that lives inside the Lesson aggregate. It represents
 * a sidecar file (PDF, Markdown, text, or image) attached to a lesson video.
 *
 * The `kind` is derived from the file extension at scan time via the static
 * factory `Material.fromFile`. Extensions outside the supported set throw
 * MaterialKindUnsupportedError — the scan handler catches that and records a
 * ScanError instead of propagating.
 *
 * The read DTO must never expose raw filesystem paths (NFR-S-01). `path` is
 * only needed at save time and is stored on the Prisma row; the aggregate
 * keeps it internally so the repository can persist it, but it is never part
 * of any public DTO.
 *
 * `path` is a `LibraryRelativePath` (tuxedo 174), the same VO
 * `Lesson.videoPath` uses (see that file's header) — an absolute path is
 * rejected at construction instead of silently accepted and mishandled by
 * `path.resolve` at read time.
 */
import { LibraryRelativePath } from '../shared-vo/library-relative-path';
import { MaterialKindUnsupportedError } from './lesson.errors';

export type MaterialKindValue = 'doc' | 'note' | 'image' | 'slide';

/** Extension → MaterialKind mapping. Lower-case keys only. */
const EXT_TO_KIND: ReadonlyMap<string, MaterialKindValue> = new Map([
  ['.pdf', 'doc'],
  ['.md', 'note'],
  ['.txt', 'note'],
  ['.png', 'image'],
  ['.jpg', 'image'],
  ['.jpeg', 'image'],
]);

export interface MaterialProps {
  readonly id: string;
  readonly kind: MaterialKindValue;
  readonly label: string;
  readonly path: LibraryRelativePath;
  readonly sizeBytes: number;
}

export class Material {
  readonly id: string;
  readonly kind: MaterialKindValue;
  readonly label: string;
  /** Relative to library root — stored internally; never exposed in DTOs. */
  readonly path: LibraryRelativePath;
  readonly sizeBytes: number;

  private constructor(props: MaterialProps) {
    this.id = props.id;
    this.kind = props.kind;
    this.label = props.label;
    this.path = props.path;
    this.sizeBytes = props.sizeBytes;
  }

  /** This material's file, resolved to an absolute path under `libraryRoot`. */
  absolutePath(libraryRoot: string): string {
    return this.path.resolveAbsolute(libraryRoot);
  }

  /**
   * Derive a Material value object from a filesystem entry.
   *
   * @param id    - Pre-generated cuid for persistence.
   * @param path  - Absolute or library-relative path, as walked off disk.
   * @param libraryRoot - The library's root; `path` is normalised against it.
   * @param sizeBytes - File size in bytes.
   *
   * Throws MaterialKindUnsupportedError for unrecognised extensions — callers
   * (scan handler) catch this and record a ScanError instead. Throws
   * LibraryRelativePathEscapedError when `path` would resolve outside
   * `libraryRoot`.
   */
  static fromFile(props: {
    id: string;
    path: string;
    libraryRoot: string;
    sizeBytes: number;
  }): Material {
    const lastDot = props.path.lastIndexOf('.');
    const ext = lastDot === -1 ? '' : props.path.slice(lastDot).toLowerCase();

    const kind = EXT_TO_KIND.get(ext);
    if (!kind) {
      throw new MaterialKindUnsupportedError(ext);
    }

    // Label: basename with extension stripped, preserving any ordinal prefix.
    const basename = props.path.split(/[/\\]/).pop() ?? props.path;
    const label = lastDot === -1 ? basename : basename.slice(0, basename.lastIndexOf('.'));

    return new Material({
      id: props.id,
      kind,
      label,
      path: LibraryRelativePath.from(props.path, props.libraryRoot),
      sizeBytes: props.sizeBytes,
    });
  }

  /** Reconstitute from persisted row (bypasses validation). */
  static reconstitute(props: MaterialProps): Material {
    return new Material(props);
  }
}
