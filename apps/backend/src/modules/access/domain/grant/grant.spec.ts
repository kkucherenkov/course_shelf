import { describe, expect, it } from 'vitest';

import { GrantTargetInvalidError } from './grant.errors';
import { AccessGrant } from './grant';

describe('AccessGrant aggregate', () => {
  const baseProps = {
    id: 'grant-1',
    userId: 'user-abc',
    level: 'READ' as const,
  };

  // -------------------------------------------------------------------------
  // library target
  // -------------------------------------------------------------------------
  describe('register — library target', () => {
    it('creates aggregate with library target', () => {
      const grant = AccessGrant.register({
        ...baseProps,
        target: { kind: 'library', libraryId: 'lib-1' },
      });

      expect(grant.id).toBe('grant-1');
      expect(grant.userId).toBe('user-abc');
      expect(grant.target).toEqual({ kind: 'library', libraryId: 'lib-1' });
      expect(grant.level).toBe('READ');
    });

    it('uses provided now for createdAt', () => {
      const now = new Date('2026-01-01T00:00:00.000Z');
      const grant = AccessGrant.register({
        ...baseProps,
        target: { kind: 'library', libraryId: 'lib-1' },
        now,
      });
      expect(grant.createdAt).toBe(now);
    });

    it('throws GrantTargetInvalidError when libraryId is empty', () => {
      expect(() =>
        AccessGrant.register({
          ...baseProps,
          target: { kind: 'library', libraryId: '' },
        }),
      ).toThrow(GrantTargetInvalidError);
    });
  });

  // -------------------------------------------------------------------------
  // course target
  // -------------------------------------------------------------------------
  describe('register — course target', () => {
    it('creates aggregate with course target', () => {
      const grant = AccessGrant.register({
        ...baseProps,
        target: { kind: 'course', courseId: 'course-1' },
      });

      expect(grant.target).toEqual({ kind: 'course', courseId: 'course-1' });
    });

    it('throws GrantTargetInvalidError when courseId is empty', () => {
      expect(() =>
        AccessGrant.register({
          ...baseProps,
          target: { kind: 'course', courseId: '' },
        }),
      ).toThrow(GrantTargetInvalidError);
    });
  });

  // -------------------------------------------------------------------------
  // Error properties
  // -------------------------------------------------------------------------
  describe('GrantTargetInvalidError', () => {
    it('has status 422 and code grant-target-invalid', () => {
      let caught: GrantTargetInvalidError | undefined;
      try {
        AccessGrant.register({
          ...baseProps,
          target: { kind: 'library', libraryId: '' },
        });
      } catch (error) {
        caught = error as GrantTargetInvalidError;
      }
      expect(caught?.status).toBe(422);
      expect(caught?.code).toBe('grant-target-invalid');
    });
  });

  // -------------------------------------------------------------------------
  // reconstitute
  // -------------------------------------------------------------------------
  describe('reconstitute', () => {
    it('bypasses invariant checks and returns the aggregate', () => {
      const now = new Date('2026-01-01T00:00:00.000Z');
      const grant = AccessGrant.reconstitute({
        id: 'grant-1' as ReturnType<typeof AccessGrant.reconstitute>['id'],
        userId: 'user-abc',
        target: { kind: 'library', libraryId: 'lib-1' },
        level: 'READ',
        createdAt: now,
      });

      expect(grant.id).toBe('grant-1');
      expect(grant.createdAt).toBe(now);
    });
  });
});
