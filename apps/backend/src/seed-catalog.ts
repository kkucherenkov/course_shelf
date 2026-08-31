/**
 * WHY this file exists:
 * `pnpm db:seed` pointed at `prisma/seed.ts`, which never existed — so both
 * `db:seed` and `db:reset` failed, and the Schemathesis contract test in
 * `e2e.yml` had no row to address on any of the 40 path-parameter operations.
 * This module builds the smallest catalog spine those operations need.
 *
 * Three properties the callers depend on:
 *
 *   Deterministic. Every id, slug and timestamp is a constant below.
 *     `packages/specs/schemathesis.toml` pins these exact ids as parameter
 *     overrides — that, not the row's existence, is what makes the contract
 *     test reach a real resource (a generated `type: string` id never matches
 *     a cuid). Changing an id here without changing that file silently puts
 *     those operations back on the 404 path.
 *
 *   Idempotent. Every repository `save()` is an upsert and every timestamp is
 *     fixed, so a second run rewrites identical rows. `db:reset` and a dev
 *     loop both re-run it.
 *
 *   Refuses a database that is not its own. If the catalog already holds a
 *     library or a course this seed did not create, it is somebody's real
 *     data and the seed aborts rather than adding demo rows to it. This is
 *     the environment guard: NODE_ENV cannot serve as one, because
 *     `docker/compose.ci.yml` deliberately runs the CI backend with
 *     NODE_ENV=production to exercise the production codepaths.
 *
 * It creates NO users. `e2e.yml` mints the contract test's admin token by
 * signing up, and `databaseHooks.user.create.before` in
 * `common/auth/auth.service.ts` promotes only the FIRST account to ADMIN. A
 * user row here would demote that account to USER and send every /admin
 * operation back to 403 — the blind spot #321 closed.
 */
import { Course } from './modules/catalog/domain/course/course';
import { Instructor } from './modules/catalog/domain/instructor/instructor';
import { Lesson } from './modules/catalog/domain/lesson/lesson';
import { Library } from './modules/catalog/domain/library/library';
import { Material } from './modules/catalog/domain/lesson/material';
import { Studio } from './modules/catalog/domain/studio/studio';
import { Subtitle } from './modules/catalog/domain/lesson/subtitle';
import { Tag } from './modules/catalog/domain/tag/tag';

import type { CourseRepository } from './modules/catalog/domain/course/course.repository';
import type { InstructorRepository } from './modules/catalog/domain/instructor/instructor.repository';
import type { LessonRepository } from './modules/catalog/domain/lesson/lesson.repository';
import type { LibraryRepository } from './modules/catalog/domain/library/library.repository';
import type { StudioRepository } from './modules/catalog/domain/studio/studio.repository';
import type { TagRepository } from './modules/catalog/domain/tag/tag.repository';

/**
 * Fixed identifiers. Mirrored verbatim in `packages/specs/schemathesis.toml`.
 *
 * The `seed-` prefix is load-bearing twice over: it is how the guard below
 * tells its own rows from real ones, and it makes any row that escapes into a
 * real deployment obvious in the UI rather than passing for content.
 */
export const SEED_IDS = {
  /** Library the read operations address. Points at the image's media mount. */
  library: 'seed-library-main',
  course: 'seed-course-fundamentals',
  section: 'seed-section-getting-started',
  lesson: 'seed-lesson-welcome',
  material: 'seed-material-welcome-handout',
  subtitle: 'seed-subtitle-welcome-en',
  instructor: 'seed-instructor-ada-lovelace',
  studio: 'seed-studio-analytical-engine',
  tag: 'seed-tag-fundamentals',
} as const;

/** Slugs the `/catalog/{instructors,studios,tags}/{slug}` operations address. */
export const SEED_SLUGS = {
  course: 'seed-course-fundamentals',
  instructor: 'seed-instructor-ada-lovelace',
  studio: 'seed-studio-analytical-engine',
  tag: 'seed-tag-fundamentals',
} as const;

/**
 * Every timestamp the seed writes. A fixed instant is what makes the second
 * run a byte-identical rewrite instead of an `updatedAt` bump — "idempotent"
 * would otherwise only mean "does not crash".
 */
export const SEED_EPOCH = new Date('2026-01-01T00:00:00.000Z');

/**
 * `/data/courses` is the media mount the backend image creates and admins
 * point libraries at (see `apps/backend/Dockerfile`). Empty in CI, which is
 * fine: `POST /libraries/{id}/scans` over an empty tree is a valid 202 and
 * gives `GET /libraries/{id}/scans/latest` something to return.
 */
const SEED_LIBRARY_ROOT = '/data/courses';

/** Repository ports the seed writes through. Resolved from DI by `seed.ts`. */
export interface SeedPorts {
  readonly libraries: LibraryRepository;
  readonly courses: CourseRepository;
  readonly lessons: LessonRepository;
  readonly instructors: InstructorRepository;
  readonly studios: StudioRepository;
  readonly tags: TagRepository;
}

/** Minimal logging surface — `Logger` from Nest satisfies it, so does `console`. */
export interface SeedLogger {
  log(message: string): void;
}

/**
 * Thrown when the target database already holds catalog content the seed did
 * not create. Not a `DomainError`: nothing here is reachable over HTTP.
 */
