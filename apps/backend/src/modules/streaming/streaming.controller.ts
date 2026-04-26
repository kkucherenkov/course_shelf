/**
 * WHY this file exists:
 * HTTP entry point for the Streaming bounded context. Follows the exact same
 * pattern as LessonsController:
 *   1. Resolve session → actor (id + role).
 *   2. Dispatch via QueryBus.
 *   3. Return the result typed as the OpenAPI-specified response.
 *
 * No business logic, no Prisma, no domain mapping here.
 *
 * The controller path is `lessons/:id` (not `streaming/...`) because the
 * OpenAPI spec defines `GET /lessons/{id}/stream-url` under the Streaming tag —
 * it is a sub-resource of a lesson, not a separate top-level resource.
 */
import { Controller, Get, Param, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { SessionGuard } from '../../common/auth/auth.guard';
import { AuthService } from '../../common/auth/auth.service';
import { IssueStreamTokenQuery } from './application/queries/issue-stream-token.query';

import type { Request } from 'express';
import type { StreamUrlDto } from '@app/api-client-ts';

@Controller({ path: 'lessons', version: '1' })
export class StreamingController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly auth: AuthService,
  ) {}

  /**
   * Resolves the session and returns the actor (id + role).
   * Throws UnauthorizedException (401) — the only HTTP exception allowed in a
   * controller; domain errors are thrown by handlers.
   */
  private async resolveActor(req: Request): Promise<{ id: string; role: string }> {
    const session = await this.auth.getSession(req);
    if (!session?.user) {
      throw new UnauthorizedException('Authentication required.');
    }
    const raw = (session.user as unknown as Record<string, unknown>)['role'];
    const role = typeof raw === 'string' ? raw : 'user';
    return { id: session.user.id, role };
  }

  /** GET /api/v1/lessons/:id/stream-url */
  @UseGuards(SessionGuard)
  @Get(':id/stream-url')
  async issueStreamUrl(@Param('id') id: string, @Req() req: Request): Promise<StreamUrlDto> {
    const actor = await this.resolveActor(req);
    return this.queryBus.execute<IssueStreamTokenQuery, StreamUrlDto>(
      new IssueStreamTokenQuery(id, actor),
    );
  }
}
