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
import {
  SectionNotFoundError,
  SectionPositionConflictError,
  SectionPositionOutOfRangeError,
} from './course.errors';

import type { Id } from '../../../../shared/branded-id';

/** Phantom-branded id for Course — prevents mixing with Library/Lesson ids. */
export type CourseId = Id<'Course'>;

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

  private constructor(props: CourseProps) {
    this.id = props.id;
    this.libraryId = props.libraryId;
    this._slug = Slug.from(props.slug);
    this._title = Title.from(props.title);
    this._description = props.description;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._sections = [...props.sections].toSorted((a, b) => a.position - b.position);
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
