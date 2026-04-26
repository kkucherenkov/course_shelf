/**
 * WHY this file exists:
 * Centralises the aggregate → wire DTO mapping so it can be shared between
 * query handlers and the controller without duplicating field access.
 *
 * Output type is sourced from the generated @app/api-client-ts package so it
 * stays in sync with the OpenAPI spec automatically.
 *
 * Timestamps are serialised as ISO-8601 strings with UTC offset per the API
 * design convention in handbook.md. JavaScript Date objects carry UTC
 * internally; toISOString() always produces a 'Z'-suffixed string which is
 * unambiguous and RFC 3339-compliant.
 */
import type { Library } from './domain/library/library';
import type { LibraryDto } from '@app/api-client-ts';

export function toLibraryDto(library: Library): LibraryDto {
  return {
    id: library.id,
    name: library.name,
    rootPath: library.rootPath,
    createdAt: library.createdAt.toISOString(),
    updatedAt: library.updatedAt.toISOString(),
  };
}
