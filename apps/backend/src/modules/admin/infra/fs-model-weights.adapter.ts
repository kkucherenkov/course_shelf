/**
 * WHY this file exists:
 * Plain filesystem adapter for ModelWeightsPort. No Prisma involved — the
 * weights directory is the source of truth, not a DB table. Containment is
 * checked twice: `path.basename(filename) !== filename` rejects any
 * separator outright, and resolving the joined path and comparing its parent
 * against the weights directory catches anything cleverer (fail-closed, same
 * posture as `derivedTranscriptPath`).
 */
import { readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';

import { Injectable } from '@nestjs/common';

import { AppConfig } from '../../../common/config/app-config';
import {
  ModelWeightNotFoundError,
  ModelWeightPathInvalidError,
} from '../domain/model-weights/model-weights.errors';

import type { ModelWeightFile, ModelWeightsPort } from '../domain/model-weights/model-weights.port';

@Injectable()
export class FsModelWeightsAdapter implements ModelWeightsPort {
  constructor(private readonly appConfig: AppConfig) {}

  async list(): Promise<ModelWeightFile[]> {
    const dir = this.appConfig.modelWeightsDir;
    let names: string[];
    try {
      names = await readdir(dir);
    } catch {
      // Directory not created yet (inert until a weight is dropped in) — an
      // empty list is the honest answer, not an error.
      return [];
    }

    const files: ModelWeightFile[] = [];
    for (const filename of names) {
      const stats = await stat(path.join(dir, filename));
      if (!stats.isFile()) continue;
      files.push({
        filename,
        sizeBytes: stats.size,
        usableForQuizGeneration: filename.endsWith('.gguf'),
      });
    }
    return files;
  }

  async delete(filename: string): Promise<void> {
    const dir = this.appConfig.modelWeightsDir;
    if (path.basename(filename) !== filename) {
      throw new ModelWeightPathInvalidError(filename);
    }
    const resolved = path.join(dir, filename);
    if (path.dirname(resolved) !== path.resolve(dir)) {
      throw new ModelWeightPathInvalidError(filename);
    }

    try {
      await unlink(resolved);
    } catch {
      throw new ModelWeightNotFoundError(filename);
    }
  }
}
