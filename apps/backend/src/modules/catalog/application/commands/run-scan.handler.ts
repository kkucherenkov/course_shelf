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

import { AppConfig } from '../../../../common/config/app-config';
import { CentrifugoService } from '../../../../common/centrifugo/centrifugo.service';
import { Course } from '../../domain/course/course';
import { CourseSlugAlreadyTakenError } from '../../domain/course/course.errors';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { Lesson } from '../../domain/lesson/lesson';
import { MaterialKindUnsupportedError } from '../../domain/lesson/lesson.errors';
import { Material } from '../../domain/lesson/material';
import { LESSON_REPOSITORY } from '../../domain/lesson/lesson.repository';
import { Subtitle } from '../../domain/lesson/subtitle';
import { LibraryNotFoundError } from '../../domain/library/library.errors';
import { LIBRARY_REPOSITORY } from '../../domain/library/library.repository';
import { parseCourseJson, normaliseCourseJson } from '../../domain/scan/course-json.schema';
import { FFMPEG_ADAPTER } from '../../domain/scan/ffmpeg-adapter';
import { FS_ADAPTER } from '../../domain/scan/fs-adapter';
import { parseFolderName, parseLessonFileName } from '../../domain/scan/folder-name.parser';
import { stemMatch } from '../../domain/scan/stem-match';
import { Scan } from '../../domain/scan/scan';
import { ScanAlreadyRunningError } from '../../domain/scan/scan.errors';
import { SCAN_REPOSITORY } from '../../domain/scan/scan.repository';

import { MetadataLinker } from '../scan/metadata-linker';
import { isCourseLevel } from '../../domain/course/course';
import { RunScanCommand } from './run-scan.command';

import type { FfmpegAdapter, VideoMetadata } from '../../domain/scan/ffmpeg-adapter';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { LibraryRepository } from '../../domain/library/library.repository';
import type { FsAdapter } from '../../domain/scan/fs-adapter';
import type { ScanRepository } from '../../domain/scan/scan.repository';
import type { NormalisedCourseJsonV2 } from '../../domain/scan/course-json.schema';
import type {
  DiscoveredFileEntry,
  ScannedLessonEntry,
  ScannedMaterial,
  ScannedSubtitle,
} from '../../domain/scan/scan';

// ---------------------------------------------------------------------------
// Slug helper
//
// Converts a human-readable folder/course title to a URL-safe slug that
// satisfies the Slug value-object regex: lowercase alphanum + hyphens, no
// leading/trailing hyphen, max 100 chars.
//
// Algorithm:
//   1. Lower-case the whole string.
//   2. Replace any run of non-alphanumeric characters (spaces, dots, underscores,
//      parentheses, etc.) with a single hyphen.
//   3. Strip leading/trailing hyphens.
//   4. Truncate to 100 chars, then strip any newly-trailing hyphen.
//
// Examples:
//   'Pragmatic Clean Architecture'  → 'pragmatic-clean-architecture'
//   '01 - NestJS: Basics & Beyond'  → '01-nestjs-basics-beyond'
//   '02 - Course B (no json)'       → '02-course-b-no-json'
// ---------------------------------------------------------------------------
function toSlug(title: string): string {
  const raw = title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 100)
    .replaceAll(/-+$/g, '');
  return raw === '' ? 'untitled' : raw;
}

@CommandHandler(RunScanCommand)
export class RunScanHandler implements ICommandHandler<RunScanCommand, Scan> {
  constructor(
    @Inject(LIBRARY_REPOSITORY) private readonly libraryRepo: LibraryRepository,
    @Inject(SCAN_REPOSITORY) private readonly scanRepo: ScanRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(FS_ADAPTER) private readonly fs: FsAdapter,
    @Inject(FFMPEG_ADAPTER) private readonly ffmpeg: FfmpegAdapter,
    private readonly appConfig: AppConfig,
    private readonly centrifugo: CentrifugoService,
    private readonly linker: MetadataLinker,
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

    // Publish 'started' event — fire-and-forget; Centrifugo being down must
    // not block the scan or prevent the 202 from going out.
    void this.centrifugo.publish(`scans:user:${command.actorUserId}`, {
      kind: 'started',
      scanId: scan.id,
      libraryId: library.id,
      libraryName: library.name,
      at: new Date().toISOString(),
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
        coursesDiscovered: scan.coursesDiscovered,
        errorsCount: scan.errors.length,
      });
      lastProgressPublishedAt = Date.now();
    };

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

