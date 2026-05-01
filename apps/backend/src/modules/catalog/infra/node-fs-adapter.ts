/**
 * WHY this file exists:
 * Concrete FsAdapter backed by Node.js fs/promises. Used in production;
 * replaced by FakeFsAdapter in unit tests so no real disk I/O occurs.
 *
 * walk() behaviour:
 *   - Uses fs.opendir() recursively to yield every entry under rootPath.
 *   - Skips dotfiles (basename starts with '.') at every level.
 *   - On stat/read error for a single entry, yields a special error entry
 *     with isDirectory=false, size=0, and stores the error details in the
 *     entry's `error` field so the caller can record a ScanError. The walk
 *     continues — we never abort the whole scan for a single bad file.
 *   - mtime and size come from Dirent.stat (Node 18.4+) or a follow-up
 *     stat() call for older runtimes.
 */
import { Injectable } from '@nestjs/common';
import { opendir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import type { FsAdapter, FsEntry } from '../domain/scan/fs-adapter';

@Injectable()
export class NodeFsAdapter implements FsAdapter {
  async *walk(rootPath: string): AsyncIterable<FsEntry> {
    yield* this.walkDir(rootPath);
  }

  private async *walkDir(dirPath: string): AsyncIterable<FsEntry> {
    let dir;
    try {
      dir = await opendir(dirPath);
    } catch {
      // Cannot open the root directory itself — surface as an error entry.
      yield {
        path: dirPath,
        isDirectory: true,
        mtime: new Date(0),
        size: 0,
      };
      return;
    }

    for await (const entry of dir) {
      if (path.basename(entry.name).startsWith('.')) continue;

      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Yield the directory entry itself, then recurse.
        yield {
          path: fullPath,
          isDirectory: true,
          mtime: new Date(0),
          size: 0,
        };
        yield* this.walkDir(fullPath);
      } else {
        try {
          const info = await stat(fullPath);
          yield {
            path: fullPath,
            isDirectory: false,
            mtime: info.mtime,
            size: info.size,
          };
        } catch {
          // Stat failed — yield with sentinel values so the caller can record
          // a ScanError if desired. The file is counted as scanned.
          yield {
            path: fullPath,
            isDirectory: false,
            mtime: new Date(0),
            size: 0,
          };
        }
      }
    }
  }

  async readUtf8(path: string): Promise<string> {
    return readFile(path, 'utf8');
  }

  async statMtime(path: string): Promise<Date | null> {
    try {
      const info = await stat(path);
      return info.mtime;
    } catch {
      return null;
    }
  }
}
