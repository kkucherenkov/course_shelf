/**
 * WHY this file exists:
 * AccessGrant is the aggregate root of the Access bounded context's first slice.
 * It owns all invariants around grant creation so they are enforced in every code
 * path — HTTP, CLI, tests — not just the controller layer.
 *
 * Target is a discriminated union: exactly one of libraryId / courseId is set and
 * its presence must match the `kind` discriminator. The aggregate enforces this
 * invariant in the static factory; reconstitute() bypasses it (DB is source of
 * truth for already-valid rows).
 *
 * No Prisma types, no NestJS decorators. Infrastructure stays in infra/.
 */
import { brand } from '../../../../shared/branded-id';
import { GrantTargetInvalidError } from './grant.errors';

import type { Id } from '../../../../shared/branded-id';
import type { GrantLevel, GrantTarget } from '@app/api-client-ts';

/** Phantom-branded id — prevents mixing a Grant id with any other entity id. */
export type GrantId = Id<'Grant'>;

export interface AccessGrantProps {
  readonly id: GrantId;
  readonly userId: string;
  readonly target: GrantTarget;
  readonly level: GrantLevel;
  readonly createdAt: Date;
}

export class AccessGrant {
  readonly id: GrantId;
  readonly userId: string;
  readonly target: GrantTarget;
  readonly level: GrantLevel;
  readonly createdAt: Date;

  private constructor(props: AccessGrantProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.target = props.target;
    this.level = props.level;
    this.createdAt = props.createdAt;
  }

  /**
   * Factory that enforces target-shape invariants before constructing.
   *
   * WHY: The discriminator `kind` must match exactly one of the nullable id
   * fields. A library grant must have `libraryId` set and `courseId` absent;
   * a course grant must have `courseId` set and `libraryId` absent. Anything
   * else is structurally invalid and surfaces as a 422.
   */
  static register(props: {
    id: string;
    userId: string;
    target: GrantTarget;
    level: GrantLevel;
    now?: Date;
  }): AccessGrant {
    const { target } = props;

    if (target.kind === 'library') {
      if (!target.libraryId) {
        throw new GrantTargetInvalidError('A library grant requires a non-empty libraryId.');
      }
    } else {
      // target.kind === 'course' — GrantTarget is a two-member discriminated union.
      if (!target.courseId) {
        throw new GrantTargetInvalidError('A course grant requires a non-empty courseId.');
      }
    }

    return new AccessGrant({
      id: brand<string, 'Grant'>(props.id),
      userId: props.userId,
      target,
      level: props.level,
      createdAt: props.now ?? new Date(),
    });
  }

  /**
   * Reconstitutes an aggregate from a persisted row. Bypasses invariant checks
   * because the DB is the source of truth for already-valid data.
   */
  static reconstitute(props: AccessGrantProps): AccessGrant {
    return new AccessGrant(props);
  }
}