      // Load existing courses for this library once, upfront, so the
      // idempotency check (skip if slug already known) is a Map lookup
      // rather than a per-course DB round-trip.
      const existingCourses = await this.courseRepo.findManyByLibrary(libraryId);
      const existingSlugSet = new Set(existingCourses.map((c) => c.slug));

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
        // Step 1: Group non-course.json files by canonical stem.
        //
        // WHY: A course folder may contain `1.1 Vim.mp4` alongside sidecar
        // files like `1.1. Vim.pdf` (dot-variant) or `1.1 Vim.en.srt`.
        // Without grouping, the PDF and SRT would fall through as
        // unsupported-extension ScanErrors. stemMatch normalises both prefix
        // variants to the same canonical stem so sidecar files can be
        // associated with their video (the "Neovim mass ScanError" fix).
        // -----------------------------------------------------------------------

        // key = canonical stem; value = collections of files by kind.
        const stemGroups = new Map<
          string,
          {
            video: { path: string; mtime: Date; size: number } | undefined;
            materials: { path: string; size: number }[];
            subtitles: { path: string; language: string }[];
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

          if (!stemGroups.has(canonicalStem)) {
            stemGroups.set(canonicalStem, {
              video: undefined,
              materials: [],
              subtitles: [],
              unsupported: [],
            });
          }
          // Non-null guaranteed: we just set the entry with stemGroups.set() above.
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guaranteed above
          const group = stemGroups.get(canonicalStem)!;

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
              // Extract the language from the subtitle filename for ScannedSubtitle.
              const langMatch = /\.([a-z]{2,3})\.(srt|vtt)$/i.exec(fileBasename);
              const lang = langMatch?.[1]?.toLowerCase() ?? 'und';
              group.subtitles.push({ path: file.path, language: lang });
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
        // - Groups WITHOUT a video: every non-video file in the group falls
        //   back to being an unsupported-extension ScanError (original behaviour).
        // -----------------------------------------------------------------------

        const lessonFiles: string[] = [];
        const discoveredLessons: ScannedLessonEntry[] = [];

        for (const [, group] of stemGroups) {
          if (group.video) {
            const videoFile = group.video;
            lessonFiles.push(videoFile.path);

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
            }));

