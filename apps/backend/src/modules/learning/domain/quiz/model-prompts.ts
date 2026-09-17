/**
 * WHY this file exists:
 * Both TextModelAdapter implementations read the cleanup and generation
 * prompts, JSON schemas and token budgets from here, not from a private copy
 * of their own. LocalLlamaAdapter and the hosted OpenRouterAdapter differ in
 * transport and in how they wrap a schema onto the wire (`--json-schema` vs
 * `response_format`), never in what they ask the model or how much room they
 * give the answer — two adapters holding their own copy of a system prompt
 * drift, and the drift shows up later as an unexplainable quality difference
 * between providers.
 */

/** Enough for a window's worth of short corrected fragments, JSON overhead included. */
export const CLEANUP_MAX_TOKENS = 800;

/** Enough for a handful of MCQ questions as JSON. */
export const GENERATE_MAX_TOKENS = 600;

/** Fixed seed + greedy decoding: structured JSON extraction wants the least wandering, not variety. */
export const SEED = 1;

export const CLEANUP_SYSTEM_PROMPT =
  'You are a transcript proofreader. You receive a JSON array of short ' +
  'speech-to-text fragments, in their original spoken order. Fix ONLY ' +
  'obvious speech-recognition mistakes (misheard words, wrong homophones, ' +
  'garbled punctuation). Do not paraphrase, do not add or remove words, do ' +
  'not translate, do not censor anything. If a word looks like a rare term ' +
  'or a proper name you do not recognize, keep it exactly as given rather ' +
  'than guessing a replacement. Reply with a JSON array of the same length, ' +
  'one corrected string per input fragment, in the same order.';

export const GENERATE_SYSTEM_PROMPT =
  'You write multiple-choice comprehension questions from a short excerpt ' +
  'of a lesson transcript. Ask only about content actually stated in the ' +
  'excerpt — never invent facts. Each question has exactly 4 options with ' +
  'exactly one correct answer. Write the question and options in the same ' +
  'language as the excerpt. Reply with a JSON object matching the given schema.';

export function cleanupJsonSchema(count: number): object {
  return {
    type: 'array',
    items: { type: 'string' },
    minItems: count,
    maxItems: count,
  };
}

export function generateJsonSchema(): object {
  return {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            prompt: { type: 'string' },
            options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
            correctOptionIndex: { type: 'integer', minimum: 0, maximum: 3 },
          },
          required: ['prompt', 'options', 'correctOptionIndex'],
        },
      },
    },
    required: ['questions'],
  };
}
