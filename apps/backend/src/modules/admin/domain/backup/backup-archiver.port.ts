/**
 * WHY this file exists:
 * Port for producing and locating database archives, so the command handler
 * never knows about `pg_dump`, child processes, or the filesystem. The
 * production implementation is PgDumpArchiver; tests use a fake.
 */

export interface BackupArchive {
  /** Opaque identifier — also the archive's basename on disk. */
  readonly id: string;
  /** Absolute path to the archive file. */
  readonly filePath: string;
  readonly sizeBytes: number;
  readonly createdAt: Date;
}

export interface BackupArchiver {
  /**
   * Produce a new archive. Deletes archives older than the retention window
   * first, so a scheduled caller cannot fill the volume.
   *
   * Throws BackupUnavailableError subclasses when the environment cannot
   * produce one (missing binary, client/server major skew, non-zero exit,
   * timeout). Never leaves a partial file behind.
   */
  create(): Promise<BackupArchive>;

  /**
   * Locate an existing archive by id, or throw BackupNotFoundError.
   * Rejects any id that is not the exact generated shape, so the id can never
   * escape the backup directory.
   */
  locate(id: string): Promise<BackupArchive>;
}

export const BACKUP_ARCHIVER = Symbol('BACKUP_ARCHIVER');

/**
 * `<YYYYMMDD>T<HHMMSS>-<16 hex>`. The timestamp makes a directory listing
 * readable; the random half is what makes the id unguessable.
 *
 * Anything not matching is rejected before it reaches `path.join`, which is the
 * only thing standing between a URL segment and a path traversal.
 */
export const BACKUP_ID_PATTERN = /^\d{8}T\d{6}-[0-9a-f]{16}$/;

/** Extension for `pg_dump --format=custom` output, restored with `pg_restore`. */
export const BACKUP_FILE_EXTENSION = '.dump';
