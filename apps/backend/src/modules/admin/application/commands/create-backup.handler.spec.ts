/**
 * Unit tests for CreateBackupHandler.
 *
 *   1. Produces the archive and returns its metadata verbatim.
 *   2. Mints a token bound to the archive id and the calling admin.
 *   3. The URL is a same-origin relative path carrying the token, so a plain
 *      `<a href download>` works — the whole reason this flow has a token.
 *   4. The token is percent-encoded into the query string.
 *   5. An archiver failure propagates untouched (the handler must not turn a
 *      503 into a signed link to a file that does not exist).
 */
import { describe, expect, it, vi } from 'vitest';

import { CreateBackupCommand } from './create-backup.command';
import { CreateBackupHandler } from './create-backup.handler';

import type { AppConfig } from '../../../../common/config/app-config';
import type { BackupArchiver } from '../../domain/backup/backup-archiver.port';
import type { BackupTokenSigner } from '../../domain/backup/backup-token-signer';

const ARCHIVE = {
  id: '20260829T014500-3f9a2c1b8e7d4a6f',
  filePath: '/tmp/cs-backups/20260829T014500-3f9a2c1b8e7d4a6f.dump',
  sizeBytes: 4_718_592,
  createdAt: new Date('2026-08-29T01:45:00Z'),
};

function makeHandler(overrides: { archiver?: Partial<BackupArchiver> } = {}): {
  handler: CreateBackupHandler;
  signer: BackupTokenSigner;
  archiver: BackupArchiver;
} {
  const archiver = {
    create: vi.fn().mockResolvedValue(ARCHIVE),
    locate: vi.fn(),
    ...overrides.archiver,
  } as unknown as BackupArchiver;

  const signer = {
    sign: vi.fn().mockReturnValue({
      token: 'tok en/with+chars',
      expiresAt: new Date('2026-08-29T01:50:00Z'),
    }),
  } as unknown as BackupTokenSigner;

  const config = { backups: { ttlSeconds: 300 } } as unknown as AppConfig;

  return { handler: new CreateBackupHandler(archiver, signer, config), signer, archiver };
}

describe('CreateBackupHandler', () => {
  it('returns the archive metadata and expiry', async () => {
    const { handler } = makeHandler();

    const dto = await handler.execute(new CreateBackupCommand('usr_admin_1'));

    expect(dto.id).toBe(ARCHIVE.id);
    expect(dto.sizeBytes).toBe(ARCHIVE.sizeBytes);
    expect(dto.createdAt).toBe('2026-08-29T01:45:00.000Z');
    expect(dto.expiresAt).toBe('2026-08-29T01:50:00.000Z');
  });

  it('binds the token to the archive and the calling admin', async () => {
    const { handler, signer } = makeHandler();

    await handler.execute(new CreateBackupCommand('usr_admin_1'));

    expect(signer.sign).toHaveBeenCalledWith({
      userId: 'usr_admin_1',
      backupId: ARCHIVE.id,
      ttlSeconds: 300,
    });
  });

  it('returns a same-origin relative URL with the token percent-encoded', async () => {
    const { handler } = makeHandler();

    const dto = await handler.execute(new CreateBackupCommand('usr_admin_1'));

    expect(dto.url).toBe(
      `/api/v1/admin/backups/${ARCHIVE.id}/download?token=tok%20en%2Fwith%2Bchars`,
    );
    // Relative, because the backend sits behind the proxy and does not know its
    // own public hostname.
    expect(dto.url.startsWith('/')).toBe(true);
    expect(dto.token).toBe('tok en/with+chars');
  });

  it('propagates an archiver failure instead of returning a link', async () => {
    const boom = new Error('pg_dump exploded');
    const { handler, signer } = makeHandler({
      archiver: { create: vi.fn().mockRejectedValue(boom) },
    });

    await expect(handler.execute(new CreateBackupCommand('usr_admin_1'))).rejects.toThrow(boom);
    expect(signer.sign).not.toHaveBeenCalled();
  });
});
