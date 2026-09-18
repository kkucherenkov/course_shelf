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
 * Two idempotency modes, and scope is what picks between them. Both
 * reconcile lessons by videoPath and keep their id, because LessonProgress /
 * Bookmark / Note / Transcript all reference lessonId with no foreign key
 * behind them — a new id orphans all four silently. An id is reused only
 * when the matched lesson's courseId is this course: the library-wide index
 * (`existingLessonByVideoPath`) spans every course, so that check is what
 * stops a lesson being adopted across a course boundary (#544).
 *   - Library-wide scan (no scope): a folder that is ALREADY IMPORTED is
 *     RECONCILED, not skipped and not re-created — every scan corrects
 *     lesson positions, the class of bug that left 153 lessons across 6
 *     courses stuck in the order a since-replaced filename parser produced
 *     (#544). Course-level metadata (title, slug, poster, level, language,
 *     rating, instructor/studio/tag links) is never re-derived — the user's
 *     edit through the API wins — and neither are sections: a section folder
 *     with no persisted match is left for a scoped rescan, and a lesson
 *     whose video vanished from disk is not removed. "Already imported"
 *     means the slug is taken AND belongs to this folder — a slug taken by a
 *     different folder is a collision, not an import, and the second folder
 *     imports under a discriminated slug with a ScanError.
 *   - Scoped rescan (POST /courses/{id}/rescan): FORCE-RESYNC. Pressing
 *     "Rescan" on one course page means "re-import this course from disk", so
 *     scope IS the force signal — there is no second flag. On top of the
 *     library-wide reconciliation above, sections are re-derived from disk
 *     and a lesson whose video is gone is deleted, along with every row that
 *     references its id.
 *
 * NOTE: v2 will move the async walk to a background worker queue (BullMQ).
 * For v1 the fire-and-forget in-process approach is intentional.
 *
 * No NestJS HTTP exceptions here — boundaries/element-types enforces this at lint time.
 */
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';
import { createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { AppConfig } from '../../../../common/config/app-config';
import { CentrifugoService } from '../../../../common/centrifugo/centrifugo.service';
import { Course } from '../../domain/course/course';
import {
  CourseNotFoundError,
  CourseSlugAlreadyTakenError,
} from '../../domain/course/course.errors';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { Lesson } from '../../domain/lesson/lesson';
import { MaterialKindUnsupportedError } from '../../domain/lesson/lesson.errors';
import { Material } from '../../domain/lesson/material';
import { LESSON_REPOSITORY } from '../../domain/lesson/lesson.repository';
import { Subtitle, dedupeSubtitlePathsByLanguage, languageOf } from '../../domain/lesson/subtitle';
import { LibraryNotFoundError } from '../../domain/library/library.errors';
import { LIBRARY_REPOSITORY } from '../../domain/library/library.repository';
import { parseCourseJson, normaliseCourseJson } from '../../domain/scan/course-json.schema';
import { FFMPEG_ADAPTER } from '../../domain/scan/ffmpeg-adapter';
import { FS_ADAPTER } from '../../domain/scan/fs-adapter';
import { parseFolderName, parseLessonFileName } from '../../domain/scan/folder-name.parser';
import { assignLessonPositions } from '../../domain/scan/lesson-position';
import { SLUG_MAX_LENGTH, slugify } from '../../domain/shared-vo/entity-slug';
import { LibraryRelativePath } from '../../domain/shared-vo/library-relative-path';
import { stemMatch } from '../../domain/scan/stem-match';
import { Scan } from '../../domain/scan/scan';
import { ScanAlreadyRunningError } from '../../domain/scan/scan.errors';
import { SCAN_REPOSITORY } from '../../domain/scan/scan.repository';
import { derivedThumbnailPath } from '../../domain/transcription/derived-path';
import { TRANSCRIPT_REPOSITORY } from '../../domain/transcription/transcript.repository';

import { MetadataLinker } from '../scan/metadata-linker';
import { PosterSyncService } from '../scan/poster-sync.service';
import { ingestSidecarTranscripts } from '../scan/sidecar-transcript-ingester';
import { isCourseLevel } from '../../domain/course/course';
import { RunScanCommand } from './run-scan.command';

import type { FfmpegAdapter, VideoMetadata } from '../../domain/scan/ffmpeg-adapter';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { LibraryRepository } from '../../domain/library/library.repository';
import type { FsAdapter } from '../../domain/scan/fs-adapter';
import type { ScanRepository } from '../../domain/scan/scan.repository';
import type { TranscriptRepository } from '../../domain/transcription/transcript.repository';
import type { NormalisedCourseJsonV2 } from '../../domain/scan/course-json.schema';
import type { ParsedLessonFileName } from '../../domain/scan/folder-name.parser';
import type {
  DiscoveredFileEntry,
  ScannedLessonEntry,
  ScannedMaterial,
  ScannedSubtitle,
} from '../../domain/scan/scan';

// ---------------------------------------------------------------------------
// Slug helpers
//
// `toSlug` is `slugify` (domain/shared-vo/entity-slug) with the scan's own
// answer to an unsluggable title: the walk must keep going, so it falls back
// to a literal instead of throwing the way the upsert handlers want it to.
// The derivation itself — charset, NFC normalisation, length cap — lives in
// exactly one place, which is the point: this function used to hold its own
// copy stripping `[^a-z0-9]`, so EVERY Latin-free title collapsed to
// 'untitled' and the duplicate-slug guard below dropped all but the first.
// Measured on the maintainer's library: eight Cyrillic course folders, one
// imported, 253 lessons lost with no ScanError to show for it.
//
// Examples:
//   'Pragmatic Clean Architecture'  → 'pragmatic-clean-architecture'
//   '01 - NestJS: Basics & Beyond'  → '01-nestjs-basics-beyond'
//   'Графы и комбинаторика'         → 'графы-и-комбинаторика'
// ---------------------------------------------------------------------------
function toSlug(title: string): string {
  try {
    return slugify(title);
  } catch {
    // Symbol-only title (e.g. '!!!'). Every such folder gets the same slug, so
    // the second one onwards goes down the collision path below — which now
    // imports it under a discriminated slug instead of dropping it.
    return 'untitled';
  }
}

/**
 * Deterministic per-folder suffix used to break a slug collision.
 *
 * Derived from the folder name rather than from a counter, so the same folder
 * gets the same discriminated slug on every scan. A counter would renumber the
 * moment a sibling folder is added or removed, and the rescan would import a
 * second copy of a course it already had.
 */
function slugDiscriminator(folderName: string): string {
  return createHash('sha256').update(folderName).digest('hex').slice(0, 8);
}

/**
 * `base`, shortened to make room, plus a folder-derived suffix — still within
 * the slug length cap. The trailing strip covers what the cut can leave
 * behind: a hyphen, an orphaned combining mark, or half of an astral character.
 */
function discriminatedSlug(base: string, folderName: string): string {
  const suffix = slugDiscriminator(folderName);
  const head = base
    .slice(0, SLUG_MAX_LENGTH - suffix.length - 1)
    .replace(/[-\p{M}\uD800-\uDBFF]+$/u, '');
  return `${head}-${suffix}`;
}

@CommandHandler(RunScanCommand)
export class RunScanHandler implements ICommandHandler<RunScanCommand, Scan> {
  private readonly logger = new Logger(RunScanHandler.name);

  constructor(
    @Inject(LIBRARY_REPOSITORY) private readonly libraryRepo: LibraryRepository,
    @Inject(SCAN_REPOSITORY) private readonly scanRepo: ScanRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(FS_ADAPTER) private readonly fs: FsAdapter,
    @Inject(FFMPEG_ADAPTER) private readonly ffmpeg: FfmpegAdapter,
    @Inject(TRANSCRIPT_REPOSITORY) private readonly transcripts: TranscriptRepository,
    private readonly appConfig: AppConfig,
    private readonly centrifugo: CentrifugoService,
    private readonly linker: MetadataLinker,
    private readonly posterSync: PosterSyncService,
  ) {}

  async execute(command: RunScanCommand): Promise<Scan> {
    // 0. Scoped rescan (E32-F01-S02): resolve the course and its library
    // first — POST /courses/{id}/rescan only ever has a courseId, never a
    // libraryId. The library-wide path (command.scope undefined) is
    // unchanged: command.libraryId is used as-is.
    let scopeCourse: Course | undefined;
    let libraryId = command.libraryId;
    if (command.scope) {
      const course = await this.courseRepo.findById(command.scope.courseId);
      if (!course) throw new CourseNotFoundError(command.scope.courseId);
      scopeCourse = course;
      libraryId = course.libraryId;
    }
    // Unreachable via the two real call sites (ScansController always passes
    // libraryId; CoursesController always passes scope) — defensive only.
    if (!libraryId) throw new LibraryNotFoundError('');

    // 1. Verify library exists.
    const library = await this.libraryRepo.findById(libraryId);
    if (!library) throw new LibraryNotFoundError(libraryId);

    // 2. Enforce at-most-one-running-scan invariant.
    const running = await this.scanRepo.findRunningByLibrary(libraryId);
    if (running) throw new ScanAlreadyRunningError(libraryId);

    // 3. Load previous scan's discovered files for incremental comparison.
    const previous = await this.scanRepo.findLatestByLibrary(libraryId);
    const prevFileMap = new Map<string, { mtime: Date; size: number }>();
    if (previous) {
      for (const f of previous.discoveredFiles) {
        prevFileMap.set(f.path, { mtime: f.mtime, size: f.size });
      }
    }

    // 4. Create and persist a running scan (202 response returns this).
    const scan = Scan.start({
      id: nanoid(),
      libraryId,
      ...(scopeCourse
        ? { scope: { courseId: scopeCourse.id, courseName: scopeCourse.title } }
        : {}),
    });
    await this.scanRepo.save(scan);

    // Publish 'started' event — fire-and-forget; Centrifugo being down must
    // not block the scan or prevent the 202 from going out.
    void this.centrifugo.publish(`scans:user:${command.actorUserId}`, {
      kind: 'started',
      scanId: scan.id,
      libraryId: library.id,
      libraryName: library.name,
      at: new Date().toISOString(),
      ...(scopeCourse ? { scopeCourseId: scopeCourse.id, scopeCourseName: scopeCourse.title } : {}),
    });

    // 5. Fire-and-forget the actual walk.
    // NOTE: v2 will move this to a BullMQ background worker.
    Promise.resolve()
      .then(() =>
        this.runWalk(
          scan,
          library.id,
          library.name,
          library.rootPath,
          prevFileMap,
          command.actorUserId,
          scopeCourse,
        ),
      )
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
    libraryId: string,
    libraryName: string,
    rootPath: string,
    prevFileMap: Map<string, { mtime: Date; size: number }>,
    actorUserId: string,
    scopeCourse?: Course,
  ): Promise<void> {
    const channel = `scans:user:${actorUserId}`;
    let lastProgressPublishedAt = 0;

    const publishProgress = (): void => {
      void this.centrifugo.publish(channel, {
        kind: 'progress',
        scanId: scan.id,
        libraryId,
        libraryName,
        at: new Date().toISOString(),
        filesScanned: scan.filesScanned,
        filesAdded: scan.filesAdded,
        filesUpdated: scan.filesUpdated,
        coursesDiscovered: scan.coursesDiscovered,
        errorsCount: scan.errors.length,
        ...(scan.scopeCourseId
          ? { scopeCourseId: scan.scopeCourseId, scopeCourseName: scan.scopeCourseName }
          : {}),
      });
      lastProgressPublishedAt = Date.now();
    };

    try {
      // -----------------------------------------------------------------------
      // Scoped rescan (E32-F01-S02): resolve which on-disk folder belongs to
      // scopeCourse from one of its already-persisted lessons' videoPath —
      // Course does not itself store a folder path. Undefined when this is a
      // library-wide scan (the default, unchanged) or when the scoped course
      // somehow has no lessons to derive a folder from (recorded as a
      // ScanError rather than silently falling back to the whole library).
      // The walk below stays whole (a directory listing is cheap — see the
      // card's "Why"); only the FILTER on which folder gets grouped, and
      // later which folder gets the expensive per-lesson processing, is
      // scoped.
      // -----------------------------------------------------------------------
      let targetFolderName: string | undefined;
      const scopedLessons = scopeCourse ? await this.lessonRepo.findByCourse(scopeCourse.id) : [];
      if (scopeCourse) {
        const anyLesson = scopedLessons[0];
        if (anyLesson) {
          // `videoPath` is library-relative (LibraryRelativePath) — its own
          // first segment is already the top-level folder, no need to
          // relativise against rootPath again.
          targetFolderName = anyLesson.videoPath.split(/[/\\]/)[0];
        } else {
          scan.recordError({
            path: rootPath,
            message: `Course "${scopeCourse.id}" has no lessons to derive its on-disk folder from — cannot scope the rescan.`,
            code: 'course-scope-unresolvable',
          });
        }
      }

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

        // Scoped rescan: skip every folder except the target course's.
        if (scopeCourse && topFolder !== targetFolderName) continue;

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

      // Load existing courses for this library once, upfront, so the
      // idempotency check (skip if slug already known) is a Map lookup
      // rather than a per-course DB round-trip.
      const existingCourses = await this.courseRepo.findManyByLibrary(libraryId);
      const existingSlugSet = new Set(existingCourses.map((c) => c.slug));

      // Which top-level folder each already-imported slug came from, filled in
      // from that course's lessons below (Course has no folder column).
      //
      // WHY it is needed: "this slug is taken" and "this FOLDER is already
      // imported" used to be the same question, because one title could only
      // ever produce one slug. Once a taken slug can belong to a different
      // folder, answering the second question with the first is what silently
      // drops a course. With the owner known, a taken slug splits into two
      // cases — mine (skip, idempotent) and someone else's (discriminate and
      // import, with a ScanError) — and neither is silent.
      const existingFolderBySlug = new Map<string, string>();

      // Top-level folders that already own a persisted course, from that
      // course's own lessons — never from its slug (#504). A slug is a label
      // an operator can edit through PATCH /courses/{id}
      // (update-course-metadata.handler.ts treats title and slug as
      // independent fields), and once edited it stops matching what this
      // folder derives on the next scan. Matching on the folder itself is
      // what a slug edit cannot break; the identity check below reads this
      // set first, before either one's derived slug enters the picture.
      const importedFolderNames = new Set<string>();

      // Same identity, but resolving to the actual Course aggregate rather
      // than just its name — a library-wide scan on an already-imported
      // folder reconciles that course (#544) instead of skipping it, and
      // needs the aggregate itself to do that. Populated alongside
      // `importedFolderNames` below, never separately, so the two can never
      // disagree on which folders are "already imported".
      const courseByFolderName = new Map<string, Course>();

      // Every lesson already known for this library, keyed by the ABSOLUTE
      // path the walk itself produces (`videoFile.path` below, and
      // `seenVideoPaths`) — `lesson.videoPath` is library-relative
      // (LibraryRelativePath), so it is re-resolved against `rootPath` on the
      // way in via `absoluteVideoPath()` to land in the same space.
      // Two uses (E27-F01-S01, E25-F04-S01):
      //   - a video whose course is already known still gets its sidecars
      //     re-checked every scan (v1 otherwise never revisits it at all);
      //   - a video that WAS in this map but is not in `seenVideoPaths` once
      //     the walk finishes has vanished from disk — its lesson's Transcript
      //     rows get cleaned up below.
      //
      // Scoped rescan (E32-F01-S02): this is the map orphan cleanup reads at
      // the end of the walk, so scoping it here is what keeps cleanup
      // scope-aware for free — index only the target course's own lessons
      // (one query) instead of every course in the library (N+1 queries over
      // courses this scan never even looks at). Trap avoided: a scoped scan
      // only ever sees ITS OWN folder in `seenVideoPaths`, so indexing every
      // OTHER course's lessons here would make them all look deleted from
      // disk once the walk reaches the cleanup loop below.
      const existingLessonByVideoPath = new Map<string, Lesson>();
      if (scopeCourse) {
        if (targetFolderName !== undefined) {
          for (const lesson of scopedLessons) {
            existingLessonByVideoPath.set(lesson.absoluteVideoPath(rootPath), lesson);
          }
        }
        // targetFolderName undefined → scope was unresolvable (ScanError
        // already recorded above) → index nothing, so cleanup touches
        // nothing rather than treating every lesson as newly orphaned.
      } else {
        for (const course of existingCourses) {
          for (const lesson of await this.lessonRepo.findByCourse(course.id)) {
            existingLessonByVideoPath.set(lesson.absoluteVideoPath(rootPath), lesson);
            // Every lesson of one course lives under one top-level folder, so
            // the first one answers for all of them. `videoPath` is already
            // library-relative — its own first segment is the folder.
            const [folder] = lesson.videoPath.split(/[/\\]/);
            if (folder !== undefined && folder !== '') {
              importedFolderNames.add(folder);
              courseByFolderName.set(folder, course);
              if (!existingFolderBySlug.has(course.slug)) {
                existingFolderBySlug.set(course.slug, folder);
              }
            }
          }
        }
      }
      const seenVideoPaths = new Set<string>();

      // Set once a force-resync has actually re-imported the scoped course's
      // folder. Gates the lesson deletion in the cleanup below — see there.
      let resyncedCourseId: string | undefined;

      // Process each course folder.
      for (const [folderName, files] of courseEntries) {
        const courseFolder = `${rootPath}/${folderName}`;
        const { label: folderTitle } = parseFolderName(folderName);

        // Attempt to read and parse course.json.
        let courseTitle = folderTitle;
        let normalisedCourseJson: NormalisedCourseJsonV2 | undefined;
        const jsonFile = files.find((f) => path.basename(f.path) === 'course.json');

        if (jsonFile) {
          try {
            const raw = await this.fs.readUtf8(jsonFile.path);
            const parsed = parseCourseJson(raw, jsonFile.path);
            normalisedCourseJson = normaliseCourseJson(parsed);
            courseTitle = normalisedCourseJson.title;
          } catch (error) {
            // Record a non-fatal ScanError but continue with folder-derived title.
            scan.recordError({
              path: path.relative(rootPath, jsonFile.path),
              message: error instanceof Error ? error.message : String(error),
              code: 'course-json-invalid',
            });
          }
        }

        // -----------------------------------------------------------------------
        // Step 1: Group non-course.json files by (directory, canonical stem).
        //
        // WHY grouping: a course folder may contain `1.1 Vim.mp4` alongside
        // sidecar files like `1.1. Vim.pdf` (dot-variant) or `1.1 Vim.en.srt`.
        // Without grouping, the PDF and SRT would fall through as
        // unsupported-extension ScanErrors. stemMatch normalises both prefix
        // variants to the same canonical stem so sidecar files can be
        // associated with their video (the "Neovim mass ScanError" fix).
        //
        // WHY the directory is part of the key: `stemMatch` reads the basename
        // only — by contract — and this map spans the WHOLE course, sections
        // included. Keyed by the stem alone, two videos in different section
        // folders that happen to share a filename collapse into one group and
        // `group.video` silently overwrites the earlier one: no error, no
        // warning, the lesson simply never exists. Measured on the maintainer's
        // library: a course of 31 videos all named `video.mp4`, one per section
        // folder, imported exactly ONE lesson — 296 videos across 18 courses
        // lost this way, ~5 % of a 5984-video library. A sidecar is by
        // definition a sibling of its video, so scoping the key to the
        // directory cannot break the pairing the shared key exists for.
        // -----------------------------------------------------------------------

        // key = `${directory}\0${canonicalStem}`; value = files by kind.
        const stemGroups = new Map<
          string,
          {
            video: { path: string; mtime: Date; size: number } | undefined;
            materials: { path: string; size: number }[];
            subtitles: { path: string; language: string; mtime: Date; size: number }[];
            unsupported: { path: string; ext: string }[];
          }
        >();

        // section label → smallest ordinal seen for that label (or undefined
        // when none of the sibling folders carry one). Persisted as a Map so
        // section order downstream is the natural ordinal order rather than
        // file-walk insertion order — `1, 2, 3, …, 10` instead of the
        // lexicographic `1, 10, 2, …` that a Set would produce.
        const sectionMap = new Map<string, number | undefined>();

        for (const file of files) {
          const fileBasename = path.basename(file.path);
          if (fileBasename === 'course.json') continue;

          const { canonicalStem, kind } = stemMatch(file.path);
          // NUL cannot occur in a path component on any filesystem we read, so
          // it is the one separator that cannot be forged by a directory or a
          // stem containing it.
          const groupKey = `${path.dirname(file.path)}\u0000${canonicalStem}`;

          if (!stemGroups.has(groupKey)) {
            stemGroups.set(groupKey, {
              video: undefined,
              materials: [],
              subtitles: [],
              unsupported: [],
            });
          }
          // Non-null guaranteed: we just set the entry with stemGroups.set() above.
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guaranteed above
          const group = stemGroups.get(groupKey)!;

          switch (kind) {
            case 'video': {
              group.video = { path: file.path, mtime: file.mtime, size: file.size };
              break;
            }
            case 'material': {
              group.materials.push({ path: file.path, size: file.size });
              break;
            }
            case 'subtitle': {
              group.subtitles.push({
                path: file.path,
                language: languageOf(fileBasename),
                mtime: file.mtime,
                size: file.size,
              });
              break;
            }
            case 'ignored': {
              // Generated cache files (*.cache.vtt) — silently skip, no ScanError.
              break;
            }
            default: {
              group.unsupported.push({
                path: file.path,
                ext: fileBasename.slice(fileBasename.lastIndexOf('.')).toLowerCase(),
              });
            }
          }

          // Track section folders for course metadata.
          const relFromCourse = path.relative(courseFolder, file.path);
          const relSegments = relFromCourse.split(/[/\\]/);
          if (relSegments.length > 1) {
            const sectionFolder = relSegments[0] ?? '';
            const { label, ordinal } = parseFolderName(sectionFolder);
            // Keep the smallest ordinal seen for this label so two sibling
            // folders that collapse to the same label (e.g. "1 Урок" and
            // "2 Урок" both producing label="Урок") do not overwrite the
            // first ordinal recorded.
            const prev = sectionMap.get(label);
            if (!sectionMap.has(label)) {
              sectionMap.set(label, ordinal);
            } else if (ordinal !== undefined && (prev === undefined || ordinal < prev)) {
              sectionMap.set(label, ordinal);
            }
          }
        }

        // Sort sections by their parsed ordinal; labels without an ordinal go
        // last in alphabetical order (so a course mixing "01 - Intro" with
        // "Bonus Material" lands the bonus folder after the numbered sections).
        const sortedSectionEntries = [...sectionMap.entries()].toSorted(
          ([labelA, ordA], [labelB, ordB]) => {
            if (ordA !== undefined && ordB !== undefined) return ordA - ordB;
            if (ordA !== undefined) return -1;
            if (ordB !== undefined) return 1;
            return labelA.localeCompare(labelB);
          },
        );

        // -----------------------------------------------------------------------
        // Step 2: Process each stem group.
        //
        // - Groups WITH a video:  video = lesson, sidecars attach to it.
        //   Video file participates in incremental comparison (filesAdded/Updated).
        //   Sidecars do NOT bump filesAdded/filesUpdated — only the video does.
        //   Unsupported files in the group are still ScanErrors (belt-and-suspenders).
        // - Groups WITHOUT a video: silently skipped (#523). Material and
        //   Subtitle are both value objects scoped to a Lesson (see
        //   domain/lesson/material.ts) — with no video there is no lesson to
        //   attach them to. A course folder holds far more than its videos
        //   (slides, exercises, sample code, archives), and none of that is a
        //   scan failure. Measured on a clean import of the maintainer's
        //   library: 9201 unsupported-extension errors and 3 genuine ones;
        //   PR #519 stopped the walk descending into node_modules/vendor/etc
        //   but left ~7800 of the 9201 in place — this branch is the rest.
        // -----------------------------------------------------------------------

        const lessonFiles: string[] = [];
        const discoveredLessons: ScannedLessonEntry[] = [];

        for (const [, group] of stemGroups) {
          if (group.video) {
            const videoFile = group.video;
            lessonFiles.push(videoFile.path);
            seenVideoPaths.add(videoFile.path);

            // Incremental comparison for the video file only.
            const prev = prevFileMap.get(videoFile.path);
            const fileEntry: DiscoveredFileEntry = {
              path: videoFile.path,
              mtime: videoFile.mtime,
              size: videoFile.size,
            };

            if (!prev) {
              scan.recordFileAdded(fileEntry);
            } else if (
              prev.mtime.getTime() !== videoFile.mtime.getTime() ||
              prev.size !== videoFile.size
            ) {
              scan.recordFileUpdated(fileEntry);
            } else {
              scan.recordFileUnchanged(fileEntry);
            }

            // Build the discovered lesson entry with sidecar collections.
            const materials: ScannedMaterial[] = group.materials.map((m) => ({
              path: m.path,
              sizeBytes: m.size,
            }));
            const subtitles: ScannedSubtitle[] = group.subtitles.map((s) => ({
              path: s.path,
              language: s.language,
              mtime: s.mtime,
              size: s.size,
            }));

            // -----------------------------------------------------------------------
            // Sidecar ingest (E27-F01-S01) for a lesson that already exists.
            //
            // A brand-new lesson (course not yet in `existingLessonByVideoPath`) is
            // ingested after it is persisted, further down — there is no lessonId
            // yet at this point in the walk. An existing lesson's course may or may
            // not itself get touched below (v1 skips re-persisting a known course),
            // but its sidecars are re-checked every scan regardless: this is the
            // only place that happens, so it does not wait on that decision.
            // -----------------------------------------------------------------------
            const existingLesson = existingLessonByVideoPath.get(videoFile.path);
            if (existingLesson) {
              const sidecarErrors = await ingestSidecarTranscripts({
                fs: this.fs,
                transcripts: this.transcripts,
                lessonId: existingLesson.id,
                rootPath,
                subtitles,
              });
              for (const sidecarError of sidecarErrors) scan.recordError(sidecarError);
            }

            // -----------------------------------------------------------------------
            // ffprobe + thumbnail extraction (E06-F02-S02)
            //
            // Probe the video for duration/resolution/codec. On failure record a
            // ScanError with code 'ffmpeg-probe-failed' and continue — no metadata,
            // no thumbnail attempt for this lesson.
            //
            // On probe success: write a 320×180 JPEG poster under the derived
            // volume (E25-F04-S01) — never next to the video, which fails on
            // every production install because COURSES_PATH is mounted `:ro`.
            // The thumbnail write is idempotent: skip if the existing thumbnail's
            // mtime is newer than the video's mtime (meaning it was already generated
            // for the current version of the video).
            //
            // Failure on writeThumbnail is also non-fatal: ScanError recorded,
            // walk continues, metadata is still stored on the lesson entry.
            // -----------------------------------------------------------------------

            let metadata: VideoMetadata | undefined;

            try {
              metadata = await this.ffmpeg.probe(videoFile.path);
            } catch (error) {
              scan.recordError({
                path: path.relative(rootPath, videoFile.path),
                message: error instanceof Error ? error.message : String(error),
                code: 'ffmpeg-probe-failed',
              });
            }

            if (metadata !== undefined) {
              try {
                const relativeVideoPath = path.relative(rootPath, videoFile.path);
                const thumbPath = derivedThumbnailPath({
                  derivedRoot: this.appConfig.derivedPath,
                  libraryId,
                  videoPath: relativeVideoPath,
                });

                // Idempotency: skip write if the thumbnail is newer than the
                // source video. videoFile.mtime is already known from the walk,
                // so we only need to stat the thumbnail. Routed through the
                // FsAdapter port (returns null on ENOENT) so unit tests stay
                // off the real filesystem.
                const thumbMtime = await this.fs.statMtime(thumbPath);
                const shouldWriteThumb =
                  thumbMtime === null || thumbMtime.getTime() <= videoFile.mtime.getTime();

                if (shouldWriteThumb) {
                  const atSecond = Math.max(metadata.durationSeconds / 4, 1);
                  await mkdir(path.dirname(thumbPath), { recursive: true });
                  await this.ffmpeg.writeThumbnail({
                    videoAbsolutePath: videoFile.path,
                    outAbsolutePath: thumbPath,
                    atSecond,
                    widthPx: 320,
                    heightPx: 180,
                    jpegQuality: this.appConfig.thumbnailJpegQuality,
                  });
                }
              } catch (error) {
                scan.recordError({
                  path: path.relative(rootPath, videoFile.path),
                  message: error instanceof Error ? error.message : String(error),
                  code: 'ffmpeg-thumbnail-failed',
                });
              }
            }

            discoveredLessons.push({
              videoPath: videoFile.path,
              mtime: videoFile.mtime,
              sizeBytes: videoFile.size,
              materials,
              subtitles,
              ...(metadata === undefined ? {} : { metadata }),
            });

            // Belt-and-suspenders: truly unsupported files even within a
            // stem group with a video still surface as ScanErrors.
            for (const u of group.unsupported) {
              scan.recordError({
                path: path.relative(rootPath, u.path),
                message: `Unsupported file extension "${u.ext}".`,
                code: 'unsupported-extension',
              });
            }
          }
          // No video in this stem group: nothing to do. See the WHY above
          // Step 2 — not a failure, and nowhere to attach these files without
          // a lesson (#523).
        }

        // Record the course if it has at least one lesson file.
        if (lessonFiles.length > 0) {
          const sortedSectionTitles = sortedSectionEntries.map(([title]) => title);
          scan.incrementCoursesDiscovered({
            path: courseFolder,
            title: courseTitle,
            sectionTitles: sortedSectionTitles,
            lessonFiles,
            discoveredLessons,
          });

          // -------------------------------------------------------------------
          // Persist Course + Section + Lesson rows.
          //
          // Library-wide scan, folder already imported: RECONCILE (#544), not
          // skip and not re-create. Lesson positions and lesson ids are
          // recomputed the same way a scoped rescan recomputes them, minus
          // the two things scope alone still does: course-level metadata is
          // never re-derived (a user's title/slug/poster edit through the API
          // wins) and sections are left exactly as persisted — a section
          // folder with no matching persisted section produces
          // 'lesson-section-unresolvable' for its lessons rather than a new
          // section, and a lesson whose video vanished is not removed. Both
          // are deliberately narrower than force-resync: what was measured
          // (153 lessons across 6 courses, see the issue) is lessons stuck at
          // a stale POSITION, never a missing section or a vanished file, so
          // this is the minimum that fixes it.
          //
          // Scoped rescan: FORCE-RESYNC this one course instead (E32-F01-S03)
          // — the above, plus sections re-derived from disk and a vanished
          // lesson's row removed. Scope is the force signal — the walk above
          // only grouped the scoped course's own folder (every other
          // topFolder was skipped), so this branch can only be that course's
          // folder, and `scopeCourse` is the aggregate the request named.
          //
          // Library-wide scan, folder genuinely new: build a fresh course.
          // "Already imported" is NOT "slug is taken". Two folders whose titles
          // legitimately reduce to one slug are two courses, and treating the
          // second as an idempotent skip is what cost 253 lessons without so
          // much as a ScanError. The loser now takes a folder-derived
          // discriminator and imports, and the operator is told.
          // -------------------------------------------------------------------

          // Matched on the folder, not on `slug` — see `courseByFolderName`
          // above for why the slug cannot be trusted for this check (#504).
          // `scopeCourse` already resolved its own course upfront (a scoped
          // rescan's `courseEntries` only ever has that one folder), so this
          // lookup only fires on the library-wide path.
          const reconcileCourse =
            scopeCourse === undefined ? courseByFolderName.get(folderName) : undefined;

          let slug = toSlug(courseTitle);

          if (
            scopeCourse === undefined &&
            reconcileCourse === undefined &&
            existingSlugSet.has(slug)
          ) {
            const owner = existingFolderBySlug.get(slug);
            const relFolder = path.relative(rootPath, courseFolder);

            if (owner === undefined) {
              // A course row holds the slug but owns no lesson that could say
              // which folder it came from — in practice this same folder, whose
              // lessons failed to persist on an earlier scan. Claiming the slug
              // would collide on uq_course_library_slug, so the folder is
              // skipped, but it is reported: a scoped rescan repairs it.
              scan.recordError({
                path: relFolder,
                message:
                  `Slug "${slug}" is held by a course with no lessons, so this folder cannot be ` +
                  `matched to it. Rescan that course to re-import its lessons.`,
                code: 'course-slug-collision',
              });
              continue;
            }

            // A DIFFERENT folder holds the slug. Both are real courses.
            slug = discriminatedSlug(slug, folderName);
            if (existingSlugSet.has(slug)) {
              // Already imported under the discriminated slug — nothing to do.
              continue;
            }
            scan.recordError({
              path: relFolder,
              message:
                `Course title "${courseTitle}" reduces to a slug "${folderName}" shares with ` +
                `"${owner}"; imported as "${slug}" instead.`,
              code: 'course-slug-collision',
            });
          }

          try {
            // Build Course aggregate with sections.
            // When the course has no sub-folder sections (flat layout: all
            // videos directly inside the course folder), a synthetic "Lessons"
            // section is created so every lesson has a valid sectionId.
            const sectionTitleList =
              sortedSectionEntries.length > 0
                ? sortedSectionEntries.map(([title]) => title)
                : ['Lessons'];

            let course: Course;
            if (scopeCourse) {
              // Force-resync: keep the course row exactly as it is (its title
              // may be a user rename that no longer matches the folder) and
              // re-derive only its sections. Reuse the id of every section
              // whose title survived — Lesson.section is onDelete: Cascade, so
              // a section that changes id drops its lessons on the way (#317).
              course = scopeCourse;
              const persistedSectionIdByTitle = new Map(
                course.sections.map((s) => [s.title, s.id]),
              );
              course.replaceSections(
                sectionTitleList.map((title) => ({
                  id: persistedSectionIdByTitle.get(title.trim()) ?? nanoid(),
                  title,
                })),
              );
            } else if (reconcileCourse) {
              // Reconcile (#544): keep the course row AND its sections exactly
              // as persisted — only lesson positions and lesson ids are
              // recomputed below. Re-deriving sections here would mean a
              // section whose folder was renamed or removed on disk gets
              // dropped and cascades its lessons with it, on every ordinary
              // scan rather than only when an operator explicitly asks for a
              // rescan; that stays force-resync-only, see the comment above.
              course = reconcileCourse;
            } else {
              course = Course.create({
                id: nanoid(),
                libraryId,
                slug,
                title: courseTitle,
              });
              for (const [i, sectionTitle] of sectionTitleList.entries()) {
                course.addSection({ id: nanoid(), title: sectionTitle, position: i + 1 });
              }
            }
            await this.courseRepo.save(course);

            if (scopeCourse === undefined && reconcileCourse === undefined) {
              // Mark the slug as taken, and by whom, so a later folder in THIS
              // same scan whose title reduces to it takes the discriminated
              // branch above instead of being skipped. Skipped for scopeCourse/
              // reconcileCourse: `slug` here is only `courseTitle`'s derivation
              // (folder or course.json), not the persisted course's actual
              // slug — recording it would be wrong bookkeeping for a course
              // that already has a real slug in `existingSlugSet`.
              existingSlugSet.add(slug);
              existingFolderBySlug.set(slug, folderName);
            }

            // Build a title → sectionId lookup from the freshly-created sections.
            const sectionIdByTitle = new Map<string, string>(
              course.sections.map((s) => [s.title, s.id]),
            );

            // -------------------------------------------------------------------
            // Resolve each lesson's section first (pass 1), then assign
            // positions per section as a batch (E32-F01-S01) — never per-file.
            // Per-file `parsed.ordinal ?? 1` is exactly the bug that silently
            // dropped 23% of a real library: two files sharing a section with
            // no parseable ordinal (or a legitimately-repeating one, e.g. a
            // composite "N.M" filename reusing "M" every chapter) landed on
            // the same position, and the second write lost the
            // (sectionId, position) unique-constraint race. See
            // assignLessonPositions() for the position rule.
            // -------------------------------------------------------------------
            const resolved: {
              entry: ScannedLessonEntry;
              sectionId: string;
              lessonTitle: string;
              parsed: ParsedLessonFileName;
            }[] = [];

            // Counts lessons whose filename gave the parser no ordinal at all
            // (tuxedo 145/129/137 investigation, #499/#498/#503): their position
            // falls back to lexicographic videoPath order in
            // assignLessonPositions(), which is indistinguishable from a
            // correctly-parsed order unless something says so. One ScanError per
            // COURSE below, not per file — tuxedo 128/#506 is the reason this
            // scan already writes far too many per-file errors.
            let ordinalMissingCount = 0;

            for (const entry of discoveredLessons) {
              const videoBasename = path.basename(entry.videoPath);
              const relFromCourse = path.relative(courseFolder, entry.videoPath);
              const relSegments = relFromCourse.split(/[/\\]/);
              const parsed = parseLessonFileName(videoBasename);

              // Determine which section this lesson belongs to.
              const sectionId =
                relSegments.length > 1
                  ? // Lesson is inside a sub-folder (section folder).
                    (sectionIdByTitle.get(parseFolderName(relSegments[0] ?? '').label) ?? '')
                  : // Flat layout — all videos directly in the course folder.
                    // A synthetic "Lessons" section was added above; it is
                    // always sections[0] in this branch.
                    (course.sections[0]?.id ?? '');

              if (!sectionId) {
                // Could not resolve a section — record non-fatal error and skip.
                scan.recordError({
                  path: path.relative(rootPath, entry.videoPath),
                  message: 'Could not resolve a section for this lesson during materialisation.',
                  code: 'lesson-section-unresolvable',
                });
                continue;
              }

              if (parsed.ordinal === undefined) ordinalMissingCount++;
              resolved.push({ entry, sectionId, lessonTitle: parsed.label, parsed });
            }

            if (ordinalMissingCount > 0) {
              // Advisory, not a failure: the course imported fine, its lesson
              // order is a best-effort guess for `ordinalMissingCount` of
              // `resolved.length` lessons. A distinct code (rather than reusing
              // e.g. 'lesson-persist-failed') keeps it queryable apart from
              // actual failures — nothing here failed.
              scan.recordError({
                path: path.relative(rootPath, courseFolder),
                message:
                  `${String(ordinalMissingCount)} of ${String(resolved.length)} lesson(s) had ` +
                  `no parseable ordinal in their filename; their order falls back to ` +
                  `file-path order instead of the filename's own numbering.`,
                code: 'course-order-unreliable',
              });
            }

            const positionByVideoPath = new Map<string, number>();
            const bySection = new Map<string, typeof resolved>();
            for (const r of resolved) {
              const bucket = bySection.get(r.sectionId) ?? [];
              bucket.push(r);
              bySection.set(r.sectionId, bucket);
            }
            for (const bucket of bySection.values()) {
              const positions = assignLessonPositions(
                bucket.map((r) => ({ videoPath: r.entry.videoPath, parsed: r.parsed })),
              );
              for (const [videoPath, position] of positions) {
                positionByVideoPath.set(videoPath, position);
              }
            }

            // Force-resync or reconcile (#544): empty this course's positive
            // position range before writing the new order back. Lessons are
            // saved one at a time, and a resync/reconcile that reorders even
            // one lesson shifts every later lesson in its section — without
            // parking, the first shifted lesson lands on a position the row
            // after it still holds and loses the (sectionId, position)
            // unique constraint.
            if (scopeCourse || reconcileCourse) {
              await this.lessonRepo.parkPositionsForResync(course.id);
            }

            // Persist each discovered lesson (pass 2).
            for (const { entry, sectionId, lessonTitle } of resolved) {
              // positionByVideoPath is guaranteed to have every resolved
              // entry's videoPath — assignLessonPositions() is total over
              // its input, one entry per resolved lesson in this section.
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guaranteed above
              const lessonPosition = positionByVideoPath.get(entry.videoPath)!;

              // Force-resync or reconcile (#544): match by videoPath and keep
              // the existing lesson's id. Progress, bookmarks, notes and
              // transcripts all point at lessonId with no foreign key, so
              // minting a new id orphans every one of them with nothing left
              // to collect them. Only scopeCourse/reconcileCourse reuse ids at
              // all — on a library-wide scan of a genuinely new folder there
              // is no existing course to match against.
              //
              // The `courseId` check is the safety net #544 needs now that
              // reuse is live on the library-wide path too:
              // `existingLessonByVideoPath` spans every course in the library
              // there, not just this one, so without it a stray videoPath
              // collision (or corrupted data) could hand this course a lesson
              // id that actually belongs to a different one — silently moving
              // that row's progress/bookmarks/notes/transcripts with it.
              const matchedExistingLesson =
                scopeCourse || reconcileCourse
                  ? existingLessonByVideoPath.get(entry.videoPath)
                  : undefined;
              const reusableLessonId =
                matchedExistingLesson?.courseId === course.id
                  ? matchedExistingLesson.id
                  : undefined;

              try {
                const lesson = Lesson.create({
                  id: reusableLessonId ?? nanoid(),
                  courseId: course.id,
                  sectionId,
                  position: lessonPosition,
                  title: lessonTitle,
                  videoPath: LibraryRelativePath.from(entry.videoPath, rootPath),
                  mtime: entry.mtime,
                  sizeBytes: entry.sizeBytes,
                });

                if (entry.metadata !== undefined) {
                  lesson.setDuration(entry.metadata.durationSeconds);
                }

                for (const m of entry.materials) {
                  try {
                    lesson.addMaterial(
                      Material.fromFile({ id: nanoid(), path: m.path, sizeBytes: m.sizeBytes }),
                    );
                  } catch (error) {
                    if (error instanceof MaterialKindUnsupportedError) {
                      // Already reported as unsupported-extension during scan walk; skip silently.
                    } else {
                      throw error;
                    }
                  }
                }

                // One row per language: `Lesson.en.srt` + `Lesson.en.vtt` are
                // the same track twice, and the stream route addresses a track
                // by its language. Every discovered file still keeps its own
                // signature entry above, so incremental detection is unaffected.
                for (const subtitlePath of dedupeSubtitlePathsByLanguage(
                  entry.subtitles.map((s) => s.path),
                )) {
                  lesson.addSubtitle(Subtitle.fromFile({ id: nanoid(), path: subtitlePath }));
                }

                await this.lessonRepo.save(lesson);

                // Sidecar ingest (E27-F01-S01) for the lesson just created. A
                // pre-existing lesson's sidecars are handled earlier in the walk,
                // where its id was already known — see `existingLessonByVideoPath`.
                // That covers every resynced lesson whose id was reused, so this
                // only runs for lessons that did not exist before.
                if (reusableLessonId === undefined) {
                  const sidecarErrors = await ingestSidecarTranscripts({
                    fs: this.fs,
                    transcripts: this.transcripts,
                    lessonId: lesson.id,
                    rootPath,
                    subtitles: entry.subtitles,
                  });
                  for (const sidecarError of sidecarErrors) scan.recordError(sidecarError);
                }
              } catch (error) {
                scan.recordError({
                  path: path.relative(rootPath, entry.videoPath),
                  message: error instanceof Error ? error.message : String(error),
                  code: 'lesson-persist-failed',
                });
              }
            }

            // This course's folder was found on disk and re-imported. Only now
            // may the cleanup below delete a lesson: see the guard there.
            if (scopeCourse) resyncedCourseId = course.id;

            // -------------------------------------------------------------------
            // Metadata linking (Slice 7): upsert Instructor/Studio/Tag rows and
            // set their refs on the course, then do a second save so the join
            // rows land in the same repo transaction as the course.
            //
            // Runs only when a course.json was successfully parsed; errors are
            // non-fatal (logged as 'metadata-link-failed') so a bad link never
            // aborts the scan or discards the already-persisted course+lessons.
            //
            // Never on a force-resync or a reconcile (#544): course.json is
            // the FIRST import's source of metadata, and after that the
            // course row belongs to whoever edited it through the API.
            // Re-linking would silently revert a renamed title, a replaced
            // poster or a curated tag list — the very thing the old skip was
            // protecting, and reconcile protects the same way.
            // -------------------------------------------------------------------
            if (
              normalisedCourseJson !== undefined &&
              scopeCourse === undefined &&
              reconcileCourse === undefined
            ) {
              try {
                const instructorRefs = await this.linker.upsertInstructorsByName(
                  normalisedCourseJson.instructorNames ?? [],
                );
                course.setInstructors([...instructorRefs]);

                const studioRef = normalisedCourseJson.studioName
                  ? await this.linker.upsertStudioByName(normalisedCourseJson.studioName)
                  : null;
                course.setStudios(studioRef ? [studioRef] : []);

                const tagRefs = await this.linker.upsertTagsByName(normalisedCourseJson.tags ?? []);
                course.setTags([...tagRefs]);

                if (
                  normalisedCourseJson.level !== undefined &&
                  isCourseLevel(normalisedCourseJson.level)
                ) {
                  course.setLevel(normalisedCourseJson.level);
                }
                if (normalisedCourseJson.language !== undefined) {
                  course.setLanguage(normalisedCourseJson.language);
                }
                if (normalisedCourseJson.releaseDate !== undefined) {
                  course.setReleaseDate(new Date(normalisedCourseJson.releaseDate));
                }
                if (normalisedCourseJson.posterUrl !== undefined) {
                  await this.posterSync.applyPosterUrl(course, normalisedCourseJson.posterUrl);
                }
                if (normalisedCourseJson.externalIds !== undefined) {
                  course.setExternalIds([...normalisedCourseJson.externalIds]);
                }

                await this.courseRepo.save(course);
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                scan.recordError({
                  path: jsonFile?.path ?? '<unknown>',
                  message: `metadata-link-failed: ${message}`,
                  code: 'metadata-link-failed',
                });
              }
            }
          } catch (error) {
            if (error instanceof CourseSlugAlreadyTakenError) {
              // Race condition between two concurrent scans — treat as idempotent skip.
            } else {
              scan.recordError({
                path: courseFolder,
                message: error instanceof Error ? error.message : String(error),
                code: 'course-persist-failed',
              });
            }
          }
        }

        // Throttled progress publish: at most once per second per course folder.
        // Always fires after the last folder so the SPA gets at least one progress
        // event per scan (even for single-course libraries).
        if (Date.now() - lastProgressPublishedAt >= 1000) {
          publishProgress();
        }
      }

      // -----------------------------------------------------------------------
      // Orphan cleanup (E25-F04-S01): a lesson this library used to have but
      // whose video the walk did not encounter this time has vanished from
      // disk. Its Transcript rows (both origins) are deleted and each row's
      // generated file is unlinked best-effort.
      //
      // On a library-wide scan the Lesson row itself is left alone, matching
      // the "skip an already-imported folder" idempotency the rest of that walk lives
      // with. On a force-resync the row goes too (below) — a resync exists to
      // make the course match the disk, and a lesson pointing at a file that
      // is gone is exactly the drift it is there to remove.
      // -----------------------------------------------------------------------
      const vanishedLessonIds: string[] = [];
      for (const [videoPath, lesson] of existingLessonByVideoPath) {
        if (seenVideoPaths.has(videoPath)) continue;
        try {
          await this.transcripts.deleteForLesson(lesson.id);
          vanishedLessonIds.push(lesson.id);
        } catch (error) {
          // Keep the lesson row: its transcript cues are still in the pg_trgm
          // index E27 search reads, and deleting the row now would leave search
          // returning hits that point at a lesson nothing can resolve.
          scan.recordError({
            path: path.relative(rootPath, videoPath),
            message: error instanceof Error ? error.message : String(error),
            code: 'transcript-cleanup-failed',
          });
        }
      }

      // Force-resync only: drop the vanished lesson rows and, with them, every
      // row that references lessonId without a foreign key behind it.
      //
      // The guard is the point. `resyncedCourseId` is set only once this walk
      // actually re-imported the scoped course's folder. If that folder is gone
      // — renamed on disk, or a volume that failed to mount — the walk finds no
      // files at all, EVERY lesson looks vanished, and an unguarded delete
      // would take the whole course's progress, bookmarks and notes with it.
      // In that case the scan still reports what it saw and changes nothing.
      if (resyncedCourseId !== undefined && vanishedLessonIds.length > 0) {
        try {
          await this.lessonRepo.removeMany(vanishedLessonIds);
        } catch (error) {
          scan.recordError({
            path: rootPath,
            message: error instanceof Error ? error.message : String(error),
            code: 'lesson-cleanup-failed',
          });
        }
      }

      scan.complete();
    } catch (error) {
      // Unexpected failure — record why (tuxedo 118: this used to be a bare
      // `catch {}` that discarded the error entirely, so a crash left the
      // scan stuck at status=running with no reason anywhere) and transition
      // to failed so the aggregate is not stuck running.
      this.logger.error(
        `Scan ${scan.id} for library ${libraryId} crashed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      try {
        scan.recordError({
          path: rootPath,
          message: error instanceof Error ? error.message : String(error),
          code: 'scan-walk-failed',
        });
        scan.fail();
      } catch {
        // scan is already terminal (should not happen, but be safe).
      }
    } finally {
      // Publish 'finished' event before persisting so the SPA can react
      // to the terminal state. Fire-and-forget — Centrifugo failure must not
      // block or corrupt the scan's persistent terminal state.
      //
      // scan.status is already the right value here — complete()/fail() (both
      // called above, one or the other) already decided succeeded/partial/failed.
      void this.centrifugo.publish(channel, {
        kind: 'finished',
        scanId: scan.id,
        libraryId,
        libraryName,
        at: new Date().toISOString(),
        status: scan.status,
        filesScanned: scan.filesScanned,
        filesAdded: scan.filesAdded,
        filesUpdated: scan.filesUpdated,
        coursesDiscovered: scan.coursesDiscovered,
        errorsCount: scan.errors.length,
        ...(scan.scopeCourseId
          ? { scopeCourseId: scan.scopeCourseId, scopeCourseName: scan.scopeCourseName }
          : {}),
      });

      // Always persist the terminal state. Best-effort: if this itself
      // throws there is no further fallback write, but tuxedo 118 established
      // that dropping the failure silently here is how a scan gets stuck at
      // status=running forever with zero trace — so it is logged, not swallowed.
      await this.scanRepo.save(scan).catch((error: unknown) => {
        this.logger.error(
          `Failed to persist terminal state for scan ${scan.id} (library ${libraryId}): ${
            error instanceof Error ? error.message : String(error)
          }`,
          error instanceof Error ? error.stack : undefined,
        );
      });
    }
  }
}
