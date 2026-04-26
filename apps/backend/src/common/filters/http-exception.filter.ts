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

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const problem = this.toProblem(exception, request.originalUrl || request.url);

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

  private toProblem(exception: unknown, instance: string): ProblemDocument {
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
