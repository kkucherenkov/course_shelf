/**
 * WHY this file exists:
 * Course is the aggregate root for the Catalog bounded context's second slice.
 * It owns all structural invariants for course metadata and section ordering so
 * they are enforced in every code path — HTTP, scan-sync, tests — not just the
 * controller.
 *
 * Sections are modelled as composition (inner value-object-ish structs). There is
 * no separate SectionRepository in E06-F03-S01; section persistence is handled
 * atomically by PrismaCourseRepository. Lessons land in E06-F03-S02.
 *
 * The aggregate does NOT depend on Prisma types — infrastructure stays in infra/.
 */
import { brand } from '../../../../shared/branded-id';
import { Slug } from './slug';
import { Title } from './title';
import { Position } from './position';
import { LanguageTag } from '../shared-vo/language-tag';
import { ExternalIdRefVO } from '../shared-vo/external-id-ref';
import {
  SectionNotFoundError,
  SectionPositionConflictError,
  SectionPositionOutOfRangeError,
  CourseLanguageInvalidError,
  CourseRatingInvalidError,
} from './course.errors';

import type { Id } from '../../../../shared/branded-id';
import type { ExternalIdRef } from '../shared-vo/external-id-ref';
import type { InstructorRef, StudioRef, TagRef } from '../shared-vo/refs';

/** Phantom-branded id for Course — prevents mixing with Library/Lesson ids. */
export type CourseId = Id<'Course'>;

/** Skill level of a course — maps to the DB enum course_level. */
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'all_levels';

/** Runtime guard for CourseLevel — rejects arbitrary strings. */
export function isCourseLevel(v: unknown): v is CourseLevel {
  return (
    v === 'beginner' ||
    v === 'intermediate' ||
    v === 'advanced' ||
    v === 'expert' ||
    v === 'all_levels'
  );
}

/** Lightweight struct that lives inside a Course aggregate. */
export interface SectionData {
  readonly id: string;
  readonly position: number;
  readonly title: string;
}

export interface CourseProps {
  readonly id: CourseId;
  readonly libraryId: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string | undefined;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly sections: SectionData[];
  // Enrichment metadata — all optional for backwards-compat with existing code
  readonly posterUrl?: string;
  readonly posterStoragePath?: string;
  readonly level?: CourseLevel;
  readonly language?: string;
  readonly releaseDate?: Date;
  readonly sourceUpdatedAt?: Date;
  readonly ratingAverage?: number;
  readonly ratingCount?: number;
  readonly instructors?: InstructorRef[];
  readonly studios?: StudioRef[];
  readonly tags?: TagRef[];
  readonly externalIds?: ExternalIdRef[];
}

export class Course {
  readonly id: CourseId;
  readonly libraryId: string;
  private _slug: Slug;
  private _title: Title;
  private _description: string | undefined;
  readonly createdAt: Date;
  private _updatedAt: Date;
  private _sections: SectionData[];
  // Enrichment metadata
  private _posterUrl: string | undefined;
  private _posterStoragePath: string | undefined;
  private _level: CourseLevel | undefined;
  private _language: LanguageTag | undefined;
  private _releaseDate: Date | undefined;
  private _sourceUpdatedAt: Date | undefined;
  private _ratingAverage: number | undefined;
  private _ratingCount: number | undefined;
  private _instructors: InstructorRef[];
  private _studios: StudioRef[];
  private _tags: TagRef[];
  private _externalIds: ExternalIdRef[];

