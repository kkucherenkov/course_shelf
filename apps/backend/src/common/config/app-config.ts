import os from 'node:os';
import path from 'node:path';

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

export interface BackupsConfig {
  /**
   * Master key passed to HKDF as IKM. Re-uses BETTER_AUTH_SECRET, exactly as
   * `StreamingConfig` does — the info string below is what separates the two
   * derived subkeys.
   */
  readonly secret: string;
  /**
   * Directory the dump archives are written to.
   * Default: `<os.tmpdir()>/courseshelf-backups`.
   *
   * The default is deliberately ephemeral: it is writable everywhere (dev host,
   * container, CI) so the endpoint never fails on a permissions problem the
   * operator did not choose. An operator who wants archives to survive a
   * restart points BACKUP_DIR at a mounted volume.
   * Env: BACKUP_DIR.
   */
  readonly dir: string;
  /**
   * Path to the `pg_dump` binary. Default: 'pg_dump' (resolved via PATH).
   * Env: PG_DUMP_PATH.
   */
  readonly pgDumpPath: string;
  /**
   * Wall-clock timeout for one `pg_dump` invocation, in milliseconds.
   * Default: 300000 (5 min). The metadata database is small; this is a
   * runaway guard, not a budget.
   * Env: BACKUP_TIMEOUT_MS.
   */
  readonly timeoutMs: number;
  /**
   * HKDF info string for the backup download token. Deliberately different
   * from the streaming one, so a stream token can never be replayed against a
   * backup. Changing it rotates the subkey and invalidates outstanding links.
   * Default: "courseshelf:backup-token:v1".
   * Env: BACKUP_TOKEN_HKDF_INFO.
   */
  readonly hkdfInfo: string;
  /**
   * TTL for a backup download link, in seconds. Default: 300 (5 min) — same
   * reasoning as material downloads: a click resolves immediately, so a long
   * TTL only widens the window in which a leaked URL still works.
   * Env: BACKUP_TOKEN_TTL_SECONDS.
   */
  readonly ttlSeconds: number;
  /**
   * How long an archive stays on disk. Archives older than this are deleted
   * when a new backup is taken. Default: 168 (7 days).
   *
   * Without this the directory grows without bound — a scheduled backup would
   * eventually fill the volume.
   * Env: BACKUP_RETENTION_HOURS.
   */
  readonly retentionHours: number;
}

export type ProviderMode = 'mock' | 'real';

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

  get backups(): BackupsConfig {
    return {
      dir: this.stringOrDefault('BACKUP_DIR', path.join(os.tmpdir(), 'courseshelf-backups')),
      pgDumpPath: this.stringOrDefault('PG_DUMP_PATH', 'pg_dump'),
      timeoutMs: this.numberOrDefault('BACKUP_TIMEOUT_MS', 300_000),
      // Same IKM as `streaming`, different info — see BackupsConfig.hkdfInfo.
      secret: this.requireString('BETTER_AUTH_SECRET'),
      hkdfInfo: this.stringOrDefault('BACKUP_TOKEN_HKDF_INFO', 'courseshelf:backup-token:v1'),
      ttlSeconds: this.numberOrDefault('BACKUP_TOKEN_TTL_SECONDS', 300),
      retentionHours: this.numberOrDefault('BACKUP_RETENTION_HOURS', 168),
    };
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
