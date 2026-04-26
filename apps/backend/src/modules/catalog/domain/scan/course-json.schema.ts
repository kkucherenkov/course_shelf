/**
 * WHY this file exists:
 * Defines the v1 course.json schema as a TypeScript type plus a hand-rolled
 * parser/validator. No runtime schema library (zod, ajv) is used here to keep
 * the domain layer dependency-free.
 *
 * The parser returns a typed CourseJsonV1 on success or throws
 * CourseJsonInvalidError on any shape mismatch — the caller (RunScanHandler)
 * catches that and records it as a ScanError row rather than failing the scan.
 */
import { CourseJsonInvalidError } from './scan.errors';

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

/**
 * Parse and validate a raw JSON string as CourseJsonV1.
 * Throws CourseJsonInvalidError on any shape mismatch or JSON parse failure.
 * Unknown extra keys are ignored (open-world assumption).
 *
 * @param raw   Raw UTF-8 content of course.json.
 * @param filePath  Filesystem path — used only for error messages.
 */
export function parseCourseJson(raw: string, filePath = 'course.json'): CourseJsonV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new CourseJsonInvalidError(filePath, 'file is not valid JSON');
  }

  if (!isObject(parsed)) {
    throw new CourseJsonInvalidError(filePath, 'root must be a JSON object');
  }

  if (parsed['schemaVersion'] !== 1) {
    throw new CourseJsonInvalidError(
      filePath,
      `schemaVersion must be 1, got ${String(parsed['schemaVersion'])}`,
    );
  }

  if (typeof parsed['title'] !== 'string' || parsed['title'].length === 0) {
    throw new CourseJsonInvalidError(filePath, 'title must be a non-empty string');
  }

  if (parsed['instructor'] !== undefined && typeof parsed['instructor'] !== 'string') {
    throw new CourseJsonInvalidError(filePath, 'instructor must be a string when present');
  }

  if (parsed['description'] !== undefined && typeof parsed['description'] !== 'string') {
    throw new CourseJsonInvalidError(filePath, 'description must be a string when present');
  }

  let sections: CourseJsonV1Section[] | undefined;
  if (parsed['sections'] !== undefined) {
    if (!Array.isArray(parsed['sections'])) {
      throw new CourseJsonInvalidError(filePath, 'sections must be an array when present');
    }
    sections = (parsed['sections'] as unknown[]).map((s) => validateSection(s, filePath));
  }

  return {
    schemaVersion: 1,
    title: parsed['title'],
    ...(typeof parsed['instructor'] === 'string' ? { instructor: parsed['instructor'] } : {}),
    ...(typeof parsed['description'] === 'string' ? { description: parsed['description'] } : {}),
    ...(sections === undefined ? {} : { sections }),
  };
}
