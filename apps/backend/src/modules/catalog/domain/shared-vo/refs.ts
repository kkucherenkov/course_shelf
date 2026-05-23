/**
 * WHY this file exists:
 * Read-only projection types for Instructor, Studio, and Tag references that
 * are embedded inside the Course aggregate's read paths. These are pure types
 * with no logic — they represent the minimal shape needed by the Course
 * aggregate and its query handlers without creating circular dependencies on
 * the full Instructor/Studio/Tag aggregates.
 */

/** Minimal projection of an Instructor embedded in a Course read-model. */
export interface InstructorRef {
  readonly id: string;
  readonly slug: string;
  readonly displayName: string;
}

/** Minimal projection of a Studio embedded in a Course read-model. */
export interface StudioRef {
  readonly id: string;
  readonly slug: string;
  readonly displayName: string;
}

/** Minimal projection of a Tag embedded in a Course read-model. */
export interface TagRef {
  readonly id: string;
  readonly slug: string;
  readonly displayName: string;
  readonly category: string | null;
}
