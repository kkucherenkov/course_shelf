import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';

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
  /**
   * Express `trust proxy` value — who this instance believes about
   * `X-Forwarded-For`. A comma-separated list of IPs/CIDRs/presets
   * (`loopback`, `linklocal`, `uniquelocal`) or one of those, exactly as
   * https://expressjs.com/en/guide/behind-proxies.html documents.
   *
   * Default `loopback`: correct only when the reverse proxy runs in the same
   * network namespace as the backend (e.g. a plain `nginx -g daemon off`
   * next to the process). Every compose file here runs nginx as its own
   * container, so each sets this to that stack's pinned docker-network
   * subnet instead (`docker/compose*.yml`, `TRUST_PROXY`) — see #693.
   *
   * Deliberately NOT a hop count (`app.set('trust proxy', 1)`): Express
   * compiles a number into `(addr, i) => i < n`, which trusts the Nth entry
   * in `X-Forwarded-For` by position alone, regardless of who is actually
   * connected. A client that reaches this backend directly (its port is
   * published, e.g. compose.yml's :3000) could send its own
   * `X-Forwarded-For` and be believed. An address/CIDR list only trusts the
   * header when the immediate TCP peer is actually inside it — a direct
   * external connection's peer address is never inside the docker-only
   * subnet named here, so it cannot forge its way into a fresh rate-limit
   * bucket.
   * Env: TRUST_PROXY.
   */
  readonly trustProxy: string;
}

export interface CatalogConfig {
  /**
   * Absolute path prefixes a registered library's `rootPath` must fall
   * under. Empty (the default) means unrestricted — dev and CI register
   * libraries at whatever fixture path is at hand, and restricting that by
   * default would just move the friction into every contributor's `.env`.
   *
   * `POST /libraries` is admin-only (#592), but the guard alone doesn't stop
   * an admin from fat-fingering a path like `/` and kicking off a scan of
   * the entire filesystem. `compose.prod.yml` / `compose.release.yml` set
   * this to the same `/data/courses` the host's `COURSES_PATH` is mounted
   * at, so in every real deployment a library can only ever point at the
   * directory an operator actually chose to share.
   * Env: LIBRARY_ROOT_ALLOWLIST (comma-separated).
   */
  readonly rootAllowlist: string[];
}

export interface AuthorizationCacheConfig {
  /** TTL for each canSee() result, in milliseconds. Default 30 000 (30 s). */
  readonly ttlMs: number;
  /** Maximum number of entries in the LRU. Default 1 000. */
  readonly maxEntries: number;
}

