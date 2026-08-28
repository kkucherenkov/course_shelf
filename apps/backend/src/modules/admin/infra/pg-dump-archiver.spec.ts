/**
 * Unit tests for PgDumpArchiver.
 *
 * `child_process.execFile` and `node:fs/promises` are mocked — no postgres and
 * no real pg_dump. The value here is the decisions the adapter makes around the
 * shell-out, which is where the bugs would be:
 *
 *   1.  Version gate: client major != server major → BackupVersionMismatchError,
 *       and pg_dump is NOT invoked (a mismatched archive must never be written).
 *   2.  Version gate: same major, different minor → allowed. A client newer than
 *       the server is supported by pg_dump; only a *newer server* is not.
 *   3.  Missing binary (ENOENT) → BackupToolMissingError naming the path.
 *   4.  Non-zero exit → BackupUnavailableError, and the partial file is removed.
 *   5.  Timeout (`killed`) → BackupUnavailableError, partial file removed.
 *   6.  Credentials: the password travels in the child's PGPASSWORD env, never
 *       in argv, and the --dbname argument carries no password.
 *   7.  locate() rejects a path-traversal id without touching the filesystem.
 *   8.  locate() rejects a well-formed id whose file is gone.
 *   9.  newBackupId() output matches BACKUP_ID_PATTERN.
 *   10. splitPassword / parsePgDumpVersion / majorOf edge cases.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({ execFile: vi.fn() }));
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(async () => undefined),
  readdir: vi.fn(async () => []),
  rm: vi.fn(async () => undefined),
  stat: vi.fn(async () => ({ size: 1024, mtime: new Date('2026-08-29T01:45:00Z'), mtimeMs: 0 })),
}));

import { execFile } from 'node:child_process';
import { rm, stat } from 'node:fs/promises';

import { BACKUP_ID_PATTERN } from '../domain/backup/backup-archiver.port';
import {
  BackupNotFoundError,
  BackupToolMissingError,
  BackupUnavailableError,
  BackupVersionMismatchError,
} from '../domain/backup/backup.errors';
import {
  majorOf,
  newBackupId,
  parsePgDumpVersion,
  PgDumpArchiver,
  splitPassword,
} from './pg-dump-archiver';

import type { AppConfig } from '../../../common/config/app-config';
import type { PrismaService } from '../../../common/prisma/prisma.service';

type ExecFileCb = (error: Error | null, stdout: string, stderr: string) => void;

interface ExecCall {
  file: string;
  args: string[];
  options: { env?: NodeJS.ProcessEnv; timeout?: number };
}

const calls: ExecCall[] = [];

/** Route each execFile call through `handler`, recording it for assertions. */
function mockExec(handler: (call: ExecCall) => { stdout?: string; error?: Error }): void {
  vi.mocked(execFile).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- callback-style mock
    (...argv: any[]) => {
      const call: ExecCall = { file: argv[0], args: argv[1], options: argv[2] };
      calls.push(call);
      const cb = argv.at(-1) as ExecFileCb;
      const result = handler(call);
      if (result.error) cb(result.error, '', 'boom');
      else cb(null, result.stdout ?? '', '');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return {} as any;
    },
  );
}

function makeConfig(overrides: Partial<Record<string, unknown>> = {}): AppConfig {
  return {
    databaseUrl: 'postgresql://cs:s3cr3t@postgres:5432/courseshelf',
    backups: {
      secret: 'test-secret',
      dir: '/tmp/cs-backups',
      pgDumpPath: 'pg_dump',
      timeoutMs: 1000,
      hkdfInfo: 'courseshelf:backup-token:v1',
      ttlSeconds: 300,
      retentionHours: 168,
      ...overrides,
    },
  } as unknown as AppConfig;
}

function makePrisma(serverVersion = '18.1'): PrismaService {
  return {
    $queryRawUnsafe: vi.fn(async () => [{ server_version: serverVersion }]),
  } as unknown as PrismaService;
}

function build(serverVersion = '18.1'): PgDumpArchiver {
  return new PgDumpArchiver(makeConfig(), makePrisma(serverVersion));
}

