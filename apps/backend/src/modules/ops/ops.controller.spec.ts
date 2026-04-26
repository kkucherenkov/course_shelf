/**
 * WHY this file exists:
 * Unit tests for OpsController. No I/O: PrismaService is mocked.
 *
 * Scenarios:
 *   - liveness() always returns { status: 'ok' } (no I/O involved).
 *   - readiness() returns { status: 'ok' } when DB query resolves.
 *   - readiness() sets 503 and returns { status: 'down' } when DB query rejects.
 */
import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { OpsController } from './ops.controller';

function makePrisma(rejects = false) {
  return {
    $queryRawUnsafe: rejects
      ? vi.fn().mockRejectedValue(new Error('DB down'))
      : vi.fn().mockResolvedValue([{ '?column?': 1 }]),
  };
}

function makeRes() {
  const res = { statusCode: 200, status: vi.fn() };
  res.status.mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  return res;
}

describe('OpsController', () => {
  describe('liveness()', () => {
    it('returns { status: "ok" } without any I/O', () => {
      const controller = new OpsController(makePrisma() as never);
      expect(controller.liveness()).toEqual({ status: 'ok' });
    });
  });

  describe('readiness()', () => {
    it('returns { status: "ok" } when prisma query resolves', async () => {
      const controller = new OpsController(makePrisma() as never);
      const res = makeRes();

      const result = await controller.readiness(res as never);

      expect(result).toEqual({ status: 'ok' });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('sets 503 and returns { status: "down" } when prisma query rejects', async () => {
      const controller = new OpsController(makePrisma(true) as never);
      const res = makeRes();

      const result = await controller.readiness(res as never);

      expect(result).toEqual({ status: 'down' });
      expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    });
  });
});
