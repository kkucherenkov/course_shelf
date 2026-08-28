import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AppConfig } from '../../../../common/config/app-config';
import { BACKUP_ARCHIVER } from '../../domain/backup/backup-archiver.port';
import { BackupTokenSigner } from '../../domain/backup/backup-token-signer';
import { CreateBackupCommand } from './create-backup.command';

import type { BackupArchiver } from '../../domain/backup/backup-archiver.port';
import type { BackupCreatedDto } from '@app/api-client-ts';

/**
 * Produces the archive, then mints the link that downloads it.
 *
 * The URL is a same-origin *relative* path, matching issueStreamUrl and
 * issueMaterialDownloadUrl: the backend does not know its own public hostname
 * (it sits behind the nginx proxy), and the SPA resolves the path against the
 * API origin it already uses.
 */
@Injectable()
@CommandHandler(CreateBackupCommand)
export class CreateBackupHandler implements ICommandHandler<CreateBackupCommand, BackupCreatedDto> {
  constructor(
    @Inject(BACKUP_ARCHIVER) private readonly archiver: BackupArchiver,
    private readonly signer: BackupTokenSigner,
    private readonly config: AppConfig,
  ) {}

  async execute(command: CreateBackupCommand): Promise<BackupCreatedDto> {
    const archive = await this.archiver.create();

    const { token, expiresAt } = this.signer.sign({
      userId: command.userId,
      backupId: archive.id,
      ttlSeconds: this.config.backups.ttlSeconds,
    });

    return {
      id: archive.id,
      createdAt: archive.createdAt.toISOString(),
      sizeBytes: archive.sizeBytes,
      url: `/api/v1/admin/backups/${archive.id}/download?token=${encodeURIComponent(token)}`,
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
