import { Injectable, Logger } from '@nestjs/common';

import type { EmailPayload, IEmailService, SentEmail } from '../domain/email.port';

const RING_BUFFER_SIZE = 200;

@Injectable()
export class MockEmailService implements IEmailService {
  private readonly logger = new Logger(MockEmailService.name);
  private readonly buffer: SentEmail[] = [];

  send(payload: EmailPayload): Promise<void> {
    const entry: SentEmail = { ...payload, sentAt: new Date() };

    if (this.buffer.length >= RING_BUFFER_SIZE) {
      this.buffer.shift();
    }
    this.buffer.push(entry);

    this.logger.warn(`[MOCK EMAIL] to=${payload.to} subject="${payload.subject}"`);
    return Promise.resolve();
  }

  sentTo(address: string): readonly SentEmail[] {
    return this.buffer.filter((e) => e.to === address);
  }
}
