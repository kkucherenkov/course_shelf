import { describe, expect, it, vi } from 'vitest';

import { ListModelWeightsHandler } from './list-model-weights.handler';

import type { ModelWeightsPort } from '../../domain/model-weights/model-weights.port';

describe('ListModelWeightsHandler', () => {
  it('wraps the port result in { weights }', async () => {
    const weights = [{ filename: 'a.gguf', sizeBytes: 1, usableForQuizGeneration: true }];
    const port: ModelWeightsPort = { list: vi.fn().mockResolvedValue(weights), delete: vi.fn() };
    const handler = new ListModelWeightsHandler(port);

    const dto = await handler.execute();

    expect(dto).toEqual({ weights });
  });
});
