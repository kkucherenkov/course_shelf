/**
 * WHY this file exists:
 * Composition root for the Access bounded context. It wires together:
 *   - AccessController (HTTP entry point)
 *   - Command/query handlers (application layer)
 *   - PrismaGrantRepository bound behind the GRANT_REPOSITORY port token
 *   - AdminGuard (provided here; AuthService is global via AuthModule)
 *
 * Nothing outside this module knows about PrismaGrantRepository. If we ever
 * swap the adapter, only this binding changes.
 *
 * exports: [] — cross-module access goes through events or a public facade,
 * never through direct imports.
 */
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';

import { RegisterGrantHandler } from './application/commands/register-grant.handler';
import { RevokeGrantHandler } from './application/commands/revoke-grant.handler';
import { GetGrantHandler } from './application/queries/get-grant.handler';
import { ListUserGrantsHandler } from './application/queries/list-user-grants.handler';
import { AccessController } from './access.controller';
import { GRANT_REPOSITORY } from './domain/grant/grant.repository';
import { PrismaGrantRepository } from './infra/prisma-grant.repository';

@Module({
  imports: [CqrsModule],
  controllers: [AccessController],
  providers: [
    RegisterGrantHandler,
    RevokeGrantHandler,
    GetGrantHandler,
    ListUserGrantsHandler,
    AdminGuard,
    { provide: GRANT_REPOSITORY, useClass: PrismaGrantRepository },
  ],
})
export class AccessModule {}
