/**
 * WHY this file exists:
 * Defines the course.json schema for both v1 and v2 as TypeScript types plus a
 * hand-rolled parser/validator and a normaliser. No runtime schema library
 * (zod, ajv) is used here to keep the domain layer dependency-free.
 *
 * v1 is the original format (schemaVersion: 1, instructor as a single string).
 * v2 extends it with richer metadata: instructorNames[], studioName, tags,
 * level, language, releaseDate, posterUrl, externalIds[].
 *
 * The parser returns a typed CourseJson (v1 | v2) on success or throws
 * CourseJsonInvalidError on any shape mismatch — the caller (RunScanHandler)
 * catches that and records it as a ScanError row rather than failing the scan.
 *
 * normaliseCourseJson converts any CourseJson to NormalisedCourseJsonV2, which
 * is always the v2 shape. Callers should use only the normalised form.
 */
import { CourseJsonInvalidError } from './scan.errors';

// ---------------------------------------------------------------------------
// V1 types
// ---------------------------------------------------------------------------

export interface CourseJsonV1Lesson {
  readonly title: string;
  readonly file: string;
}

export interface CourseJsonV1Section {
  readonly title: string;
  readonly lessons?: CourseJsonV1Lesson[];
}

export interface CourseJsonV1 {
  readonly schemaVersion: 1;
  readonly title: string;
  readonly instructor?: string;
  readonly description?: string;
  readonly sections?: CourseJsonV1Section[];
}

// ---------------------------------------------------------------------------
// V2 types
// ---------------------------------------------------------------------------

export interface CourseJsonV2ExternalId {
  readonly source: string;
  readonly externalId: string;
  readonly url?: string;
}

/** Valid values for the course level field. */
export type CourseJsonLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'all_levels';

export interface CourseJsonV2 {
  readonly schemaVersion: 2;
  readonly title: string;
  readonly description?: string;
  readonly sections?: CourseJsonV1Section[];
  readonly instructorNames?: string[];
  readonly studioName?: string;
  readonly tags?: string[];
  readonly level?: CourseJsonLevel;
  readonly language?: string;
  readonly releaseDate?: string;
  readonly posterUrl?: string;
  readonly externalIds?: CourseJsonV2ExternalId[];
}

/** Union of all supported course.json versions. */
export type CourseJson = CourseJsonV1 | CourseJsonV2;

/**
 * Explicit alias for the normalised v2 shape. Callers that invoke
 * normaliseCourseJson receive this type.
 */
export type NormalisedCourseJsonV2 = CourseJsonV2;

// ---------------------------------------------------------------------------
// Valid level values — kept as a constant array so it can be used both for
// the type constraint and for runtime membership checks.
// ---------------------------------------------------------------------------

const VALID_LEVELS: readonly string[] = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
  'all_levels',
];

/** ISO 8601 date: YYYY-MM-DD (strictly — no time component). */
const ISO_DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// ---------------------------------------------------------------------------
// Hand-rolled validators — keep this domain-only and dep-free.
// ---------------------------------------------------------------------------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validateLesson(raw: unknown, path: string): CourseJsonV1Lesson {
  if (!isObject(raw)) {
    throw new CourseJsonInvalidError(path, 'each lesson must be an object');
  }
  if (typeof raw['title'] !== 'string' || raw['title'].length === 0) {
    throw new CourseJsonInvalidError(path, 'lesson.title must be a non-empty string');
  }
  if (typeof raw['file'] !== 'string' || raw['file'].length === 0) {
    throw new CourseJsonInvalidError(path, 'lesson.file must be a non-empty string');
  }
  return { title: raw['title'], file: raw['file'] };
}

function validateSection(raw: unknown, path: string): CourseJsonV1Section {
  if (!isObject(raw)) {
    throw new CourseJsonInvalidError(path, 'each section must be an object');
  }
  if (typeof raw['title'] !== 'string' || raw['title'].length === 0) {
    throw new CourseJsonInvalidError(path, 'section.title must be a non-empty string');
  }
  let lessons: CourseJsonV1Lesson[] | undefined;
  if (raw['lessons'] !== undefined) {
    if (!Array.isArray(raw['lessons'])) {
      throw new CourseJsonInvalidError(path, 'section.lessons must be an array');
    }
    lessons = (raw['lessons'] as unknown[]).map((l) => validateLesson(l, path));
  }
  return { title: raw['title'], ...(lessons === undefined ? {} : { lessons }) };
}

function validateSections(raw: unknown, path: string): CourseJsonV1Section[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    throw new CourseJsonInvalidError(path, 'sections must be an array when present');
  }
  return (raw as unknown[]).map((s) => validateSection(s, path));
}

