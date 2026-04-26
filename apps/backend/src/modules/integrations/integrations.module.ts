import { Global, Module } from '@nestjs/common';

import { EMAIL_PORT } from './domain/email.port';
import { PUSH_PORT } from './domain/push.port';
import { SMS_PORT } from './domain/sms.port';
import { STORAGE_PORT } from './domain/storage.port';
import { MockEmailService } from './infra/mock-email.service';
import { MockPushService } from './infra/mock-push.service';
import { MockSmsService } from './infra/mock-sms.service';
import { MockStorageService } from './infra/mock-storage.service';

@Global()
@Module({
  providers: [
    { provide: SMS_PORT, useClass: MockSmsService },
    { provide: EMAIL_PORT, useClass: MockEmailService },
    { provide: PUSH_PORT, useClass: MockPushService },
    { provide: STORAGE_PORT, useClass: MockStorageService },
    MockSmsService,
    MockEmailService,
    MockPushService,
  ],
  exports: [
    SMS_PORT,
    EMAIL_PORT,
    PUSH_PORT,
    STORAGE_PORT,
    MockSmsService,
    MockEmailService,
    MockPushService,
  ],
})
export class IntegrationsModule {}
