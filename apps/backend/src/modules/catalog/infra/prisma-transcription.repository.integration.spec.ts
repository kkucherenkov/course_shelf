/**
 * Integration test for PrismaTranscriptionRepository.findStaleRunning (#525).
 *
 * Requires a reachable Postgres on `docker/compose.yml`'s dev port/credentials
 * (`course-shelf`/`course-shelf`). The suite skips itself when it cannot log
 * in with those credentials — a bare TCP-reachability check is not enough on
 * this project's own dev machines, where an unrelated project's Postgres
 * routinely squats port 5432 (see the "shared-host port collisions" note);
 * connecting with the wrong credentials to the wrong database must read as
 * "not available", not as a connection error. CI's unit-test job has no
 * Postgres at all (see COMMON.md) and skips the same way — the same pattern
 * `local-ffmpeg.adapter.integration.spec.ts` uses for a missing ffmpeg.
 *
 * The reachability check runs inside `beforeAll` rather than as a top-level
 * await: the backend compiles as CommonJS (`packages/tsconfig/nest.json`),
 * where a module-level `await` is not legal syntax at all — this file is
 * only ever evaluated as ESM under Vitest's own transform, not under `tsc`.
 *
 * This is the "not only through mocks" proof the card asked for: two rows are
 * inserted through a real PrismaClient — one tagged with a bootId standing in
 * for "a previous process", one with the current process's — and the real
 * query, against real Postgres, has to tell them apart.
 */
import { randomUUID } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PrismaTranscriptionRepository } from './prisma-transcription.repository';

/** Matches docker/compose.yml's `postgres` service — the stack this repo normally runs. */
const DATABASE_URL = 'postgresql://course-shelf:course-shelf@localhost:5432/course-shelf';

describe('PrismaTranscriptionRepository.findStaleRunning [integration]', () => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });
  const repo = new PrismaTranscriptionRepository(prisma as never);
  const libraryId = `lib-recovery-test-${randomUUID()}`;
  const staleId = `t-stale-${randomUUID()}`;
  const currentId = `t-current-${randomUUID()}`;
  let reachable = true;

  beforeAll(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      reachable = false;
      await prisma.$disconnect();
      return;
    }

    await prisma.transcription.createMany({
      data: [
        {
          id: staleId,
          libraryId,
          status: 'running',
          bootId: 'boot-from-a-previous-process',
          lessonsTotal: 10,
        },
        {
          id: currentId,
          libraryId,
          status: 'running',
          bootId: 'boot-current',
          lessonsTotal: 10,
        },
      ],
    });
  });

  afterAll(async () => {
    if (!reachable) return;
    await prisma.transcription.deleteMany({ where: { libraryId } });
    await prisma.$disconnect();
  });

  it('selects the row a previous boot left running, and none it started itself', async (ctx) => {
    if (!reachable) return ctx.skip();

    const stale = await repo.findStaleRunning('boot-current');
    const ids = stale.map((t) => t.id);

    expect(ids).toContain(staleId);
    expect(ids).not.toContain(currentId);
  });
});
