/**
 * Derives the short lead shown in `CourseHero` from a course's full
 * description.
 *
 * A scraped course description can run well past what a hero card has room
 * for — a real course description carries an intro paragraph plus a
 * "what you'll learn" bullet list plus audience/requirements text, all in
 * one field (see `CourseDto.description` in the spec). The card only ever
 * shows the intro: the first line (i.e. up to the first newline — the
 * bullet list and everything after it lives in the full-text section
 * instead), capped at `DESCRIPTION_LEAD_MAX_CHARS` in case that first line
 * is itself a wall of text.
 *
 * This is the one rule for where the hero's lead ends — nowhere else should
 * a description be sliced by a bare character count.
 */
export const DESCRIPTION_LEAD_MAX_CHARS = 220;

export function descriptionLead(description: string): string {
  const firstLine = (description.trim().split(/\r?\n/)[0] ?? '').trim();
  if (firstLine.length <= DESCRIPTION_LEAD_MAX_CHARS) return firstLine;
  return `${firstLine.slice(0, DESCRIPTION_LEAD_MAX_CHARS).trimEnd()}…`;
}
