/**
 * WHY this file exists:
 * Failure modes of the model-weights admin endpoints. `ModelWeightPathInvalidError`
 * is fail-closed defence in depth — the OpenAPI path parameter already rejects a
 * `filename` containing a separator, but the handler re-checks rather than
 * trusting that alone (same posture as DerivedPathEscapedError).
 */
import { DomainError, NotFound } from '../../../../shared/domain-error';

export class ModelWeightNotFoundError extends NotFound {
  constructor(filename: string) {
    super(`Model weight "${filename}" was not found.`, 'model-weight-not-found');
    this.name = 'ModelWeightNotFoundError';
  }
}

export class ModelWeightPathInvalidError extends DomainError {
  constructor(filename: string) {
    super({
      code: 'model-weight-path-invalid',
      status: 422,
      title: 'Invariant violation',
      detail: `"${filename}" is not a bare filename.`,
    });
    this.name = 'ModelWeightPathInvalidError';
  }
}

/**
 * The file is the deployment's currently configured active model
 * (WHISPER_MODEL_PATH or LLAMA_DEFAULT_MODEL) — deleting it would silently
 * make the next transcription/generation request fail with a confusing
 * error instead of the clean "not configured"/"not found" ones those flows
 * already document. Change the config first.
 */
export class ModelWeightInUseError extends DomainError {
  constructor(filename: string, envVar: string) {
    super({
      code: 'model-weight-in-use',
      status: 409,
      title: 'Conflict',
      detail: `Model weight "${filename}" is the configured active model — change ${envVar} first.`,
    });
    this.name = 'ModelWeightInUseError';
  }
}
