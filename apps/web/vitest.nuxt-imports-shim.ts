// Minimal shim for Nuxt's `#imports` virtual module used in unit tests.
// Only the symbols actually used by pages/components under test need to be
// re-exported. Nuxt composables that rely on the runtime context (router,
// i18n, color-mode, etc.) are mocked at the test-file level with vi.mock().
export {
  ref,
  computed,
  watch,
  watchEffect,
  onMounted,
  onUnmounted,
  reactive,
  toRef,
  toRefs,
  nextTick,
  defineComponent,
  defineAsyncComponent,
} from 'vue';

// Nuxt composables that are safe to stub here as no-ops.
// Individual tests can vi.mock('#imports') to override these.
export const useColorMode = () => ({ value: 'dark', preference: 'dark' });
export const useNuxtApp = () => ({});
export const useRoute = () => ({ path: '/' });
export const useRouter = () => ({});
export const navigateTo = () => Promise.resolve();
export const useRuntimeConfig = () => ({ public: {} });
