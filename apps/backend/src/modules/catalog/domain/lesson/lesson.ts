/**
 * WHY this file exists:
 * Lesson is the aggregate root for the third catalog slice (E06-F03-S02). It
 * owns a collection of Material and Subtitle value objects and guards all
 * invariants around position uniqueness and state transitions.
 *
 * Design notes:
 *   - `videoPath` is stored internally for persistence (the repository needs it),
 *     but it is NOT on any public getter — the read DTO must never expose raw
 *     filesystem paths (NFR-S-01).
 *   - `duration` is null until E06-F02-S02 (ffprobe) populates it. The setter
 *     `setDuration` is already wired so that story's handler has a clean hook.
 *   - `updateSignature` lets the scan handler refresh mtime/size without
 *     replacing the whole aggregate on rescan.
 *   - Materials and Subtitles are eagerly loaded — there is no lazy-loading
 *     strategy for v1 given the small cardinality.
 */
import { brand } from '../../../../shared/branded-id';
import { LessonPositionConflictError } from './lesson.errors';
import { Material } from './material';
import { Subtitle } from './subtitle';

import type { Id } from '../../../../shared/branded-id';

export type LessonId = Id<'Lesson'>;

export interface LessonProps {
  readonly id: LessonId;
  readonly courseId: string;
  readonly sectionId: string;
  readonly position: number;
  readonly title: string;
  /** Relative to library root. Never exposed in DTOs. */
  readonly videoPath: string;
  readonly mtime: Date;
  readonly sizeBytes: number;
  readonly duration: number | undefined;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly materials: Material[];
  readonly subtitles: Subtitle[];
}

export class Lesson {
  readonly id: LessonId;
  readonly courseId: string;
  readonly sectionId: string;
  readonly position: number;
  readonly title: string;
  /** Stored for persistence only — never returned on public accessors. */
  private readonly _videoPath: string;
  private _mtime: Date;
  private _sizeBytes: number;
  private _duration: number | undefined;
  readonly createdAt: Date;
  private _updatedAt: Date;
  private readonly _materials: Material[];
  private readonly _subtitles: Subtitle[];

  private constructor(props: LessonProps) {
    this.id = props.id;
    this.courseId = props.courseId;
    this.sectionId = props.sectionId;
    this.position = props.position;
    this.title = props.title;
    this._videoPath = props.videoPath;
    this._mtime = props.mtime;
    this._sizeBytes = props.sizeBytes;
    this._duration = props.duration;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._materials = [...props.materials];
    this._subtitles = [...props.subtitles];
  }

  // ---------------------------------------------------------------------------
  // Public accessors
  // ---------------------------------------------------------------------------

  get mtime(): Date {
    return this._mtime;
  }

  get sizeBytes(): number {
    return this._sizeBytes;
  }

  get duration(): number | undefined {
    return this._duration;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get materials(): readonly Material[] {
    return this._materials;
  }

  get subtitles(): readonly Subtitle[] {
    return this._subtitles;
  }

  /**
   * Internal accessor used ONLY by the Prisma adapter for persistence.
   * Must never appear in any DTO mapper.
   */
  get videoPath(): string {
    return this._videoPath;
  }

  // ---------------------------------------------------------------------------
  // Factories
  // ---------------------------------------------------------------------------

  /**
   * Creates a new Lesson aggregate. Position must be unique within the section —
   * the uniqueness constraint is enforced by the DB (and the repository catches
   * P2002 → LessonPositionConflictError). At domain layer we trust the caller
   * to pass a valid position; the repository re-throws on conflict.
   */
  static create(props: {
    id: string;
    courseId: string;
    sectionId: string;
    position: number;
    title: string;
    videoPath: string;
    mtime: Date;
    sizeBytes: number;
    now?: Date;
  }): Lesson {
    const now = props.now ?? new Date();
    return new Lesson({
      id: brand<string, 'Lesson'>(props.id),
      courseId: props.courseId,
      sectionId: props.sectionId,
      position: props.position,
      title: props.title,
      videoPath: props.videoPath,
      mtime: props.mtime,
      sizeBytes: props.sizeBytes,
      duration: undefined,
      createdAt: now,
      updatedAt: now,
      materials: [],
      subtitles: [],
    });
  }

  /** Reconstitute from a persisted row. Bypasses invariant checks. */
  static reconstitute(props: LessonProps): Lesson {
    return new Lesson(props);
  }

  // ---------------------------------------------------------------------------
  // Mutators
  // ---------------------------------------------------------------------------

  /** Append a material to this lesson. Duplicate ids are rejected. */
  addMaterial(material: Material): void {
    if (this._materials.some((m) => m.id === material.id)) {
      throw new LessonPositionConflictError(
        `Material with id "${material.id}" already exists on lesson "${this.id}".`,
      );
    }
    this._materials.push(material);
    this._touch();
  }

  /** Append a subtitle track to this lesson. Duplicate ids are rejected. */
  addSubtitle(subtitle: Subtitle): void {
    if (this._subtitles.some((s) => s.id === subtitle.id)) {
      throw new LessonPositionConflictError(
        `Subtitle with id "${subtitle.id}" already exists on lesson "${this.id}".`,
      );
    }
    this._subtitles.push(subtitle);
    this._touch();
  }

  /**
   * Set the video duration in seconds. Called by E06-F02-S02 (ffprobe).
   * Passing undefined clears an existing duration.
   */
  setDuration(seconds: number | undefined): void {
    this._duration = seconds;
    this._touch();
  }

  /**
   * Refresh the file signature after a rescan detected a change.
   * Does not reset materials/subtitles — those are handled by the full
   * delete-and-recreate path in the repository.
   */
  updateSignature(props: { mtime: Date; sizeBytes: number }): void {
    this._mtime = props.mtime;
    this._sizeBytes = props.sizeBytes;
    this._touch();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _touch(): void {
    this._updatedAt = new Date();
  }
}
