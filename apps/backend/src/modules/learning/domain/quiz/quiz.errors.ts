/**
 * WHY this file exists:
 * Domain errors for the quiz bounded context (E29-F02-S01), mapped to RFC 9457
 * by the global filter. Mirrors catalog's identify-task.errors.ts for the
 * review lifecycle (not-found / not-pending) and transcription.errors.ts for
 * the "engine unusable" shape (not-configured / already-running).
 */
import { DomainError, NotFound } from '../../../../shared/domain-error';

export class QuizNotFoundError extends NotFound {
  constructor(id: string) {
    super(`Quiz "${id}" does not exist.`, 'quiz-not-found');
    this.name = 'QuizNotFoundError';
  }
}

/** Thrown when apply/discard is attempted on a quiz that is not `proposed`. */
export class QuizNotPendingError extends DomainError {
  constructor(id: string, status: string) {
    super({
      code: 'quiz-not-pending',
      status: 409,
      title: 'Quiz not pending',
      detail: `Quiz "${id}" is "${status}" and can no longer be applied or discarded.`,
    });
    this.name = 'QuizNotPendingError';
  }
}

/**
 * Thrown when no model was named on the request AND no default is configured
 * (`LLAMA_DEFAULT_MODEL` unset). Mirrors TranscriptionNotConfiguredError —
 * refuse before doing any work rather than start a run that can only fail.
 */
export class QuizGenerationNotConfiguredError extends DomainError {
  constructor() {
    super({
      code: 'quiz-generation-not-configured',
      status: 503,
      title: 'Service Unavailable',
      detail: 'LLAMA_DEFAULT_MODEL is unset, so no quiz-generation model is available.',
    });
    this.name = 'QuizGenerationNotConfiguredError';
  }
}

/**
 * The requested (or defaulted) model filename does not resolve to a usable
 * `.gguf` file in the weights directory right now. Checked live, per request
 * — unlike whisper's boot-cached `configured` flag, the weights directory can
 * change between requests via the admin delete endpoint, so nothing here is
 * safe to cache at boot.
 */
export class QuizModelNotFoundError extends NotFound {
  constructor(filename: string) {
    super(`Quiz-generation model "${filename}" was not found.`, 'quiz-model-not-found');
    this.name = 'QuizModelNotFoundError';
  }
}

/**
 * A quiz-generation walk is already running for this course (lesson- or
 * course-scoped — both share the same lock, keyed by courseId). llama.cpp
 * saturates every core it is given, same reasoning as
 * TranscriptionAlreadyRunningError: a second concurrent run halves the first
 * rather than finishing sooner.
 */
export class QuizGenerationAlreadyRunningError extends DomainError {
  constructor(courseId: string) {
    super({
      code: 'quiz-generation-already-running',
      status: 409,
      title: 'Conflict',
      detail:
        `Quiz generation is already running for course "${courseId}". llama.cpp saturates ` +
        'every core it is given, same as whisper — wait for it to finish before starting another.',
    });
    this.name = 'QuizGenerationAlreadyRunningError';
  }
}

/**
 * llama-completion exited non-zero, timed out, or produced output the adapter could
 * not parse. Caught per-window inside the walk (a bad window costs its own
 * questions, never the whole lesson) — never reaches a request handler.
 */
export class QuizGenerationFailedError extends DomainError {
  constructor(detail: string) {
    super({
      code: 'quiz-generation-failed',
      status: 500,
      title: 'Quiz generation failed',
      detail,
    });
    this.name = 'QuizGenerationFailedError';
  }
}
