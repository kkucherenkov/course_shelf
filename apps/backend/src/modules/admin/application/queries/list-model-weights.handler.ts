/** WHY this file exists: read-side handler listing every file on the shared weights volume. */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { MODEL_WEIGHTS_PORT } from '../../domain/model-weights/model-weights.port';

import { ListModelWeightsQuery } from './list-model-weights.query';

import type { ModelWeightsPort } from '../../domain/model-weights/model-weights.port';
import type { ModelWeightListDto } from '@app/api-client-ts';

@QueryHandler(ListModelWeightsQuery)
export class ListModelWeightsHandler implements IQueryHandler<
  ListModelWeightsQuery,
  ModelWeightListDto
> {
  constructor(@Inject(MODEL_WEIGHTS_PORT) private readonly weights: ModelWeightsPort) {}

  async execute(): Promise<ModelWeightListDto> {
    const weights = await this.weights.list();
    return { weights };
  }
}
