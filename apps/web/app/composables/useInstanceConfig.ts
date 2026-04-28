/**
 * Fetches `GET /api/v1/admin/instance` once per browser session.
 * Result is cached in Nuxt's `useState`.
 *
 * Falls back to safe defaults if the backend is unavailable so the UI
 * never hard-blocks on a transient error.
 */

import { computed, type ComputedRef } from 'vue';

import { getAdminInstance, client } from '@app/api-client-ts';
import type { InstanceConfigDto } from '@app/api-client-ts';

const DEFAULT_CONFIG: InstanceConfigDto = {
  selfRegistration: true,
  emailVerificationRequired: false,
  ssoProviders: [],
};

export interface UseInstanceConfigReturn {
  config: ComputedRef<InstanceConfigDto>;
  refresh: () => Promise<void>;
}

export function useInstanceConfig(): UseInstanceConfigReturn {
  const config = useState<InstanceConfigDto | null>('cs.instanceConfig', () => null);

  async function refresh(): Promise<void> {
    try {
      const res = await getAdminInstance({ client, throwOnError: false });
      if (res.error || !res.data) {
        config.value = { ...DEFAULT_CONFIG };
        return;
      }
      config.value = res.data;
    } catch {
      config.value = { ...DEFAULT_CONFIG };
    }
  }

  if (config.value === null) {
    void refresh();
  }

  // Expose a non-null computed that always resolves to defaults while loading.
  const resolved = computed<InstanceConfigDto>(() => config.value ?? DEFAULT_CONFIG);

  return { config: resolved, refresh };
}
