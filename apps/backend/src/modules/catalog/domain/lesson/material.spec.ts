/**
 * Unit tests for the Material value object.
 *
 * Covers:
 *   - Kind derivation per extension (.pdf → doc, .md → note, .txt → note,
 *     .png → image, .jpg → image, .jpeg → image).
 *   - MaterialKindUnsupportedError for unknown extensions.
 *   - Label derivation (extension stripped, ordinal prefix preserved).
 *   - reconstitute bypasses validation.
 */
import { describe, expect, it } from 'vitest';

import { Material } from './material';
import { MaterialKindUnsupportedError } from './lesson.errors';

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
    const material = Material.fromFile({ id: 'm1', path: `/lib/Lesson${ext}`, sizeBytes: 100 });
    expect(material.kind).toBe(expectedKind);
  });

  it('throws MaterialKindUnsupportedError for unsupported extension', () => {
    expect(() => Material.fromFile({ id: 'm1', path: '/lib/Lesson.docx', sizeBytes: 100 })).toThrow(
      MaterialKindUnsupportedError,
    );
  });

  it('throws MaterialKindUnsupportedError for file with no extension', () => {
    expect(() => Material.fromFile({ id: 'm1', path: '/lib/NoExtension', sizeBytes: 100 })).toThrow(
      MaterialKindUnsupportedError,
    );
  });

  // -------------------------------------------------------------------------
  // Label derivation
  // -------------------------------------------------------------------------
  it('label strips the extension', () => {
    const m = Material.fromFile({ id: 'm1', path: '/lib/01 - Intro Notes.pdf', sizeBytes: 100 });
    expect(m.label).toBe('01 - Intro Notes');
  });

  it('label uses the basename, not the full path', () => {
    const m = Material.fromFile({ id: 'm1', path: '/some/deep/path/Notes.md', sizeBytes: 100 });
    expect(m.label).toBe('Notes');
  });

  it('label preserves ordinal prefix', () => {
    const m = Material.fromFile({ id: 'm1', path: '/lib/1.1 Vim Basics.pdf', sizeBytes: 100 });
    expect(m.label).toBe('1.1 Vim Basics');
  });

  // -------------------------------------------------------------------------
  // sizeBytes
  // -------------------------------------------------------------------------
  it('sizeBytes is stored as-is', () => {
    const m = Material.fromFile({ id: 'm1', path: '/lib/doc.pdf', sizeBytes: 9999 });
    expect(m.sizeBytes).toBe(9999);
  });

  // -------------------------------------------------------------------------
  // reconstitute
  // -------------------------------------------------------------------------
  it('reconstitute bypasses validation (unknown kind allowed for future expansion)', () => {
    const m = Material.reconstitute({
      id: 'm1',
      kind: 'slide',
      label: 'My Slide',
      path: '/lib/slide.pptx',
      sizeBytes: 200,
    });
    expect(m.id).toBe('m1');
    expect(m.kind).toBe('slide');
  });
});
