/**
 * WHY this file exists:
 * Composition root for the cross-cutting authorization service. It binds
 * LruAuthorizationService behind the AUTHORIZATION_SERVICE token and exports
 * it so any feature module can inject it without knowing the implementation.
 *
 * Circular-dependency note:
 *   AccessModule  ←imports (forwardRef)→  CommonAccessModule
 *   - CommonAccessModule needs GRANT_REPOSITORY (provided by AccessModule).
 *   - AccessModule's command handlers need AUTHORIZATION_SERVICE (provided here).
 *   forwardRef() on both sides tells Nest to defer resolution until after both
 *   modules are fully constructed, breaking the circular dependency at runtime.
 */
import { Module, forwardRef } from '@nestjs/common';

import { AccessModule } from '../../modules/access/access.module';
import { LruAuthorizationService } from './lru-authorization.service';
import { AUTHORIZATION_SERVICE } from './authorization.service';

@Module({
  imports: [forwardRef(() => AccessModule)],
  providers: [{ provide: AUTHORIZATION_SERVICE, useClass: LruAuthorizationService }],
  exports: [AUTHORIZATION_SERVICE],
})
export class CommonAccessModule {}
