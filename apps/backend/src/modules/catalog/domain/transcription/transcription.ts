/**
 * WHY this file exists:
 * The Transcription aggregate captures the lifecycle and results of one pass
 * over a library's videos. Deliberately shaped like Scan: status transitions,
 * counters, and per-item error records that do not fail the run.
 *
 * The counters differ from Scan's because the interesting question here is not
 * "how many files did we see" but "how many did we skip, finish, and fail" —
 * a resumed run is mostly skips, and that has to be legible in the UI.
 *
 * Plain class: no Prisma, no NestJS types.
 */
import { brand } from '../../../../shared/branded-id';
import { TranscriptionInTerminalStateError } from './transcription.errors';

import type { Id } from '../../../../shared/branded-id';

export type TranscriptionId = Id<'Transcription'>;

/** Machine-readable status matching the OpenAPI TranscriptionStatus enum. */
export type TranscriptionStatusValue = 'running' | 'succeeded' | 'failed' | 'cancelled';

/** A non-fatal per-lesson failure recorded during the run. */
export interface TranscriptionErrorEntry {
  readonly lessonId: string;
  readonly message: string;
  readonly code?: string;
}

export interface TranscriptionProps {
  readonly id: TranscriptionId;
  readonly libraryId: string;
  readonly status: TranscriptionStatusValue;
  readonly force: boolean;
  readonly startedAt: Date;
  /** undefined while the run is going; set on terminal transition. */
  readonly finishedAt: Date | undefined;
  readonly lessonsTotal: number;
  readonly lessonsSkipped: number;
  readonly lessonsTranscribed: number;
  readonly lessonsFailed: number;
  readonly errors: TranscriptionErrorEntry[];
}

const TERMINAL_STATUSES: ReadonlySet<TranscriptionStatusValue> = new Set([
  'succeeded',
  'failed',
  'cancelled',
]);

export class Transcription {
  readonly id: TranscriptionId;
  readonly libraryId: string;
  readonly force: boolean;
  readonly startedAt: Date;
  private _status: TranscriptionStatusValue;
  private _finishedAt: Date | undefined;
  private readonly _lessonsTotal: number;
  private _lessonsSkipped: number;
  private _lessonsTranscribed: number;
  private _lessonsFailed: number;
  private readonly _errors: TranscriptionErrorEntry[];

  private constructor(props: TranscriptionProps) {
    this.id = props.id;
    this.libraryId = props.libraryId;
    this.force = props.force;
    this.startedAt = props.startedAt;
    this._status = props.status;
    this._finishedAt = props.finishedAt;
    this._lessonsTotal = props.lessonsTotal;
    this._lessonsSkipped = props.lessonsSkipped;
    this._lessonsTranscribed = props.lessonsTranscribed;
    this._lessonsFailed = props.lessonsFailed;
    this._errors = [...props.errors];
  }

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  get status(): TranscriptionStatusValue {
    return this._status;
  }

  get finishedAt(): Date | undefined {
    return this._finishedAt;
  }

  get lessonsTotal(): number {
    return this._lessonsTotal;
  }

  get lessonsSkipped(): number {
    return this._lessonsSkipped;
  }

  get lessonsTranscribed(): number {
    return this._lessonsTranscribed;
  }

  get lessonsFailed(): number {
    return this._lessonsFailed;
  }

  get errors(): readonly TranscriptionErrorEntry[] {
    return this._errors;
  }

  // ---------------------------------------------------------------------------
  // Factories
  // ---------------------------------------------------------------------------

  /**
   * Called when a run is started. The total is known up front because the walk
   * enumerates the library's lessons before transcribing any of them.
   */
  static start(props: {
    id: string;
    libraryId: string;
    force: boolean;
    lessonsTotal: number;
    now?: Date;
  }): Transcription {
    return new Transcription({
      id: brand<string, 'Transcription'>(props.id),
      libraryId: props.libraryId,
      status: 'running',
      force: props.force,
      startedAt: props.now ?? new Date(),
      finishedAt: undefined,
      lessonsTotal: props.lessonsTotal,
      lessonsSkipped: 0,
      lessonsTranscribed: 0,
      lessonsFailed: 0,
      errors: [],
    });
  }

  /**
   * Reconstitutes the aggregate from a persisted row.
   * Bypasses invariant checks — the DB is the source of truth.
   */
  static reconstitute(props: TranscriptionProps): Transcription {
    return new Transcription(props);
  }

  // ---------------------------------------------------------------------------
  // Mutators — each refuses once the run is closed.
  // ---------------------------------------------------------------------------

  private assertRunning(): void {
    if (TERMINAL_STATUSES.has(this._status)) {
      throw new TranscriptionInTerminalStateError(this._status);
    }
  }

  /** A lesson the skip rule left alone (sidecar present, or transcript current). */
  recordSkipped(): void {
    this.assertRunning();
    this._lessonsSkipped++;
  }

  /** A lesson whose transcript this run produced. */
  recordTranscribed(): void {
    this.assertRunning();
    this._lessonsTranscribed++;
  }

  /** A lesson that failed. Costs its own lesson, never the run. */
  recordFailure(entry: TranscriptionErrorEntry): void {
    this.assertRunning();
    this._lessonsFailed++;
    this._errors.push(entry);
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

  /** Transition to cancelled, requested from the admin screen. Sets finishedAt. */
  cancel(now?: Date): void {
    this.assertRunning();
    this._status = 'cancelled';
    this._finishedAt = now ?? new Date();
  }
}