export interface RateLimitConfig {
  /** Sliding window for the global throttler, in milliseconds. Default 60 000 (1 min). */
  readonly ttlMs: number;
  /** Requests allowed per window, per client. Default 60. */
  readonly limit: number;
  /** Window for the realtime-token route's own, tighter budget. Default 60 000. */
  readonly realtimeTokenTtlMs: number;
  /** Requests allowed per window for realtime-token minting. Default 30. */
  readonly realtimeTokenLimit: number;
  /**
   * Window for every `/api/v1/auth/*` route except `get-session` (sign-in,
   * sign-up, sign-out, forgot/reset-password, ...). Default 60 000. Sign-in
   * itself additionally carries its own brute-force limiter
   * (`SignInRateLimitMiddleware`) on top of this.
   */
  readonly authTtlMs: number;
  /** Requests allowed per window for the auth budget above. Default 10. */
  readonly authLimit: number;
  /**
   * Window for `GET /api/v1/auth/get-session` — every cold SPA load makes
   * one of these, so it needs a looser, ordinary-traffic budget rather than
   * sharing `authLimit` with sign-in (#777). Default 60 000.
   */
  readonly authSessionTtlMs: number;
  /** Requests allowed per window for session reads. Default 60. */
  readonly authSessionLimit: number;
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

export interface PosterTokenConfig {
  /**
   * Master key passed to HKDF as IKM. Re-uses BETTER_AUTH_SECRET, exactly as
   * `StreamingConfig` does — the info string below is what separates the
   * derived subkeys.
   */
  readonly secret: string;
  /**
   * HKDF info string for the course-poster token. Deliberately different from
   * the streaming/backup ones so a poster token can never be replayed against
   * those routes. Default: "courseshelf:poster-token:v1".
   * Env: POSTER_TOKEN_HKDF_INFO.
   */
  readonly hkdfInfo: string;
  /**
   * TTL for a poster token, in seconds. Default: 900 (15 min) — same as the
   * stream token: the token is embedded in every CourseDto a list/get query
   * returns, so it must outlive a normal browsing session, not just one click.
   * Env: POSTER_TOKEN_TTL_SECONDS.
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

export interface TranscriptionConfig {
  /** whisper.cpp CLI binary. Default: 'whisper-cli' (resolved via PATH). */
  readonly whisperPath: string;
  /** Absolute path to a ggml model file. Empty = transcription unavailable. */
  readonly modelPath: string;
  /** Wall-clock timeout for one whisper invocation, in milliseconds. */
  readonly timeoutMs: number;
  /** `-t` passed to whisper.cpp. The one dial that matters on a NAS. */
  readonly threads: number;
  /** `-l` passed to whisper.cpp. 'auto' lets whisper detect the language. */
  readonly language: string;
  /** 'mock' swaps the real whisper.cpp shell-out for a fixture adapter (used in CI, where a ~75 MB model buys nothing — see MockWhisperAdapter). Default 'real'. */
  readonly mode: ProviderMode;
  /**
   * False unless `mode` is 'mock', or `modelPath` is set AND the file exists
   * on disk. A path alone used to be enough, which meant a default model path
   * in compose could report `configured: true` for a model nobody downloaded
   * yet — the run endpoint would start and then fail on every lesson.
   */
  readonly configured: boolean;
}

export type ProviderMode = 'mock' | 'real';

/** Which engine answers a text-generation call. Default 'local' keeps llama.cpp. */
export type LlmProvider = 'local' | 'openrouter';

export interface HostedModelConfig {
  /** Secret. Empty means the hosted provider cannot be used. */
  readonly apiKey: string;
  /** API root, without a trailing slash. */
  readonly baseUrl: string;
  /** Model id used when a request names none, e.g. 'mistralai/mistral-nemo'. */
  readonly defaultModel: string;
  /** Wall-clock timeout for one chat-completions call, in milliseconds. */
  readonly timeoutMs: number;
  /** True once an API key is present — the hosted equivalent of whisper's model-file check. */
  readonly configured: boolean;
}

export interface QuizGenerationConfig {
  /** 'local' (llama.cpp, default) or 'openrouter' (ADR-0012). */
  readonly provider: LlmProvider;
  /** llama.cpp's one-shot completion CLI. Default: 'llama-completion' (resolved via PATH). */
  readonly llamaPath: string;
  /** Filename (not a path — resolved under `modelWeightsDir`) used when a request names no model. */
  readonly defaultModelFilename: string;
  /** Wall-clock timeout for one llama-completion invocation, in milliseconds. */
  readonly timeoutMs: number;
  /** `-t` passed to llama-completion. */
  readonly threads: number;
  /** `-c` passed to llama-completion — bounds KV-cache; windows are sized to fit comfortably under it. */
  readonly contextSize: number;
  /** 'mock' swaps the real llama-completion shell-out for a fixture adapter (used in CI). Default 'real'. */
  readonly mode: ProviderMode;
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
  /**
   * A field, not a getter like every other block below — deliberately. It is
   * read once per transcription run in `run-transcription.handler.ts` and once
   * per lesson in the walk that follows, and `configured` now `stat`s the
   * model file. AppConfig is a singleton for the app's lifetime and env vars
   * don't change underneath it, so computing this once at construction turns
   * "a syscall per request" into "a syscall at boot".
   */
  readonly transcription: TranscriptionConfig;

  /**
   * Random id generated once when this process starts — not read from the
   * environment, but a per-process singleton is exactly what AppConfig
   * already is, so a second provider just to hold one random string would be
   * ceremony for its own sake.
   *
   * Stamped onto a Transcription run at `Transcription.start()`. A boot-time
   * recovery pass (#525) compares it against every persisted `running` row:
   * this process has started nothing yet, so any row whose bootId differs
   * from this one was left running by a process that is no longer there —
   * "no live owner" becomes a single equality check instead of a heartbeat
   * staleness window that needs a number picked for it.
   */
  readonly bootId: string = nanoid();

