/**
 * WHY this file exists:
 * The binary half of the backup flow. It is a separate controller from
 * AdminController because it must NOT carry `@UseGuards(AdminGuard)`: the
 * browser cannot attach an Authorization header to a plain `<a href download>`,
 * and the web client keeps its bearer token in localStorage, so the signed
 * token in the query string is the auth mechanism — exactly as for lesson and
 * material streaming.
 *
 * That is a deliberate, narrow trade: possession of the link is possession of
 * the archive for the next few minutes. It is mitigated by a short TTL
 * (BACKUP_TOKEN_TTL_SECONDS, default 300), by the id being unguessable, and by
 * the token being bound to one archive id.
 *
 * The route is exempt from express-openapi-validator (see
 * `openapi-validator.middleware.ts`) because it returns an opaque byte stream
 * with no JSON schema — the same exemption the streaming routes carry, recorded
 * in docs/adr/0002-spec-first-openapi.md.
 */
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

import { Controller, Get, Inject, Param, Query, Req, Res } from '@nestjs/common';

import { AllowAnonymous } from '../../common/auth/decorators';
import { BACKUP_ARCHIVER } from './domain/backup/backup-archiver.port';
import { BackupTokenSigner } from './domain/backup/backup-token-signer';
import { BackupTokenInvalidError } from './domain/backup/backup.errors';

import type { BackupArchiver } from './domain/backup/backup-archiver.port';
import type { Request, Response } from 'express';

@Controller({ path: 'admin/backups', version: '1' })
export class AdminBackupController {
  constructor(
    @Inject(BACKUP_ARCHIVER) private readonly archiver: BackupArchiver,
    private readonly signer: BackupTokenSigner,
  ) {}

  @AllowAnonymous()
  @Get(':id/download')
  async download(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('token') token?: string,
  ): Promise<void> {
    if (!token) {
      throw new BackupTokenInvalidError('Backup token is required.');
    }
    // Verify before touching the filesystem: an unauthenticated caller must not
    // be able to probe which ids exist by timing or by error shape.
    this.signer.verify(token, id);

    const archive = await this.archiver.locate(id);

    // Mirrors the material download: the link may be followed from a different
    // origin than the API, so CORP must not block it.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', archive.sizeBytes);
    res.setHeader('Content-Disposition', `attachment; filename="courseshelf-${id}.dump"`);

    res.status(200);
    const stream = createReadStream(archive.filePath);
    req.on('close', () => stream.destroy());
    await pipeline(stream, res);
  }
}
