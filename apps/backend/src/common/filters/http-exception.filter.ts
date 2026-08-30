import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';

import { DomainError } from '../../shared/domain-error';

import type { Request, Response } from 'express';

interface ProblemDocument {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance: string;
  code?: string;
  errors?: unknown;
}

/**
 * An HTTP error raised outside the Nest pipeline.
 *
 * `express-openapi-validator` is mounted with `app.use('/api', …)`, so it runs
 * before the Nest router and reports failures by calling `next(err)` with its
 * own `HttpError` — `Not Found` (404) for a path the spec does not describe,
 * `Method Not Allowed` (405) for a method the path does not define, plus
 * `Bad Request` / `Unsupported Media Type` / … for request-validation
 * failures. Nest's express error handler funnels those into this filter, but
 * they are neither `DomainError` nor `HttpException`, so they used to fall
 * through to the generic 500 branch. Anything built by `http-errors` (`status`
 * or `statusCode`) is picked up by the same narrowing.
 */
interface ExternalHttpError {
  readonly status: number;
  readonly name: string;
  readonly message: string;
  readonly headers: Record<string, string> | undefined;
  readonly errors: unknown[] | undefined;
}

function numericStatus(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 400 && value <= 599
    ? value
    : undefined;
}

function stringHeaders(value: unknown): Record<string, string> | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function externalHttpError(exception: unknown): ExternalHttpError | undefined {
  if (!(exception instanceof Error)) return undefined;
  const candidate = exception as Error & {
    status?: unknown;
    statusCode?: unknown;
    headers?: unknown;
    errors?: unknown;
  };
  const status = numericStatus(candidate.status) ?? numericStatus(candidate.statusCode);
  if (status === undefined) return undefined;

  return {
    status,
    name: candidate.name,
    message: candidate.message,
    headers: stringHeaders(candidate.headers),
    errors: Array.isArray(candidate.errors) ? candidate.errors : undefined,
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const external = externalHttpError(exception);
    const problem = this.toProblem(exception, external, request.originalUrl || request.url);

    // RFC 9110 §15.5.6 requires `Allow` on a 405; the validator already knows
    // which methods the path defines, so pass its headers straight through.
    for (const [name, value] of Object.entries(external?.headers ?? {})) {
      response.setHeader(name, value);
    }

    if (problem.status >= 500) {
      this.logger.error(
        `${request.method} ${problem.instance} — ${problem.title}`,
        exception instanceof Error ? exception.stack : undefined,
      );
      // SentryInterceptor captures 5xx that flow through the interceptor chain;
      // this call covers errors thrown directly inside filters or exception
      // factories that bypass the interceptor chain entirely.
      Sentry.captureException(exception);
    }

    response.status(problem.status).type('application/problem+json').send(problem);
  }

  private toProblem(
    exception: unknown,
    external: ExternalHttpError | undefined,
    instance: string,
  ): ProblemDocument {
    if (exception instanceof DomainError) {
      const problem: ProblemDocument = {
        type: `urn:problem-type:${exception.code}`,
        title: exception.title,
        status: exception.status,
        instance,
        code: exception.code,
      };
      if (exception.detail !== undefined) {
        problem.detail = exception.detail;
      }
      return problem;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const title = this.titleFor(status);
      if (typeof body === 'string') {
        return { type: 'about:blank', title, status, detail: body, instance };
      }
      const obj = body as Record<string, unknown>;
      const problem: ProblemDocument = {
        type: 'about:blank',
        title: (obj['error'] as string | undefined) ?? title,
        status,
        instance,
      };
      if (typeof obj['message'] === 'string') {
        problem.detail = obj['message'];
      }
      if (Array.isArray(obj['message'])) {
        problem.errors = obj['message'];
      }
      return problem;
    }

    if (external) {
      const problem: ProblemDocument = {
        type: 'about:blank',
        // `HttpError.name` is already the reason phrase ("Not Found",
        // "Method Not Allowed"); a bare `Error` falls back to the status table.
        title: external.name === 'Error' ? this.titleFor(external.status) : external.name,
        status: external.status,
        instance,
      };
      if (external.message) {
        problem.detail = external.message;
      }
      if (external.errors) {
        problem.errors = external.errors;
      }
      return problem;
    }

    return {
      type: 'about:blank',
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      instance,
    };
  }

  private titleFor(status: number): string {
    switch (status) {
      case 400: {
        return 'Bad Request';
      }
      case 401: {
        return 'Unauthorized';
      }
      case 403: {
        return 'Forbidden';
      }
      case 404: {
        return 'Not Found';
      }
      case 405: {
        return 'Method Not Allowed';
      }
      case 409: {
        return 'Conflict';
      }
      case 422: {
        return 'Unprocessable Entity';
      }
      case 429: {
        return 'Too Many Requests';
      }
      default: {
        return status >= 500 ? 'Internal Server Error' : 'Error';
      }
    }
  }
}
