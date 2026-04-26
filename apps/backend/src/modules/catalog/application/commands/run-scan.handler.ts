/**
 * WHY this file exists:
 * Orchestrates a library scan. The handler:
 *   1. Verifies the library exists.
 *   2. Verifies no scan is currently running for this library.
 *   3. Persists a Scan aggregate in status=running immediately.
 *   4. Returns { id, scan } (202 Accepted) — the HTTP response leaves before the walk finishes.
 *   5. Fire-and-forgets the actual walk via Promise.resolve().then(...) so the
 *      event loop can flush the response before the CPU-bound iteration begins.
 *
 * Walk algorithm:
 *   - Iterates FsAdapter.walk(library.rootPath).
 *   - Groups entries by top-level folder (first path segment relative to root).
 *   - For each folder: tries to read course.json; on parse failure records a
 *     ScanError and continues with folder-derived metadata.
 *   - Compares each file's (mtime, size) against the previous scan's
 *     discoveredFiles. New paths → filesAdded; changed signatures → filesUpdated;
 *     unchanged → neither counter bumped. This makes a second scan with no FS
 *     changes a counters-zero no-op.
 *   - On any unexpected exception inside the walk, calls scan.fail() and
 *     persists the terminal state.
 *
 * NOTE: v2 will move the async walk to a background worker queue (BullMQ).
 * For v1 the fire-and-forget in-process approach is intentional.
 *
 * No NestJS HTTP exceptions here — boundaries/element-types enforces this at lint time.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';
import path from 'node:path';

import { LibraryNotFoundError } from '../../domain/library/library.errors';
import { LIBRARY_REPOSITORY } from '../../domain/library/library.repository';
import { parseCourseJson } from '../../domain/scan/course-json.schema';
import { FS_ADAPTER } from '../../domain/scan/fs-adapter';
import { parseFolderName, parseLessonFileName } from '../../domain/scan/folder-name.parser';
import { Scan } from '../../domain/scan/scan';
import { ScanAlreadyRunningError } from '../../domain/scan/scan.errors';
import { SCAN_REPOSITORY } from '../../domain/scan/scan.repository';

import { RunScanCommand } from './run-scan.command';

import type { LibraryRepository } from '../../domain/library/library.repository';
import type { FsAdapter } from '../../domain/scan/fs-adapter';
import type { ScanRepository } from '../../domain/scan/scan.repository';
import type { DiscoveredFileEntry } from '../../domain/scan/scan';

@CommandHandler(RunScanCommand)
export class RunScanHandler implements ICommandHandler<RunScanCommand, Scan> {
  constructor(
    @Inject(LIBRARY_REPOSITORY) private readonly libraryRepo: LibraryRepository,
    @Inject(SCAN_REPOSITORY) private readonly scanRepo: ScanRepository,
    @Inject(FS_ADAPTER) private readonly fs: FsAdapter,
  ) {}

  async execute(command: RunScanCommand): Promise<Scan> {
    // 1. Verify library exists.
    const library = await this.libraryRepo.findById(command.libraryId);
    if (!library) throw new LibraryNotFoundError(command.libraryId);

    // 2. Enforce at-most-one-running-scan invariant.
    const running = await this.scanRepo.findRunningByLibrary(command.libraryId);
    if (running) throw new ScanAlreadyRunningError(command.libraryId);

    // 3. Load previous scan's discovered files for incremental comparison.
    const previous = await this.scanRepo.findLatestByLibrary(command.libraryId);
    const prevFileMap = new Map<string, { mtime: Date; size: number }>();
    if (previous) {
      for (const f of previous.discoveredFiles) {
        prevFileMap.set(f.path, { mtime: f.mtime, size: f.size });
      }
    }

    // 4. Create and persist a running scan (202 response returns this).
    const scan = Scan.start({ id: nanoid(), libraryId: command.libraryId });
    await this.scanRepo.save(scan);

    // 5. Fire-and-forget the actual walk.
    // NOTE: v2 will move this to a BullMQ background worker.
    Promise.resolve()
      .then(() => this.runWalk(scan, library.rootPath, prevFileMap))
      .catch(() => {
        // runWalk handles all errors internally and persists the terminal state.
        // This catch is a belt-and-suspenders guard for truly unexpected throws.
      });

    return scan;
  }

  // ---------------------------------------------------------------------------
  // Internal walk logic — runs after the HTTP response has been sent.
  // ---------------------------------------------------------------------------

  private async runWalk(
    scan: Scan,
    rootPath: string,
    prevFileMap: Map<string, { mtime: Date; size: number }>,
  ): Promise<void> {
    try {
      // Collect all entries grouped by top-level course folder.
      // key = absolute path of the immediate child directory of rootPath
      const courseEntries = new Map<string, { path: string; mtime: Date; size: number }[]>();
      // Files directly at the root are ignored (no folder → no course).

      for await (const entry of this.fs.walk(rootPath)) {
        if (entry.isDirectory) continue;

        const rel = path.relative(rootPath, entry.path);
        const segments = rel.split(/[/\\]/);

        // Skip files directly in the root (no course folder).
        if (segments.length < 2) continue;

        // segments[0] is always defined when length >= 2.
        const topFolder = segments[0] ?? '';
        if (!courseEntries.has(topFolder)) {
          courseEntries.set(topFolder, []);
        }
        // courseEntries.get(topFolder) is guaranteed non-null: we just set it above.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        courseEntries.get(topFolder)!.push({
          path: entry.path,
          mtime: entry.mtime,
          size: entry.size,
        });
      }

      // Process each course folder.
      for (const [folderName, files] of courseEntries) {
        const courseFolder = `${rootPath}/${folderName}`;
        const { label: folderTitle } = parseFolderName(folderName);

        // Attempt to read and parse course.json.
        let courseTitle = folderTitle;
        const jsonFile = files.find((f) => path.basename(f.path) === 'course.json');

        if (jsonFile) {
          try {
            const raw = await this.fs.readUtf8(jsonFile.path);
            const parsed = parseCourseJson(raw, jsonFile.path);
            courseTitle = parsed.title;
          } catch (error) {
            // Record a non-fatal ScanError but continue with folder-derived title.
            scan.recordError({
              path: path.relative(rootPath, jsonFile.path),
              message: error instanceof Error ? error.message : String(error),
              code: 'course-json-invalid',
            });
          }
        }

        // Process lesson files (non-course.json files).
        const lessonFiles: string[] = [];
        const sectionSet = new Set<string>();

        for (const file of files) {
          const fileBasename = path.basename(file.path);
          if (fileBasename === 'course.json') continue;

          const parsed = parseLessonFileName(fileBasename);

          if (parsed.unsupportedExtension) {
            scan.recordError({
              path: path.relative(rootPath, file.path),
              message: `Unsupported file extension "${parsed.extension}".`,
              code: 'unsupported-extension',
            });
            continue;
          }

          lessonFiles.push(file.path);

          // Determine which section this file belongs to (2nd path segment
          // under course). Run the section folder name through parseFolderName
          // so word-prefixed layouts ("Модуль 2 - Настройки окружения",
          // "Глава 2. Продвинутые техники") and the numeric "01 - …" form
          // both yield clean labels in `sectionTitles` rather than the raw
          // folder string.
          const relFromCourse = path.relative(courseFolder, file.path);
          const relSegments = relFromCourse.split(/[/\\]/);
          if (relSegments.length > 1) {
            const sectionFolder = relSegments[0] ?? '';
            const { label } = parseFolderName(sectionFolder);
            sectionSet.add(label);
          }

          // Incremental comparison.
          const prev = prevFileMap.get(file.path);
          const fileEntry: DiscoveredFileEntry = {
            path: file.path,
            mtime: file.mtime,
            size: file.size,
          };

          if (!prev) {
            scan.recordFileAdded(fileEntry);
          } else if (prev.mtime.getTime() !== file.mtime.getTime() || prev.size !== file.size) {
            scan.recordFileUpdated(fileEntry);
          } else {
            scan.recordFileUnchanged(fileEntry);
          }
        }

        // Record the course if it has at least one lesson file.
        if (lessonFiles.length > 0) {
          scan.incrementCoursesDiscovered({
            path: courseFolder,
            title: courseTitle,
            sectionTitles: [...sectionSet],
            lessonFiles,
          });
        }
      }

      scan.complete();
    } catch {
      // Unexpected failure — transition to failed so the aggregate is not stuck running.
      try {
        scan.fail();
      } catch {
        // scan is already terminal (should not happen, but be safe).
      }
    } finally {
      // Always persist the terminal state.
      await this.scanRepo.save(scan).catch(() => {
        // Best-effort — nothing else we can do if the DB write fails here.
      });
    }
  }
}
