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

export interface StreamingConfig {
  /**
   * Master key passed to HKDF as IKM. Re-uses BETTER_AUTH_SECRET so no extra
   * env var is required — the derived subkey provides domain separation.
   */
  readonly secret: string;
  /**
   * HKDF info string. Changing this rotates the subkey (invalidates all
   * outstanding tokens). Default: "courseshelf:stream-token:v1".
   * Env: STREAM_TOKEN_HKDF_INFO.
   */
  readonly hkdfInfo: string;
  /**
   * Default TTL for issued stream tokens, in seconds. Default: 900 (15 min).
   * Env: STREAM_TOKEN_TTL_SECONDS.
   */
  readonly ttlSeconds: number;
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

export interface ScrapersConfig {
  /** 'mock' swaps real adapters for fixture-backed ones (used in e2e/CI). Default 'real'. */
  readonly mode: ProviderMode;
  readonly httpTimeoutMs: number;
  readonly maxResponseBytes: number;
  readonly userAgent: string;
  readonly youtube: { readonly configured: boolean; readonly apiKey: string };
  readonly udemy: { readonly enabled: boolean };
}

export interface SsoProviderConfigEntry {
  /** Stable identifier emitted on click (e.g. `google`, `okta-foo`). */
  readonly id: string;
  /** Visible label on the SsoBlock button. */
  readonly label: string;
  /** IconCS glyph name. */
  readonly iconName: string;
}

export interface AuthInstanceConfig {
  /** When false, the SPA hides sign-up entry points and redirects /sign-up → /sign-in. */
  readonly selfRegistration: boolean;
  /** When true, the sign-up wizard renders the 6-digit-code step. */
  readonly emailVerificationRequired: boolean;
  /** Configured OAuth/SSO providers. v1 ships empty; v2 populates via Better Auth. */
  readonly ssoProviders: readonly SsoProviderConfigEntry[];
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

  get scrapers(): ScrapersConfig {
    const apiKey = this.config.get<string>('YOUTUBE_API_KEY') ?? '';
    return {
      mode: this.stringOrDefault('SCRAPERS_MODE', 'real') as ProviderMode,
      httpTimeoutMs: this.numberOrDefault('SCRAPERS_HTTP_TIMEOUT_MS', 10_000),
      maxResponseBytes: this.numberOrDefault('SCRAPERS_MAX_RESPONSE_BYTES', 2_000_000),
      userAgent: this.stringOrDefault(
        'SCRAPERS_USER_AGENT',
        `courseShelf/${this.runtime.version} (+metadata-scraper)`,
      ),
      youtube: { configured: apiKey.length > 0, apiKey },
      udemy: { enabled: this.boolOrDefault('SCRAPERS_UDEMY_ENABLED', true) },
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

  /**
   * Absolute path to the `ffprobe` binary.
   * Default: 'ffprobe' (resolved via PATH).
   * Env: FFPROBE_PATH.
   */
  get ffprobePath(): string {
    return this.stringOrDefault('FFPROBE_PATH', 'ffprobe');
  }

  /**
   * Absolute path to the `ffmpeg` binary.
   * Default: 'ffmpeg' (resolved via PATH).
   * Env: FFMPEG_PATH.
   */
  get ffmpegPath(): string {
    return this.stringOrDefault('FFMPEG_PATH', 'ffmpeg');
  }

  /**
   * JPEG quality for generated lesson thumbnails. Range: 0–100. Default: 30.
   * Env: THUMBNAIL_JPEG_QUALITY.
   */
  get thumbnailJpegQuality(): number {
    return this.numberOrDefault('THUMBNAIL_JPEG_QUALITY', 30);
  }

  get streaming(): StreamingConfig {
    return {
      // Re-uses BETTER_AUTH_SECRET as HKDF input key material. The derived
      // subkey provides domain separation without requiring a separate env var.
      secret: this.requireString('BETTER_AUTH_SECRET'),
      hkdfInfo: this.stringOrDefault('STREAM_TOKEN_HKDF_INFO', 'courseshelf:stream-token:v1'),
      ttlSeconds: this.numberOrDefault('STREAM_TOKEN_TTL_SECONDS', 900),
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

  /**
   * Parse a boolean env var. Truthy values: `1`, `true`, `yes`, `on`
   * (case-insensitive). Anything else — including empty / unset — falls
   * back to the default.
   */
  private boolOrDefault(key: string, fallback: boolean): boolean {
    const value = this.config.get<string>(key);
    if (value === undefined || value === '') return fallback;
    const normalised = value.trim().toLowerCase();
    if (
      normalised === '1' ||
      normalised === 'true' ||
      normalised === 'yes' ||
      normalised === 'on'
    ) {
      return true;
    }
    if (
      normalised === '0' ||
      normalised === 'false' ||
      normalised === 'no' ||
      normalised === 'off'
    ) {
      return false;
    }
    return fallback;
  }

  /**
   * Public instance configuration surfaced by `GET /admin/instance`.
   * Defaults: open self-registration, no email verification, no SSO providers.
   * v2 will populate `ssoProviders` once Better Auth's `genericOAuth` plugin
   * lands; for now the array is always empty regardless of env.
   */
  get instance(): AuthInstanceConfig {
    return {
      selfRegistration: this.boolOrDefault('AUTH_SELF_REGISTRATION', true),
      emailVerificationRequired: this.boolOrDefault('AUTH_EMAIL_VERIFICATION', false),
      ssoProviders: [],
    };
  }
}
