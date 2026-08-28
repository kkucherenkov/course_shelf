/**
 * Unit tests for AdminBackupController.
 *
 * This controller is the one route in the admin module that is NOT behind
 * AdminGuard, so its own checks are the only thing standing in front of a full
 * database dump. The tests below are therefore mostly about refusals:
 *
 *   1. No token → 401-class error, and neither the signer nor the filesystem
 *      is consulted.
 *   2. Empty token → same.
 *   3. An invalid token is rejected *before* the archive is located, so an
 *      unauthenticated caller cannot probe which ids exist.
 *   4. Happy path streams the file with attachment headers and the exact size.
 *   5. A client disconnect destroys the read stream rather than leaking it.
 */
import { PassThrough } from 'node:stream';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({ createReadStream: vi.fn() }));

import { createReadStream } from 'node:fs';

import { AdminBackupController } from './admin-backup.controller';
import { BackupTokenInvalidError } from './domain/backup/backup.errors';

import type { BackupArchiver } from './domain/backup/backup-archiver.port';
import type { BackupTokenSigner } from './domain/backup/backup-token-signer';
import type { Request, Response } from 'express';

const ID = '20260829T014500-3f9a2c1b8e7d4a6f';

const ARCHIVE = {
  id: ID,
  filePath: `/tmp/cs-backups/${ID}.dump`,
  sizeBytes: 4_718_592,
  createdAt: new Date('2026-08-29T01:45:00Z'),
};

function makeRes(): Response & { headers: Record<string, unknown>; statusCode: number } {
  const sink = new PassThrough();
  const headers: Record<string, unknown> = {};
  return Object.assign(sink, {
    headers,
    statusCode: 0,
    setHeader: vi.fn((k: string, v: unknown) => {
      headers[k] = v;
    }),
    status: vi.fn(function (this: { statusCode: number }, code: number) {
      this.statusCode = code;
      return this;
    }),
  }) as unknown as Response & { headers: Record<string, unknown>; statusCode: number };
}

/**
 * The controller only needs `req.on('close', …)`. A two-method stand-in keeps
 * the test off Node's EventEmitter, which the lint config bans in favour of
 * EventTarget — and EventTarget does not speak the `.on()` API express uses.
 */
function makeReq(): Request & { emit: (event: string) => void } {
  const listeners: Record<string, (() => void)[]> = {};
  return {
    on(event: string, handler: () => void) {
      (listeners[event] ??= []).push(handler);
      return this;
    },
    emit(event: string) {
      for (const handler of listeners[event] ?? []) handler();
    },
  } as unknown as Request & { emit: (event: string) => void };
}

function build(overrides: { verify?: () => unknown; locate?: () => unknown } = {}): {
  controller: AdminBackupController;
  archiver: BackupArchiver;
  signer: BackupTokenSigner;
} {
  const archiver = {
    create: vi.fn(),
    locate: overrides.locate ?? vi.fn().mockResolvedValue(ARCHIVE),
  } as unknown as BackupArchiver;
  const signer = {
    verify: overrides.verify ?? vi.fn().mockReturnValue({ userId: 'usr_admin_1' }),
  } as unknown as BackupTokenSigner;
  return { controller: new AdminBackupController(archiver, signer), archiver, signer };
}

describe('AdminBackupController', () => {
  beforeEach(() => {
    vi.mocked(createReadStream).mockImplementation(() => {
      const s = new PassThrough();
      Object.assign(s, { destroy: vi.fn(s.destroy.bind(s)) });
      s.end('dump-bytes');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test double
      return s as any;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
  ])('refuses a %s token without consulting the signer or the disk', async (_l, token) => {
    const { controller, archiver, signer } = build();

    await expect(controller.download(makeReq(), makeRes(), ID, token)).rejects.toThrow(
      BackupTokenInvalidError,
    );
    expect(signer.verify).not.toHaveBeenCalled();
    expect(archiver.locate).not.toHaveBeenCalled();
  });

  it('verifies the token before locating the archive', async () => {
    const boom = new BackupTokenInvalidError('nope');
    const { controller, archiver } = build({
      verify: vi.fn(() => {
        throw boom;
      }),
    });

    await expect(controller.download(makeReq(), makeRes(), ID, 'bad')).rejects.toThrow(boom);
    // The refusal must not depend on whether the file exists — otherwise the
    // error shape leaks which ids are real.
    expect(archiver.locate).not.toHaveBeenCalled();
  });

  it('streams the archive as an attachment with the exact length', async () => {
    const { controller, signer } = build();
    const res = makeRes();

    await controller.download(makeReq(), res, ID, 'good');

    expect(signer.verify).toHaveBeenCalledWith('good', ID);
    expect(res.headers['Content-Type']).toBe('application/octet-stream');
    expect(res.headers['Content-Length']).toBe(ARCHIVE.sizeBytes);
    expect(res.headers['Content-Disposition']).toBe(
      `attachment; filename="courseshelf-${ID}.dump"`,
    );
    expect(res.headers['Cross-Origin-Resource-Policy']).toBe('cross-origin');
    expect(res.statusCode).toBe(200);
  });

  it('destroys the read stream when the client disconnects', async () => {
    const { controller } = build();
    const req = makeReq();
    let opened: PassThrough | undefined;
    vi.mocked(createReadStream).mockImplementation(() => {
      opened = new PassThrough();
      opened.end('dump-bytes');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test double
      return opened as any;
    });

    await controller.download(req, makeRes(), ID, 'good');
    req.emit('close');

    expect(opened?.destroyed).toBe(true);
  });
});
