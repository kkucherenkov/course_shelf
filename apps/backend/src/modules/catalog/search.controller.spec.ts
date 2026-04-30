/**
 * Unit tests for SearchController.
 *
 * Covers:
 *   - parses limit string → int, clamps to [1, 100], defaults to 20
 *   - threads actor from session into the query
 *   - returns the SearchResultDto from the query bus
 *   - handles missing limit (defaults to 20)
 *   - clamps below-min limit to 1
 *   - clamps above-max limit to 100
 *   - handles non-numeric limit (defaults to 20)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SearchController } from './search.controller';
import { SearchCatalogueQuery } from './application/queries/search-catalogue.query';

import type { QueryBus } from '@nestjs/cqrs';
import type { SessionContext } from '../../common/auth/decorators/session.decorator';
import type { SearchResultDto } from '@app/api-client-ts';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeQueryBus(result: SearchResultDto): QueryBus {
  return {
    execute: vi.fn().mockResolvedValue(result),
  } as unknown as QueryBus;
}

const session: SessionContext = {
  user: { id: 'user-1', role: 'user' },
  sessionId: 'session-1',
};

const emptyResult: SearchResultDto = {
  query: 'arch',
  courses: [],
  lessons: [],
};

// ── tests ──────────────────────────────────────────────────────────────────────

describe('SearchController', () => {
  let queryBus: QueryBus;
  let controller: SearchController;

  beforeEach(() => {
    queryBus = makeQueryBus(emptyResult);
    controller = new SearchController(queryBus);
  });

  it('dispatches SearchCatalogueQuery with actor and default limit 20', async () => {
    await controller.searchCatalogue(session, 'arch', undefined);

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        q: 'arch',
        limit: 20,
        actor: session.user,
      }),
    );
  });

  it('parses limit string to integer', async () => {
    await controller.searchCatalogue(session, 'arch', '50');

    expect(queryBus.execute).toHaveBeenCalledWith(expect.objectContaining({ limit: 50 }));
  });

  it('clamps limit below MIN to 1', async () => {
    await controller.searchCatalogue(session, 'arch', '0');

    expect(queryBus.execute).toHaveBeenCalledWith(expect.objectContaining({ limit: 1 }));
  });

  it('clamps limit above MAX to 100', async () => {
    await controller.searchCatalogue(session, 'arch', '999');

    expect(queryBus.execute).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
  });

  it('defaults limit to 20 for non-numeric input', async () => {
    await controller.searchCatalogue(session, 'arch', 'abc');

    expect(queryBus.execute).toHaveBeenCalledWith(expect.objectContaining({ limit: 20 }));
  });

  it('returns the result from the query bus', async () => {
    const expected: SearchResultDto = {
      query: 'arch',
      courses: [
        {
          id: 'c1',
          libraryId: 'lib-1',
          title: 'Architecture',
          slug: 'architecture',
          lessonsTotal: 5,
        },
      ],
      lessons: [],
    };
    queryBus = makeQueryBus(expected);
    controller = new SearchController(queryBus);

    const result = await controller.searchCatalogue(session, 'arch', undefined);

    expect(result).toEqual(expected);
  });

  it('dispatches a SearchCatalogueQuery instance (not a plain object)', async () => {
    await controller.searchCatalogue(session, 'arch', undefined);

    const call = vi.mocked(queryBus.execute).mock.calls[0]?.[0];
    expect(call).toBeInstanceOf(SearchCatalogueQuery);
  });
});
