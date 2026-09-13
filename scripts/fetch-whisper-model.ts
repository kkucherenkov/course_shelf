#!/usr/bin/env node
/**
 * Downloads a whisper.cpp ggml model into $WHISPER_MODEL_DIR (default ./models)
 * so `docker compose up` can transcribe without a hand-rolled curl.
 *
 * Idempotent: if the target file already exists, exits 0 without touching the
 * network — safe to run on every `pnpm dev:up`.
 *
 * Usage:
 *   pnpm whisper:model [tiny|base|small|medium|large-v3]   # default: base
 *   node --experimental-strip-types scripts/fetch-whisper-model.ts [size]
 */
import { createWriteStream, existsSync, mkdirSync, renameSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const SIZES = ['tiny', 'base', 'small', 'medium', 'large-v3'] as const;
type Size = (typeof SIZES)[number];

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');

const requested = process.argv[2] ?? 'base';
if (!(SIZES as readonly string[]).includes(requested)) {
  console.error(`Unknown model size: "${requested}". Valid sizes: ${SIZES.join(', ')}`);
  process.exit(1);
}
const size = requested as Size;

const modelDir = path.resolve(repo, process.env.WHISPER_MODEL_DIR ?? './models');
const fileName = `ggml-${size}.bin`;
const destPath = path.join(modelDir, fileName);
const url = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${fileName}`;

if (existsSync(destPath)) {
  console.log(`${fileName} already at ${destPath} — skipping download.`);
  process.exit(0);
}

mkdirSync(modelDir, { recursive: true });

const tmpPath = `${destPath}.part`;
const res = await fetch(url);
if (!res.ok || !res.body) {
  console.error(`GET ${url} → ${res.status} ${res.statusText}`);
  process.exit(1);
}

console.log(`Downloading ${fileName} → ${destPath} …`);
try {
  await pipeline(Readable.fromWeb(res.body), createWriteStream(tmpPath));
  renameSync(tmpPath, destPath);
  console.log(`Done: ${destPath}`);
} catch (error) {
  if (existsSync(tmpPath)) unlinkSync(tmpPath);
  throw error;
}
