import { describe, it, expect } from 'vitest';
import { buildSubtitleUrl } from './subtitle-url';

const SIGNED = 'http://localhost:3000/api/v1/stream/lessons/clxvles001?token=abc.def.ghi';

describe('buildSubtitleUrl', () => {
  it('appends the subtitles path segment', () => {
    expect(buildSubtitleUrl(SIGNED, 'en')).toBe(
      'http://localhost:3000/api/v1/stream/lessons/clxvles001/subtitles/en?token=abc.def.ghi',
    );
  });

  it('preserves the signed token query verbatim', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJsZXNzb25JZCI6IngifQ.s-_Ab9c';
    const built = buildSubtitleUrl(
      `https://app.example.com/api/v1/stream/lessons/x?token=${jwt}`,
      'ru',
    );
    expect(new URL(built as string).searchParams.get('token')).toBe(jwt);
  });

  it('percent-encodes the language segment', () => {
    expect(buildSubtitleUrl(SIGNED, 'pt BR/../x')).toContain('/subtitles/pt%20BR%2F..%2Fx?');
  });

  it('keeps a non-default port and any path prefix', () => {
    expect(
      buildSubtitleUrl('http://127.0.0.1:8080/proxy/api/v1/stream/lessons/x?token=t', 'de'),
    ).toBe('http://127.0.0.1:8080/proxy/api/v1/stream/lessons/x/subtitles/de?token=t');
  });

  it('does not double up on a trailing slash', () => {
    expect(buildSubtitleUrl('http://localhost:3000/api/v1/stream/lessons/x/?token=t', 'en')).toBe(
      'http://localhost:3000/api/v1/stream/lessons/x/subtitles/en?token=t',
    );
  });

  it('returns null for input that is not an absolute URL', () => {
    expect(buildSubtitleUrl('/api/v1/stream/lessons/x?token=t', 'en')).toBeNull();
    expect(buildSubtitleUrl('not a url', 'en')).toBeNull();
  });

  it('returns null when the stream URL or the language is missing', () => {
    expect(buildSubtitleUrl(null, 'en')).toBeNull();
    expect(buildSubtitleUrl(undefined, 'en')).toBeNull();
    expect(buildSubtitleUrl('', 'en')).toBeNull();
    expect(buildSubtitleUrl(SIGNED, '')).toBeNull();
    expect(buildSubtitleUrl(SIGNED, undefined)).toBeNull();
  });
});
