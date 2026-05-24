/**
 * WHY this file exists:
 * IdentifyTask is the aggregate root for one admin-reviewed enrichment proposal.
 * It owns the status lifecycle (proposed → applied | discarded) and rejects
 * transitions out of a non-proposed state. The scraped fragment and the merge
 * policy are carried as plain data (persisted as jsonb). markApplied records the
 * policy actually used so the row is a faithful audit trail.
 */
import { IdentifyTaskNotPendingError } from './identify-task.errors';

import type { ScrapedCourseFragment } from '../scraper/scraper.types';
import type { MergePolicy } from './merge-policy';

export type IdentifyTaskStatus = 'proposed' | 'applied' | 'discarded';

export interface IdentifyTaskProps {
  readonly id: string;
  readonly courseId: string;
  readonly status: IdentifyTaskStatus;
  readonly source: string;
  readonly sourceUrl?: string;
  readonly scrapedFragment: ScrapedCourseFragment;
  readonly mergePolicy: MergePolicy;
  readonly createdAt: Date;
  readonly completedAt?: Date;
}

export class IdentifyTask {
  readonly id: string;
  readonly courseId: string;
  readonly source: string;
  readonly sourceUrl: string | undefined;
  readonly scrapedFragment: ScrapedCourseFragment;
  readonly createdAt: Date;
  private _status: IdentifyTaskStatus;
  private _mergePolicy: MergePolicy;
  private _completedAt: Date | undefined;

  private constructor(props: IdentifyTaskProps) {
    this.id = props.id;
    this.courseId = props.courseId;
    this.source = props.source;
    this.sourceUrl = props.sourceUrl;
    this.scrapedFragment = props.scrapedFragment;
    this.createdAt = props.createdAt;
    this._status = props.status;
    this._mergePolicy = props.mergePolicy;
    this._completedAt = props.completedAt;
  }

  get status(): IdentifyTaskStatus {
    return this._status;
  }

  get mergePolicy(): MergePolicy {
    return this._mergePolicy;
  }

  get completedAt(): Date | undefined {
    return this._completedAt;
  }

  static create(props: {
    id: string;
    courseId: string;
    source: string;
    sourceUrl?: string;
    scrapedFragment: ScrapedCourseFragment;
    mergePolicy: MergePolicy;
    now?: Date;
  }): IdentifyTask {
    const now = props.now ?? new Date();
    return new IdentifyTask({
      id: props.id,
      courseId: props.courseId,
      status: 'proposed',
      source: props.source,
      ...(props.sourceUrl === undefined ? {} : { sourceUrl: props.sourceUrl }),
      scrapedFragment: props.scrapedFragment,
      mergePolicy: props.mergePolicy,
      createdAt: now,
    });
  }

  static reconstitute(props: IdentifyTaskProps): IdentifyTask {
    return new IdentifyTask(props);
  }

  /** Record the policy actually applied and complete the task. */
  markApplied(finalPolicy: MergePolicy, now: Date): void {
    this.assertPending();
    this._mergePolicy = finalPolicy;
    this._status = 'applied';
    this._completedAt = now;
  }

  markDiscarded(now: Date): void {
    this.assertPending();
    this._status = 'discarded';
    this._completedAt = now;
  }

  private assertPending(): void {
    if (this._status !== 'proposed') {
      throw new IdentifyTaskNotPendingError(this.id, this._status);
    }
  }
}
