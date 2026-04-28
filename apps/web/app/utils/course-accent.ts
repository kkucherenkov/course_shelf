/**
 * Deterministically derives a palette accent name from a course id.
 *
 * The hash function is stable across runs so card colours are consistent
 * per course even without a server-side `accent` field.
 */

import type { CourseAccent } from '@app/ui';

const ACCENTS: CourseAccent[] = ['teal', 'amber', 'indigo', 'warm', 'coral', 'neutral'];

export function accentFromId(id: string): CourseAccent {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + (id.codePointAt(i) ?? 0)) >>> 0;
  return ACCENTS[h % ACCENTS.length] ?? 'neutral';
}
