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

/** The shape `buildSubtitleTracks` needs from a `LessonDto.subtitles[]` entry. */
export interface SubtitleTrackInput {
  id: string;
  language: string;
  label: string;
}

export interface SubtitleTrack extends SubtitleTrackInput {
  src: string;
  isDefault: boolean;
}

/**
 * Turn `LessonDto.subtitles[]` into the `<track>` list for the player.
 *
 * Entries whose URL cannot be derived are dropped rather than rendered with
 * an undefined `src`, and **at most one** track is marked `default`: nothing
 * stops a lesson from carrying two sidecars for the same language
 * (`Lesson.en.srt` next to `Lesson.en.vtt` is two rows — there is no
 * `@@unique([lessonId, language])`, and both files are legitimate), while a
 * second `<track default>` on one `<video>` is an HTML conformance error that
 * leaves the activated track, and therefore the chrome's toggle, up to the
 * implementation.
 */
export function buildSubtitleTracks(
  streamUrl: string | null | undefined,
  subtitles: readonly SubtitleTrackInput[] | null | undefined,
  locale: string | null | undefined,
): SubtitleTrack[] {
  const uiLanguage = (locale ?? '').split('-')[0];
  const tracks: SubtitleTrack[] = [];
  let defaultTaken = false;

  for (const sub of subtitles ?? []) {
    const src = buildSubtitleUrl(streamUrl, sub.language);
    if (!src) continue;
    const isDefault = !defaultTaken && Boolean(uiLanguage) && sub.language === uiLanguage;
    if (isDefault) defaultTaken = true;
    tracks.push({ id: sub.id, language: sub.language, label: sub.label, src, isDefault });
  }

  return tracks;
}
