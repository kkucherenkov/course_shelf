/**
 * WHY this file exists:
 * Port for the shared model-weights volume — the same directory holds
 * whisper's ggml `.bin` files and quiz generation's llama `.gguf` files
 * (E29-F02-S01 clarification #6), so one port serves both engines rather
 * than one per engine.
 */
export interface ModelWeightFile {
  readonly filename: string;
  readonly sizeBytes: number;
  /** True for a `.gguf` file — selectable as a quiz-generation model. */
  readonly usableForQuizGeneration: boolean;
}

export interface ModelWeightsPort {
  /** Every file directly inside the weights directory, unsorted. */
  list(): Promise<ModelWeightFile[]>;

  /**
   * Deletes one file by bare filename.
   * @throws ModelWeightPathInvalidError if `filename` is not a bare name
   *   (contains a path separator or resolves outside the weights directory).
   * @throws ModelWeightNotFoundError if no such file exists.
   */
  delete(filename: string): Promise<void>;
}

export const MODEL_WEIGHTS_PORT = Symbol('MODEL_WEIGHTS_PORT');
