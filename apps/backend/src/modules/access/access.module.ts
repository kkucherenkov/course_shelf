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
 * exports: [GRANT_REPOSITORY] — exported so CommonAccessModule (src/common/access/)
 * can bind LruAuthorizationService against the same adapter without duplicating
 * the PrismaGrantRepository registration. This is the one deliberate
 * common→module dependency permitted by the architecture: the common layer
 * depends on the Access module's persistence port, not on any bounded-context
 * business logic. No other module may import AccessModule for this purpose.
 */
import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { CommonAccessModule } from '../../common/access/access.module';

import { RegisterGrantHandler } from './application/commands/register-grant.handler';
import { RevokeGrantHandler } from './application/commands/revoke-grant.handler';
import { GetGrantHandler } from './application/queries/get-grant.handler';
import { ListUserGrantsHandler } from './application/queries/list-user-grants.handler';
import { AccessController } from './access.controller';
import { GRANT_REPOSITORY } from './domain/grant/grant.repository';
import { PrismaGrantRepository } from './infra/prisma-grant.repository';

@Module({
  imports: [CqrsModule, forwardRef(() => CommonAccessModule)],
  controllers: [AccessController],
  providers: [
    RegisterGrantHandler,
    RevokeGrantHandler,
    GetGrantHandler,
    ListUserGrantsHandler,
    AdminGuard,
    { provide: GRANT_REPOSITORY, useClass: PrismaGrantRepository },
  ],
  exports: [GRANT_REPOSITORY],
})
export class AccessModule {}
