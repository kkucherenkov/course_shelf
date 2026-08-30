/**
 * Spec for derivedTranscriptPath — pure, no filesystem, no DI.
 */
import { describe, expect, it } from 'vitest';

import { derivedTranscriptPath } from './derived-path';
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
