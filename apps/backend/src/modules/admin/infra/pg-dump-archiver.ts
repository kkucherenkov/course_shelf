/**
 * WHY this file exists:
 * Concrete BackupArchiver backed by `execFile` shell-outs to `pg_dump`. Follows
 * the same shape as LocalFfmpegAdapter — a thin wrapper, not `fluent-*`
 * bindings — so the surface stays small and the timeout is explicit.
 *
 * Format is `--format=custom`: a single compressed file carrying schema and
 * data together, restored with `pg_restore`. That is why the card's "Prisma
 * schema + data dump" is one artefact and not two.
 *
 * Version gate:
 *   pg_dump refuses to dump a server newer than itself, and a mismatched dump
 *   fails at *restore* time — long after the operator stopped watching. The
 *   majors are compared before the dump runs, so a skewed environment produces
 *   an error and no file, rather than a file that looks fine until it is needed.
 *
 * Credentials never reach the process table: the password is passed via the
 * PGPASSWORD environment variable of the child, and `--dbname` receives the URL
 * with the password stripped. pg_dump stderr is logged but never returned to
 * the client — connection strings carry secrets.
 */
import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { AppConfig } from '../../../common/config/app-config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  BACKUP_FILE_EXTENSION,
  BACKUP_ID_PATTERN,
  type BackupArchive,
  type BackupArchiver,
} from '../domain/backup/backup-archiver.port';
import {
  BackupNotFoundError,
  BackupToolMissingError,
  BackupUnavailableError,
  BackupVersionMismatchError,
} from '../domain/backup/backup.errors';

interface ExecResult {
  stdout: string;
  stderr: string;
}

/**
 * The shape execFile reports a failure with. Declared explicitly rather than
 * relying on `ExecException` so the rejection value is statically an `Error`.
 */
export interface ExecFailure extends Error {
  /** `null` is in the union because that is how Node types the callback's error. */
  code?: string | number | null;
  killed?: boolean;
  stderr?: string;
}

