/**
 * Formats a duration in seconds as `m:ss`, or `h:mm:ss` once it reaches an
 * hour. Locale-agnostic (digits only) — shared by every transcript-cue UI
 * (player tab, search results) so the vocabulary stays identical.
 */
export function formatCueTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${String(hours)}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(minutes)}:${String(secs).padStart(2, '0')}`;
}
