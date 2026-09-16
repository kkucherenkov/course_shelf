/**
 * WHY this file exists:
 * Quiz is the aggregate root for one admin-reviewed generation proposal —
 * same propose/apply/discard lifecycle as catalog's IdentifyTask, reused
 * rather than duplicated (E29-F02-S01): a generated quiz is reviewed by a
 * human before it becomes real, exactly like a scraped metadata fragment.
 * The generated questions are carried as plain data (persisted as jsonb);
 * `modelFilename` records which .gguf weight produced them, so an admin can
 * later compare a 4B run against a 9B run of the same lesson.
 */
import { QuizNotPendingError } from './quiz.errors';

export type QuizStatus = 'proposed' | 'applied' | 'discarded';

export interface QuizQuestion {
  readonly prompt: string;
  readonly options: readonly [string, string, string, string];
  readonly correctOptionIndex: number;
  /**
   * Start of the transcript window this question was generated from (ms) —
   * the card's acceptance criterion. Assigned by the window, never asked of
   * the model, so it cannot be hallucinated.
   */
  readonly cueStartMs: number;
}

export interface QuizProps {
  readonly id: string;
  readonly lessonId: string;
  readonly courseId: string;
  readonly status: QuizStatus;
  readonly modelFilename: string;
  readonly questions: readonly QuizQuestion[];
  readonly createdAt: Date;
  readonly completedAt?: Date;
}

export class Quiz {
  readonly id: string;
  readonly lessonId: string;
  readonly courseId: string;
  readonly modelFilename: string;
  readonly questions: readonly QuizQuestion[];
  readonly createdAt: Date;
  private _status: QuizStatus;
  private _completedAt: Date | undefined;

  private constructor(props: QuizProps) {
    this.id = props.id;
    this.lessonId = props.lessonId;
    this.courseId = props.courseId;
    this.modelFilename = props.modelFilename;
    this.questions = props.questions;
    this.createdAt = props.createdAt;
    this._status = props.status;
    this._completedAt = props.completedAt;
  }

  get status(): QuizStatus {
    return this._status;
  }

  get completedAt(): Date | undefined {
    return this._completedAt;
  }

  static create(props: {
    id: string;
    lessonId: string;
    courseId: string;
    modelFilename: string;
    questions: readonly QuizQuestion[];
    now?: Date;
  }): Quiz {
    return new Quiz({
      id: props.id,
      lessonId: props.lessonId,
      courseId: props.courseId,
      status: 'proposed',
      modelFilename: props.modelFilename,
      questions: props.questions,
      createdAt: props.now ?? new Date(),
    });
  }

  static reconstitute(props: QuizProps): Quiz {
    return new Quiz(props);
  }

  markApplied(now: Date): void {
    this.assertPending();
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
      throw new QuizNotPendingError(this.id, this._status);
    }
  }
}
