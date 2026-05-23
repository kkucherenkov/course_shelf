/**
 * WHY this file exists:
 * Resolves a scraper for a ScrapeCourseCommand and returns preview candidates.
 * Verifies the target course exists, picks the scraper (explicit source →
 * registry.get; url-kind → auto-detect via findByUrl; fragment without source →
 * json-ld; name without source → error), checks the kind is supported, and
 * delegates. Performs NO writes — persistence/merge is Stage 4.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import {
  ScraperKindUnsupportedError,
  ScraperNotFoundError,
} from '../../domain/scraper/scraper.errors';
import { SCRAPER_REGISTRY } from '../../domain/scraper/scraper.port';
import { ScrapeCourseCommand } from './scrape-course.command';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { Scraper, ScraperRegistry } from '../../domain/scraper/scraper.port';
import type { ScrapeCandidate } from '../../domain/scraper/scraper.types';

@CommandHandler(ScrapeCourseCommand)
export class ScrapeCourseHandler implements ICommandHandler<
  ScrapeCourseCommand,
  ScrapeCandidate[]
> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(SCRAPER_REGISTRY) private readonly registry: ScraperRegistry,
  ) {}

  async execute(command: ScrapeCourseCommand): Promise<ScrapeCandidate[]> {
    const course = await this.courseRepo.findById(command.courseId);
    if (!course) throw new CourseNotFoundError(command.courseId);

    const scraper = this.resolveScraper(command);
    if (!scraper.supportedKinds.includes(command.request.kind)) {
      throw new ScraperKindUnsupportedError(scraper.id, command.request.kind);
    }
    return scraper.scrape(command.request);
  }

  private resolveScraper(command: ScrapeCourseCommand): Scraper {
    if (command.source !== undefined) return this.registry.get(command.source);

    const { request } = command;
    if (request.kind === 'url') {
      return this.registry.findByUrl(request.url) ?? this.registry.get('json-ld');
    }
    if (request.kind === 'fragment') return this.registry.get('json-ld');
    // name-kind requires an explicit source — there is nothing to auto-detect from.
    throw new ScraperNotFoundError('(none — name-kind needs an explicit source)');
  }
}
