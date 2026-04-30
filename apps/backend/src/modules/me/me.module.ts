import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ME_PORT } from './domain/me.port';
import { PrismaMeAdapter } from './infra/prisma-me.adapter';
import { MeController } from './me.controller';
import { UpdateMeHandler } from './application/commands/update-me.handler';
import { SignOutOthersHandler } from './application/commands/sign-out-others.handler';

// PrismaService is provided globally by PrismaModule — no extra import needed.

@Module({
  imports: [CqrsModule],
  controllers: [MeController],
  providers: [
    UpdateMeHandler,
    SignOutOthersHandler,
    { provide: ME_PORT, useClass: PrismaMeAdapter },
  ],
})
export class MeModule {}