function validateStringArray(raw: unknown, fieldName: string, path: string): string[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    throw new CourseJsonInvalidError(path, `${fieldName} must be an array when present`);
  }
  for (const item of raw as unknown[]) {
    if (typeof item !== 'string') {
      throw new CourseJsonInvalidError(
        path,
        `${fieldName} must be an array of strings; got a non-string element`,
      );
    }
  }
  return raw as string[];
}

function validateExternalIds(raw: unknown, path: string): CourseJsonV2ExternalId[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    throw new CourseJsonInvalidError(path, 'externalIds must be an array when present');
  }
  return (raw as unknown[]).map((item) => {
    if (!isObject(item)) {
      throw new CourseJsonInvalidError(path, 'each externalId entry must be an object');
    }
    if (typeof item['source'] !== 'string' || item['source'].length === 0) {
      throw new CourseJsonInvalidError(path, 'externalId.source must be a non-empty string');
    }
    if (typeof item['externalId'] !== 'string' || item['externalId'].length === 0) {
      throw new CourseJsonInvalidError(path, 'externalId.externalId must be a non-empty string');
    }
    let url: string | undefined;
    if (item['url'] !== undefined) {
      if (typeof item['url'] !== 'string' || item['url'].length === 0) {
        throw new CourseJsonInvalidError(
          path,
          'externalId.url must be a non-empty string when present',
        );
      }
      try {
        new URL(item['url']);
      } catch {
        throw new CourseJsonInvalidError(
          path,
          `externalId.url "${item['url']}" is not a valid URL`,
        );
      }
      url = item['url'];
    }
    return {
      source: item['source'],
      externalId: item['externalId'],
      ...(url === undefined ? {} : { url }),
    };
  });
}

// ---------------------------------------------------------------------------
// V1 parser
// ---------------------------------------------------------------------------

function parseV1(parsed: Record<string, unknown>, filePath: string): CourseJsonV1 {
  if (typeof parsed['title'] !== 'string' || parsed['title'].length === 0) {
    throw new CourseJsonInvalidError(filePath, 'title must be a non-empty string');
  }

  if (parsed['instructor'] !== undefined && typeof parsed['instructor'] !== 'string') {
    throw new CourseJsonInvalidError(filePath, 'instructor must be a string when present');
  }

  if (parsed['description'] !== undefined && typeof parsed['description'] !== 'string') {
    throw new CourseJsonInvalidError(filePath, 'description must be a string when present');
  }

  const sections = validateSections(parsed['sections'], filePath);

  return {
    schemaVersion: 1,
    title: parsed['title'],
    ...(typeof parsed['instructor'] === 'string' ? { instructor: parsed['instructor'] } : {}),
    ...(typeof parsed['description'] === 'string' ? { description: parsed['description'] } : {}),
    ...(sections === undefined ? {} : { sections }),
  };
}

// ---------------------------------------------------------------------------
// V2 parser
// ---------------------------------------------------------------------------

