/**
 * Splits `text` into segments, marking substrings that match `q`
 * (case-insensitive). Returns an array of `{ text, match }` objects
 * suitable for rendering `<span>` / `<mark>` tags.
 *
 * Special regex characters in `q` are escaped before matching, so a
 * query like "a.b" will not accidentally match "axb".
 *
 * Returns a single non-matching segment when `q` is empty or produces
 * no match.
 */
export function highlight(text: string, q: string): { text: string; match: boolean }[] {
  if (!q) return [{ text, match: false }];

  // Escape regex special characters so the raw query is treated literally.
  const escaped = q.replaceAll(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`);

  const re = new RegExp(escaped, 'gi');
  const segments: { text: string; match: boolean }[] = [];
  let lastIndex = 0;

  for (const m of text.matchAll(re)) {
    const start = m.index;
    if (start > lastIndex) {
      segments.push({ text: text.slice(lastIndex, start), match: false });
    }
    segments.push({ text: m[0], match: true });
    lastIndex = start + m[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), match: false });
  }

  if (segments.length === 0) return [{ text, match: false }];

  return segments;
}
