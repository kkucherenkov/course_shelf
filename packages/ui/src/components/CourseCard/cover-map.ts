import type { CourseAccent } from './types';

// Values live in `docs/design/shared/tokens.json` under `media.cover*` — the
// only source of truth (see DESIGN.md's no-private-hex rule). `media.*` is
// theme-independent by design, same reasoning as the video-surface tokens it
// sits alongside: a course's identity colour should not flip with the page
// theme, and `--media-fg-secondary` (paired below by every consumer) is
// tuned against these exact values, not the page's light/dark text tokens.
export const COVER: Record<CourseAccent, string> = {
  teal: 'var(--media-cover-teal)',
  amber: 'var(--media-cover-amber)',
  indigo: 'var(--media-cover-indigo)',
  warm: 'var(--media-cover-warm)',
  coral: 'var(--media-cover-coral)',
  neutral: 'var(--media-cover-neutral)',
};

// Words that carry no identity signal for a course-title monogram: platform
// names, generic course-noun filler, and short function words in the
// catalogue's two active languages. Filtering by stopword instead of word
// length is what fixes the two collisions this replaces — "Основы Golang"
// vs "Основы Git" both used to reduce to "OG", and "Udemy - Learn to Code
// with Rust" picked up the platform name as one of its two letters.
const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'to',
  'with',
  'and',
  'of',
  'for',
  'from',
  'in',
  'on',
  'by',
  'at',
  'is',
  'udemy',
  'основы',
  'курс',
  'курсы',
  'для',
  'с',
  'от',
  'до',
  'и',
  'в',
  'на',
  'по',
]);

// Splits on whitespace and punctuation (dashes, brackets, colons, quotes) so
// a separator never becomes a fake "word" — the root cause of the `U-`,
// `V-`, `[Ш` garbage this replaces.
const SEPARATORS = /[\s\-–—_/·|[\](){}<>:;,.!?"'«»]+/u;

/**
 * Two-letter monogram for a course/lesson title. The single implementation —
 * `search.vue` used to carry its own copy that disagreed with this one on
 * ~30/68 real catalogue titles (issue #569).
 *
 * Mixed-script results (e.g. one Latin + one Cyrillic letter) are an
 * accepted trade-off, not a bug: suppressing them needs language detection
 * this two-letter monogram doesn't warrant.
 */
export function initials(title: string): string {
  const words = title.split(SEPARATORS).filter(Boolean);
  const significant = words.filter((w) => !STOPWORDS.has(w.toLocaleLowerCase()));
  // An all-stopword title (rare) still needs a monogram — fall back to the
  // unfiltered split rather than returning nothing.
  const pool = significant.length > 0 ? significant : words;
  // A single surviving word has no second word to pair with — use its own
  // first two letters instead of colliding with every other single-word
  // title on the same first letter.
  const monogram =
    pool.length === 1
      ? (pool[0] ?? '').slice(0, 2)
      : pool
          .slice(0, 2)
          .map((w) => w[0] ?? '')
          .join('');
  return monogram.toLocaleUpperCase();
}

export function fmtTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${String(hours)}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(minutes)}:${String(secs).padStart(2, '0')}`;
}
