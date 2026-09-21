import { describe, expect, it } from 'vitest';

import { parseFolderName } from './folder-name.parser';
import { compareSectionKeys, resolveSectionFolder, sectionSortKey } from './section-folder';

const ordinalOf = (segment: string): number | undefined => parseFolderName(segment).ordinal;
const key = (folder: string): number[] => sectionSortKey(folder, ordinalOf);

describe('resolveSectionFolder', () => {
  it('returns undefined for a video sitting directly in the course folder', () => {
    expect(
      resolveSectionFolder({ relSegments: ['lesson.mp4'], videoCountByDir: new Map() }),
    ).toBeUndefined();
  });

  it('returns the only folder when the video is one level down', () => {
    expect(
      resolveSectionFolder({
        relSegments: ['01 - Intro', 'lesson.mp4'],
        videoCountByDir: new Map([['01 - Intro', 1]]),
      }),
    ).toBe('01 - Intro');
  });

  it('descends when the deeper folder holds several videos', () => {
    // Course/01 - Block/01 - Basics/{a,b}.mp4 — "01 - Basics" is a section.
    expect(
      resolveSectionFolder({
        relSegments: ['01 - Block', '01 - Basics', 'a.mp4'],
        videoCountByDir: new Map([['01 - Block/01 - Basics', 2]]),
      }),
    ).toBe('01 - Block/01 - Basics');
  });

  it('stays on the first segment when the deeper folder holds exactly one video', () => {
    // Course/01 - Block/Lesson One/video.mp4 — the folder IS the lesson, and
    // promoting it would turn a 31-lesson course into 31 one-lesson sections.
    expect(
      resolveSectionFolder({
        relSegments: ['01 - Block', 'Lesson One', 'video.mp4'],
        videoCountByDir: new Map([
          ['01 - Block/Lesson One', 1],
          ['01 - Block/Lesson Two', 1],
        ]),
      }),
    ).toBe('01 - Block');
  });

  it('never climbs above the first segment', () => {
    // A lesson folder directly under the course keeps its own folder as the
    // section — the pre-existing behaviour for that layout.
    expect(
      resolveSectionFolder({
        relSegments: ['Урок 1', 'video.mp4'],
        videoCountByDir: new Map([['Урок 1', 1]]),
      }),
    ).toBe('Урок 1');
  });
});

describe('sectionSortKey / compareSectionKeys', () => {
  it('composes the ordinal of every path segment', () => {
    expect(key('06 - Practice/11 - Tests')).toEqual([6, 11]);
    expect(key('08 - Docker')).toEqual([8]);
  });

  it('sorts a nested section before a later top-level one', () => {
    // Reading only the deepest segment would compare 11 against 8 and put
    // "11 - Tests" last, outside the block it belongs to.
    expect(compareSectionKeys(key('06 - Practice/11 - Tests'), key('08 - Docker'))).toBeLessThan(0);
  });

  it('sorts a parent folder before its own subsection', () => {
    // "06 - Practice" holds videos of its own; they open the block.
    expect(
      compareSectionKeys(key('06 - Practice'), key('06 - Practice/01 - Modules')),
    ).toBeLessThan(0);
  });

  it('sorts an unnumbered folder after numbered siblings', () => {
    expect(compareSectionKeys(key('Bonus Material'), key('02 - Middle'))).toBeGreaterThan(0);
  });

  it('treats two identical paths as equal so the caller can fall back to the name', () => {
    expect(compareSectionKeys(key('01 - Intro'), key('01 - Intro'))).toBe(0);
  });
});
