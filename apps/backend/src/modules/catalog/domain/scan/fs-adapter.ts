/**
 * WHY this file exists:
 * Port (interface + Symbol token) for filesystem I/O. Isolating file system
 * access behind a port allows unit tests to supply a fake in-memory tree via
 * FakeFsAdapter without any real disk I/O, and production code to use the
 * NodeFsAdapter backed by fs/promises.
 *
 * Naming convention:
 *   Token:   FS_ADAPTER
 *   Port:    FsAdapter (interface)
 *   Adapter: NodeFsAdapter (infra/node-fs-adapter.ts)
 *   Binding: { provide: FS_ADAPTER, useClass: NodeFsAdapter }
 */

/** Injection token — Symbol ensures global uniqueness across the process. */
export const FS_ADAPTER = Symbol('FS_ADAPTER');

/** A single filesystem entry returned by walk(). */
export interface FsEntry {
  /** Absolute path to the entry. */
  path: string;
  /** True when the entry is a directory, false for a regular file. */
  isDirectory: boolean;
  /** Last-modified timestamp of the entry. */
  mtime: Date;
  /** Byte size. 0 for directories. */
  size: number;
}

export interface FsAdapter {
  /**
   * Recursively yield every entry (file and directory) under rootPath.
   * Implementations must skip dotfiles (entries whose basename starts with '.').
   * Errors during enumeration should be swallowed and surfaced as a ScanError
   * row on the aggregate rather than propagating — callers are responsible for
   * wrapping the walk in a try/catch for truly catastrophic failures.
   */
  walk(rootPath: string): AsyncIterable<FsEntry>;

  /** Read the UTF-8 content of a file. Throws on I/O error. */
  readUtf8(path: string): Promise<string>;

  /**
   * Return the mtime of `path`, or null if the path does not exist (or any
   * other stat error). Used for the thumbnail freshness check during scan;
   * routing it through the port keeps unit tests off the real filesystem.
   */
  statMtime(path: string): Promise<Date | null>;
}
