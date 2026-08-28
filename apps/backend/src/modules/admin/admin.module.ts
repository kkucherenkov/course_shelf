import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { BACKUP_ARCHIVER } from './domain/backup/backup-archiver.port';
import { BackupTokenSigner } from './domain/backup/backup-token-signer';
import { DASHBOARD_PORT } from './domain/dashboard.port';
import { PgDumpArchiver } from './infra/pg-dump-archiver';
import { PrismaDashboardAdapter } from './infra/prisma-dashboard.adapter';
import { AdminBackupController } from './admin-backup.controller';
import { AdminController } from './admin.controller';
import { AdminPublicController } from './admin-public.controller';
import { GetAdminDashboardHandler } from './application/queries/get-admin-dashboard.handler';
import { GetAdminUserHandler } from './application/queries/get-admin-user.handler';
import { ListAdminLibrariesHandler } from './application/queries/list-admin-libraries.handler';
import { ListAdminScansHandler } from './application/queries/list-admin-scans.handler';
import { ListAdminUsersHandler } from './application/queries/list-admin-users.handler';
import { CreateBackupHandler } from './application/commands/create-backup.handler';
import { UpdateAdminUserHandler } from './application/commands/update-admin-user.handler';

// AdminGuard's dependencies (AuthService, I18nService) are provided globally
// by AuthModule (@Global) and I18nModule — no extra imports needed here.

@Module({
  imports: [CqrsModule],
  controllers: [AdminController, AdminPublicController, AdminBackupController],
  providers: [
    AdminGuard,
    GetAdminDashboardHandler,
    GetAdminUserHandler,
    ListAdminLibrariesHandler,
    ListAdminScansHandler,
    ListAdminUsersHandler,
    UpdateAdminUserHandler,
    CreateBackupHandler,
    BackupTokenSigner,
    { provide: DASHBOARD_PORT, useClass: PrismaDashboardAdapter },
    { provide: BACKUP_ARCHIVER, useClass: PgDumpArchiver },
  ],
})
export class AdminModule {}