export class SeedRefusedError extends Error {
  constructor(readonly conflicts: readonly string[]) {
    super(
      `Refusing to seed: the catalog already holds ${String(conflicts.length)} row(s) this seed did not create ` +
        `(${conflicts.slice(0, 5).join(', ')}${conflicts.length > 5 ? ', …' : ''}). ` +
        'This looks like a real database. Point DATABASE_URL at a development or CI database.',
    );
    this.name = 'SeedRefusedError';
  }
}

/**
 * Write the catalog spine. Order matters: the join rows on the course carry
 * foreign keys to instructor/studio/tag, and the lesson's section only exists
 * once the course has been saved.
 */
export async function seedCatalog(ports: SeedPorts, logger: SeedLogger): Promise<void> {
  await assertDatabaseIsSeedable(ports);

  const instructor = Instructor.create({
    id: SEED_IDS.instructor,
    displayName: 'Ada Lovelace (seed)',
    slug: SEED_SLUGS.instructor,
    now: SEED_EPOCH,
  });
  const studio = Studio.create({
    id: SEED_IDS.studio,
    displayName: 'Analytical Engine Studio (seed)',
    slug: SEED_SLUGS.studio,
    now: SEED_EPOCH,
  });
  const tag = Tag.create({
    id: SEED_IDS.tag,
    displayName: 'Fundamentals (seed)',
    slug: SEED_SLUGS.tag,
    category: 'topic',
    now: SEED_EPOCH,
  });

  await Promise.all([
    ports.instructors.save(instructor),
    ports.studios.save(studio),
    ports.tags.save(tag),
  ]);

  await ports.libraries.save(
    Library.register({
      id: SEED_IDS.library,
      name: 'Seed library',
      rootPath: SEED_LIBRARY_ROOT,
      now: SEED_EPOCH,
    }),
  );

  await ports.courses.save(buildSeedCourse());
  await ports.lessons.save(buildSeedLesson());

  logger.log(
    `Seeded catalog: library ${SEED_IDS.library}, ` +
      `course ${SEED_IDS.course}, lesson ${SEED_IDS.lesson}.`,
  );
}

/** The course aggregate, with the metadata every course read DTO exposes. */
export function buildSeedCourse(): Course {
  const course = Course.create({
    id: SEED_IDS.course,
    libraryId: SEED_IDS.library,
    slug: SEED_SLUGS.course,
    title: 'Seed course — fundamentals',
    description: 'Fixture course created by `pnpm db:seed`. Not real content.',
    now: SEED_EPOCH,
  });

  course.addSection({ id: SEED_IDS.section, title: 'Getting started', position: 1 });
  course.setLevel('beginner');
  course.setLanguage('en');
  course.setReleaseDate(SEED_EPOCH);
  course.setRating(4.5, 10);
  course.setInstructors([
    { id: SEED_IDS.instructor, slug: SEED_SLUGS.instructor, displayName: 'Ada Lovelace (seed)' },
  ]);
  course.setStudios([
    {
      id: SEED_IDS.studio,
      slug: SEED_SLUGS.studio,
      displayName: 'Analytical Engine Studio (seed)',
    },
  ]);
  course.setTags([
    {
      id: SEED_IDS.tag,
      slug: SEED_SLUGS.tag,
      displayName: 'Fundamentals (seed)',
      category: 'topic',
    },
  ]);

  return course;
}

/**
 * The lesson aggregate, carrying one material and one subtitle so that
 * `GET /lessons/{lessonId}/materials/{materialId}/download-url` has a material
 * id to address and the lesson DTO's `subtitles` array is non-empty.
 *
 * No file is written for either path: the URL-minting handlers only check that
 * the lesson exists and that the actor may see it. The binary endpoints that
 * would open the file are gated behind a short-lived HMAC stream token the
 * contract run cannot forge, so they stay out of reach regardless.
 */
export function buildSeedLesson(): Lesson {
  const lesson = Lesson.create({
    id: SEED_IDS.lesson,
    courseId: SEED_IDS.course,
    sectionId: SEED_IDS.section,
    position: 1,
    title: 'Welcome',
    videoPath: `${SEED_SLUGS.course}/01-welcome.mp4`,
    mtime: SEED_EPOCH,
    sizeBytes: 1_048_576,
    now: SEED_EPOCH,
  });

  lesson.setDuration(60);
  lesson.addMaterial(
    Material.fromFile({
      id: SEED_IDS.material,
      path: `${SEED_SLUGS.course}/01-welcome.pdf`,
      sizeBytes: 2048,
    }),
  );
  lesson.addSubtitle(
    Subtitle.fromFile({
      id: SEED_IDS.subtitle,
      path: `${SEED_SLUGS.course}/01-welcome.en.vtt`,
    }),
  );

  return lesson;
}

/**
 * The environment guard. A production catalog has libraries and courses this
 * seed did not create; a fresh CI or dev database has none. Re-running the
 * seed finds only its own rows and proceeds, which is what keeps the guard
 * compatible with idempotence.
 */
async function assertDatabaseIsSeedable(ports: SeedPorts): Promise<void> {
  const [libraries, courses] = await Promise.all([
    ports.libraries.findAll(),
    ports.courses.findAll(),
  ]);

  const conflicts = [
    ...libraries.filter((l) => l.id !== SEED_IDS.library).map((l) => `library:${l.id}`),
    ...courses.filter((c) => c.id !== SEED_IDS.course).map((c) => `course:${c.id}`),
  ];

  if (conflicts.length > 0) {
    throw new SeedRefusedError(conflicts);
  }
}