            // -----------------------------------------------------------------------
            // ffprobe + thumbnail extraction (E06-F02-S02)
            //
            // Probe the video for duration/resolution/codec. On failure record a
            // ScanError with code 'ffmpeg-probe-failed' and continue — no metadata,
            // no thumbnail attempt for this lesson.
            //
            // On probe success: write a 320×180 JPEG poster next to the source file.
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
              // Derive thumbnail path: <stem without final ext>.thumb.jpg
              const videoExt = path.extname(videoFile.path);
              const stemWithoutExt = videoFile.path.slice(
                0,
                videoFile.path.length - videoExt.length,
              );
              const thumbPath = `${stemWithoutExt}.thumb.jpg`;

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
                try {
                  await this.ffmpeg.writeThumbnail({
                    videoAbsolutePath: videoFile.path,
                    outAbsolutePath: thumbPath,
                    atSecond,
                    widthPx: 320,
                    heightPx: 180,
                    jpegQuality: this.appConfig.thumbnailJpegQuality,
                  });
                } catch (error) {
                  scan.recordError({
                    path: path.relative(rootPath, videoFile.path),
                    message: error instanceof Error ? error.message : String(error),
                    code: 'ffmpeg-thumbnail-failed',
                  });
                }
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
          } else {
            // No video in this stem group — all files are unsupported-extension errors.
            const allFiles = [
              ...group.materials,
              ...group.subtitles.map((s) => ({ path: s.path, size: 0 })),
              ...group.unsupported.map((u) => ({ path: u.path, size: 0 })),
            ];
            for (const f of allFiles) {
              const basename = path.basename(f.path);
              const ext = basename.includes('.')
                ? basename.slice(basename.lastIndexOf('.')).toLowerCase()
                : '';
              scan.recordError({
                path: path.relative(rootPath, f.path),
                message: `Unsupported file extension "${ext}".`,
                code: 'unsupported-extension',
              });
            }
          }
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
          // Idempotency strategy: SKIP on duplicate slug (v1).
          // WHY skip rather than update: re-importing would clobber user-renamed
          // metadata (e.g. a user renamed the course title via the API). The
          // user's edit wins. A future story can add a --force-resync flag.
          // -------------------------------------------------------------------
          const slug = toSlug(courseTitle);

          if (existingSlugSet.has(slug)) {
            // Course already persisted from a previous scan — do not overwrite.
            continue;
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
            const course = Course.create({
              id: nanoid(),
              libraryId,
              slug,
              title: courseTitle,
            });
            for (const [i, sectionTitle] of sectionTitleList.entries()) {
              course.addSection({ id: nanoid(), title: sectionTitle, position: i + 1 });
            }
            await this.courseRepo.save(course);

            // Mark slug as known so subsequent folders in the same scan with
            // the same slug are also skipped (edge case — two folders that
            // normalise to the same slug).
            existingSlugSet.add(slug);

            // Build a title → sectionId lookup from the freshly-created sections.
            const sectionIdByTitle = new Map<string, string>(
              course.sections.map((s) => [s.title, s.id]),
            );

            // Persist each discovered lesson.
            for (const entry of discoveredLessons) {
              const videoBasename = path.basename(entry.videoPath);
              const relFromCourse = path.relative(courseFolder, entry.videoPath);
              const relSegments = relFromCourse.split(/[/\\]/);

              // Determine which section this lesson belongs to.
              let sectionId: string;
              let lessonPosition: number;
              let lessonTitle: string;

              if (relSegments.length > 1) {
                // Lesson is inside a sub-folder (section folder).
                const sectionFolder = relSegments[0] ?? '';
                const { label: sectionLabel } = parseFolderName(sectionFolder);
                sectionId = sectionIdByTitle.get(sectionLabel) ?? '';

                const parsed = parseLessonFileName(videoBasename);
                lessonPosition = parsed.ordinal ?? 1;
                lessonTitle = parsed.label;
              } else {
                // Flat layout — all videos directly in the course folder.
                // A synthetic "Lessons" section was added above; it is
                // always sections[0] in this branch.
                sectionId = course.sections[0]?.id ?? '';

                const parsed = parseLessonFileName(videoBasename);
                lessonPosition = parsed.ordinal ?? 1;
                lessonTitle = parsed.label;
              }

              if (!sectionId) {
                // Could not resolve a section — record non-fatal error and skip.
                scan.recordError({
                  path: path.relative(rootPath, entry.videoPath),
                  message: 'Could not resolve a section for this lesson during materialisation.',
                  code: 'lesson-section-unresolvable',
                });
                continue;
              }

              try {
                const lesson = Lesson.create({
                  id: nanoid(),
                  courseId: course.id,
                  sectionId,
                  position: lessonPosition,
                  title: lessonTitle,
                  videoPath: entry.videoPath,
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

                for (const s of entry.subtitles) {
                  lesson.addSubtitle(Subtitle.fromFile({ id: nanoid(), path: s.path }));
                }

                await this.lessonRepo.save(lesson);
              } catch (error) {
                scan.recordError({
                  path: path.relative(rootPath, entry.videoPath),
                  message: error instanceof Error ? error.message : String(error),
                  code: 'lesson-persist-failed',
                });
              }
            }

            // -------------------------------------------------------------------
            // Metadata linking (Slice 7): upsert Instructor/Studio/Tag rows and
            // set their refs on the course, then do a second save so the join
            // rows land in the same repo transaction as the course.
            //
            // Runs only when a course.json was successfully parsed; errors are
            // non-fatal (logged as 'metadata-link-failed') so a bad link never
            // aborts the scan or discards the already-persisted course+lessons.
            // -------------------------------------------------------------------
            if (normalisedCourseJson !== undefined) {
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
                  course.setPosterUrl(normalisedCourseJson.posterUrl);
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

      scan.complete();
    } catch {
      // Unexpected failure — transition to failed so the aggregate is not stuck running.
      try {
        scan.fail();
      } catch {
        // scan is already terminal (should not happen, but be safe).
      }
    } finally {
      // Publish 'finished' event before persisting so the SPA can react
      // to the terminal state. Fire-and-forget — Centrifugo failure must not
      // block or corrupt the scan's persistent terminal state.
      const finishedStatus =
        scan.status === 'failed' ? 'failed' : scan.errors.length > 0 ? 'partial' : 'succeeded';
      void this.centrifugo.publish(channel, {
        kind: 'finished',
        scanId: scan.id,
        libraryId,
        libraryName,
        at: new Date().toISOString(),
        status: finishedStatus,
        filesScanned: scan.filesScanned,
        filesAdded: scan.filesAdded,
        coursesDiscovered: scan.coursesDiscovered,
        errorsCount: scan.errors.length,
      });

      // Always persist the terminal state.
      await this.scanRepo.save(scan).catch(() => {
        // Best-effort — nothing else we can do if the DB write fails here.
      });
    }
  }
}
