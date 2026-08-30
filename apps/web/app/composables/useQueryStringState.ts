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
import type { LocationQuery, Router } from 'vue-router';

// A page that clears several filters at once (browse.vue's "Clear filters")
// sets several of these refs synchronously, one intended `router.replace` per
// ref. The real router resolves each `replace` asynchronously and not
// necessarily in dispatch order, so issuing one `replace` per ref lets a
// stale, earlier-computed query win the race and re-add a key a later call
// already dropped. Instead, every same-tick `set()` merges into one pending
// query per router and only the last one schedules a *single* `replace`, on
// the next microtask, once all synchronous writes have landed — there is
// then only one navigation in flight, so there is nothing left to race.
const pendingQueryByRouter = new WeakMap<Router, LocationQuery>();

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
      const isFirstInBatch = !pendingQueryByRouter.has(router);
      const base = pendingQueryByRouter.get(router) ?? route.query;
      // Rest-destructure rather than `delete` — the default is expressed as the
      // absence of the key, and this drops it without mutating route.query.
      const { [key]: _dropped, ...rest } = base;
      const query = next === fallback ? rest : { ...rest, [key]: next };
      pendingQueryByRouter.set(router, query);

      if (isFirstInBatch) {
        void Promise.resolve().then(() => {
          const finalQuery = pendingQueryByRouter.get(router);
          pendingQueryByRouter.delete(router);
          void router.replace({ query: finalQuery ?? query });
        });
      }
    },
  });
}
