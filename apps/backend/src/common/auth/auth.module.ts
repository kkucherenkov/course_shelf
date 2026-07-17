import { Global, Module, RequestMethod } from '@nestjs/common';

import type { MiddlewareConsumer, NestModule } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignInRateLimitMiddleware } from './sign-in-rate-limit.middleware';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, SignInRateLimitMiddleware],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Mount on /api/v1/auth/sign-in/* — Better Auth uses /sign-in/email and
    // will add /sign-in/<provider> routes as SSO lands. The trailing wildcard
    // catches all providers.
    // Nest 11 / Express 5 catch-all syntax uses the named wildcard *splat.
    consumer
      .apply(SignInRateLimitMiddleware)
      .forRoutes({ path: 'api/v1/auth/sign-in/*splat', method: RequestMethod.POST });
  }
}
