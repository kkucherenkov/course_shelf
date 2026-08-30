/**
 * Spec for derivedTranscriptPath / derivedThumbnailPath — pure, no filesystem, no DI.
 */
import { describe, expect, it } from 'vitest';

import { derivedThumbnailPath, derivedTranscriptPath } from './derived-path';
import { DerivedPathEscapedError } from './transcription.errors';

const base = {
  derivedRoot: '/data/derived',
  libraryId: 'lib-1',
  language: 'en',
};

describe('derivedTranscriptPath', () => {
  it('mirrors the library-relative path under the library id', () => {
    expect(derivedTranscriptPath({ ...base, videoPath: 'Course/01 - Intro.mp4' })).toBe(
      '/data/derived/lib-1/Course/01 - Intro.mp4.en.srt',
    );
  });

  it('handles a video at the library root', () => {
    expect(derivedTranscriptPath({ ...base, videoPath: 'Intro.mp4' })).toBe(
      '/data/derived/lib-1/Intro.mp4.en.srt',
    );
  });

  it('keeps languages apart', () => {
    const en = derivedTranscriptPath({ ...base, videoPath: 'a.mp4' });
    const ru = derivedTranscriptPath({ ...base, videoPath: 'a.mp4', language: 'ru' });
    expect(en).not.toBe(ru);
  });

  it('keeps libraries apart', () => {
    const one = derivedTranscriptPath({ ...base, videoPath: 'a.mp4' });
    const two = derivedTranscriptPath({ ...base, libraryId: 'lib-2', videoPath: 'a.mp4' });
    expect(one).not.toBe(two);
  });

  it('rejects a traversal attempt in the video path', () => {
    expect(() => derivedTranscriptPath({ ...base, videoPath: '../../etc/passwd.mp4' })).toThrow(
      DerivedPathEscapedError,
    );
  });

  it('rejects an absolute video path', () => {
    expect(() => derivedTranscriptPath({ ...base, videoPath: '/etc/passwd.mp4' })).toThrow(
      DerivedPathEscapedError,
    );
  });

  it('rejects a traversal attempt in the language', () => {
    expect(() => derivedTranscriptPath({ ...base, videoPath: 'a.mp4', language: '../x' })).toThrow(
      DerivedPathEscapedError,
    );
  });

  it('rejects a traversal attempt in the library id', () => {
    expect(() =>
      derivedTranscriptPath({ ...base, libraryId: '../../etc', videoPath: 'a.mp4' }),
    ).toThrow(DerivedPathEscapedError);
  });
});

describe('derivedThumbnailPath', () => {
  const thumbBase = { derivedRoot: '/data/derived', libraryId: 'lib-1' };

  it('mirrors the library-relative video path under the library id, suffixed .thumb.jpg', () => {
    expect(derivedThumbnailPath({ ...thumbBase, videoPath: 'Course/01 - Intro.mp4' })).toBe(
      '/data/derived/lib-1/Course/01 - Intro.mp4.thumb.jpg',
    );
  });

  it('never lands next to the video (the pre-fix, read-only-mount-breaking location)', () => {
    const result = derivedThumbnailPath({ ...thumbBase, videoPath: 'Course/01 - Intro.mp4' });
    expect(result).not.toBe('Course/01 - Intro.thumb.jpg');
    expect(result.startsWith('/data/derived/')).toBe(true);
  });

  it('keeps libraries apart', () => {
    const one = derivedThumbnailPath({ ...thumbBase, videoPath: 'a.mp4' });
    const two = derivedThumbnailPath({ ...thumbBase, libraryId: 'lib-2', videoPath: 'a.mp4' });
    expect(one).not.toBe(two);
  });

  it('rejects a traversal attempt in the video path', () => {
    expect(() => derivedThumbnailPath({ ...thumbBase, videoPath: '../../etc/passwd.mp4' })).toThrow(
      DerivedPathEscapedError,
    );
  });

  it('rejects an absolute video path', () => {
    expect(() => derivedThumbnailPath({ ...thumbBase, videoPath: '/etc/passwd.mp4' })).toThrow(
      DerivedPathEscapedError,
    );
  });

  it('rejects a traversal attempt in the library id', () => {
    expect(() =>
      derivedThumbnailPath({ ...thumbBase, libraryId: '../../etc', videoPath: 'a.mp4' }),
    ).toThrow(DerivedPathEscapedError);
  });
});
