/**
 * WHY this file exists:
 * Admin-only HTTP entry point for the scraping subsystem (Stage 2). Two routes:
 *   - GET  /api/v1/admin/scrapers                       → list configured scrapers
 *   - POST /api/v1/admin/courses/{id}/scrape-preview    → preview candidates
 * Both are guarded by AdminGuard. The controller does composition only:
 * dispatches the CQRS command and shapes the OpenAPI response. Domain errors
 * thrown by the handler become RFC 9457 problems via the global filter.
 */
import { Body, Controller, Get, HttpCode, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { ScrapeCourseCommand } from './application/commands/scrape-course.command';
import { SCRAPER_REGISTRY } from './domain/scraper/scraper.port';

import type { ScraperRegistry } from './domain/scraper/scraper.port';
import type { ScrapeCandidate, ScrapeRequest } from './domain/scraper/scraper.types';
import type {
  ScrapePreviewRequest,
  ScrapePreviewResponse,
  ScraperListDto,
} from '@app/api-client-ts';

@UseGuards(AdminGuard)
@Controller({ path: 'admin', version: '1' })
export class CatalogScrapeAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(SCRAPER_REGISTRY) private readonly registry: ScraperRegistry,
  ) {}

  /** GET /api/v1/admin/scrapers */
  @Get('scrapers')
  listScrapers(): ScraperListDto {
    return {
      scrapers: this.registry.all().map((s) => ({
        id: s.id,
        supportedKinds: [...s.supportedKinds],
        configured: true,
      })),
    };
  }

  /** POST /api/v1/admin/courses/:id/scrape-preview */
  @HttpCode(200)
  @Post('courses/:id/scrape-preview')
  async scrapeCoursePreview(
    @Param('id') id: string,
    @Body() body: ScrapePreviewRequest,
  ): Promise<ScrapePreviewResponse> {
    const request = this.toScrapeRequest(body);
    const candidates = await this.commandBus.execute<ScrapeCourseCommand, ScrapeCandidate[]>(
      new ScrapeCourseCommand(id, body.source, request),
    );
    return { candidates: candidates };
  }

  private toScrapeRequest(body: ScrapePreviewRequest): ScrapeRequest {
    if (body.kind === 'url') return { kind: 'url', url: body.url ?? '' };
    if (body.kind === 'name') return { kind: 'name', query: body.query ?? '' };
    return { kind: 'fragment', raw: body.fragment ?? '' };
  }
}
