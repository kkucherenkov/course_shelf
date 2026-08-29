/**
 * Adapts `GET /admin/instance`'s `ssoProviders` to what `AppSsoBlock` renders.
 *
 * The server owns the copy: `SsoProviderConfig` carries `label` and `iconName`
 * alongside the id, and the spec says the array "lights up the SsoBlock without
 * UI changes". So there is deliberately no id→label mapping here — inventing
 * one client-side would silently override whatever an operator configured.
 *
 * The only real work is narrowing `iconName: string` off the wire to the
 * `IconName` union `IconCS` accepts. `IconCS` renders through a chain of
 * `v-if="name === …"`, so an unrecognised glyph is not an error — it is a
 * blank `<svg>`, i.e. a button with no icon. Falling back to `key` keeps a
 * provider an operator adds visibly usable instead of silently blank.
 *
 * The recognised set is the three the design bundle documents for SSO, the
 * same three mobile maps.
 *
 * **This normally yields an empty list and the SSO row does not render.**
 * `AppConfig.instance` (`apps/backend/src/common/config/app-config.ts:334`)
 * returns `ssoProviders: []` unconditionally in v1; v2 populates it once Better
 * Auth's `genericOAuth` plugin lands. Wiring it now is what makes the web light
 * up on that day — mobile already did.
 */

import { computed, type ComputedRef } from 'vue';

import { useInstanceConfig } from '~/composables/useInstanceConfig';

/**
 * The glyphs SSO uses, as a local union rather than an `IconName` import.
 *
 * `IconName` is declared inside `IconCS.vue`, and typescript-eslint's program
 * does not resolve types out of an SFC — importing it here makes every use an
 * "error typed value". A three-value subset costs nothing and stays assignable
 * to `IconName` at the call site, where the Vue compiler does resolve it.
 * Keep it a subset: adding a glyph `IconCS` does not have would only surface
 * as a blank button.
 */
type SsoGlyph = 'mail' | 'github' | 'key';

const SSO_GLYPHS = new Set<string>(['mail', 'github', 'key']);

function toIconName(raw: string): SsoGlyph {
  return SSO_GLYPHS.has(raw) ? (raw as SsoGlyph) : 'key';
}

export interface SsoProviderEntry {
  id: string;
  label: string;
  iconName: SsoGlyph;
}

export function useSsoProviders(): ComputedRef<SsoProviderEntry[]> {
  const { config } = useInstanceConfig();

  return computed<SsoProviderEntry[]>(() =>
    config.value.ssoProviders.map((p) => ({
      id: p.id,
      label: p.label,
      iconName: toIconName(p.iconName),
    })),
  );
}
