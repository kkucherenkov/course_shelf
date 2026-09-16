/**
 * WHY this file exists:
 * Refuses to delete whichever file is currently the deployment's configured
 * active model for either engine, checked by basename (both configs store a
 * bare filename or a path — comparing basenames handles either). Everything
 * else on the volume is re-fetchable, so deletion needs no further guard.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import path from 'node:path';

import { AppConfig } from '../../../../common/config/app-config';
import { ModelWeightInUseError } from '../../domain/model-weights/model-weights.errors';
import { MODEL_WEIGHTS_PORT } from '../../domain/model-weights/model-weights.port';

import { DeleteModelWeightCommand } from './delete-model-weight.command';

import type { ModelWeightsPort } from '../../domain/model-weights/model-weights.port';

@CommandHandler(DeleteModelWeightCommand)
export class DeleteModelWeightHandler implements ICommandHandler<DeleteModelWeightCommand, void> {
  constructor(
    @Inject(MODEL_WEIGHTS_PORT) private readonly weights: ModelWeightsPort,
    private readonly appConfig: AppConfig,
  ) {}

  async execute(command: DeleteModelWeightCommand): Promise<void> {
    const { filename } = command;
    const whisperModel = this.appConfig.transcription.modelPath;
    const llamaModel = this.appConfig.quizGeneration.defaultModelFilename;

    if (whisperModel !== '' && path.basename(whisperModel) === filename) {
      throw new ModelWeightInUseError(filename, 'WHISPER_MODEL_PATH');
    }
    if (llamaModel !== '' && llamaModel === filename) {
      throw new ModelWeightInUseError(filename, 'LLAMA_DEFAULT_MODEL');
    }

    await this.weights.delete(filename);
  }
}
