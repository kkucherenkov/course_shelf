/**
 * WHY this file exists:
 * Centralises the aggregate → wire DTO mapping so it can be shared between
 * query handlers without duplicating field access.
 *
 * Output type is sourced from the generated @app/api-client-ts package so it
 * stays in sync with the OpenAPI spec automatically.
 *
 * createdAt is serialised as an ISO-8601 string with UTC offset per the API
 * design convention in handbook.md.
 */
import type { AccessGrant } from './domain/grant/grant';
import type { AccessGrantDto } from '@app/api-client-ts';

export function toAccessGrantDto(grant: AccessGrant): AccessGrantDto {
  return {
    id: grant.id,
    userId: grant.userId,
    target: grant.target,
    level: grant.level,
    createdAt: grant.createdAt.toISOString(),
  };
}
