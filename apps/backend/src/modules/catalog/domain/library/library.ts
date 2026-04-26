/**
 * WHY this file exists:
 * The Library is the aggregate root of the Catalog bounded context's first slice.
 * It owns all invariants around library creation so they are enforced in every
 * code path — HTTP, CLI, tests — not just the controller layer.
 *
 * The aggregate is a plain class with readonly fields; no Prisma types, no NestJS
 * decorators. Infrastructure concerns stay in infra/.
 */
import { brand } from '../../../../shared/branded-id';
import { LibraryNameRequiredError, LibraryPathNotAbsoluteError } from './library.errors';

import type { Id } from '../../../../shared/branded-id';

/** Phantom-branded id — prevents mixing a Library id with any other entity id. */
export type LibraryId = Id<'Library'>;

/** WHY: Absolute path regex covers POSIX (/…) and Windows drive paths (C:\…). */
const ABSOLUTE_PATH_RE = /^(\/|[A-Za-z]:\\)/;

export interface LibraryProps {
  readonly id: LibraryId;
  readonly name: string;
  readonly rootPath: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class Library {
  readonly id: LibraryId;
  readonly name: string;
  readonly rootPath: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: LibraryProps) {
    this.id = props.id;
    this.name = props.name;
    this.rootPath = props.rootPath;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Factory that enforces both domain invariants before constructing the aggregate.
   * Throw first, construct only on happy path.
   *
   * WHY a static factory (not `new`): invariant violations must surface as typed
   * domain errors, not generic exceptions. A constructor cannot communicate which
   * invariant was violated in a type-safe way.
   */
  static register(props: { id: string; name: string; rootPath: string; now?: Date }): Library {
    const name = props.name.trim();

    // WHY: A library without a name is unaddressable by users and meaningless
    // in the UI. Trimming before checking avoids whitespace-only names.
    if (name.length === 0) {
      throw new LibraryNameRequiredError();
    }

    // WHY: rootPath is used as a filesystem anchor. A relative path has no
    // stable meaning outside the process working directory and would silently
    // break media scanning in any deployment environment.
    if (!ABSOLUTE_PATH_RE.test(props.rootPath)) {
      throw new LibraryPathNotAbsoluteError(props.rootPath);
    }

    const now = props.now ?? new Date();

    return new Library({
      id: brand<string, 'Library'>(props.id),
      name,
      rootPath: props.rootPath,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitutes an aggregate from a persisted row. Bypasses invariant checks
   * because the DB is the source of truth for already-valid data.
   */
  static reconstitute(props: LibraryProps): Library {
    return new Library(props);
  }
}
