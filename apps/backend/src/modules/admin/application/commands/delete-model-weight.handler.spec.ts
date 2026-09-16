import { describe, expect, it, vi } from 'vitest';

import { ModelWeightInUseError } from '../../domain/model-weights/model-weights.errors';
import { DeleteModelWeightCommand } from './delete-model-weight.command';
import { DeleteModelWeightHandler } from './delete-model-weight.handler';

import type { ModelWeightsPort } from '../../domain/model-weights/model-weights.port';
import type { AppConfig } from '../../../../common/config/app-config';

function makeWeights(): ModelWeightsPort {
  return { list: vi.fn(), delete: vi.fn() };
}

function makeAppConfig(
  overrides: {
    whisperModelPath?: string;
    llamaDefaultModel?: string;
  } = {},
): AppConfig {
  return {
    transcription: { modelPath: overrides.whisperModelPath ?? '' },
    quizGeneration: { defaultModelFilename: overrides.llamaDefaultModel ?? '' },
  } as unknown as AppConfig;
}

describe('DeleteModelWeightHandler', () => {
  it('deletes a file that is not the active model for either engine', async () => {
    const weights = makeWeights();
    const handler = new DeleteModelWeightHandler(weights, makeAppConfig());

    await handler.execute(new DeleteModelWeightCommand('spare.gguf'));

    expect(weights.delete).toHaveBeenCalledWith('spare.gguf');
  });

  it('refuses to delete the active whisper model', async () => {
    const weights = makeWeights();
    const handler = new DeleteModelWeightHandler(
      weights,
      makeAppConfig({ whisperModelPath: '/models/ggml-base.bin' }),
    );

    await expect(
      handler.execute(new DeleteModelWeightCommand('ggml-base.bin')),
    ).rejects.toBeInstanceOf(ModelWeightInUseError);
    expect(weights.delete).not.toHaveBeenCalled();
  });

  it('refuses to delete the active llama default model', async () => {
    const weights = makeWeights();
    const handler = new DeleteModelWeightHandler(
      weights,
      makeAppConfig({ llamaDefaultModel: 'Qwen3.5-4B-Q4_K_M.gguf' }),
    );

    await expect(
      handler.execute(new DeleteModelWeightCommand('Qwen3.5-4B-Q4_K_M.gguf')),
    ).rejects.toBeInstanceOf(ModelWeightInUseError);
    expect(weights.delete).not.toHaveBeenCalled();
  });
});
