/**
 * WHY this file exists:
 * Port (interface + Symbol token) for IdentifyTask persistence. The application
 * layer depends only on this; PrismaIdentifyTaskRepository implements it and is
 * bound by the token in CatalogModule.
 *
 *   Token:   IDENTIFY_TASK_REPOSITORY
 *   Port:    IdentifyTaskRepository
 *   Adapter: PrismaIdentifyTaskRepository (infra/prisma-identify-task.repository.ts)
 */
import type { IdentifyTask, IdentifyTaskStatus } from './identify-task';

export const IDENTIFY_TASK_REPOSITORY = Symbol('IDENTIFY_TASK_REPOSITORY');

export interface IdentifyTaskRepository {
  /** Insert or update the task row (jsonb fragment + policy serialized). */
  save(task: IdentifyTask): Promise<void>;

  /** Return the task by id, or null when not found. */
  findById(id: string): Promise<IdentifyTask | null>;

  /**
   * List tasks newest-first, optionally narrowed by status and/or courseId.
   * Both filters are AND-combined when present.
   */
  findMany(filter: { status?: IdentifyTaskStatus; courseId?: string }): Promise<IdentifyTask[]>;
}
