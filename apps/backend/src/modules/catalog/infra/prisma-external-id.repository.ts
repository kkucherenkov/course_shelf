/**
 * WHY this file exists:
 * Prisma adapter that implements the ExternalIdRepository port. The ExternalId
 * table is a polymorphic association table — it links (source, externalId) pairs
 * to any entity type (course, instructor, studio, tag). Because Prisma does not
 * support polymorphic relations natively, external ids are managed here in a
 * dedicated adapter rather than through each aggregate's own repository.
 *
 * replaceForEntity uses delete-then-createMany inside the caller-supplied
 * transaction (or the adapter's own prisma client when no tx is supplied) so
 * the replace is always atomic.
 *
 * P2002 on (source, externalId) unique index → ExternalIdConflictError so the
 * application layer stays free of Prisma types.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { ExternalIdConflictError } from '../domain/shared-vo/shared.errors';

import type {
  ExternalIdRepository,
  ExternalIdEntityType,
} from '../domain/shared-vo/external-id.repository';
import type { ExternalIdRef } from '../domain/shared-vo/external-id-ref';

@Injectable()
export class PrismaExternalIdRepository implements ExternalIdRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Replace the full set of external ids for one entity atomically.
   * Accepts an optional Prisma transaction client via the tx parameter.
   * The port uses `unknown` at the boundary; we narrow here so callers that
   * compose this write with their own aggregate upsert share one transaction.
   */
  async replaceForEntity(
    entityType: ExternalIdEntityType,
    entityId: string,
    refs: readonly ExternalIdRef[],
    tx?: unknown,
  ): Promise<void> {
    // WHY: tx is `unknown` at the port boundary to avoid leaking Prisma types into
    // the domain layer. We narrow it here so we can use Prisma's transaction client
    // when one is provided, and fall back to the injected prisma instance otherwise.
    const client = (tx as Prisma.TransactionClient | undefined) ?? this.prisma;

    try {
      await client.externalId.deleteMany({ where: { entityType, entityId } });

      if (refs.length > 0) {
        await client.externalId.createMany({
          data: refs.map((r) => ({
            entityType,
            entityId,
            source: r.source,
            externalId: r.externalId,
            url: r.url ?? null,
          })),
        });
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Extract the conflicting (source, externalId) for a useful error message.
        // meta.target contains the constraint fields when available.
        const first = refs[0];
        throw new ExternalIdConflictError(
          first?.source ?? 'unknown',
          first?.externalId ?? 'unknown',
        );
      }
      throw error;
    }
  }

  /**
   * Return all external id refs owned by the given entity, ordered by createdAt asc.
   * Returns an empty array when no refs exist.
   */
  async findByEntity(entityType: ExternalIdEntityType, entityId: string): Promise<ExternalIdRef[]> {
    const rows = await this.prisma.externalId.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((r) => ({
      source: r.source,
      externalId: r.externalId,
      ...(r.url === null ? {} : { url: r.url }),
    }));
  }

  /**
   * Reverse lookup: given (source, externalId), return the owning entity.
   * Returns null when no match exists.
   * The unique constraint name in the schema is "uq_external_id_source_value",
   * which Prisma uses as the compound key field name in the generated client.
   */
  async findEntity(
    source: string,
    externalId: string,
  ): Promise<{ entityType: ExternalIdEntityType; entityId: string; url: string | null } | null> {
    const row = await this.prisma.externalId.findUnique({
      where: { uq_external_id_source_value: { source, externalId } },
    });

    if (!row) return null;

    return {
      entityType: row.entityType,
      entityId: row.entityId,
      url: row.url,
    };
  }
}
