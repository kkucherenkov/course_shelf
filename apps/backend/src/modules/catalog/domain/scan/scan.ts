/**
 * WHY this file exists:
 * The Scan aggregate captures the lifecycle and results of a single library walk.
 * It owns all invariants around state transitions (running → succeeded/failed)
 * and accumulates counters + error records during the walk.
 *
 * Design decisions:
 *   - ScannedCourse is an in-memory value object; it is not persisted as its own
 *     row because E06-F03 (Course/Section/Lesson aggregates) has not landed yet.
 *     Its data drives the coursesDiscovered counter and the response DTO only.
 *   - DiscoveredFileEntry represents a file signature (path, mtime, size) stored
 *     per scan for incremental no-op detection in subsequent scans.
 *   - All mutators throw ScanInTerminalStateError when the scan is in a terminal
 *     state (succeeded / failed / cancelled), so callers cannot mutate closed scans.
 *   - The aggregate is a plain class with no Prisma or NestJS types.
 */
import { brand } from '../../../../shared/branded-id';
import { ScanInTerminalStateError } from './scan.errors';

import type { Id } from '../../../../shared/branded-id';

export type ScanId = Id<'Scan'>;

/** Machine-readable status matching the OpenAPI ScanStatus enum. */
export type ScanStatusValue = 'running' | 'succeeded' | 'failed' | 'cancelled';

/** A non-fatal per-file error recorded during the walk. */
export interface ScanErrorEntry {
  readonly path: string;
  readonly message: string;
  readonly code?: string;
}

/** File-level signature stored for incremental detection. */
export interface DiscoveredFileEntry {
  readonly path: string;
  readonly mtime: Date;
  readonly size: number;
}

/** Lesson-level value object — populated from folder-name parsing + course.json. */
export interface ScannedLesson {
  readonly title: string;
  readonly file: string;
}

/** Section-level value object. */
export interface ScannedSection {
  readonly title: string;
  readonly lessons: ScannedLesson[];
}

/**
 * Course-level value object discovered during the walk.
 * Not persisted as its own row; used to populate counters and response DTOs
 * until the E06-F03 chain (Course aggregate) lands.
 */
export interface ScannedCourse {
  readonly path: string;
  readonly title: string;
  readonly sectionTitles: string[];
  readonly lessonFiles: string[];
}

export interface ScanProps {
  readonly id: ScanId;
  readonly libraryId: string;
  readonly status: ScanStatusValue;
  readonly startedAt: Date;
  /** undefined while the scan is running; set on terminal transition. */
  readonly finishedAt: Date | undefined;
  readonly filesScanned: number;
  readonly filesAdded: number;
  readonly filesUpdated: number;
  readonly coursesDiscovered: number;
  readonly errors: ScanErrorEntry[];
  readonly discoveredFiles: DiscoveredFileEntry[];
}

const TERMINAL_STATUSES: ReadonlySet<ScanStatusValue> = new Set([
  'succeeded',
  'failed',
  'cancelled',
]);

export class Scan {
  readonly id: ScanId;
  readonly libraryId: string;
  private _status: ScanStatusValue;
  readonly startedAt: Date;
  private _finishedAt: Date | undefined;
  private _filesScanned: number;
  private _filesAdded: number;
  private _filesUpdated: number;
  private _coursesDiscovered: number;
  private readonly _errors: ScanErrorEntry[];
  private readonly _discoveredFiles: DiscoveredFileEntry[];
  private readonly _courses: ScannedCourse[];

  private constructor(props: ScanProps) {
    this.id = props.id;
    this.libraryId = props.libraryId;
    this._status = props.status;
    this.startedAt = props.startedAt;
    this._finishedAt = props.finishedAt;
    this._filesScanned = props.filesScanned;
    this._filesAdded = props.filesAdded;
    this._filesUpdated = props.filesUpdated;
    this._coursesDiscovered = props.coursesDiscovered;
    this._errors = [...props.errors];
    this._discoveredFiles = [...props.discoveredFiles];
    this._courses = [];
  }

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  get status(): ScanStatusValue {
    return this._status;
  }

  get finishedAt(): Date | undefined {
    return this._finishedAt;
  }

  get filesScanned(): number {
    return this._filesScanned;
  }

  get filesAdded(): number {
    return this._filesAdded;
  }

  get filesUpdated(): number {
    return this._filesUpdated;
  }

  get coursesDiscovered(): number {
    return this._coursesDiscovered;
  }

  get errors(): readonly ScanErrorEntry[] {
    return this._errors;
  }

  get discoveredFiles(): readonly DiscoveredFileEntry[] {
    return this._discoveredFiles;
  }

  get courses(): readonly ScannedCourse[] {
    return this._courses;
  }

  // ---------------------------------------------------------------------------
  // Factories
  // ---------------------------------------------------------------------------

  /**
   * Static factory called at the start of a new scan.
   * Initialises with status=running and zero counters.
   */
  static start(props: { id: string; libraryId: string; now?: Date }): Scan {
    const now = props.now ?? new Date();
    return new Scan({
      id: brand<string, 'Scan'>(props.id),
      libraryId: props.libraryId,
      status: 'running',
      startedAt: now,
      finishedAt: undefined,
      filesScanned: 0,
      filesAdded: 0,
      filesUpdated: 0,
      coursesDiscovered: 0,
      errors: [],
      discoveredFiles: [],
    });
  }

  /**
   * Reconstitutes the aggregate from a persisted row.
   * Bypasses invariant checks — the DB is the source of truth.
   */
  static reconstitute(props: ScanProps): Scan {
    return new Scan(props);
  }

  // ---------------------------------------------------------------------------
  // Mutators — each throws ScanInTerminalStateError when the scan is closed.
  // ---------------------------------------------------------------------------

  private assertRunning(): void {
    if (TERMINAL_STATUSES.has(this._status)) {
      throw new ScanInTerminalStateError(this._status);
    }
  }

  /** Record a non-fatal per-file error. Does not transition the scan. */
  recordError(entry: ScanErrorEntry): void {
    this.assertRunning();
    this._errors.push(entry);
  }

  /** Record a newly-discovered file (not seen in any previous scan). */
  recordFileAdded(file: DiscoveredFileEntry): void {
    this.assertRunning();
    this._filesScanned++;
    this._filesAdded++;
    this._discoveredFiles.push(file);
  }

  /** Record a file whose (mtime, size) changed since the previous scan. */
  recordFileUpdated(file: DiscoveredFileEntry): void {
    this.assertRunning();
    this._filesScanned++;
    this._filesUpdated++;
    this._discoveredFiles.push(file);
  }

  /** Record a file that exists in the previous scan and has not changed. */
  recordFileUnchanged(file: DiscoveredFileEntry): void {
    this.assertRunning();
    this._filesScanned++;
    this._discoveredFiles.push(file);
  }

  /** Bump the discovered-course counter and record the course value object. */
  incrementCoursesDiscovered(course: ScannedCourse): void {
    this.assertRunning();
    this._coursesDiscovered++;
    this._courses.push(course);
  }

  /** Transition to succeeded. Sets finishedAt. */
  complete(now?: Date): void {
    this.assertRunning();
    this._status = 'succeeded';
    this._finishedAt = now ?? new Date();
  }

  /** Transition to failed. Sets finishedAt. */
  fail(now?: Date): void {
    this.assertRunning();
    this._status = 'failed';
    this._finishedAt = now ?? new Date();
  }
}