  constructor(private readonly config: ConfigService) {
    this.transcription = this.buildTranscription();
  }

  get runtime(): AppRuntimeConfig {
    const sentryDsn = this.config.get<string>('SENTRY_DSN') ?? '';
    return {
      port: this.numberOrDefault('PORT', 3000),
      nodeEnv: this.stringOrDefault('NODE_ENV', 'development') as AppRuntimeConfig['nodeEnv'],
      corsOrigins: this.stringOrDefault('CORS_ORIGINS', 'http://localhost:3001')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      version: this.stringOrDefault('APP_VERSION', '0.0.0-dev'),
      sentryDsn: sentryDsn.length > 0 ? sentryDsn : null,
      trustProxy: this.stringOrDefault('TRUST_PROXY', 'loopback'),
    };
  }

  get catalog(): CatalogConfig {
    return {
      rootAllowlist: this.stringOrDefault('LIBRARY_ROOT_ALLOWLIST', '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
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

  /**
   * Global `ThrottlerGuard` budget. The values used to be literals in
   * `app.module.ts`, which meant the one setting that is genuinely
   * environment-shaped could not be shaped per environment: production wants
   * 60/min, and the CI stack that runs `spec:contract-test` needs headroom for
   * a property-based suite that sends thousands of requests in a minute. With
   * the literals in place the limiter, not the contract, decided the result.
   */
  get rateLimit(): RateLimitConfig {
    return {
      ttlMs: this.numberOrDefault('RATE_LIMIT_TTL_MS', 60_000),
      limit: this.numberOrDefault('RATE_LIMIT_MAX', 60),
      realtimeTokenTtlMs: this.numberOrDefault('RATE_LIMIT_REALTIME_TOKEN_TTL_MS', 60_000),
      realtimeTokenLimit: this.numberOrDefault('RATE_LIMIT_REALTIME_TOKEN_MAX', 30),
      authTtlMs: this.numberOrDefault('RATE_LIMIT_AUTH_TTL_MS', 60_000),
      authLimit: this.numberOrDefault('RATE_LIMIT_AUTH_MAX', 10),
      authSessionTtlMs: this.numberOrDefault('RATE_LIMIT_AUTH_SESSION_TTL_MS', 60_000),
      authSessionLimit: this.numberOrDefault('RATE_LIMIT_AUTH_SESSION_MAX', 60),
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
   * Root for artefacts CourseShelf generates from the media it reads:
   * whisper transcripts and, later, scan thumbnails. Deliberately separate
   * from COURSES_PATH, which is mounted read-only in prod and release.
   * Default: '/data/derived'. Env: DERIVED_PATH.
   */
  get derivedPath(): string {
    return this.stringOrDefault('DERIVED_PATH', '/data/derived');
  }

  /**
   * Directory holding every model weight file — whisper's ggml `.bin` and
   * llama's `.gguf`, side by side. Not a new volume: this repo already binds
   * one (`WHISPER_MODEL_DIR` → `/models`) for whisper; a second mount for
   * llama would be the same host directory under a different name
   * (E29-F02-S01 clarification #6). The admin model-weights endpoint lists
   * and deletes from here, for both engines.
   * Default: '/models'. Env: MODEL_WEIGHTS_DIR.
   */
  get modelWeightsDir(): string {
    return this.stringOrDefault('MODEL_WEIGHTS_DIR', '/models');
  }

  /**
   * llama.cpp settings for on-demand quiz generation. Unlike `transcription`,
   * `configured` is deliberately NOT computed here: the weights directory can
   * hold several `.gguf` files and the one actually used is chosen per
   * request (E29-F02-S01 clarification #4), so "does this specific file
   * exist" is checked live, by the command handler, not cached at boot — the
   * admin delete endpoint can remove a file between two requests, and a
   * boot-cached boolean would go stale the moment that happens.
   * `provider` picks the engine (ADR-0012); everything else here stays
   * llama.cpp-only and is unread once `provider` is 'openrouter'.
   * Env: LLM_PROVIDER, LLAMA_MODE, LLAMA_PATH, LLAMA_DEFAULT_MODEL,
   *      LLAMA_TIMEOUT_MS, LLAMA_THREADS, LLAMA_CONTEXT_SIZE.
   */
  get quizGeneration(): QuizGenerationConfig {
    return {
      provider: this.stringOrDefault('LLM_PROVIDER', 'local') as LlmProvider,
      llamaPath: this.stringOrDefault('LLAMA_PATH', 'llama-completion'),
      // Empty disables the feature explicitly (mirrors WHISPER_MODEL_PATH's
      // "empty = unavailable"); the maintainer's own default deployment keeps
      // this the 4B weight — the 9B is an opt-in, named per request.
      defaultModelFilename: this.stringOrDefault('LLAMA_DEFAULT_MODEL', 'Qwen3.5-4B-Q4_K_M.gguf'),
      // Generous: a cold model load (up to ~5.7 GB) plus prompt processing on
      // memory-bandwidth-bound CPU is genuinely slow — measure on one lesson
      // before trusting any published tok/s figure, which is almost always a
      // desktop Ryzen number, not this hardware's.
      timeoutMs: this.numberOrDefault('LLAMA_TIMEOUT_MS', 600_000),
      threads: this.numberOrDefault('LLAMA_THREADS', 4),
      contextSize: this.numberOrDefault('LLAMA_CONTEXT_SIZE', 4096),
      mode: this.stringOrDefault('LLAMA_MODE', 'real') as ProviderMode,
    };
  }

  /**
   * Hosted text-generation settings (ADR-0012). `configured` is a key check
   * and nothing more: unlike a local weight file, whether the model id is
   * real is only knowable from the provider's answer, so a bad id surfaces
   * as a failed generation rather than a boot-time refusal.
   * Env: OPENROUTER_API_KEY, OPENROUTER_BASE_URL, OPENROUTER_MODEL,
   *      OPENROUTER_TIMEOUT_MS.
   */
  get hostedModel(): HostedModelConfig {
    const apiKey = this.stringOrDefault('OPENROUTER_API_KEY', '');
    const baseUrl = this.stringOrDefault('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1');
    return {
      apiKey,
      // Stripped so `OpenRouterAdapter` can always join with `/chat/completions`
      // — an operator-supplied value with a trailing slash (or several) used
      // to survive untouched and produce `.../v1//chat/completions`.
      baseUrl: baseUrl.replace(/\/+$/, ''),
      defaultModel: this.stringOrDefault('OPENROUTER_MODEL', 'mistralai/mistral-nemo'),
      timeoutMs: this.numberOrDefault('OPENROUTER_TIMEOUT_MS', 120_000),
      configured: apiKey.length > 0,
    };
  }

  /**
   * whisper.cpp settings. `configured` stays false until either mock mode is
   * on or a model file is named AND present on disk — the binary alone cannot
   * transcribe anything, and starting a run that can only fail is worse than
   * refusing it.
   * Env: WHISPER_MODE, WHISPER_PATH, WHISPER_MODEL_PATH, WHISPER_TIMEOUT_MS,
   *      WHISPER_THREADS, WHISPER_LANGUAGE.
   */
  private buildTranscription(): TranscriptionConfig {
    const modelPath = this.stringOrDefault('WHISPER_MODEL_PATH', '');
    const mode = this.stringOrDefault('WHISPER_MODE', 'real') as ProviderMode;
    return {
      whisperPath: this.stringOrDefault('WHISPER_PATH', 'whisper-cli'),
      modelPath,
      // Six hours. A long lesson on NAS-grade CPU is measured in hours, not
      // in the 30s that is right for ffprobe.
      timeoutMs: this.numberOrDefault('WHISPER_TIMEOUT_MS', 21_600_000),
      threads: this.numberOrDefault('WHISPER_THREADS', 4),
      language: this.stringOrDefault('WHISPER_LANGUAGE', 'auto'),
      mode,
      configured: mode === 'mock' || (modelPath !== '' && existsSync(modelPath)),
    };
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

  get posterToken(): PosterTokenConfig {
    return {
      secret: this.requireString('BETTER_AUTH_SECRET'),
      hkdfInfo: this.stringOrDefault('POSTER_TOKEN_HKDF_INFO', 'courseshelf:poster-token:v1'),
      ttlSeconds: this.numberOrDefault('POSTER_TOKEN_TTL_SECONDS', 900),
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