describe('PgDumpArchiver.create', () => {
  beforeEach(() => {
    calls.length = 0;
    vi.mocked(rm).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('refuses to dump when the client major does not match the server', async () => {
    mockExec(() => ({ stdout: 'pg_dump (PostgreSQL) 17.6' }));
    await expect(build('18.1').create()).rejects.toThrow(BackupVersionMismatchError);
    // Only --version ran; the dump itself must not have been attempted.
    expect(calls).toHaveLength(1);
    expect(calls[0]?.args).toEqual(['--version']);
  });

  it('allows a client newer than the server within the same major', async () => {
    mockExec((call) =>
      call.args[0] === '--version' ? { stdout: 'pg_dump (PostgreSQL) 18.6' } : { stdout: '' },
    );
    const archive = await build('18.1').create();
    expect(archive.sizeBytes).toBe(1024);
    expect(calls).toHaveLength(2);
    expect(calls[1]?.args).toContain('--format=custom');
  });

  it('maps a missing binary to BackupToolMissingError', async () => {
    mockExec(() => ({ error: Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' }) }));
    await expect(build().create()).rejects.toThrow(BackupToolMissingError);
  });

  it('removes the partial file when pg_dump exits non-zero', async () => {
    mockExec((call) =>
      call.args[0] === '--version'
        ? { stdout: 'pg_dump (PostgreSQL) 18.6' }
        : { error: Object.assign(new Error('exit 1'), { code: 1 }) },
    );
    await expect(build().create()).rejects.toThrow(BackupUnavailableError);
    expect(vi.mocked(rm)).toHaveBeenCalledWith(expect.stringContaining('/tmp/cs-backups/'), {
      force: true,
    });
  });

  it('removes the partial file and reports a timeout when the child is killed', async () => {
    mockExec((call) =>
      call.args[0] === '--version'
        ? { stdout: 'pg_dump (PostgreSQL) 18.6' }
        : { error: Object.assign(new Error('killed'), { killed: true }) },
    );
    await expect(build().create()).rejects.toThrow(/timeout/i);
    expect(vi.mocked(rm)).toHaveBeenCalled();
  });

  it('passes the password via PGPASSWORD and never in argv', async () => {
    mockExec((call) =>
      call.args[0] === '--version' ? { stdout: 'pg_dump (PostgreSQL) 18.6' } : { stdout: '' },
    );
    await build('18.1').create();

    const dump = calls[1];
    expect(dump?.options.env?.['PGPASSWORD']).toBe('s3cr3t');
    expect(dump?.args.join(' ')).not.toContain('s3cr3t');
    expect(dump?.args.some((a) => a.startsWith('--dbname='))).toBe(true);
  });
});

describe('PgDumpArchiver.locate', () => {
  it.each([
    ['traversal', '../../etc/passwd'],
    ['absolute path', '/etc/passwd'],
    ['wrong shape', 'not-a-backup-id'],
    ['empty', ''],
  ])('rejects a %s id without touching the filesystem', async (_label, id) => {
    vi.mocked(stat).mockClear();
    await expect(build().locate(id)).rejects.toThrow(BackupNotFoundError);
    expect(vi.mocked(stat)).not.toHaveBeenCalled();
  });

  it('reports a well-formed id whose file is gone as not found', async () => {
    vi.mocked(stat).mockRejectedValueOnce(new Error('ENOENT'));
    await expect(build().locate('20260829T014500-3f9a2c1b8e7d4a6f')).rejects.toThrow(
      BackupNotFoundError,
    );
  });
});

describe('helpers', () => {
  it('generates ids that satisfy BACKUP_ID_PATTERN', () => {
    for (let i = 0; i < 25; i += 1) {
      expect(newBackupId()).toMatch(BACKUP_ID_PATTERN);
    }
  });

  it.each([
    ['pg_dump (PostgreSQL) 18.6', '18.6'],
    ['pg_dump (PostgreSQL) 17.6 (Debian 17.6-1)', '17.6'],
    ['pg_dump (PostgreSQL) 16', '16'],
    ['no digits here', null],
  ])('parses %s', (input, expected) => {
    expect(parsePgDumpVersion(input)).toBe(expected);
  });

  it.each([
    ['18.1', '18'],
    ['18.1 (Debian 18.1-1)', '18'],
    ['  17.6 ', '17'],
  ])('takes the major of %s', (input, expected) => {
    expect(majorOf(input)).toBe(expected);
  });

  it('splits the password out of a postgres URL', () => {
    const { dsn, password } = splitPassword('postgresql://cs:s3cr3t@host:5432/db');
    expect(password).toBe('s3cr3t');
    expect(dsn).not.toContain('s3cr3t');
    expect(dsn).toContain('cs@host:5432/db');
  });

  it('url-decodes a percent-encoded password', () => {
    expect(splitPassword('postgresql://cs:p%40ss%3Aword@host/db').password).toBe('p@ss:word');
  });

  it('leaves a URL without a password untouched', () => {
    const { dsn, password } = splitPassword('postgresql://cs@host:5432/db');
    expect(password).toBeNull();
    expect(dsn).toContain('host:5432/db');
  });

  it('passes through a non-URL connection string rather than guessing', () => {
    const raw = 'host=postgres port=5432 dbname=courseshelf';
    expect(splitPassword(raw)).toEqual({ dsn: raw, password: null });
  });
});
