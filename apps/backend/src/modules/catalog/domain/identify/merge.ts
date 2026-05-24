/**
 * WHY this file exists:
 * computeMergedPatch is the pure heart of Stage 4 identify: given the current
 * course (as a minimal read-only view), a scraped fragment, and a per-field
 * MergePolicy, it produces an EffectivePatch describing exactly what should be
 * written. It performs NO I/O — entity-name resolution (names → ids) is the
 * caller's job (ApplyIdentifyResultHandler via MetadataLinker), keeping this
 * function trivially unit-testable.
 *
 * Field semantics:
 *   scalar  merge     → fill only if current is empty
 *   scalar  overwrite → replace, but only when the fragment has a value
 *   array   merge     → union (entities by slug, externalIds by source+externalId)
 *   array   overwrite → replace with scraped, but only when scraped is non-empty
 *   *       ignore    → field omitted from the patch entirely
 *
 * Omitted fields are simply absent from EffectivePatch — the caller maps
 * "present key" → write, "absent key" → leave unchanged. Arrays are never
 * cleared from an empty scrape (overwrite with nothing is a no-op, not a wipe).
 */
import { slugify } from '../shared-vo/entity-slug';

import type { CourseLevel } from '../course/course';
import type { ExternalIdRef } from '../shared-vo/external-id-ref';
import type { ScrapedCourseFragment } from '../scraper/scraper.types';
import type { MergeMode, MergePolicy } from './merge-policy';

/**
 * Minimal read-only projection of the current Course needed to merge. The Course
 * aggregate satisfies this structurally and is passed directly — the optional
 * scalars are declared as `T | undefined` (always-present keys, value may be
 * undefined) to mirror Course's getters, so no cast is needed under
 * exactOptionalPropertyTypes.
 */
export interface CurrentCourseView {
  readonly title: string;
  readonly description: string | undefined;
  readonly level: CourseLevel | undefined;
  readonly language: string | undefined;
  readonly posterUrl: string | undefined;
  readonly releaseDate: Date | undefined;
  readonly ratingAverage: number | undefined;
  readonly ratingCount: number | undefined;
  readonly instructors: readonly { readonly displayName: string }[];
  readonly studios: readonly { readonly displayName: string }[];
  readonly tags: readonly { readonly displayName: string }[];
  readonly externalIds: readonly ExternalIdRef[];
}

/** What to write. Absent key = leave unchanged. Names are unresolved (caller resolves to ids). */
export interface EffectivePatch {
  title?: string;
  description?: string;
  level?: CourseLevel;
  language?: string;
  posterUrl?: string;
  releaseDate?: string; // ISO date string from the fragment; caller parses to Date
  ratingAverage?: number;
  ratingCount?: number;
  externalIds?: ExternalIdRef[];
  instructorNames?: string[];
  studioNames?: string[];
  tagNames?: string[];
}

function pickScalar<T>(
  currentEmpty: boolean,
  scraped: T | undefined,
  mode: MergeMode,
): T | undefined {
  if (mode === 'ignore' || scraped === undefined) return undefined;
  if (mode === 'overwrite' || currentEmpty) return scraped;
  return undefined; // merge + current present → keep current (omit)
}

function isEmptyString(value: string | undefined): boolean {
  return value === undefined || value.trim().length === 0;
}

/** Dedupe display names by slug key. Trims, skips empties, and falls back to a
 *  lowercase key for names that cannot be slugified — never throws. */
function dedupeByNameSlug(names: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (trimmed.length === 0) continue;
    let key: string;
    try {
      key = slugify(trimmed);
    } catch {
      // WHY: slugify throws on un-sluggable names (e.g. symbol-only like '---');
      // we fall back to lowercase rather than crash a pure merge function.
      key = trimmed.toLowerCase();
    }
    if (!seen.has(key)) {
      seen.add(key);
      out.push(trimmed);
    }
  }
  return out;
}

function mergeNames(
  currentNames: readonly string[],
  scrapedNames: readonly string[],
  mode: MergeMode,
): string[] | undefined {
  if (mode === 'ignore') return undefined;
  const cleanScraped = scrapedNames.map((n) => n.trim()).filter((n) => n.length > 0);
  if (cleanScraped.length === 0) return undefined;
  if (mode === 'overwrite') return dedupeByNameSlug(cleanScraped);
  return dedupeByNameSlug([...currentNames, ...cleanScraped]); // merge = union, current first
}

function mergeExternalIds(
  current: readonly ExternalIdRef[],
  scraped: readonly ExternalIdRef[],
  mode: MergeMode,
): ExternalIdRef[] | undefined {
  if (mode === 'ignore' || scraped.length === 0) return undefined;
  if (mode === 'overwrite') return [...scraped];
  const key = (r: ExternalIdRef): string => `${r.source}::${r.externalId}`;
  const seen = new Set(current.map((r) => key(r)));
  const union = [...current];
  for (const ref of scraped) {
    if (!seen.has(key(ref))) {
      seen.add(key(ref));
      union.push(ref);
    }
  }
  return union;
}

export function computeMergedPatch(
  current: CurrentCourseView,
  fragment: ScrapedCourseFragment,
  policy: MergePolicy,
): EffectivePatch {
  const patch: EffectivePatch = {};

  const title = pickScalar(isEmptyString(current.title), fragment.title, policy.title);
  if (title !== undefined) patch.title = title;

  const description = pickScalar(
    isEmptyString(current.description),
    fragment.description,
    policy.description,
  );
  if (description !== undefined) patch.description = description;

  const level = pickScalar(current.level === undefined, fragment.level, policy.level);
  if (level !== undefined) patch.level = level;

  const language = pickScalar(isEmptyString(current.language), fragment.language, policy.language);
  if (language !== undefined) patch.language = language;

  const posterUrl = pickScalar(
    isEmptyString(current.posterUrl),
    fragment.posterUrl,
    policy.posterUrl,
  );
  if (posterUrl !== undefined) patch.posterUrl = posterUrl;

  const releaseDate = pickScalar(
    current.releaseDate === undefined,
    fragment.releaseDate,
    policy.releaseDate,
  );
  if (releaseDate !== undefined) patch.releaseDate = releaseDate;

  const ratingAverage = pickScalar(
    current.ratingAverage === undefined,
    fragment.ratingAverage,
    policy.ratingAverage,
  );
  if (ratingAverage !== undefined) patch.ratingAverage = ratingAverage;

  const ratingCount = pickScalar(
    current.ratingCount === undefined,
    fragment.ratingCount,
    policy.ratingCount,
  );
  if (ratingCount !== undefined) patch.ratingCount = ratingCount;

  const instructorNames = mergeNames(
    current.instructors.map((i) => i.displayName),
    fragment.instructorNames ?? [],
    policy.instructors,
  );
  if (instructorNames !== undefined) patch.instructorNames = instructorNames;

  const studioNames = mergeNames(
    current.studios.map((s) => s.displayName),
    fragment.studioName ? [fragment.studioName] : [],
    policy.studios,
  );
  if (studioNames !== undefined) patch.studioNames = studioNames;

  const tagNames = mergeNames(
    current.tags.map((t) => t.displayName),
    fragment.tags ?? [],
    policy.tags,
  );
  if (tagNames !== undefined) patch.tagNames = tagNames;

  const externalIds = mergeExternalIds(
    current.externalIds,
    fragment.externalIds ?? [],
    policy.externalIds,
  );
  if (externalIds !== undefined) patch.externalIds = externalIds;

  return patch;
}