  private constructor(props: CourseProps) {
    this.id = props.id;
    this.libraryId = props.libraryId;
    this._slug = Slug.from(props.slug);
    this._title = Title.from(props.title);
    this._description = props.description;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._sections = [...props.sections].toSorted((a, b) => a.position - b.position);
    // Enrichment metadata
    this._posterUrl = props.posterUrl;
    this._posterStoragePath = props.posterStoragePath;
    this._level = props.level;
    this._language = props.language === undefined ? undefined : LanguageTag.from(props.language);
    this._releaseDate = props.releaseDate;
    this._sourceUpdatedAt = props.sourceUpdatedAt;
    this._ratingAverage = props.ratingAverage;
    this._ratingCount = props.ratingCount;
    this._instructors = [...(props.instructors ?? [])];
    this._studios = [...(props.studios ?? [])];
    this._tags = [...(props.tags ?? [])];
    this._externalIds = [...(props.externalIds ?? [])];
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  get slug(): string {
    return this._slug.value;
  }

  get title(): string {
    return this._title.value;
  }

  get description(): string | undefined {
    return this._description;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /** Sections ordered ascending by position. */
  get sections(): readonly SectionData[] {
    return this._sections;
  }

  get posterUrl(): string | undefined {
    return this._posterUrl;
  }

  get posterStoragePath(): string | undefined {
    return this._posterStoragePath;
  }

  get level(): CourseLevel | undefined {
    return this._level;
  }

  /** Returns the normalised BCP-47 string value, or undefined when not set. */
  get language(): string | undefined {
    return this._language?.value;
  }

  get releaseDate(): Date | undefined {
    return this._releaseDate;
  }

  get sourceUpdatedAt(): Date | undefined {
    return this._sourceUpdatedAt;
  }

  get ratingAverage(): number | undefined {
    return this._ratingAverage;
  }

  get ratingCount(): number | undefined {
    return this._ratingCount;
  }

  get instructors(): readonly InstructorRef[] {
    return this._instructors;
  }

  get studios(): readonly StudioRef[] {
    return this._studios;
  }

  get tags(): readonly TagRef[] {
    return this._tags;
  }

  get externalIds(): readonly ExternalIdRef[] {
    return this._externalIds;
  }

  // ---------------------------------------------------------------------------
  // Factories
  // ---------------------------------------------------------------------------

  /**
   * Factory that enforces domain invariants before constructing the aggregate.
   * Validates Slug and Title via their respective value objects; any violation
   * surfaces as a typed domain error.
   */
  static create(props: {
    id: string;
    libraryId: string;
    slug: string;
    title: string;
    description?: string;
    now?: Date;
  }): Course {
    const now = props.now ?? new Date();
    return new Course({
      id: brand<string, 'Course'>(props.id),
      libraryId: props.libraryId,
      slug: props.slug,
      title: props.title,
      description: props.description ?? undefined,
      createdAt: now,
      updatedAt: now,
      sections: [],
    });
  }

  /**
   * Reconstitutes an aggregate from persisted data. Bypasses validation because
   * the DB is the source of truth for already-valid data. Sections are passed in
   * and sorted by position.
   */
  static reconstitute(props: CourseProps): Course {
    return new Course(props);
  }

  // ---------------------------------------------------------------------------
  // Metadata mutations
  // ---------------------------------------------------------------------------

  /** Update the course title. Enforces Title invariant. */
  rename(newTitle: string): void {
    this._title = Title.from(newTitle);
    this._touch();
  }

  /** Set or clear the description. */
  setDescription(description?: string): void {
    this._description = description?.trim() === '' ? undefined : description?.trim();
    this._touch();
  }

  /** Change the slug. The uniqueness constraint is enforced by the repository. */
  changeSlug(newSlug: string): void {
    this._slug = Slug.from(newSlug);
    this._touch();
  }

  // ---------------------------------------------------------------------------
  // Enrichment metadata setters
  // ---------------------------------------------------------------------------

  /** Set or clear the poster image URL. Pass undefined to clear. */
  setPosterUrl(url: string | undefined): void {
    this._posterUrl = url;
    this._touch();
  }

  /** Set or clear the poster local storage path. Pass undefined to clear. */
  setPosterStoragePath(p: string | undefined): void {
    this._posterStoragePath = p;
    this._touch();
  }

  /**
   * Set or clear the skill level. Pass undefined to clear.
   * Throws CourseRatingInvalidError when a defined value is not a valid CourseLevel.
   */
  setLevel(level: CourseLevel | undefined): void {
    if (level !== undefined && !isCourseLevel(level)) {
      throw new CourseRatingInvalidError(`"${String(level)}" is not a valid CourseLevel value.`);
    }
    this._level = level;
    this._touch();
  }

  /**
   * Set or clear the BCP-47 language tag. Pass undefined to clear.
   * Throws CourseLanguageInvalidError when the tag is defined but invalid.
   */
  setLanguage(langTag: string | undefined): void {
    if (langTag === undefined) {
      this._language = undefined;
    } else {
      try {
        this._language = LanguageTag.from(langTag);
      } catch (error) {
        throw new CourseLanguageInvalidError(langTag, error);
      }
    }
    this._touch();
  }

  /** Set or clear the release date. Pass undefined to clear. */
  setReleaseDate(d: Date | undefined): void {
    this._releaseDate = d;
    this._touch();
  }

  /** Set or clear the upstream source's last-updated timestamp. Pass undefined to clear. */
  setSourceUpdatedAt(d: Date | undefined): void {
    this._sourceUpdatedAt = d;
    this._touch();
  }

  /**
   * Set or clear the rating. Pass both arguments as undefined to clear.
   * Throws CourseRatingInvalidError when:
   *   - avg is defined and outside [0, 5]
   *   - count is defined and is not a non-negative integer
   */
  setRating(avg: number | undefined, count: number | undefined): void {
    if (avg === undefined && count === undefined) {
      this._ratingAverage = undefined;
      this._ratingCount = undefined;
      this._touch();
      return;
    }
    if (avg === undefined || count === undefined) {
      throw new CourseRatingInvalidError(
        'Both ratingAverage and ratingCount must be provided together, or both must be undefined.',
      );
    }
    if (avg < 0 || avg > 5) {
      throw new CourseRatingInvalidError(`ratingAverage must be in [0, 5]; got ${String(avg)}.`);
    }
    if (!Number.isInteger(count) || count < 0) {
      throw new CourseRatingInvalidError(
        `ratingCount must be a non-negative integer; got ${String(count)}.`,
      );
    }
    this._ratingAverage = avg;
    this._ratingCount = count;
    this._touch();
  }

  /**
   * Replace instructor links. Dedupes by id (preserves first-seen order).
   * Calls _touch().
   */
  setInstructors(refs: InstructorRef[]): void {
    this._instructors = dedupeById(refs);
    this._touch();
  }

  /**
   * Replace studio links. Dedupes by id (preserves first-seen order).
   * Calls _touch().
   */
  setStudios(refs: StudioRef[]): void {
    this._studios = dedupeById(refs);
    this._touch();
  }

  /**
   * Replace tag links. Dedupes by id (preserves first-seen order).
   * Calls _touch().
   */
  setTags(refs: TagRef[]): void {
    this._tags = dedupeById(refs);
    this._touch();
  }

  /**
   * Replace the external-id set. Validates each ref via ExternalIdRefVO.from.
   * Dedupes by (source, externalId). Calls _touch().
   */
  setExternalIds(refs: ExternalIdRef[]): void {
    const validated = refs.map((r) => ExternalIdRefVO.from(r));
    this._externalIds = dedupeExternalIdRefs(validated);
    this._touch();
  }

  // ---------------------------------------------------------------------------
  // Section mutations
  // ---------------------------------------------------------------------------

  /**
   * Append a new section. When position is omitted, the section lands at
   * `sections.length + 1` (next available slot). When position is supplied,
   * it is validated and checked for conflicts.
   *
   * Rejects duplicate section id or duplicate position.
   */
  addSection(params: { id: string; title: string; position?: number }): void {
    const titleVo = Title.from(params.title);

    if (this._sections.some((s) => s.id === params.id)) {
      throw new SectionPositionConflictError(
        `Section with id "${params.id}" already exists in this course.`,
      );
    }

    const position =
      params.position === undefined
        ? this._sections.length + 1
        : Position.from(params.position).value;

    if (this._sections.some((s) => s.position === position)) {
      throw new SectionPositionConflictError(
        `A section at position ${String(position)} already exists in this course.`,
      );
    }

    this._sections.push({ id: params.id, position, title: titleVo.value });
    this._sections = this._sections.toSorted((a, b) => a.position - b.position);
    this._touch();
  }

  /**
   * Reorder a section to a new 1-based position, repacking all other sections
   * to maintain contiguous 1-based ordering.
   *
   * Throws SectionNotFoundError for an unknown sectionId.
   * Throws SectionPositionOutOfRangeError when newPosition < 1 or > sections.length.
   */
  reorderSection(sectionId: string, newPosition: number): void {
    const idx = this._sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) {
      throw new SectionNotFoundError(sectionId);
    }

    const max = this._sections.length;
    if (newPosition < 1 || newPosition > max) {
      throw new SectionPositionOutOfRangeError(newPosition, max);
    }

    // Remove the section from its current slot, insert at newPosition, then
    // repack so positions are contiguous 1-based integers.
    // idx is known-valid because findIndex returned >= 0 above.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- idx proven valid by findIndex check above
    const section = this._sections[idx]!;
    const remaining = this._sections.filter((s) => s.id !== sectionId);
    remaining.splice(newPosition - 1, 0, section);

    this._sections = remaining.map((s, i) => ({ ...s, position: i + 1 }));
    this._touch();
  }

  /**
   * Rename a section. Validates the new title via the Title value object.
   *
   * Throws SectionNotFoundError for an unknown sectionId.
   */
  renameSection(sectionId: string, newTitle: string): void {
    const idx = this._sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) {
      throw new SectionNotFoundError(sectionId);
    }

    const titleVo = Title.from(newTitle);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- idx proven valid by findIndex check above
    this._sections[idx] = { ...this._sections[idx]!, title: titleVo.value };
    this._touch();
  }

  /**
   * Remove a section and repack remaining positions to 1-based contiguous values.
   *
   * Throws SectionNotFoundError for an unknown sectionId.
   */
  removeSection(sectionId: string): void {
    const idx = this._sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) {
      throw new SectionNotFoundError(sectionId);
    }

    this._sections.splice(idx, 1);
    // Repack to keep positions 1-based and contiguous after removal.
    this._sections = this._sections.map((s, i) => ({ ...s, position: i + 1 }));
    this._touch();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _touch(): void {
    this._updatedAt = new Date();
  }
}

// ---------------------------------------------------------------------------
// Module-private helpers
// ---------------------------------------------------------------------------

/** Dedupe an array of refs that have an `id` field — first-seen wins. */
function dedupeById<T extends { id: string }>(refs: T[]): T[] {
  const seen = new Set<string>();
  return refs.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

/** Dedupe ExternalIdRef by (source, externalId) — first-seen wins. */
function dedupeExternalIdRefs(refs: ExternalIdRef[]): ExternalIdRef[] {
  const seen = new Set<string>();
  return refs.filter((r) => {
    const key = `${r.source}:${r.externalId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
