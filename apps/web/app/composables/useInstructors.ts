/**
 * Wraps `listInstructors` (`GET /api/v1/catalog/instructors`) for the Browse
 * page's instructor filter.
 *
 * The endpoint caps `limit` at 100, so this returns the first page only. That
 * is deliberate: the filter is a `<select>`, and a select with more than a
 * hundred options is the wrong control — when a shelf grows past that, this
 * becomes a typeahead against the endpoint's own `search` param rather than a
 * longer list. Failure is non-fatal: the caller hides the filter and the rest
 * of the page still works.
 */

import { client, listInstructors } from '@app/api-client-ts';
import type { InstructorListDto } from '@app/api-client-ts';

import type { RowStatus } from './useHome';

const MAX_OPTIONS = 100;

export function useInstructors(): {
  data: Ref<InstructorListDto | undefined>;
  status: Ref<RowStatus>;
  error: Ref<Error | null>;
} {
  const { data, status, error } = useAsyncData<InstructorListDto>(
    'catalog:instructors:filter',
    async () => {
      const res = await listInstructors({
        client,
        throwOnError: false,
        query: { limit: MAX_OPTIONS },
      });
      if (res.error) {
        throw new Error('Failed to load instructors');
      }
      return res.data;
    },
    {
      server: false,
      default: (): InstructorListDto => ({ items: [], total: 0, offset: 0, limit: MAX_OPTIONS }),
    },
  );

  return {
    data: data as unknown as Ref<InstructorListDto | undefined>,
    status: status as Ref<RowStatus>,
    error: error as Ref<Error | null>,
  };
}
