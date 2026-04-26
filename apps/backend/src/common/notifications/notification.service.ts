import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

import { AppConfig } from '../config/app-config';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private app: admin.app.App | null = null;

  constructor(private readonly config: AppConfig) {}

  onModuleInit(): void {
    const { configured, serviceAccountJson } = this.config.firebase;
    if (!configured) {
      this.logger.warn(
        'Firebase not configured (FIREBASE_SERVICE_ACCOUNT_JSON empty) — push notifications disabled',
      );
      return;
    }
    try {
      const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
      this.app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }, 'app');
      this.logger.log('Firebase Admin initialised');
    } catch (error: unknown) {
      this.logger.error(
        'Failed to initialise Firebase Admin',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async sendToTokens(tokens: string[], payload: PushPayload): Promise<void> {
    if (!this.app || tokens.length === 0) return;

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: payload.data ?? {},
    };

    try {
      const response = await this.app.messaging().sendEachForMulticast(message);
      if (response.failureCount > 0) {
        this.logger.warn(
          `FCM multicast: ${String(response.failureCount)} failures out of ${String(tokens.length)}`,
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        'FCM sendEachForMulticast error',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
