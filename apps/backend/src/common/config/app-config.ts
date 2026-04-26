import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CentrifugoConfig {
  readonly apiUrl: string;
  readonly apiKey: string;
  readonly tokenHmacSecret: string;
  readonly tokenTtlSeconds: number;
}

export interface BetterAuthConfig {
  readonly secret: string;
  /** Public base URL (scheme + host + port). Used by Better Auth to sign cookies and build callback URLs. */
  readonly baseUrl: string;
  /** URL path where the Better Auth handler is mounted. `/api/v1/auth` sits inside URI versioning. */
  readonly basePath: string;
}

export interface SmsConfig {
  readonly configured: boolean;
  readonly accountSid: string;
  readonly authToken: string;
  readonly fromNumber: string;
}

export interface AppRuntimeConfig {
  readonly port: number;
  readonly nodeEnv: 'development' | 'production' | 'test';
  readonly corsOrigins: string[];
  readonly version: string;
  readonly sentryDsn: string | null;
  readonly otelEndpoint: string | null;
}

export interface AuthorizationCacheConfig {
  /** TTL for each canSee() result, in milliseconds. Default 30 000 (30 s). */
  readonly ttlMs: number;
  /** Maximum number of entries in the LRU. Default 1 000. */
  readonly maxEntries: number;
}

export interface FirebaseConfig {
  /** JSON-encoded service account credentials. Empty string = Firebase disabled. */
  readonly serviceAccountJson: string;
  readonly configured: boolean;
}

export type ProviderMode = 'mock' | 'real';

export interface ProvidersConfig {
  /** Which SMS backend to use. Defaults to 'mock'. */
  readonly sms: ProviderMode;
  /** Which email backend to use. Defaults to 'mock'. */
  readonly email: ProviderMode;
  /** Which push backend to use. Defaults to 'mock'. */
  readonly push: ProviderMode;
  /** Which storage backend to use. Defaults to 'mock'. */
  readonly storage: ProviderMode;
}

@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService) {}

  get runtime(): AppRuntimeConfig {
    const sentryDsn = this.config.get<string>('SENTRY_DSN') ?? '';
    const otelEndpoint = this.config.get<string>('OTEL_EXPORTER_OTLP_ENDPOINT') ?? '';
    return {
      port: this.numberOrDefault('PORT', 3000),
      nodeEnv: this.stringOrDefault('NODE_ENV', 'development') as AppRuntimeConfig['nodeEnv'],
      corsOrigins: this.stringOrDefault('CORS_ORIGINS', 'http://localhost:3001')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      version: this.stringOrDefault('APP_VERSION', '0.0.0-dev'),
      sentryDsn: sentryDsn.length > 0 ? sentryDsn : null,
      otelEndpoint: otelEndpoint.length > 0 ? otelEndpoint : null,
    };
  }

  get firebase(): FirebaseConfig {
    const serviceAccountJson = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON') ?? '';
    return {
      serviceAccountJson,
      configured: serviceAccountJson.length > 0,
    };
  }

  get databaseUrl(): string {
    return this.requireString('DATABASE_URL');
  }

  get redisUrl(): string {
    return this.requireString('REDIS_URL');
  }

  get betterAuth(): BetterAuthConfig {
    return {
      secret: this.requireString('BETTER_AUTH_SECRET'),
      baseUrl: this.requireString('BETTER_AUTH_URL'),
      basePath: this.stringOrDefault('BETTER_AUTH_BASE_PATH', '/api/v1/auth'),
    };
  }

  get sms(): SmsConfig {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID') ?? '';
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN') ?? '';
    const fromNumber = this.config.get<string>('TWILIO_FROM') ?? '';
    const configured = Boolean(accountSid && authToken && fromNumber);
    return { configured, accountSid, authToken, fromNumber };
  }

  /** Integration provider selection. All default to 'mock' — no env vars needed. */
  get providers(): ProvidersConfig {
    return {
      sms: 'mock',
      email: 'mock',
      push: 'mock',
      storage: 'mock',
    };
  }

  get authorizationCache(): AuthorizationCacheConfig {
    return {
      ttlMs: this.numberOrDefault('AUTHZ_CACHE_TTL_MS', 30_000),
      maxEntries: this.numberOrDefault('AUTHZ_CACHE_MAX_ENTRIES', 1000),
    };
  }

  get centrifugo(): CentrifugoConfig {
    return {
      apiUrl: this.requireString('CENTRIFUGO_API_URL'),
      apiKey: this.requireString('CENTRIFUGO_API_KEY'),
      tokenHmacSecret: this.requireString('CENTRIFUGO_TOKEN_HMAC_SECRET'),
      tokenTtlSeconds: this.numberOrDefault('CENTRIFUGO_TOKEN_TTL_SECONDS', 300),
    };
  }

  private requireString(key: string): string {
    const value = this.config.get<string>(key);
    if (value === undefined || value === '') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  private stringOrDefault(key: string, fallback: string): string {
    const value = this.config.get<string>(key);
    return value === undefined || value === '' ? fallback : value;
  }

  private numberOrDefault(key: string, fallback: number): number {
    const value = this.config.get<string>(key);
    if (value === undefined || value === '') return fallback;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new TypeError(`Environment variable ${key} must be numeric, got: ${value}`);
    }
    return parsed;
  }
}
