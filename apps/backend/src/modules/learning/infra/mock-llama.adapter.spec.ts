/**
 * Unit tests for MockLlamaAdapter — no child process, no model file: a
 * deterministic echo (cleanup) and a fixed canned question (generation).
 */
import { describe, expect, it } from 'vitest';

import { MockLlamaAdapter } from './mock-llama.adapter';

describe('MockLlamaAdapter', () => {
  it('cleanCues echoes the input texts unchanged, same length', async () => {
    const adapter = new MockLlamaAdapter();
    const cueTexts = ['helo wrold', 'this si a tset'];

    const result = await adapter.cleanCues({ modelAbsolutePath: '/models/x.gguf', cueTexts });

    expect(result).toEqual(cueTexts);
  });

  it('generateQuestions returns exactly questionCount canned questions', async () => {
    const adapter = new MockLlamaAdapter();

    const result = await adapter.generateQuestions({
      modelAbsolutePath: '/models/x.gguf',
      windowText: 'irrelevant',
      questionCount: 3,
    });

    expect(result).toHaveLength(3);
    for (const question of result) {
      expect(question.options).toHaveLength(4);
      expect(question.correctOptionIndex).toBeGreaterThanOrEqual(0);
      expect(question.correctOptionIndex).toBeLessThan(4);
    }
  });
});