/** execFile promisified inline — see LocalFfmpegAdapter for why not `promisify`. */
function run(
  file: string,
  args: string[],
  options: { timeout: number; env?: NodeJS.ProcessEnv },
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    execFile(file, args, options, (error: ExecFailure | null, stdout, stderr) => {
      if (error) {
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function isEnoent(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: string }).code === 'ENOENT'
  );
}

/** `pg_dump (PostgreSQL) 18.6` → `18.6`; `18.6 (Debian 18.6-1)` → `18.6`. */
export function parsePgDumpVersion(output: string): string | null {
  const match = /(\d+(?:\.\d+)*)/.exec(output);
  return match?.[1] ?? null;
}

/** `18.1 (Debian …)` → `18`; `18.1` → `18`. */
export function majorOf(version: string): string {
  return (/^\d+/.exec(version.trim())?.[0] ?? '').trim();
}

@Injectable()
export class PgDumpArchiver implements BackupArchiver {
  private readonly logger = new Logger(PgDumpArchiver.name);

  constructor(
    private readonly config: AppConfig,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async create(): Promise<BackupArchive> {
    const { dir, pgDumpPath, timeoutMs } = this.config.backups;

    const clientVersion = await this.clientVersion();
    const serverVersion = await this.serverVersion();
    if (majorOf(clientVersion) !== majorOf(serverVersion)) {
      throw new BackupVersionMismatchError(clientVersion, serverVersion);
    }

    await mkdir(dir, { recursive: true });
    await this.prune();

    const id = newBackupId();
    const filePath = path.join(dir, `${id}${BACKUP_FILE_EXTENSION}`);

    const { dsn, password } = splitPassword(this.config.databaseUrl);

    try {
      await run(
        pgDumpPath,
        [
          '--format=custom',
          '--no-owner',
          '--no-privileges',
          `--file=${filePath}`,
          `--dbname=${dsn}`,
        ],
        {
          timeout: timeoutMs,
          env: password === null ? process.env : { ...process.env, PGPASSWORD: password },
        },
      );
    } catch (error) {
      // A timeout or a non-zero exit can leave a truncated file. Remove it —
      // an archive that exists but cannot be restored is worse than none.
      try {
        await rm(filePath, { force: true });
      } catch {
        // Best-effort — pg_dump may have failed before creating the file at all.
      }

      if (isEnoent(error)) {
        throw new BackupToolMissingError(pgDumpPath);
      }
      const failure = error as ExecFailure;
      const killed = failure.killed === true;
      this.logger.error(
        `pg_dump failed: ${killed ? 'timed out' : (failure.stderr ?? failure.message)}`,
      );
      throw new BackupUnavailableError(
        killed
          ? `pg_dump exceeded the ${String(timeoutMs)} ms timeout.`
          : 'pg_dump exited non-zero. See the server log for details.',
        killed ? 'backup-timeout' : 'backup-failed',
      );
    }

    const stats = await stat(filePath);
    return { id, filePath, sizeBytes: stats.size, createdAt: stats.mtime };
  }

  async locate(id: string): Promise<BackupArchive> {
    // Validate before touching path.join — this is the only thing between a URL
    // segment and a traversal out of the backup directory.
    if (!BACKUP_ID_PATTERN.test(id)) {
      throw new BackupNotFoundError(id);
    }
    const filePath = path.join(this.config.backups.dir, `${id}${BACKUP_FILE_EXTENSION}`);
    try {
      const stats = await stat(filePath);
      return { id, filePath, sizeBytes: stats.size, createdAt: stats.mtime };
    } catch {
      throw new BackupNotFoundError(id);
    }
  }

  /** Delete archives older than the retention window. Best-effort. */
  private async prune(): Promise<void> {
    const { dir, retentionHours } = this.config.backups;
    const cutoff = Date.now() - retentionHours * 3_600_000;
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.endsWith(BACKUP_FILE_EXTENSION)) continue;
      const full = path.join(dir, entry);
      try {
        const stats = await stat(full);
        if (stats.mtimeMs < cutoff) {
          await rm(full, { force: true });
          this.logger.log(`Pruned expired backup ${entry}`);
        }
      } catch {
        // A file that vanished under us needs no pruning.
      }
    }
  }

  private async clientVersion(): Promise<string> {
    const { pgDumpPath } = this.config.backups;
    try {
      const { stdout } = await run(pgDumpPath, ['--version'], { timeout: 10_000 });
      const version = parsePgDumpVersion(stdout);
      if (version === null) {
        throw new BackupUnavailableError(
          'Could not parse the pg_dump version string.',
          'backup-version-unreadable',
        );
      }
      return version;
    } catch (error) {
      if (isEnoent(error)) {
        throw new BackupToolMissingError(pgDumpPath);
      }
      throw error;
    }
  }

  private async serverVersion(): Promise<string> {
    const rows =
      await this.prisma.$queryRawUnsafe<{ server_version: string }[]>('SHOW server_version');
    const value = rows[0]?.server_version;
    if (value === undefined) {
      throw new BackupUnavailableError(
        'Could not read the PostgreSQL server version.',
        'backup-version-unreadable',
      );
    }
    return value;
  }
}

/** `<YYYYMMDD>T<HHMMSS>-<16 hex>` — see BACKUP_ID_PATTERN. */
export function newBackupId(now = new Date()): string {
  const stamp = now
    .toISOString()
    .replaceAll(/[-:]/g, '')
    .replace(/\.\d+Z$/, '');
  return `${stamp}-${randomBytes(8).toString('hex')}`;
}

/**
 * Split the password out of a postgres URL so it travels in PGPASSWORD rather
 * than in argv, where any local process can read it from `ps`.
 * A URL with no password round-trips unchanged.
 */
export function splitPassword(databaseUrl: string): { dsn: string; password: string | null } {
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    // Not a URL we can parse (e.g. a libpq keyword string) — pass it through
    // untouched rather than guessing.
    return { dsn: databaseUrl, password: null };
  }
  const password = url.password === '' ? null : decodeURIComponent(url.password);
  url.password = '';
  return { dsn: url.toString(), password };
}
