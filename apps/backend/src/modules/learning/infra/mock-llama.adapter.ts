/**
 * WHY this file exists:
 * Deterministic, network-free LlamaAdapter used when LLAMA_MODE=mock (CI).
 * No model file is ever read; no process is ever spawned — mirrors
 * MockWhisperAdapter's reasoning exactly (E29-F02-S01 clarification #5: no
 * workflow downloads a .gguf, no test calls a live model).
 *
 * `cleanCues` echoes the input back unchanged — the interesting cleanup
 * behaviour (falling back to the original on a count mismatch) is domain
 * logic in `quiz-cleanup.ts`'s `applyCleanup`, tested there directly against
 * fabricated adapter output, not by round-tripping through this mock.
 */
import { Injectable } from '@nestjs/common';

import type {
  GeneratedQuizQuestion,
  LlamaAdapter,
  LlamaCleanCuesRequest,
  LlamaGenerateQuestionsRequest,
} from '../domain/quiz/llama.port';

const MOCK_QUESTION: GeneratedQuizQuestion = {
  prompt: 'Mock question about this excerpt?',
  options: ['Mock option A', 'Mock option B', 'Mock option C', 'Mock option D'],
  correctOptionIndex: 0,
};

@Injectable()
export class MockLlamaAdapter implements LlamaAdapter {
  cleanCues(req: LlamaCleanCuesRequest): Promise<readonly string[]> {
    return Promise.resolve(req.cueTexts);
  }

  generateQuestions(req: LlamaGenerateQuestionsRequest): Promise<readonly GeneratedQuizQuestion[]> {
    return Promise.resolve(Array.from({ length: req.questionCount }, () => MOCK_QUESTION));
  }
}
