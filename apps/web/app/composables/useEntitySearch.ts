/**
 * Search-as-you-type source for the instructor/studio/tag pickers on the
 * course metadata editor (E30-F03-S01). `instructorIds`/`studioIds`/`tagIds`
 * are ids — the admin picks from existing entities, never types one in.
 *
 * `listInstructors` / `listStudios` / `listTags` all share the same
 * `{ items: [{ id, displayName, ... }], ... }` shape, so one generic
 * composable drives all three pickers; only the fetch function differs.
 *
 * Every option ever seen (the course's current links, plus every search
 * page fetched) is kept in `known` so a previously-picked entity's label
 * stays resolvable even after the search term that found it is gone —
 * `USelectMenu`'s `items` prop needs the full object for every selected id,
 * not just the ones matching the current search.
 */

import { ref, watch, type Ref } from 'vue';
import { listInstructors, listStudios, listTags, client } from '@app/api-client-ts';

export interface EntityOption {
  id: string;
  displayName: string;
}

const SEARCH_LIMIT = 20;
// ponytail: fixed debounce, no cancellation of in-flight requests. Add
// AbortController + adaptive delay if a library's entity count ever makes
// this feel laggy — course/instructor/studio/tag counts are in the hundreds.
const DEBOUNCE_MS = 250;

export async function fetchInstructorOptions(search: string): Promise<EntityOption[]> {
  const res = await listInstructors({
    client,
    throwOnError: false,
    query: { search: search || undefined, limit: SEARCH_LIMIT },
  });
  if (res.error) return [];
  return res.data.items.map((i) => ({ id: i.id, displayName: i.displayName }));
}

export async function fetchStudioOptions(search: string): Promise<EntityOption[]> {
  const res = await listStudios({
    client,
    throwOnError: false,
    query: { search: search || undefined, limit: SEARCH_LIMIT },
  });
  if (res.error) return [];
  return res.data.items.map((s) => ({ id: s.id, displayName: s.displayName }));
}

export async function fetchTagOptions(search: string): Promise<EntityOption[]> {
  const res = await listTags({
    client,
    throwOnError: false,
    query: { search: search || undefined, limit: SEARCH_LIMIT },
  });
  if (res.error) return [];
  return res.data.items.map((t) => ({ id: t.id, displayName: t.displayName }));
}

export interface UseEntitySearchReturn {
  searchTerm: Ref<string>;
  items: Ref<EntityOption[]>;
  loading: Ref<boolean>;
}

export function useEntitySearch(
  fetchPage: (search: string) => Promise<EntityOption[]>,
  initial: EntityOption[] = [],
): UseEntitySearchReturn {
  const searchTerm = ref('');
  const loading = ref(false);
  const known = ref(new Map(initial.map((o) => [o.id, o])));
  const items = ref<EntityOption[]>([...known.value.values()]);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function run(term: string): Promise<void> {
    loading.value = true;
    try {
      const page = await fetchPage(term);
      for (const option of page) known.value.set(option.id, option);
      items.value = [...known.value.values()];
    } finally {
      loading.value = false;
    }
  }

  watch(searchTerm, (term) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void run(term), DEBOUNCE_MS);
  });

  // Not gated behind onMounted: this is an SPA-only app (`ssr: false`), so
  // there is no hydration mismatch to avoid, and firing immediately means
  // the composable is just as usable from a plain unit test as from a
  // mounted component.
  void run('');

  return { searchTerm, items, loading };
}
