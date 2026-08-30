/**
 * Derive a lesson's subtitle URL from its already-signed stream URL.
 *
 * The subtitle route (`GET /api/v1/stream/lessons/{id}/subtitles/{language}`)
 * takes the *same* stream token as the video endpoint — a `<track>` element
 * cannot send an Authorization header either — so the signed video URL is the
 * only input needed: append the path segment and keep the query untouched.
 *
 * Pure: no Nuxt runtime config, no network. Returns `null` for anything it
 * cannot build a real URL from, so the caller renders no `<track>` at all
 * rather than a `src="undefined"`.
 */
export function buildSubtitleUrl(
  streamUrl: string | null | undefined,
  language: string | null | undefined,
): string | null {
  if (!streamUrl || !language) return null;

  let url: URL;
  try {
    url = new URL(streamUrl);
  } catch {
    return null;
  }

  url.pathname = `${url.pathname.replace(/\/+$/, '')}/subtitles/${encodeURIComponent(language)}`;
  return url.toString();
}
