import { describe, expect, it, vi } from 'vitest';

import { CatalogScrapeAdminController } from './catalog-scrape-admin.controller';
import { ScrapeCourseCommand } from './application/commands/scrape-course.command';
import type { CommandBus } from '@nestjs/cqrs';
import type { ScraperRegistry } from './domain/scraper/scraper.port';

function commandBus(result: unknown): CommandBus {
  return { execute: vi.fn(async () => result) } as unknown as CommandBus;
}

const registry = {
  all: () => [
    {
      id: 'json-ld',
      supportedKinds: ['url', 'fragment'],
      canHandle: () => true,
      scrape: async () => [],
    },
  ],
} as unknown as ScraperRegistry;

describe('CatalogScrapeAdminController', () => {
  it('GET /admin/scrapers maps the registry to ScraperListDto', () => {
    const controller = new CatalogScrapeAdminController(commandBus([]), registry);
    expect(controller.listScrapers()).toEqual({
      scrapers: [{ id: 'json-ld', supportedKinds: ['url', 'fragment'], configured: true }],
    });
  });

  it('POST scrape-preview dispatches a ScrapeCourseCommand and wraps candidates', async () => {
    const bus = commandBus([{ source: 'json-ld', fragment: { title: 'X' } }]);
    const controller = new CatalogScrapeAdminController(bus, registry);
    const res = await controller.scrapeCoursePreview('c1', { kind: 'url', url: 'https://x.test' });
    expect(bus.execute).toHaveBeenCalledWith(expect.any(ScrapeCourseCommand));
    expect(res).toEqual({ candidates: [{ source: 'json-ld', fragment: { title: 'X' } }] });
  });

  // tuxedo 90: a pasted fragment's optional `url` becomes the request's sourceUrl.
  it('maps a fragment request url to sourceUrl on the ScrapeRequest', async () => {
    const bus = commandBus([]);
    const controller = new CatalogScrapeAdminController(bus, registry);
    await controller.scrapeCoursePreview('c1', {
      kind: 'fragment',
      fragment: '<html>…</html>',
      source: 'udemy',
      url: 'https://www.udemy.com/course/docker-mastery/',
    });
    const command = vi.mocked(bus.execute).mock.calls[0]![0] as ScrapeCourseCommand;
    expect(command.request).toEqual({
      kind: 'fragment',
      raw: '<html>…</html>',
      sourceUrl: 'https://www.udemy.com/course/docker-mastery/',
    });
  });

  it('omits sourceUrl on a fragment request with no url', async () => {
    const bus = commandBus([]);
    const controller = new CatalogScrapeAdminController(bus, registry);
    await controller.scrapeCoursePreview('c1', { kind: 'fragment', fragment: '<html>…</html>' });
    const command = vi.mocked(bus.execute).mock.calls[0]![0] as ScrapeCourseCommand;
    expect(command.request).toEqual({ kind: 'fragment', raw: '<html>…</html>' });
  });
});
