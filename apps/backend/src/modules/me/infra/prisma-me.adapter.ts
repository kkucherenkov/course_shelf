import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';

import type { MePort } from '../domain/me.port';
import type { AdminUserRole, MeDto } from '@app/api-client-ts';

/** Known DB role values (uppercase). Anything else falls back defensively. */
const KNOWN_DB_ROLES = new Set(['ADMIN', 'USER', 'GUEST']);

/**
 * Normalise a DB role string to the lowercase `AdminUserRole` expected by the
 * API. Unknown values fall back to `'user'` with a warning so future DB values
 * do not hard-crash the endpoint.
 *
 * Inlined here rather than imported from admin infra to keep module boundaries
 * clean — the boundary linter forbids cross-module infra imports.
 */
function normaliseRole(dbRole: string, logger: Logger, userId: string): AdminUserRole {
  const lower = dbRole.toLowerCase() as AdminUserRole;
  if (KNOWN_DB_ROLES.has(dbRole.toUpperCase())) {
    return lower;
  }
  logger.warn(`Unknown role value "${dbRole}" for user ${userId} — falling back to "user"`);
  return 'user';
}

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  displayName: true,
  role: true,
} as const;

@Injectable()
export class PrismaMeAdapter implements MePort {
  private readonly logger = new Logger(PrismaMeAdapter.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string): Promise<MeDto | null> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });

    if (row === null) {
      return null;
    }

    return this.toDto(row);
  }

  async updateProfile(
    userId: string,
    patch: { displayName?: string | null },
  ): Promise<MeDto | null> {
    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(patch.displayName === undefined ? {} : { displayName: patch.displayName }),
        },
        select: USER_SELECT,
      });

      return this.toDto(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  async revokeOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: {
        userId,
        NOT: { id: currentSessionId },
      },
    });
  }

  private toDto(row: {
    id: string;
    email: string;
    name: string;
    displayName: string | null;
    role: string;
  }): MeDto {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      displayName: row.displayName ?? null,
      role: normaliseRole(row.role, this.logger, row.id),
    };
  }
}
