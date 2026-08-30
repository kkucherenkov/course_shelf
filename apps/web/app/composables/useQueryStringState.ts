/**
 * A writable ref backed by one query-string parameter.
 *
 * Reading resolves the current URL; writing pushes a `router.replace` so the
 * back button still means "the previous page", not "the previous filter click".
 * The fallback value is never written to the URL — a page at its defaults has
 * a clean address, and `?status=all` and no `status` at all mean the same thing.
 *
 * `allowed` guards against a hand-edited or stale URL selecting a value the UI
 * cannot render: anything outside the list reads back as the fallback. Omit it
 * for free-form ids (a library or instructor cuid), where any non-empty string
 * is legitimate and an unknown one simply matches no course.
 */
import { computed, type WritableComputedRef } from 'vue';

export function useQueryStringState<T extends string>(
  key: string,
  fallback: T,
  allowed?: readonly T[],
): WritableComputedRef<T> {
  const route = useRoute();
  const router = useRouter();

  return computed<T>({
    get() {
      const raw = route.query[key];
      // Repeated params (`?a=1&a=2`) arrive as an array — take the last one,
      // which is what a browser form resubmission would have meant.
      const value = Array.isArray(raw) ? raw.at(-1) : raw;
      if (typeof value !== 'string' || value === '') return fallback;
      if (allowed && !allowed.includes(value as T)) return fallback;
      return value as T;
    },
    set(next: T) {
      // Rest-destructure rather than `delete` — the default is expressed as the
      // absence of the key, and this drops it without mutating route.query.
      const { [key]: _dropped, ...rest } = route.query;
      void router.replace({ query: next === fallback ? rest : { ...rest, [key]: next } });
    },
  });
}
