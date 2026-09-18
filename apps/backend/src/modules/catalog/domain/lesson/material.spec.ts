/**
 * Unit tests for the Material value object.
 *
 * Covers:
 *   - Kind derivation per extension (.pdf → doc, .md → note, .txt → note,
 *     .png → image, .jpg → image, .jpeg → image).
 *   - MaterialKindUnsupportedError for unknown extensions.
 *   - Label derivation (extension stripped, ordinal prefix preserved).
 *   - path is normalised to library-relative; an absolute path outside
 *     libraryRoot is rejected (tuxedo 174 — same guard as Lesson.videoPath).
 *   - reconstitute bypasses validation.
 */
import { describe, expect, it } from 'vitest';

import { Material } from './material';
import { MaterialKindUnsupportedError } from './lesson.errors';
import { LibraryRelativePath } from '../shared-vo/library-relative-path';
import { LibraryRelativePathEscapedError } from '../shared-vo/shared.errors';

/** Every fixture below is absolute; '/' as libraryRoot keeps them all in-root. */
const ROOT = '/';

describe('Material.fromFile', () => {
  // -------------------------------------------------------------------------
  // Kind derivation
  // -------------------------------------------------------------------------
  it.each([
    ['.pdf', 'doc'],
    ['.md', 'note'],
    ['.txt', 'note'],
    ['.png', 'image'],
    ['.jpg', 'image'],
    ['.jpeg', 'image'],
  ])('extension %s → kind %s', (ext, expectedKind) => {
    const material = Material.fromFile({
      id: 'm1',
      path: `/lib/Lesson${ext}`,
      libraryRoot: ROOT,
      sizeBytes: 100,
    });
    expect(material.kind).toBe(expectedKind);
  });

  it('throws MaterialKindUnsupportedError for unsupported extension', () => {
    expect(() =>
      Material.fromFile({ id: 'm1', path: '/lib/Lesson.docx', libraryRoot: ROOT, sizeBytes: 100 }),
    ).toThrow(MaterialKindUnsupportedError);
  });

  it('throws MaterialKindUnsupportedError for file with no extension', () => {
    expect(() =>
      Material.fromFile({ id: 'm1', path: '/lib/NoExtension', libraryRoot: ROOT, sizeBytes: 100 }),
    ).toThrow(MaterialKindUnsupportedError);
  });

  // -------------------------------------------------------------------------
  // Label derivation
  // -------------------------------------------------------------------------
  it('label strips the extension', () => {
    const m = Material.fromFile({
      id: 'm1',
      path: '/lib/01 - Intro Notes.pdf',
      libraryRoot: ROOT,
      sizeBytes: 100,
    });
    expect(m.label).toBe('01 - Intro Notes');
  });

  it('label uses the basename, not the full path', () => {
    const m = Material.fromFile({
      id: 'm1',
      path: '/some/deep/path/Notes.md',
      libraryRoot: ROOT,
      sizeBytes: 100,
    });
    expect(m.label).toBe('Notes');
  });

  it('label preserves ordinal prefix', () => {
    const m = Material.fromFile({
      id: 'm1',
      path: '/lib/1.1 Vim Basics.pdf',
      libraryRoot: ROOT,
      sizeBytes: 100,
    });
    expect(m.label).toBe('1.1 Vim Basics');
  });

  // -------------------------------------------------------------------------
  // sizeBytes
  // -------------------------------------------------------------------------
  it('sizeBytes is stored as-is', () => {
    const m = Material.fromFile({
      id: 'm1',
      path: '/lib/doc.pdf',
      libraryRoot: ROOT,
      sizeBytes: 9999,
    });
    expect(m.sizeBytes).toBe(9999);
  });

  // -------------------------------------------------------------------------
  // path normalisation
  // -------------------------------------------------------------------------
  it('normalises path to library-relative', () => {
    const m = Material.fromFile({
      id: 'm1',
      path: '/lib/course/notes.pdf',
      libraryRoot: '/lib',
      sizeBytes: 100,
    });
    expect(m.path.value).toBe('course/notes.pdf');
  });

  it('throws LibraryRelativePathEscapedError for a path outside libraryRoot', () => {
    expect(() =>
      Material.fromFile({ id: 'm1', path: '/etc/evil.pdf', libraryRoot: '/lib', sizeBytes: 100 }),
    ).toThrow(LibraryRelativePathEscapedError);
  });

  // -------------------------------------------------------------------------
  // reconstitute
  // -------------------------------------------------------------------------
  it('reconstitute bypasses validation (unknown kind allowed for future expansion)', () => {
    const m = Material.reconstitute({
      id: 'm1',
      kind: 'slide',
      label: 'My Slide',
      path: LibraryRelativePath.reconstitute('slide.pptx'),
      sizeBytes: 200,
    });
    expect(m.id).toBe('m1');
    expect(m.kind).toBe('slide');
  });
});