function parseV2(parsed: Record<string, unknown>, filePath: string): CourseJsonV2 {
  if (typeof parsed['title'] !== 'string' || parsed['title'].length === 0) {
    throw new CourseJsonInvalidError(filePath, 'title must be a non-empty string');
  }

  if (parsed['description'] !== undefined && typeof parsed['description'] !== 'string') {
    throw new CourseJsonInvalidError(filePath, 'description must be a string when present');
  }

  const sections = validateSections(parsed['sections'], filePath);

  // instructorNames — primary v2 field. If absent, a bare `instructor` string (v1-compat)
  // is promoted to instructorNames: [instructor]. If both are present, instructorNames wins.
  let instructorNames = validateStringArray(parsed['instructorNames'], 'instructorNames', filePath);
  if (instructorNames === undefined && typeof parsed['instructor'] === 'string') {
    instructorNames = [parsed['instructor']];
  }

  let studioName: string | undefined;
  if (parsed['studioName'] !== undefined) {
    if (typeof parsed['studioName'] !== 'string') {
      throw new CourseJsonInvalidError(filePath, 'studioName must be a string when present');
    }
    studioName = parsed['studioName'];
  }

  const tags = validateStringArray(parsed['tags'], 'tags', filePath);

  let level: CourseJsonLevel | undefined;
  if (parsed['level'] !== undefined) {
    if (typeof parsed['level'] !== 'string' || !VALID_LEVELS.includes(parsed['level'])) {
      throw new CourseJsonInvalidError(
        filePath,
        `level must be one of ${VALID_LEVELS.join(', ')} when present; got "${JSON.stringify(parsed['level'])}"`,
      );
    }
    level = parsed['level'] as CourseJsonLevel;
  }

  // language: structural check only (string); domain VO validates BCP-47 on aggregate boundary
  let language: string | undefined;
  if (parsed['language'] !== undefined) {
    if (typeof parsed['language'] !== 'string') {
      throw new CourseJsonInvalidError(filePath, 'language must be a string when present');
    }
    language = parsed['language'];
  }

  let releaseDate: string | undefined;
  if (parsed['releaseDate'] !== undefined) {
    if (typeof parsed['releaseDate'] !== 'string') {
      throw new CourseJsonInvalidError(filePath, 'releaseDate must be a string when present');
    }
    if (!ISO_DATE_RE.test(parsed['releaseDate'])) {
      throw new CourseJsonInvalidError(
        filePath,
        `releaseDate must be an ISO 8601 date (YYYY-MM-DD); got "${parsed['releaseDate']}"`,
      );
    }
    releaseDate = parsed['releaseDate'];
  }

  let posterUrl: string | undefined;
  if (parsed['posterUrl'] !== undefined) {
    if (typeof parsed['posterUrl'] !== 'string' || parsed['posterUrl'].length === 0) {
      throw new CourseJsonInvalidError(
        filePath,
        'posterUrl must be a non-empty string when present',
      );
    }
    try {
      new URL(parsed['posterUrl']);
    } catch {
      throw new CourseJsonInvalidError(
        filePath,
        `posterUrl "${parsed['posterUrl']}" is not a valid URL`,
      );
    }
    posterUrl = parsed['posterUrl'];
  }

  const externalIds = validateExternalIds(parsed['externalIds'], filePath);

  return {
    schemaVersion: 2,
    title: parsed['title'],
    ...(typeof parsed['description'] === 'string' ? { description: parsed['description'] } : {}),
    ...(sections === undefined ? {} : { sections }),
    ...(instructorNames === undefined ? {} : { instructorNames }),
    ...(studioName === undefined ? {} : { studioName }),
    ...(tags === undefined ? {} : { tags }),
    ...(level === undefined ? {} : { level }),
    ...(language === undefined ? {} : { language }),
    ...(releaseDate === undefined ? {} : { releaseDate }),
    ...(posterUrl === undefined ? {} : { posterUrl }),
    ...(externalIds === undefined ? {} : { externalIds }),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse and validate a raw JSON string as CourseJsonV1 or CourseJsonV2.
 * Throws CourseJsonInvalidError on any shape mismatch or JSON parse failure.
 * Unknown extra keys are ignored (open-world assumption).
 *
 * @param raw      Raw UTF-8 content of course.json.
 * @param filePath Filesystem path — used only for error messages.
 */
export function parseCourseJson(raw: string, filePath = 'course.json'): CourseJson {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new CourseJsonInvalidError(filePath, 'file is not valid JSON');
  }

  if (!isObject(parsed)) {
    throw new CourseJsonInvalidError(filePath, 'root must be a JSON object');
  }

  const version = parsed['schemaVersion'];

  if (version === 1) {
    return parseV1(parsed, filePath);
  }

  if (version === 2) {
    return parseV2(parsed, filePath);
  }

  throw new CourseJsonInvalidError(
    filePath,
    `schemaVersion must be 1 or 2, got ${String(version)}`,
  );
}

/**
 * Normalise any CourseJson to NormalisedCourseJsonV2 (always the v2 shape).
 *
 * Rules:
 * - v2 input is returned as-is (but bare `instructor` field that may exist from a
 *   v1-aware author is resolved: if `instructorNames` is present it wins; otherwise
 *   `instructor` is promoted to `instructorNames[0]`).
 * - v1 input: copies title/description/sections; if `instructor` is present it
 *   becomes `instructorNames: [instructor]`.
 */
export function normaliseCourseJson(json: CourseJson): NormalisedCourseJsonV2 {
  if (json.schemaVersion === 2) {
    // v2 may contain a bare `instructor` key written by a v1-aware tool.
    // Cast to access the possibly-present non-typed field.
    const raw = json as CourseJsonV2 & { instructor?: string };

    if (raw.instructor !== undefined && raw.instructorNames === undefined) {
      // Promote bare instructor to instructorNames, strip the bare field
      const { instructor: _dropped, ...rest } = raw;
      return {
        ...rest,
        schemaVersion: 2,
        instructorNames: [raw.instructor],
      };
    }

    // Either no bare instructor, or instructorNames already present (wins)
    // Spread to drop any bare `instructor` field from the output shape
    const { instructor: _dropped, ...clean } = raw;
    return { ...clean, schemaVersion: 2 };
  }

  // v1 → v2 normalisation
  const v1 = json;
  const result: NormalisedCourseJsonV2 = {
    schemaVersion: 2,
    title: v1.title,
    ...(v1.description === undefined ? {} : { description: v1.description }),
    ...(v1.sections === undefined ? {} : { sections: v1.sections }),
    ...(v1.instructor === undefined ? {} : { instructorNames: [v1.instructor] }),
  };
  return result;
}
