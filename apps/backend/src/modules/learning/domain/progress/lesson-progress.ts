/**
 * WHY this file exists:
 * LessonProgress is the aggregate root of the Learning bounded context's first
 * slice. It owns all progress-update invariants:
 *   - Structural: durationSeconds >= 1, positionSeconds >= 0.
 *   - Clamp: positionSeconds > durationSeconds is clamped to durationSeconds
 *     rather than rejected. Rationale: clients report the player's currentTime
 *     which can transiently exceed duration (float rounding, HLS segment edge);
 *     clamping recovers gracefully without data loss, which matters more than
 *     strict rejection in a best-effort telemetry path.
 *   - Idempotency: the 90 % completion threshold is crossed at most once;
 *     `completedThisCall` is false on all subsequent writes.
 *   - Last-write-wins: `clientUpdatedAt` acts as a logical clock. Writes with
 *     an older or equal timestamp are silently ignored (`accepted: false`).
 *
 * No Prisma types. No NestJS decorators. Infrastructure stays in infra/.
 */
import { LessonProgressInvalidError } from './lesson-progress.errors';

export interface LessonProgressProps {
  readonly id: string;
  readonly userId: string;
  readonly lessonId: string;
  positionSeconds: number;
  durationSeconds: number;
  percent: number;
  completed: boolean;
  lastSeenAt: Date;
  completedAt: Date | undefined;
  readonly createdAt: Date;
}

export interface RecordResult {
  readonly aggregate: LessonProgress;
  readonly accepted: boolean;
  readonly completedThisCall: boolean;
}

/** Clamp n to [min, max]. */
function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/** Compute integer percent, clamped to [0, 100]. */
function computePercent(positionSeconds: number, durationSeconds: number): number {
  return clamp(Math.round((positionSeconds / durationSeconds) * 100), 0, 100);
}

export class LessonProgress {
  readonly id: string;
  readonly userId: string;
  readonly lessonId: string;
  positionSeconds: number;
  durationSeconds: number;
  percent: number;
  completed: boolean;
  lastSeenAt: Date;
  completedAt: Date | undefined;
  readonly createdAt: Date;

  private constructor(props: LessonProgressProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.lessonId = props.lessonId;
    this.positionSeconds = props.positionSeconds;
    this.durationSeconds = props.durationSeconds;
    this.percent = props.percent;
    this.completed = props.completed;
    this.lastSeenAt = props.lastSeenAt;
    this.completedAt = props.completedAt;
    this.createdAt = props.createdAt;
  }

  /**
   * Creates the initial progress record for a (userId, lessonId) pair.
   *
   * Throws `LessonProgressInvalidError` for:
   *   - durationSeconds < 1
   *   - positionSeconds < 0
   *
   * positionSeconds > durationSeconds is clamped (see module comment).
   */
  static start(params: {
    id: string;
    userId: string;
    lessonId: string;
    durationSeconds: number;
    positionSeconds: number;
    clientUpdatedAt: Date;
  }): RecordResult {
    const { id, userId, lessonId, durationSeconds, clientUpdatedAt } = params;

    if (durationSeconds < 1) {
      throw new LessonProgressInvalidError(
        `durationSeconds must be >= 1, got ${String(durationSeconds)}.`,
      );
    }
    if (params.positionSeconds < 0) {
      throw new LessonProgressInvalidError(
        `positionSeconds must be >= 0, got ${String(params.positionSeconds)}.`,
      );
    }

    // Clamp position to duration rather than reject — see module comment.
    const positionSeconds = clamp(params.positionSeconds, 0, durationSeconds);
    const percent = computePercent(positionSeconds, durationSeconds);

    const completedThisCall = percent >= 90;

    const aggregate = new LessonProgress({
      id,
      userId,
      lessonId,
      positionSeconds,
      durationSeconds,
      percent,
      completed: completedThisCall,
      lastSeenAt: clientUpdatedAt,
      completedAt: completedThisCall ? clientUpdatedAt : undefined,
      createdAt: new Date(),
    });

    return { aggregate, accepted: true, completedThisCall };
  }

  /**
   * Reconstitutes an aggregate from a persisted row. Bypasses invariant checks
   * because the DB is the source of truth for already-valid rows.
   */
  static reconstitute(props: LessonProgressProps): LessonProgress {
    return new LessonProgress(props);
  }

  /**
   * Records a new position for this progress aggregate.
   *
   * - If `clientUpdatedAt <= this.lastSeenAt`: returns accepted=false, no mutation.
   * - Otherwise: clamps positionSeconds, recomputes percent, updates lastSeenAt.
   *   If percent crosses 90 % for the first time, sets completed=true, records
   *   completedAt, returns completedThisCall=true. Subsequent crossings are
   *   idempotent (completedThisCall=false because completed was already true).
   */
  record(params: { positionSeconds: number; clientUpdatedAt: Date }): RecordResult {
    const { clientUpdatedAt } = params;

    // Last-write-wins: reject stale or concurrent writes.
    if (clientUpdatedAt <= this.lastSeenAt) {
      return { aggregate: this, accepted: false, completedThisCall: false };
    }

    // Clamp position — same rationale as in start().
    const positionSeconds = clamp(params.positionSeconds, 0, this.durationSeconds);
    const percent = computePercent(positionSeconds, this.durationSeconds);

    this.positionSeconds = positionSeconds;
    this.percent = percent;
    this.lastSeenAt = clientUpdatedAt;

    let completedThisCall = false;
    if (percent >= 90 && !this.completed) {
      this.completed = true;
      this.completedAt = clientUpdatedAt;
      completedThisCall = true;
    }

    return { aggregate: this, accepted: true, completedThisCall };
  }
}
