import { describe, expect, it } from 'vitest';

import { cleanupJsonSchema, generateJsonSchema } from './model-prompts';

describe('cleanupJsonSchema', () => {
  it('pins the array length to the cue count in both directions', () => {
    expect(cleanupJsonSchema(3)).toMatchObject({ minItems: 3, maxItems: 3 });
  });
});

describe('generateJsonSchema', () => {
  it('requires exactly four options and an index inside them', () => {
    const schema = generateJsonSchema() as {
      properties: {
        questions: { items: { properties: { options: unknown; correctOptionIndex: unknown } } };
      };
    };
    const question = schema.properties.questions.items;
    expect(question.properties.options).toMatchObject({ minItems: 4, maxItems: 4 });
    expect(question.properties.correctOptionIndex).toMatchObject({ minimum: 0, maximum: 3 });
  });
});
