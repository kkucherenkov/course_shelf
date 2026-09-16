/**
 * Unit tests for FsModelWeightsAdapter — real filesystem, no mocking, mirrors
 * mock-whisper.adapter.spec.ts's tmpdir approach.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  ModelWeightNotFoundError,
  ModelWeightPathInvalidError,
} from '../domain/model-weights/model-weights.errors';
import { FsModelWeightsAdapter } from './fs-model-weights.adapter';

import type { AppConfig } from '../../../common/config/app-config';

function makeAppConfig(modelWeightsDir: string): AppConfig {
  return { modelWeightsDir } as unknown as AppConfig;
}

describe('FsModelWeightsAdapter', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'model-weights-'));
  });

  afterEach(async () => {
    await rm(dir, { force: true, recursive: true });
  });

  it('lists files with size and classifies .gguf as usable for quiz generation', async () => {
    await writeFile(path.join(dir, 'ggml-base.bin'), 'x'.repeat(10));
    await writeFile(path.join(dir, 'model.gguf'), 'x'.repeat(20));
    const adapter = new FsModelWeightsAdapter(makeAppConfig(dir));

    const files = await adapter.list();

    expect(files).toHaveLength(2);
    const bin = files.find((f) => f.filename === 'ggml-base.bin')!;
    const gguf = files.find((f) => f.filename === 'model.gguf')!;
    expect(bin).toMatchObject({ sizeBytes: 10, usableForQuizGeneration: false });
    expect(gguf).toMatchObject({ sizeBytes: 20, usableForQuizGeneration: true });
  });

  it('returns an empty list when the directory does not exist yet', async () => {
    const adapter = new FsModelWeightsAdapter(makeAppConfig(path.join(dir, 'not-there')));
    expect(await adapter.list()).toEqual([]);
  });

  it('ignores subdirectories', async () => {
    await mkdir(path.join(dir, 'a-subdir'));
    await writeFile(path.join(dir, 'model.gguf'), 'x');
    const adapter = new FsModelWeightsAdapter(makeAppConfig(dir));

    const files = await adapter.list();

    expect(files.map((f) => f.filename)).toEqual(['model.gguf']);
  });

  it('deletes a file by bare filename', async () => {
    const filePath = path.join(dir, 'model.gguf');
    await writeFile(filePath, 'x');
    const adapter = new FsModelWeightsAdapter(makeAppConfig(dir));

    await adapter.delete('model.gguf');

    expect(await adapter.list()).toEqual([]);
  });

  it('throws ModelWeightNotFoundError for a missing file', async () => {
    const adapter = new FsModelWeightsAdapter(makeAppConfig(dir));
    await expect(adapter.delete('nope.gguf')).rejects.toBeInstanceOf(ModelWeightNotFoundError);
  });

  it('throws ModelWeightPathInvalidError for a filename containing a separator', async () => {
    const adapter = new FsModelWeightsAdapter(makeAppConfig(dir));
    await expect(adapter.delete('../escape.gguf')).rejects.toBeInstanceOf(
      ModelWeightPathInvalidError,
    );
    await expect(adapter.delete('sub/dir.gguf')).rejects.toBeInstanceOf(
      ModelWeightPathInvalidError,
    );
  });
});
